import express from 'express';

const router = express.Router();

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, phone, avatar_url, bio, verification_status, created_at')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('[v0] Get user error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;

    if (userId !== id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const allowedFields = ['full_name', 'phone', 'avatar_url', 'bio'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const { data, error } = await supabase
      .from('users')
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
    console.error('[v0] Update user error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Search users
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { q, role } = req.query;

    let query = supabase
      .from('users')
      .select('id, email, full_name, role, avatar_url, verification_status');

    if (q) {
      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query.limit(20);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('[v0] Search users error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Verify user (admin only)
router.post('/:id/verify', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (adminUser?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        verification_status: 'verified',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: id,
        actor_id: userId,
        type: 'system',
        title: 'Verification Complete',
        content: 'Your account has been verified',
        is_read: false
      });

    res.json(data);
  } catch (error) {
    console.error('[v0] Verify user error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
