import express from 'express';

const router = express.Router();

// Get notifications
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { unreadOnly = false, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);

    if (unreadOnly === 'true') {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('[v0] Get notifications error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get unread count
router.get('/unread/count', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    res.json({ unreadCount: count || 0 });
  } catch (error) {
    console.error('[v0] Get unread count error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get single notification
router.get('/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('[v0] Get notification error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('[v0] Mark read error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
router.put('/read-all/bulk', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('[v0] Mark all read error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('[v0] Delete notification error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete all read notifications
router.delete('/read/all', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('is_read', true);

    if (error) throw error;

    res.json({ message: 'All read notifications deleted' });
  } catch (error) {
    console.error('[v0] Delete read error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
