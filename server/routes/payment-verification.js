import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - List pending payment verifications (admin only)
router.get('/pending', async (req, res) => {
  try {
    const { data: user } = await supabase.auth.admin.getUserById(req.user.id);
    
    if (user?.raw_user_meta_data?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view pending verifications' });
    }

    const { data, error } = await supabase
      .from('payment_verifications')
      .select(`
        *,
        payment:payments(*),
        verified_by:auth.users(id, email, raw_user_meta_data)
      `)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Get verification details
router.get('/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    const { data: verification, error: verError } = await supabase
      .from('payment_verifications')
      .select(`
        *,
        payment:payments(*),
        receipts:payment_receipts(*)
      `)
      .eq('payment_id', paymentId)
      .single();

    if (verError) throw verError;

    // Check access
    const { data: payment } = await supabase
      .from('payments')
      .select('payer_id')
      .eq('id', paymentId)
      .single();

    const { data: user } = await supabase.auth.admin.getUserById(req.user.id);
    const isAdmin = user?.raw_user_meta_data?.role === 'admin';
    const isPayer = payment?.payer_id === req.user.id;

    if (!isAdmin && !isPayer) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(verification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Upload receipt for payment
router.post('/:paymentId/receipts', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { fileName, fileUrl, fileType, fileSize, mimeType } = req.body;

    // Verify user is payer
    const { data: payment } = await supabase
      .from('payments')
      .select('payer_id')
      .eq('id', paymentId)
      .single();

    if (payment?.payer_id !== req.user.id) {
      return res.status(403).json({ error: 'Only payer can upload receipts' });
    }

    // Create or get verification record
    let { data: verification } = await supabase
      .from('payment_verifications')
      .select('id')
      .eq('payment_id', paymentId)
      .single();

    if (!verification) {
      const { data: payment_data } = await supabase
        .from('payments')
        .select('amount')
        .eq('id', paymentId)
        .single();

      const { data: newVer, error: createError } = await supabase
        .from('payment_verifications')
        .insert({
          payment_id: paymentId,
          status: 'pending',
          declared_amount: payment_data?.amount,
          submitted_at: new Date().toISOString()
        })
        .select();

      if (createError) throw createError;
      verification = newVer[0];
    }

    // Upload receipt
    const { data: receipt, error: receiptError } = await supabase
      .from('payment_receipts')
      .insert({
        payment_id: paymentId,
        file_name: fileName,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize,
        mime_type: mimeType,
        uploaded_by: req.user.id,
        is_verified: false
      })
      .select();

    if (receiptError) throw receiptError;

    // Update receipt count
    const { data: receipts } = await supabase
      .from('payment_receipts')
      .select('id', { count: 'exact' })
      .eq('payment_id', paymentId);

    await supabase
      .from('payment_verifications')
      .update({ receipt_count: receipts?.length || 0 })
      .eq('id', verification.id);

    res.json({ receipt: receipt[0], message: 'Receipt uploaded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - List receipts for payment
router.get('/:paymentId/receipts', async (req, res) => {
  try {
    const { paymentId } = req.params;

    const { data: receipts, error } = await supabase
      .from('payment_receipts')
      .select('*')
      .eq('payment_id', paymentId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Delete receipt
router.delete('/receipts/:receiptId', async (req, res) => {
  try {
    const { receiptId } = req.params;

    // Verify user is the uploader
    const { data: receipt } = await supabase
      .from('payment_receipts')
      .select('uploaded_by')
      .eq('id', receiptId)
      .single();

    if (receipt?.uploaded_by !== req.user.id) {
      return res.status(403).json({ error: 'Only uploader can delete receipt' });
    }

    const { error } = await supabase
      .from('payment_receipts')
      .delete()
      .eq('id', receiptId);

    if (error) throw error;
    res.json({ message: 'Receipt deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Verify payment (admin only)
router.post('/:paymentId/verify', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { verifiedAmount, notes, status } = req.body;

    const { data: user } = await supabase.auth.admin.getUserById(req.user.id);
    if (user?.raw_user_meta_data?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can verify payments' });
    }

    const now = new Date().toISOString();
    const newStatus = status || 'verified';

    const { data, error } = await supabase
      .from('payment_verifications')
      .update({
        status: newStatus,
        verified_by: req.user.id,
        verified_at: newStatus === 'verified' ? now : null,
        verification_notes: notes,
        verified_amount: verifiedAmount,
        amount_matches: verifiedAmount === (await supabase
          .from('payments')
          .select('amount')
          .eq('id', paymentId)
          .single()).data?.amount,
        all_receipts_verified: newStatus === 'verified',
        review_started_at: new Date().toISOString(),
        completed_at: ['verified', 'rejected'].includes(newStatus) ? now : null
      })
      .eq('payment_id', paymentId)
      .select();

    if (error) throw error;

    // Update payment status
    await supabase
      .from('payments')
      .update({ 
        verification_status: newStatus,
        status: newStatus === 'verified' ? 'verified' : 'under_review'
      })
      .eq('id', paymentId);

    res.json({ 
      verification: data[0], 
      message: `Payment ${newStatus} successfully` 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Verification statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { data: user } = await supabase.auth.admin.getUserById(req.user.id);
    if (user?.raw_user_meta_data?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view stats' });
    }

    const { data, error } = await supabase
      .rpc('get_payment_verification_stats', { p_period_days: 30 });

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
