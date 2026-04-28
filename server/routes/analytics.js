import express from 'express';

const router = express.Router();

// Log event
router.post('/events', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { clusterId, eventType, eventData } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'Event type required' });
    }

    const { data, error } = await supabase
      .from('analytics')
      .insert({
        user_id: userId,
        cluster_id: clusterId,
        event_type: eventType,
        event_data: eventData
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('[v0] Log event error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    const role = userData?.role;

    // Get stats based on role
    let stats = {};

    if (role === 'owner') {
      // Owner stats
      const { count: clustersCount } = await supabase
        .from('farm_clusters')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId);

      const { count: proposalsCount } = await supabase
        .from('proposals')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId);

      const { count: agreementsCount } = await supabase
        .from('agreements')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId);

      const { data: totalRevenue } = await supabase
        .from('payments')
        .select('amount')
        .eq('receiver_id', userId)
        .eq('status', 'completed');

      stats = {
        clustersCount: clustersCount || 0,
        proposalsCount: proposalsCount || 0,
        agreementsCount: agreementsCount || 0,
        totalRevenue: totalRevenue?.reduce((sum, p) => sum + p.amount, 0) || 0
      };
    } else if (role === 'tenant') {
      // Tenant stats
      const { count: agreementsCount } = await supabase
        .from('agreements')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', userId);

      const { count: paymentsCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('payer_id', userId);

      const { data: pendingPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('payer_id', userId)
        .eq('status', 'pending');

      stats = {
        agreementsCount: agreementsCount || 0,
        paymentsCount: paymentsCount || 0,
        pendingAmount: pendingPayments?.reduce((sum, p) => sum + p.amount, 0) || 0
      };
    }

    res.json(stats);
  } catch (error) {
    console.error('[v0] Get dashboard stats error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get revenue analytics (owner only)
router.get('/revenue', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { months = 12 } = req.query;

    // Check if owner
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userData?.role !== 'owner') {
      return res.status(403).json({ error: 'Owner access required' });
    }

    const { data, error } = await supabase
      .from('payments')
      .select('amount, paid_at')
      .eq('receiver_id', userId)
      .eq('status', 'completed')
      .gt('paid_at', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    // Group by month
    const revenueByMonth = {};
    data?.forEach(payment => {
      if (payment.paid_at) {
        const date = new Date(payment.paid_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + payment.amount;
      }
    });

    res.json(revenueByMonth);
  } catch (error) {
    console.error('[v0] Get revenue analytics error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get payment analytics
router.get('/payments', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;

    const { data, error } = await supabase
      .from('payments')
      .select('status, amount')
      .or(`payer_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) throw error;

    // Group by status
    const statsByStatus = {
      pending: { count: 0, total: 0 },
      completed: { count: 0, total: 0 },
      failed: { count: 0, total: 0 },
      refunded: { count: 0, total: 0 }
    };

    data?.forEach(payment => {
      if (statsByStatus[payment.status]) {
        statsByStatus[payment.status].count++;
        statsByStatus[payment.status].total += payment.amount;
      }
    });

    res.json(statsByStatus);
  } catch (error) {
    console.error('[v0] Get payment analytics error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get cluster analytics
router.get('/clusters/:clusterId', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { clusterId } = req.params;

    // Get cluster
    const { data: cluster } = await supabase
      .from('farm_clusters')
      .select('*')
      .eq('id', clusterId)
      .single();

    if (!cluster) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    // Get related data
    const { count: proposalsCount } = await supabase
      .from('proposals')
      .select('*', { count: 'exact', head: true })
      .eq('cluster_id', clusterId);

    const { count: agreementsCount } = await supabase
      .from('agreements')
      .select('*', { count: 'exact', head: true })
      .eq('cluster_id', clusterId);

    const { data: agreements } = await supabase
      .from('agreements')
      .select('monthly_amount, status')
      .eq('cluster_id', clusterId);

    const monthlyIncome = agreements
      ?.filter(a => a.status === 'active')
      .reduce((sum, a) => sum + (a.monthly_amount || 0), 0) || 0;

    res.json({
      cluster,
      proposalsCount: proposalsCount || 0,
      agreementsCount: agreementsCount || 0,
      monthlyIncome
    });
  } catch (error) {
    console.error('[v0] Get cluster analytics error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
