-- Geospatial Management Tables
-- Adds mapping and land boundary tracking to the Farm Lease Platform

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Land Boundaries table - stores farm boundary coordinates and GeoJSON
CREATE TABLE IF NOT EXISTS land_boundaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES farm_clusters(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Boundary data
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- GeoJSON geometry - polygon/multipolygon
  geometry JSONB NOT NULL, -- GeoJSON FeatureCollection
  coordinates JSONB NOT NULL, -- Array of [lat, lng] points
  
  -- Metrics
  area_sqm DECIMAL(15, 2), -- Square meters
  area_hectares DECIMAL(12, 4), -- Hectares
  perimeter_m DECIMAL(15, 2), -- Meters
  
  -- Accuracy
  accuracy_rating INT CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  survey_date TIMESTAMP,
  source VARCHAR(100) DEFAULT 'manual_drawing', -- manual_drawing, gps_survey, satellite, imported
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Land Surveys table - tracks survey uploads and verification
CREATE TABLE IF NOT EXISTS land_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boundary_id UUID NOT NULL REFERENCES land_boundaries(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Survey details
  survey_type VARCHAR(50) NOT NULL, -- gps, drone, satellite, manual, cad
  file_url VARCHAR(2048),
  file_name VARCHAR(255),
  file_size INT,
  
  -- Extracted data
  extracted_coordinates JSONB, -- Coordinates from survey file
  extracted_metrics JSONB, -- Area, perimeter from survey
  
  -- Quality metrics
  accuracy_meters DECIMAL(10, 2),
  confidence_score DECIMAL(3, 2), -- 0.00-1.00
  quality_rating INT CHECK (quality_rating >= 1 AND quality_rating <= 5),
  
  -- Processing status
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  processing_notes TEXT,
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verification_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Geospatial Audit table - track all coordinate and boundary changes
CREATE TABLE IF NOT EXISTS geospatial_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boundary_id UUID REFERENCES land_boundaries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  action VARCHAR(50) NOT NULL, -- created, updated, verified, deleted
  change_details JSONB, -- What changed
  old_geometry JSONB,
  new_geometry JSONB,
  
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add geospatial columns to farm_clusters
ALTER TABLE farm_clusters ADD COLUMN IF NOT EXISTS
  center_latitude DECIMAL(10, 8);
ALTER TABLE farm_clusters ADD COLUMN IF NOT EXISTS
  center_longitude DECIMAL(11, 8);
ALTER TABLE farm_clusters ADD COLUMN IF NOT EXISTS
  zoom_level INT DEFAULT 15;
ALTER TABLE farm_clusters ADD COLUMN IF NOT EXISTS
  total_area_sqm DECIMAL(15, 2);
ALTER TABLE farm_clusters ADD COLUMN IF NOT EXISTS
  total_area_hectares DECIMAL(12, 4);
ALTER TABLE farm_clusters ADD COLUMN IF NOT EXISTS
  primary_boundary_id UUID REFERENCES land_boundaries(id) ON DELETE SET NULL;
ALTER TABLE farm_clusters ADD COLUMN IF NOT EXISTS
  last_survey_date TIMESTAMP;
ALTER TABLE farm_clusters ADD COLUMN IF NOT EXISTS
  has_verified_survey BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_land_boundaries_cluster_id ON land_boundaries(cluster_id);
CREATE INDEX IF NOT EXISTS idx_land_boundaries_created_by ON land_boundaries(created_by);
CREATE INDEX IF NOT EXISTS idx_land_boundaries_is_active ON land_boundaries(is_active);
CREATE INDEX IF NOT EXISTS idx_land_surveys_boundary_id ON land_surveys(boundary_id);
CREATE INDEX IF NOT EXISTS idx_land_surveys_uploaded_by ON land_surveys(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_land_surveys_status ON land_surveys(status);
CREATE INDEX IF NOT EXISTS idx_geospatial_audit_boundary_id ON geospatial_audit_logs(boundary_id);
CREATE INDEX IF NOT EXISTS idx_geospatial_audit_user_id ON geospatial_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_geospatial_audit_created ON geospatial_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_farm_clusters_primary_boundary ON farm_clusters(primary_boundary_id);

-- Row-Level Security Policies for Land Boundaries
ALTER TABLE land_boundaries ENABLE ROW LEVEL SECURITY;

-- Owners can see all boundaries for their clusters
CREATE POLICY "owners_can_view_own_boundaries" ON land_boundaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM farm_clusters fc
      WHERE fc.id = land_boundaries.cluster_id
      AND fc.owner_id = auth.uid()
    )
  );

-- Tenants can view boundaries for clusters they're interested in
CREATE POLICY "tenants_can_view_cluster_boundaries" ON land_boundaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM farm_clusters fc
      WHERE fc.id = land_boundaries.cluster_id
      AND (
        EXISTS (
          SELECT 1 FROM proposals p
          WHERE p.cluster_id = fc.id AND p.tenant_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM agreements a
          WHERE a.cluster_id = fc.id AND a.tenant_id = auth.uid()
        )
      )
    )
  );

-- Owners can insert boundaries for their clusters
CREATE POLICY "owners_can_insert_boundaries" ON land_boundaries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM farm_clusters fc
      WHERE fc.id = cluster_id AND fc.owner_id = auth.uid()
    )
  );

-- Owners can update their boundaries
CREATE POLICY "owners_can_update_boundaries" ON land_boundaries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM farm_clusters fc
      WHERE fc.id = cluster_id AND fc.owner_id = auth.uid()
    )
  );

-- Admins can see all boundaries
CREATE POLICY "admins_can_view_all_boundaries" ON land_boundaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Row-Level Security Policies for Land Surveys
ALTER TABLE land_surveys ENABLE ROW LEVEL SECURITY;

-- Similar access control for surveys
CREATE POLICY "owners_can_view_own_surveys" ON land_surveys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM land_boundaries lb
      INNER JOIN farm_clusters fc ON fc.id = lb.cluster_id
      WHERE lb.id = land_surveys.boundary_id AND fc.owner_id = auth.uid()
    )
  );

CREATE POLICY "owners_can_insert_surveys" ON land_surveys
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM land_boundaries lb
      INNER JOIN farm_clusters fc ON fc.id = lb.cluster_id
      WHERE lb.id = boundary_id AND fc.owner_id = auth.uid()
    )
  );

-- Row-Level Security for Audit Logs
ALTER TABLE geospatial_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_audit_logs" ON geospatial_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM land_boundaries lb
      INNER JOIN farm_clusters fc ON fc.id = lb.cluster_id
      WHERE lb.id = geospatial_audit_logs.boundary_id
      AND (fc.owner_id = auth.uid() OR user_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Create trigger to update farm_clusters timestamp
CREATE OR REPLACE FUNCTION update_cluster_survey_date()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE farm_clusters
  SET last_survey_date = CURRENT_TIMESTAMP
  WHERE id = NEW.cluster_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER land_boundaries_update_cluster_survey
AFTER INSERT ON land_boundaries
FOR EACH ROW
EXECUTE FUNCTION update_cluster_survey_date();

-- Create trigger for audit logging
CREATE OR REPLACE FUNCTION audit_boundary_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO geospatial_audit_logs (
    boundary_id, user_id, action, old_geometry, new_geometry, change_details
  ) VALUES (
    NEW.id, auth.uid(), TG_ARGV[0], 
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.geometry ELSE NULL END,
    NEW.geometry,
    jsonb_build_object(
      'name', CASE WHEN NEW.name != OLD.name THEN NEW.name ELSE NULL END,
      'area_hectares', CASE WHEN NEW.area_hectares != OLD.area_hectares THEN NEW.area_hectares ELSE NULL END,
      'accuracy_rating', CASE WHEN NEW.accuracy_rating != OLD.accuracy_rating THEN NEW.accuracy_rating ELSE NULL END
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER land_boundaries_audit
AFTER INSERT OR UPDATE ON land_boundaries
FOR EACH ROW
EXECUTE FUNCTION audit_boundary_changes('updated');

-- Update farm_clusters updated_at on geospatial changes
CREATE OR REPLACE FUNCTION update_cluster_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE farm_clusters SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.cluster_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER land_surveys_update_cluster
AFTER INSERT OR UPDATE ON land_surveys
FOR EACH ROW
EXECUTE FUNCTION update_cluster_timestamp();

-- Useful Views
CREATE OR REPLACE VIEW boundary_statistics AS
SELECT 
  fc.id as cluster_id,
  fc.name as cluster_name,
  COUNT(lb.id) as total_boundaries,
  SUM(lb.area_hectares) as total_area_hectares,
  AVG(lb.accuracy_rating) as avg_accuracy,
  COUNT(CASE WHEN lb.verified_at IS NOT NULL THEN 1 END) as verified_count,
  MAX(lb.created_at) as last_boundary_added
FROM farm_clusters fc
LEFT JOIN land_boundaries lb ON fc.id = lb.cluster_id AND lb.deleted_at IS NULL
GROUP BY fc.id, fc.name;

-- Grants for RLS
GRANT SELECT ON land_boundaries TO authenticated;
GRANT INSERT, UPDATE ON land_boundaries TO authenticated;
GRANT SELECT ON land_surveys TO authenticated;
GRANT INSERT, UPDATE ON land_surveys TO authenticated;
GRANT SELECT ON geospatial_audit_logs TO authenticated;
GRANT SELECT ON boundary_statistics TO authenticated;
