-- Farm Lease Platform – full schema
-- Run in Supabase Dashboard → SQL Editor if npm run migrate fails

-- ========== 01_create_schema.sql ==========

-- Create schema for Farm Lease Platform
-- This migration sets up all tables with proper relationships and policies

-- 1. Users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('owner', 'tenant', 'admin')),
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Farm Clusters table
CREATE TABLE IF NOT EXISTS farm_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  area_hectares DECIMAL(10, 2),
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES farm_clusters(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  lease_term_months INT,
  proposed_price DECIMAL(15, 2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'negotiating', 'accepted', 'rejected', 'expired')),
  terms JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- 4. Negotiations table
CREATE TABLE IF NOT EXISTS negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_price DECIMAL(15, 2),
  proposed_price DECIMAL(15, 2),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'rejected', 'closed')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Agreements table
CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  cluster_id UUID NOT NULL REFERENCES farm_clusters(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'terminated', 'disputed')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_amount DECIMAL(15, 2),
  total_amount DECIMAL(15, 2),
  payment_frequency TEXT DEFAULT 'monthly',
  terms JSONB,
  document_url TEXT,
  signed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  transaction_id TEXT,
  notes TEXT,
  due_date DATE,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  related_to_id UUID,
  related_to_type TEXT CHECK (related_to_type IN ('proposal', 'agreement', 'payment', 'general')),
  content TEXT NOT NULL,
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Conversations table (for grouping related messages)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  related_to_id UUID,
  related_to_type TEXT,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user1_id, user2_id)
);

ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

-- 9. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('proposal', 'agreement', 'payment', 'message', 'system', 'negotiation')),
  title TEXT NOT NULL,
  content TEXT,
  related_to_id UUID,
  related_to_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiated_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  related_to_id UUID,
  related_to_type TEXT,
  meeting_type TEXT DEFAULT 'discussion' CHECK (meeting_type IN ('discussion', 'negotiation', 'inspection', 'signing')),
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES farm_clusters(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_clusters_owner ON farm_clusters(owner_id);
CREATE INDEX idx_proposals_cluster ON proposals(cluster_id);
CREATE INDEX idx_proposals_owner ON proposals(owner_id);
CREATE INDEX idx_proposals_tenant ON proposals(tenant_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_agreements_cluster ON agreements(cluster_id);
CREATE INDEX idx_agreements_owner ON agreements(owner_id);
CREATE INDEX idx_agreements_tenant ON agreements(tenant_id);
CREATE INDEX idx_agreements_status ON agreements(status);
CREATE INDEX idx_payments_agreement ON payments(agreement_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_read ON messages(is_read);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can read all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for farm_clusters
CREATE POLICY "Users can read clusters they own" ON farm_clusters
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Tenants can read published clusters" ON farm_clusters
  FOR SELECT USING (
    NOT auth.uid() = owner_id AND status = 'active'
  );

CREATE POLICY "Owners can update own clusters" ON farm_clusters
  FOR UPDATE USING (auth.uid() = owner_id);

-- RLS Policies for proposals
CREATE POLICY "Users can read own proposals" ON proposals
  FOR SELECT USING (
    auth.uid() = owner_id OR auth.uid() = tenant_id OR auth.uid() = owner_id
  );

CREATE POLICY "Owners can create proposals" ON proposals
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own proposals" ON proposals
  FOR UPDATE USING (auth.uid() = owner_id);

-- RLS Policies for agreements
CREATE POLICY "Users can read own agreements" ON agreements
  FOR SELECT USING (
    auth.uid() = owner_id OR auth.uid() = tenant_id
  );

CREATE POLICY "Owners and tenants can update agreements" ON agreements
  FOR UPDATE USING (
    auth.uid() = owner_id OR auth.uid() = tenant_id
  );

-- RLS Policies for payments
CREATE POLICY "Users can read own payments" ON payments
  FOR SELECT USING (
    auth.uid() = payer_id OR auth.uid() = receiver_id
  );

-- RLS Policies for messages
CREATE POLICY "Users can read own messages" ON messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can create messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for audit logs
CREATE POLICY "Only service role can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service role can read audit logs" ON audit_logs
  FOR SELECT USING (auth.role() = 'service_role');


-- ========== 02_add_geospatial.sql ==========

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


-- ========== 03_add_payment_verification.sql ==========

-- Payment Verification System
-- Adds comprehensive payment verification with receipt uploads and admin review workflow

-- 1. Add payment receipt storage table
CREATE TABLE IF NOT EXISTS payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata for tracking
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_receipts_payment_id ON payment_receipts(payment_id);
CREATE INDEX idx_payment_receipts_uploaded_by ON payment_receipts(uploaded_by);
CREATE INDEX idx_payment_receipts_verified_by ON payment_receipts(verified_by);
CREATE INDEX idx_payment_receipts_is_verified ON payment_receipts(is_verified);

-- 2. Create payment verifications table
CREATE TABLE IF NOT EXISTS payment_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL UNIQUE REFERENCES payments(id) ON DELETE CASCADE,
  
  -- Verification status workflow
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'verified', 'rejected', 'disputed')),
  rejection_reason TEXT,
  
  -- Verification details
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT,
  
  -- Amount verification
  declared_amount DECIMAL(15, 2) NOT NULL,
  verified_amount DECIMAL(15, 2),
  amount_matches BOOLEAN,
  
  -- Document verification
  receipt_count INT DEFAULT 0,
  all_receipts_verified BOOLEAN DEFAULT FALSE,
  
  -- Timeline
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  review_started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_verifications_status ON payment_verifications(status);
CREATE INDEX idx_payment_verifications_verified_by ON payment_verifications(verified_by);
CREATE INDEX idx_payment_verifications_submitted_at ON payment_verifications(submitted_at);

-- 3. Update payments table to include verification reference
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verification_id UUID REFERENCES payment_verifications(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending';

-- 4. Row Level Security for payment_receipts
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

-- Payers can see their own payment receipts
CREATE POLICY "Users can view their payment receipts" ON payment_receipts
  FOR SELECT USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM payments p 
      WHERE p.id = payment_id AND p.payer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Users can upload receipts for their own payments
CREATE POLICY "Users can upload receipts for their payments" ON payment_receipts
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM payments p 
      WHERE p.id = payment_id AND p.payer_id = auth.uid()
    )
  );

-- Only admins can verify receipts
CREATE POLICY "Admins can verify receipts" ON payment_receipts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 5. Row Level Security for payment_verifications
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;

-- Payers can see their payment verification status
CREATE POLICY "Users can view their payment verifications" ON payment_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM payments p 
      WHERE p.id = payment_id AND p.payer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Only admins can review and verify payments
CREATE POLICY "Admins can review payment verifications" ON payment_verifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 6. Audit trigger for payment verification changes
CREATE OR REPLACE FUNCTION audit_payment_verification_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, action, entity_type, entity_id, details, created_at
  ) VALUES (
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END,
    'payment_verification',
    NEW.id,
    jsonb_build_object(
      'status', NEW.status,
      'verified_by', NEW.verified_by,
      'amount_matches', NEW.amount_matches,
      'previous_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status END
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_verification_audit_trigger
AFTER INSERT OR UPDATE ON payment_verifications
FOR EACH ROW EXECUTE FUNCTION audit_payment_verification_changes();

-- 7. Helper function to calculate verification statistics
CREATE OR REPLACE FUNCTION get_payment_verification_stats(p_period_days INT DEFAULT 30)
RETURNS TABLE(
  total_payments BIGINT,
  pending_verification BIGINT,
  verified_count BIGINT,
  rejected_count BIGINT,
  average_verification_time_hours NUMERIC,
  verification_success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT pv.payment_id)::BIGINT,
    COUNT(CASE WHEN pv.status = 'pending' THEN 1 END)::BIGINT,
    COUNT(CASE WHEN pv.status = 'verified' THEN 1 END)::BIGINT,
    COUNT(CASE WHEN pv.status = 'rejected' THEN 1 END)::BIGINT,
    ROUND(
      AVG(EXTRACT(EPOCH FROM (pv.completed_at - pv.submitted_at)) / 3600)::NUMERIC, 
      2
    ),
    ROUND(
      (COUNT(CASE WHEN pv.status = 'verified' THEN 1 END)::NUMERIC / 
       NULLIF(COUNT(CASE WHEN pv.status IN ('verified', 'rejected') THEN 1 END), 0)) * 100,
      2
    )
  FROM payment_verifications pv
  WHERE pv.submitted_at >= NOW() - (p_period_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- 8. Indexes for performance
CREATE INDEX idx_payment_verifications_payment_id ON payment_verifications(payment_id);
CREATE INDEX idx_payment_verifications_created_at ON payment_verifications(created_at);
CREATE INDEX idx_payments_verification_id ON payments(verification_id);


-- ========== 04_add_contract_templates.sql ==========

-- Contract Templates System
-- Adds dynamic contract template management with clause library and version control

-- 1. Contract template library
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('lease', 'agreement', 'amendment', 'other')),
  
  -- Template management
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Version control
  version INT DEFAULT 1,
  current_version_id UUID,
  
  -- Organization
  category VARCHAR(100),
  tags JSONB DEFAULT '[]'::jsonb,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contract_templates_type ON contract_templates(type);
CREATE INDEX idx_contract_templates_is_active ON contract_templates(is_active);
CREATE INDEX idx_contract_templates_created_by ON contract_templates(created_by);

-- 2. Template versions (for version control and history)
CREATE TABLE IF NOT EXISTS contract_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES contract_templates(id) ON DELETE CASCADE,
  
  -- Version info
  version_number INT NOT NULL,
  version_name VARCHAR(255),
  change_log TEXT,
  
  -- Content
  preamble TEXT,
  footer TEXT,
  
  -- Status
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Audit
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(template_id, version_number)
);

CREATE INDEX idx_contract_template_versions_template_id ON contract_template_versions(template_id);
CREATE INDEX idx_contract_template_versions_is_published ON contract_template_versions(is_published);
CREATE INDEX idx_contract_template_versions_version_number ON contract_template_versions(version_number);

-- 3. Clause library (reusable legal clauses)
CREATE TABLE IF NOT EXISTS contract_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Clause info
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  
  -- Organization
  category VARCHAR(100) NOT NULL,
  sub_category VARCHAR(100),
  section_number VARCHAR(50),
  
  -- Metadata
  is_mandatory BOOLEAN DEFAULT FALSE,
  is_conditional BOOLEAN DEFAULT FALSE,
  conditions JSONB,
  
  -- Versioning
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contract_clauses_category ON contract_clauses(category);
CREATE INDEX idx_contract_clauses_section_number ON contract_clauses(section_number);
CREATE INDEX idx_contract_clauses_is_mandatory ON contract_clauses(is_mandatory);
CREATE INDEX idx_contract_clauses_is_active ON contract_clauses(is_active);

-- 4. Template clause mapping (joining templates with clauses)
CREATE TABLE IF NOT EXISTS contract_template_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_version_id UUID NOT NULL REFERENCES contract_template_versions(id) ON DELETE CASCADE,
  clause_id UUID NOT NULL REFERENCES contract_clauses(id) ON DELETE CASCADE,
  
  -- Positioning
  display_order INT NOT NULL,
  
  -- Customization
  is_customized BOOLEAN DEFAULT FALSE,
  customized_content TEXT,
  
  -- Status
  is_included BOOLEAN DEFAULT TRUE,
  is_optional BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(template_version_id, clause_id)
);

CREATE INDEX idx_contract_template_clauses_template_version_id ON contract_template_clauses(template_version_id);
CREATE INDEX idx_contract_template_clauses_clause_id ON contract_template_clauses(clause_id);
CREATE INDEX idx_contract_template_clauses_display_order ON contract_template_clauses(display_order);

-- 5. Update leases/agreements to reference templates
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS template_version_id UUID REFERENCES contract_template_versions(id) ON DELETE SET NULL;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS customizations JSONB DEFAULT '{}'::jsonb;

-- 6. Row Level Security for contract_templates
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can view active templates
CREATE POLICY "Anyone can view active templates" ON contract_templates
  FOR SELECT USING (is_active = TRUE);

-- Admins can manage all templates
CREATE POLICY "Admins can manage templates" ON contract_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 7. Row Level Security for contract_template_versions
ALTER TABLE contract_template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view published versions" ON contract_template_versions
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Creators can view their own versions" ON contract_template_versions
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Admins can manage all versions" ON contract_template_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 8. Row Level Security for contract_clauses
ALTER TABLE contract_clauses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active clauses" ON contract_clauses
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage clauses" ON contract_clauses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 9. Row Level Security for template clause mappings
ALTER TABLE contract_template_clauses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view published template clauses" ON contract_template_clauses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contract_template_versions ctv
      WHERE ctv.id = template_version_id AND ctv.is_published = TRUE
    )
  );

CREATE POLICY "Admins can manage all template clauses" ON contract_template_clauses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 10. Audit trigger for template changes
CREATE OR REPLACE FUNCTION audit_contract_template_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, action, entity_type, entity_id, details, created_at
  ) VALUES (
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END,
    'contract_template',
    NEW.id,
    jsonb_build_object(
      'name', NEW.name,
      'type', NEW.type,
      'version', NEW.version,
      'is_active', NEW.is_active
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contract_template_audit_trigger
AFTER INSERT OR UPDATE ON contract_templates
FOR EACH ROW EXECUTE FUNCTION audit_contract_template_changes();

-- 11. Helper function to get template with clauses
CREATE OR REPLACE FUNCTION get_template_with_clauses(p_template_version_id UUID)
RETURNS TABLE(
  template_id UUID,
  template_name VARCHAR,
  version_number INT,
  preamble TEXT,
  clauses JSONB,
  footer TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.id,
    ct.name,
    ctv.version_number,
    ctv.preamble,
    jsonb_agg(
      jsonb_build_object(
        'id', cc.id,
        'clause_id', cc.clause_id,
        'title', c.title,
        'content', COALESCE(cc.customized_content, c.content),
        'category', c.category,
        'display_order', cc.display_order,
        'is_customized', cc.is_customized,
        'is_optional', cc.is_optional
      )
      ORDER BY cc.display_order
    ),
    ctv.footer
  FROM contract_template_versions ctv
  JOIN contract_templates ct ON ct.id = ctv.template_id
  LEFT JOIN contract_template_clauses cc ON cc.template_version_id = ctv.id
  LEFT JOIN contract_clauses c ON c.id = cc.clause_id
  WHERE ctv.id = p_template_version_id
  GROUP BY ct.id, ct.name, ctv.version_number, ctv.preamble, ctv.footer;
END;
$$ LANGUAGE plpgsql;

-- 12. Helper function to compare template versions
CREATE OR REPLACE FUNCTION compare_template_versions(p_template_id UUID, p_version_1 INT, p_version_2 INT)
RETURNS TABLE(
  clause_id UUID,
  clause_name VARCHAR,
  version_1_present BOOLEAN,
  version_2_present BOOLEAN,
  content_changed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT 
    c.id,
    c.title,
    (ctc1.id IS NOT NULL)::BOOLEAN,
    (ctc2.id IS NOT NULL)::BOOLEAN,
    CASE 
      WHEN ctc1.id IS NULL OR ctc2.id IS NULL THEN TRUE
      WHEN ctc1.customized_content != ctc2.customized_content THEN TRUE
      ELSE FALSE
    END
  FROM contract_clauses c
  FULL OUTER JOIN contract_template_clauses ctc1 ON 
    ctc1.clause_id = c.id AND
    ctc1.template_version_id = (
      SELECT id FROM contract_template_versions 
      WHERE template_id = p_template_id AND version_number = p_version_1
    )
  FULL OUTER JOIN contract_template_clauses ctc2 ON 
    ctc2.clause_id = c.id AND
    ctc2.template_version_id = (
      SELECT id FROM contract_template_versions 
      WHERE template_id = p_template_id AND version_number = p_version_2
    );
END;
$$ LANGUAGE plpgsql;

-- 13. Indexes for performance
CREATE INDEX idx_contract_templates_created_at ON contract_templates(created_at);
CREATE INDEX idx_contract_template_versions_published_at ON contract_template_versions(published_at);
CREATE INDEX idx_contract_clauses_created_at ON contract_clauses(created_at);


-- ========== 05_add_multi_cluster_support.sql ==========

-- Multi-Cluster Support System
-- Allows users to belong to multiple clusters with role-based permissions

-- 1. User cluster memberships
CREATE TABLE IF NOT EXISTS user_cluster_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cluster_id UUID NOT NULL REFERENCES farm_clusters(id) ON DELETE CASCADE,
  
  -- Role in this specific cluster
  role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member', 'viewer')),
  
  -- Permissions override (can be more granular than role)
  permissions JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  invitation_token VARCHAR(255),
  invitation_accepted_at TIMESTAMP WITH TIME ZONE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invitation_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, cluster_id)
);

CREATE INDEX idx_user_cluster_memberships_user_id ON user_cluster_memberships(user_id);
CREATE INDEX idx_user_cluster_memberships_cluster_id ON user_cluster_memberships(cluster_id);
CREATE INDEX idx_user_cluster_memberships_role ON user_cluster_memberships(role);
CREATE INDEX idx_user_cluster_memberships_is_active ON user_cluster_memberships(is_active);

-- 2. Cluster-specific permissions table
CREATE TABLE IF NOT EXISTS cluster_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES farm_clusters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Fine-grained permissions
  can_manage_members BOOLEAN DEFAULT FALSE,
  can_edit_cluster BOOLEAN DEFAULT FALSE,
  can_create_proposals BOOLEAN DEFAULT FALSE,
  can_approve_proposals BOOLEAN DEFAULT FALSE,
  can_manage_payments BOOLEAN DEFAULT FALSE,
  can_view_analytics BOOLEAN DEFAULT FALSE,
  can_manage_contracts BOOLEAN DEFAULT FALSE,
  can_view_geospatial BOOLEAN DEFAULT FALSE,
  can_edit_geospatial BOOLEAN DEFAULT FALSE,
  can_manage_audit_logs BOOLEAN DEFAULT FALSE,
  
  -- Custom permissions (for extensibility)
  custom_permissions JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(cluster_id, user_id)
);

CREATE INDEX idx_cluster_permissions_cluster_id ON cluster_permissions(cluster_id);
CREATE INDEX idx_cluster_permissions_user_id ON cluster_permissions(user_id);

-- 3. Update farm_clusters to track owner and metadata
ALTER TABLE farm_clusters ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE farm_clusters ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE farm_clusters ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE farm_clusters ADD COLUMN IF NOT EXISTS members_count INT DEFAULT 1;
ALTER TABLE farm_clusters ADD COLUMN IF NOT EXISTS active_agreements_count INT DEFAULT 0;

-- 4. Create migration function to populate initial memberships from old system
CREATE OR REPLACE FUNCTION migrate_clusters_to_multi_cluster()
RETURNS void AS $$
DECLARE
  v_cluster RECORD;
  v_owner_id UUID;
BEGIN
  -- For each cluster, create membership for its owner
  FOR v_cluster IN SELECT * FROM farm_clusters WHERE owner_id IS NOT NULL LOOP
    INSERT INTO user_cluster_memberships (user_id, cluster_id, role, is_active, joined_at)
    VALUES (v_cluster.owner_id, v_cluster.id, 'owner', TRUE, v_cluster.created_at)
    ON CONFLICT (user_id, cluster_id) DO NOTHING;
    
    -- Grant all permissions to owner
    INSERT INTO cluster_permissions (
      cluster_id, user_id, 
      can_manage_members, can_edit_cluster, can_create_proposals, 
      can_approve_proposals, can_manage_payments, can_view_analytics,
      can_manage_contracts, can_view_geospatial, can_edit_geospatial, 
      can_manage_audit_logs
    ) VALUES (
      v_cluster.id, v_cluster.owner_id,
      TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE
    )
    ON CONFLICT (cluster_id, user_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Row Level Security for user_cluster_memberships
ALTER TABLE user_cluster_memberships ENABLE ROW LEVEL SECURITY;

-- Users can see their own memberships
CREATE POLICY "Users can view their own memberships" ON user_cluster_memberships
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Cluster owners can manage members
CREATE POLICY "Cluster owners can manage members" ON user_cluster_memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_cluster_memberships ucm
      WHERE ucm.user_id = auth.uid() 
      AND ucm.cluster_id = cluster_id 
      AND ucm.role = 'owner'
      AND ucm.is_active = TRUE
    ) OR
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 6. Row Level Security for cluster_permissions
ALTER TABLE cluster_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view permissions they have or own cluster" ON cluster_permissions
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_cluster_memberships ucm
      WHERE ucm.user_id = auth.uid() 
      AND ucm.cluster_id = cluster_id 
      AND ucm.role = 'owner'
      AND ucm.is_active = TRUE
    ) OR
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Cluster owners can manage permissions" ON cluster_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_cluster_memberships ucm
      WHERE ucm.user_id = auth.uid() 
      AND ucm.cluster_id = cluster_id 
      AND ucm.role = 'owner'
      AND ucm.is_active = TRUE
    ) OR
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 7. Audit trigger for membership changes
CREATE OR REPLACE FUNCTION audit_cluster_membership_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, action, entity_type, entity_id, details, created_at
  ) VALUES (
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END,
    'user_cluster_membership',
    NEW.id,
    jsonb_build_object(
      'user_id', NEW.user_id,
      'cluster_id', NEW.cluster_id,
      'role', NEW.role,
      'is_active', NEW.is_active
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cluster_membership_audit_trigger
AFTER INSERT OR UPDATE ON user_cluster_memberships
FOR EACH ROW EXECUTE FUNCTION audit_cluster_membership_changes();

-- 8. Helper function to get user's clusters
CREATE OR REPLACE FUNCTION get_user_clusters(p_user_id UUID)
RETURNS TABLE(
  cluster_id UUID,
  cluster_name VARCHAR,
  role VARCHAR,
  is_owner BOOLEAN,
  member_count INT,
  joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fc.id,
    fc.name,
    ucm.role,
    (ucm.role = 'owner')::BOOLEAN,
    fc.members_count,
    ucm.joined_at
  FROM user_cluster_memberships ucm
  JOIN farm_clusters fc ON fc.id = ucm.cluster_id
  WHERE ucm.user_id = p_user_id AND ucm.is_active = TRUE
  ORDER BY ucm.joined_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 9. Helper function to get cluster members
CREATE OR REPLACE FUNCTION get_cluster_members(p_cluster_id UUID)
RETURNS TABLE(
  user_id UUID,
  email VARCHAR,
  full_name VARCHAR,
  role VARCHAR,
  joined_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name,
    ucm.role,
    ucm.joined_at,
    ucm.is_active
  FROM user_cluster_memberships ucm
  JOIN auth.users u ON u.id = ucm.user_id
  WHERE ucm.cluster_id = p_cluster_id
  ORDER BY ucm.role DESC, ucm.joined_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 10. Helper function to check user cluster permission
CREATE OR REPLACE FUNCTION has_cluster_permission(
  p_user_id UUID, 
  p_cluster_id UUID, 
  p_permission VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_result BOOLEAN;
BEGIN
  -- Admin users have all permissions
  IF (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = p_user_id) = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permission
  SELECT CASE p_permission
    WHEN 'manage_members' THEN can_manage_members
    WHEN 'edit_cluster' THEN can_edit_cluster
    WHEN 'create_proposals' THEN can_create_proposals
    WHEN 'approve_proposals' THEN can_approve_proposals
    WHEN 'manage_payments' THEN can_manage_payments
    WHEN 'view_analytics' THEN can_view_analytics
    WHEN 'manage_contracts' THEN can_manage_contracts
    WHEN 'view_geospatial' THEN can_view_geospatial
    WHEN 'edit_geospatial' THEN can_edit_geospatial
    WHEN 'manage_audit_logs' THEN can_manage_audit_logs
    ELSE FALSE
  END INTO v_result
  FROM cluster_permissions
  WHERE cluster_id = p_cluster_id AND user_id = p_user_id;
  
  RETURN COALESCE(v_result, FALSE);
END;
$$ LANGUAGE plpgsql;

-- 11. Indexes for performance
CREATE INDEX idx_user_cluster_memberships_created_at ON user_cluster_memberships(created_at);
CREATE INDEX idx_cluster_permissions_created_at ON cluster_permissions(created_at);
CREATE INDEX idx_farm_clusters_owner_id ON farm_clusters(owner_id);
CREATE INDEX idx_farm_clusters_is_archived ON farm_clusters(is_archived);


