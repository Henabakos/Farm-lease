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
ALTER TABLE lease_agreements ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL;
ALTER TABLE lease_agreements ADD COLUMN IF NOT EXISTS template_version_id UUID REFERENCES contract_template_versions(id) ON DELETE SET NULL;
ALTER TABLE lease_agreements ADD COLUMN IF NOT EXISTS customizations JSONB DEFAULT '{}'::jsonb;

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
