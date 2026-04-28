import express from 'express';
import { rbacMiddleware } from '../middleware/index.js';

const router = express.Router();

// Apply admin RBAC to all routes
router.use(rbacMiddleware(['admin']));

// Get all users
router.get('/users', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { role, limit = 50, offset = 0 } = req.query;

    let query = supabase.from('users').select('*');

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('[v0] Get users error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get user details
router.get('/users/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('*')
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

// Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;
    const { role } = req.body;

    if (!['owner', 'tenant', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log action
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: 'UPDATE_USER_ROLE',
        entity_type: 'user',
        entity_id: id,
        changes: { role }
      });

    res.json(data);
  } catch (error) {
    console.error('[v0] Update user role error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Deactivate user
router.post('/users/:id/deactivate', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;
    const { reason } = req.body;

    // Prevent self-deactivation
    if (userId === id) {
      return res.status(400).json({ error: 'Cannot deactivate own account' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ verification_status: 'unverified' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log action
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: 'DEACTIVATE_USER',
        entity_type: 'user',
        entity_id: id,
        changes: { reason }
      });

    res.json(data);
  } catch (error) {
    console.error('[v0] Deactivate user error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { limit = 100, offset = 0, action, userId: filterId } = req.query;

    let query = supabase.from('audit_logs').select('*');

    if (action) {
      query = query.eq('action', action);
    }

    if (filterId) {
      query = query.eq('user_id', filterId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('[v0] Get audit logs error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    // Get counts
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: clustersCount } = await supabase
      .from('farm_clusters')
      .select('*', { count: 'exact', head: true });

    const { count: agreementsCount } = await supabase
      .from('agreements')
      .select('*', { count: 'exact', head: true });

    const { count: paymentsCount } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true });

    // Get role distribution
    const { data: roleData } = await supabase
      .from('users')
      .select('role');

    const roleDistribution = {};
    roleData?.forEach(u => {
      roleDistribution[u.role] = (roleDistribution[u.role] || 0) + 1;
    });

    // Get total revenue
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed');

    const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    res.json({
      usersCount: usersCount || 0,
      clustersCount: clustersCount || 0,
      agreementsCount: agreementsCount || 0,
      paymentsCount: paymentsCount || 0,
      roleDistribution,
      totalRevenue
    });
  } catch (error) {
    console.error('[v0] Get stats error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get platform overview
router.get('/overview', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    // Get recent activities
    const { data: recentLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get pending approvals (unverified users)
    const { count: pendingVerifications } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending');

    // Get active agreements
    const { count: activeAgreements } = await supabase
      .from('agreements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    res.json({
      recentActivities: recentLogs || [],
      pendingVerifications: pendingVerifications || 0,
      activeAgreements: activeAgreements || 0
    });
  } catch (error) {
    console.error('[v0] Get overview error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
