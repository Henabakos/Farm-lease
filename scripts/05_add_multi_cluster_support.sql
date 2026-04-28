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
