import express from 'express';

const router = express.Router();

// Get agreements
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { status, clusterId } = req.query;

    let query = supabase
      .from('agreements')
      .select('*');

    // Filter by user involvement
    query = query.or(`owner_id.eq.${userId},tenant_id.eq.${userId}`);

    if (status) {
      query = query.eq('status', status);
    }

    if (clusterId) {
      query = query.eq('cluster_id', clusterId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('[v0] Get agreements error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get single agreement
router.get('/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('agreements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Agreement not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('[v0] Get agreement error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Create agreement
router.post('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const {
      proposalId,
      clusterId,
      tenantId,
      startDate,
      endDate,
      monthlyAmount,
      paymentFrequency,
      terms
    } = req.body;

    if (!proposalId || !clusterId || !tenantId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get proposal to verify ownership
    const { data: proposal } = await supabase
      .from('proposals')
      .select('owner_id')
      .eq('id', proposalId)
      .single();

    if (!proposal || proposal.owner_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const totalMonths = Math.ceil(
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24 * 30)
    );
    const totalAmount = monthlyAmount * totalMonths;

    const { data, error } = await supabase
      .from('agreements')
      .insert({
        proposal_id: proposalId,
        cluster_id: clusterId,
        owner_id: userId,
        tenant_id: tenantId,
        start_date: startDate,
        end_date: endDate,
        monthly_amount: monthlyAmount,
        total_amount: totalAmount,
        payment_frequency: paymentFrequency || 'monthly',
        terms,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    // Create notifications
    await supabase
      .from('notifications')
      .insert({
        user_id: tenantId,
        actor_id: userId,
        type: 'agreement',
        title: 'New Agreement',
        content: 'You have a new lease agreement',
        related_to_id: data.id,
        related_to_type: 'agreement'
      });

    // Create first payment record
    const firstPaymentDate = new Date(startDate);
    firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);

    await supabase
      .from('payments')
      .insert({
        agreement_id: data.id,
        payer_id: tenantId,
        receiver_id: userId,
        amount: monthlyAmount,
        status: 'pending',
        due_date: firstPaymentDate.toISOString().split('T')[0]
      });

    res.status(201).json(data);
  } catch (error) {
    console.error('[v0] Create agreement error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update agreement
router.put('/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;
    const updates = req.body;

    // Check authorization
    const { data: agreement } = await supabase
      .from('agreements')
      .select('owner_id, tenant_id')
      .eq('id', id)
      .single();

    if (!agreement || (agreement.owner_id !== userId && agreement.tenant_id !== userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('agreements')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('[v0] Update agreement error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Terminate agreement
router.post('/:id/terminate', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;
    const { reason } = req.body;

    const { data: agreement } = await supabase
      .from('agreements')
      .select('owner_id, tenant_id')
      .eq('id', id)
      .single();

    if (!agreement || (agreement.owner_id !== userId && agreement.tenant_id !== userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('agreements')
      .update({
        status: 'terminated',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Notify other party
    const otherPartyId = agreement.owner_id === userId ? agreement.tenant_id : agreement.owner_id;
    await supabase
      .from('notifications')
      .insert({
        user_id: otherPartyId,
        actor_id: userId,
        type: 'agreement',
        title: 'Agreement Terminated',
        content: reason || 'The lease agreement has been terminated',
        related_to_id: id,
        related_to_type: 'agreement'
      });

    res.json(data);
  } catch (error) {
    console.error('[v0] Terminate agreement error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
