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
