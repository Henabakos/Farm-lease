import express from 'express';

const router = express.Router();

// Get all clusters (with filtering)
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { status, ownerId } = req.query;

    let query = supabase.from('farm_clusters').select('*');

    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    } else {
      // Default: get clusters owned by user or public clusters
      query = query.or(`owner_id.eq.${userId},status.eq.active`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('[v0] Get clusters error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get single cluster
router.get('/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('farm_clusters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('[v0] Get cluster error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Create cluster
router.post('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { name, location, areaHectares, description, imageUrl } = req.body;

    if (!name || !location) {
      return res.status(400).json({ error: 'Name and location required' });
    }

    const { data, error } = await supabase
      .from('farm_clusters')
      .insert({
        owner_id: userId,
        name,
        location,
        area_hectares: areaHectares,
        description,
        image_url: imageUrl,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    // Log action
    await logAction(supabase, userId, 'CREATE', 'cluster', data.id, data);

    res.status(201).json(data);
  } catch (error) {
    console.error('[v0] Create cluster error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update cluster
router.put('/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;
    const updates = req.body;

    // Check ownership
    const { data: cluster } = await supabase
      .from('farm_clusters')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!cluster || cluster.owner_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('farm_clusters')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAction(supabase, userId, 'UPDATE', 'cluster', id, updates);

    res.json(data);
  } catch (error) {
    console.error('[v0] Update cluster error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete cluster
router.delete('/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;

    // Check ownership
    const { data: cluster } = await supabase
      .from('farm_clusters')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!cluster || cluster.owner_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { error } = await supabase
      .from('farm_clusters')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logAction(supabase, userId, 'DELETE', 'cluster', id, {});

    res.json({ message: 'Cluster deleted' });
  } catch (error) {
    console.error('[v0] Delete cluster error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to log actions
async function logAction(supabase, userId, action, entityType, entityId, changes) {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: `${action}_${entityType}`,
        entity_type: entityType,
        entity_id: entityId,
        changes
      });
  } catch (error) {
    console.error('[v0] Audit log failed:', error.message);
  }
}

export default router;
