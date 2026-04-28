import express from 'express';

const router = express.Router();

// Get payments
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { status, agreementId } = req.query;

    let query = supabase
      .from('payments')
      .select('*');

    // Filter by user involvement
    query = query.or(`payer_id.eq.${userId},receiver_id.eq.${userId}`);

    if (status) {
      query = query.eq('status', status);
    }

    if (agreementId) {
      query = query.eq('agreement_id', agreementId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('[v0] Get payments error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get single payment
router.get('/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('[v0] Get payment error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Create manual payment
router.post('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { agreementId, amount, paymentMethod, notes } = req.body;

    if (!agreementId || !amount) {
      return res.status(400).json({ error: 'Agreement ID and amount required' });
    }

    // Get agreement
    const { data: agreement } = await supabase
      .from('agreements')
      .select('owner_id, tenant_id')
      .eq('id', agreementId)
      .single();

    if (!agreement) {
      return res.status(404).json({ error: 'Agreement not found' });
    }

    // Determine payer and receiver
    const isPayer = userId === agreement.tenant_id;
    if (!isPayer && userId !== agreement.owner_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('payments')
      .insert({
        agreement_id: agreementId,
        payer_id: agreement.tenant_id,
        receiver_id: agreement.owner_id,
        amount,
        payment_method: paymentMethod || 'bank_transfer',
        status: 'pending',
        notes
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for receiver
    await supabase
      .from('notifications')
      .insert({
        user_id: agreement.owner_id,
        actor_id: agreement.tenant_id,
        type: 'payment',
        title: 'Payment Pending',
        content: `A payment of $${amount} is pending`,
        related_to_id: data.id,
        related_to_type: 'payment'
      });

    res.status(201).json(data);
  } catch (error) {
    console.error('[v0] Create payment error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Process payment
router.post('/:id/process', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;
    const { transactionId, paymentProof } = req.body;

    // Get payment
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.payer_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        transaction_id: transactionId,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Create notification for receiver
    await supabase
      .from('notifications')
      .insert({
        user_id: payment.receiver_id,
        actor_id: userId,
        type: 'payment',
        title: 'Payment Received',
        content: `Payment of $${payment.amount} received successfully`,
        related_to_id: id,
        related_to_type: 'payment'
      });

    // Emit real-time update
    const io = req.app.locals.io;
    io.to(`notifications:${payment.receiver_id}`).emit('payment_received', {
      paymentId: id,
      amount: payment.amount
    });

    res.json(data);
  } catch (error) {
    console.error('[v0] Process payment error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Refund payment
router.post('/:id/refund', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;
    const { reason } = req.body;

    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (!payment || payment.receiver_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Notify payer
    await supabase
      .from('notifications')
      .insert({
        user_id: payment.payer_id,
        actor_id: userId,
        type: 'payment',
        title: 'Payment Refunded',
        content: reason || 'Your payment has been refunded',
        related_to_id: id,
        related_to_type: 'payment'
      });

    res.json(data);
  } catch (error) {
    console.error('[v0] Refund payment error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
