import express from 'express';

const router = express.Router();

// Get proposals
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { clusterId, status, role } = req.query;

    let query = supabase.from('proposals').select('*');

    if (clusterId) {
      query = query.eq('cluster_id', clusterId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Filter by user role
    if (role === 'owner') {
      query = query.eq('owner_id', userId);
    } else if (role === 'tenant') {
      query = query.or(`tenant_id.eq.${userId},status.eq.published`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('[v0] Get proposals error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get single proposal
router.get('/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('[v0] Get proposal error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Create proposal
router.post('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { clusterId, title, description, leaseTermMonths, proposedPrice, terms } = req.body;

    if (!clusterId || !title) {
      return res.status(400).json({ error: 'Cluster ID and title required' });
    }

    const { data, error } = await supabase
      .from('proposals')
      .insert({
        cluster_id: clusterId,
        owner_id: userId,
        title,
        description,
        lease_term_months: leaseTermMonths,
        proposed_price: proposedPrice,
        terms,
        status: 'draft',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for owner
    await createNotification(supabase, userId, userId, 'proposal', 'Proposal created', data.title, data.id);

    res.status(201).json(data);
  } catch (error) {
    console.error('[v0] Create proposal error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update proposal
router.put('/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;
    const updates = req.body;

    // Check ownership
    const { data: proposal } = await supabase
      .from('proposals')
      .select('owner_id, tenant_id')
      .eq('id', id)
      .single();

    if (!proposal || proposal.owner_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('proposals')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Notify tenant if status changed
    if (updates.status && proposal.tenant_id) {
      const statusMessages = {
        published: 'Proposal published',
        accepted: 'Proposal accepted',
        rejected: 'Proposal rejected'
      };
      await createNotification(
        supabase,
        proposal.tenant_id,
        userId,
        'proposal',
        statusMessages[updates.status] || 'Proposal updated',
        data.title,
        id
      );
    }

    res.json(data);
  } catch (error) {
    console.error('[v0] Update proposal error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Accept proposal
router.post('/:id/accept', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;

    // Get proposal
    const { data: proposal, error: getError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .single();

    if (getError || !proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Update proposal status
    const { data, error } = await supabase
      .from('proposals')
      .update({
        status: 'accepted',
        tenant_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Notify owner
    await createNotification(
      supabase,
      proposal.owner_id,
      userId,
      'proposal',
      'Proposal accepted',
      proposal.title,
      id
    );

    // Emit real-time update
    const io = req.app.locals.io;
    io.to(`notifications:${proposal.owner_id}`).emit('notification', {
      type: 'proposal_accepted',
      proposalId: id
    });

    res.json(data);
  } catch (error) {
    console.error('[v0] Accept proposal error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Reject proposal
router.post('/:id/reject', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;
    const { reason } = req.body;

    const { data: proposal } = await supabase
      .from('proposals')
      .select('owner_id')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('proposals')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await createNotification(
      supabase,
      proposal.owner_id,
      userId,
      'proposal',
      'Proposal rejected',
      reason || 'Your proposal was rejected',
      id
    );

    res.json(data);
  } catch (error) {
    console.error('[v0] Reject proposal error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

async function createNotification(supabase, userId, actorId, type, title, content, relatedId) {
  try {
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        actor_id: actorId,
        type,
        title,
        content,
        related_to_id: relatedId,
        related_to_type: 'proposal'
      });
  } catch (error) {
    console.error('[v0] Create notification failed:', error.message);
  }
}

export default router;
