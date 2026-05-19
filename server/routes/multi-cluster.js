import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - List user's clusters
router.get('/my-clusters', async (req, res) => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_clusters', { p_user_id: req.user.id });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Get cluster members
router.get('/:clusterId/members', async (req, res) => {
  try {
    const { clusterId } = req.params;

    // Check if user is member of cluster
    const { data: membership } = await supabase
      .from('user_cluster_memberships')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('cluster_id', clusterId)
      .eq('is_active', true)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data, error } = await supabase
      .rpc('get_cluster_members', { p_cluster_id: clusterId });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Invite user to cluster (owner only)
router.post('/:clusterId/invite', async (req, res) => {
  try {
    const { clusterId } = req.params;
    const { email, role } = req.body;

    // Check if requester is cluster owner
    const { data: membership } = await supabase
      .from('user_cluster_memberships')
      .select('role')
      .eq('user_id', req.user.id)
      .eq('cluster_id', clusterId)
      .eq('is_active', true)
      .single();

    if (membership?.role !== 'owner') {
      return res.status(403).json({ error: 'Only cluster owners can invite members' });
    }

    // Generate invitation token
    const invitationToken = Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15);

    // Find or create user by email
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData?.users?.find(u => u.email === email);

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Create membership with invitation
    const { data, error } = await supabase
      .from('user_cluster_memberships')
      .insert({
        user_id: user.id,
        cluster_id: clusterId,
        role: role || 'member',
        invitation_token: invitationToken,
        invitation_sent_at: new Date().toISOString(),
        invited_by: req.user.id,
        is_active: false
      })
      .select();

    if (error) throw error;

    // TODO: Send invitation email

    res.status(201).json({
      membership: data[0],
      message: 'Invitation sent successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Accept cluster invitation
router.post('/:clusterId/accept-invitation/:token', async (req, res) => {
  try {
    const { clusterId, token } = req.params;

    const { data, error } = await supabase
      .from('user_cluster_memberships')
      .update({
        is_active: true,
        invitation_accepted_at: new Date().toISOString()
      })
      .eq('user_id', req.user.id)
      .eq('cluster_id', clusterId)
      .eq('invitation_token', token)
      .select();

    if (error) throw error;
    if (!data?.length) {
      return res.status(404).json({ error: 'Invitation not found or expired' });
    }

    res.json({
      membership: data[0],
      message: 'Cluster joined successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Get user permissions in cluster
router.get('/:clusterId/permissions', async (req, res) => {
  try {
    const { clusterId } = req.params;

    const { data, error } = await supabase
      .from('cluster_permissions')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('cluster_id', clusterId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    res.json(data || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - Update user role in cluster (owner only)
router.put('/:clusterId/members/:userId/role', async (req, res) => {
  try {
    const { clusterId, userId } = req.params;
    const { role } = req.body;

    // Check if requester is cluster owner
    const { data: membership } = await supabase
      .from('user_cluster_memberships')
      .select('role')
      .eq('user_id', req.user.id)
      .eq('cluster_id', clusterId)
      .eq('is_active', true)
      .single();

    if (membership?.role !== 'owner') {
      return res.status(403).json({ error: 'Only cluster owners can update roles' });
    }

    const { data, error } = await supabase
      .from('user_cluster_memberships')
      .update({ role })
      .eq('user_id', userId)
      .eq('cluster_id', clusterId)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Remove user from cluster (owner only)
router.delete('/:clusterId/members/:userId', async (req, res) => {
  try {
    const { clusterId, userId } = req.params;

    // Check if requester is cluster owner
    const { data: membership } = await supabase
      .from('user_cluster_memberships')
      .select('role')
      .eq('user_id', req.user.id)
      .eq('cluster_id', clusterId)
      .eq('is_active', true)
      .single();

    if (membership?.role !== 'owner') {
      return res.status(403).json({ error: 'Only cluster owners can remove members' });
    }

    const { error } = await supabase
      .from('user_cluster_memberships')
      .update({ is_active: false, left_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('cluster_id', clusterId);

    if (error) throw error;
    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - Update cluster permissions for user (owner only)
router.put('/:clusterId/permissions/:userId', async (req, res) => {
  try {
    const { clusterId, userId } = req.params;
    const permissions = req.body;

    // Check if requester is cluster owner
    const { data: membership } = await supabase
      .from('user_cluster_memberships')
      .select('role')
      .eq('user_id', req.user.id)
      .eq('cluster_id', clusterId)
      .eq('is_active', true)
      .single();

    if (membership?.role !== 'owner') {
      return res.status(403).json({ error: 'Only cluster owners can update permissions' });
    }

    const { data, error } = await supabase
      .from('cluster_permissions')
      .upsert({
        cluster_id: clusterId,
        user_id: userId,
        ...permissions
      })
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Leave cluster
router.post('/:clusterId/leave', async (req, res) => {
  try {
    const { clusterId } = req.params;

    const { error } = await supabase
      .from('user_cluster_memberships')
      .update({ is_active: false, left_at: new Date().toISOString() })
      .eq('user_id', req.user.id)
      .eq('cluster_id', clusterId);

    if (error) throw error;
    res.json({ message: 'Left cluster successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Get cluster statistics (owner/admin)
router.get('/:clusterId/stats', async (req, res) => {
  try {
    const { clusterId } = req.params;

    // Check access
    const { data: membership } = await supabase
      .from('user_cluster_memberships')
      .select('role')
      .eq('user_id', req.user.id)
      .eq('cluster_id', clusterId)
      .eq('is_active', true)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: cluster } = await supabase
      .from('farm_clusters')
      .select('members_count, active_agreements_count')
      .eq('id', clusterId)
      .single();

    const { data: members } = await supabase
      .from('user_cluster_memberships')
      .select('id', { count: 'exact' })
      .eq('cluster_id', clusterId)
      .eq('is_active', true);

    const { data: agreements } = await supabase
      .from('agreements')
      .select('id', { count: 'exact' })
      .eq('cluster_id', clusterId)
      .eq('status', 'active');

    res.json({
      total_members: members?.length || 0,
      active_agreements: agreements?.length || 0,
      ...cluster
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
