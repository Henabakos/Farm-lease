import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - List active templates
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contract_templates')
      .select(`
        *,
        created_by:auth.users(id, email, raw_user_meta_data)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Get template with clauses
router.get('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { versionNumber } = req.query;

    const { data: template, error: tError } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (tError) throw tError;

    let versionId = template.current_version_id;
    if (versionNumber) {
      const { data: version } = await supabase
        .from('contract_template_versions')
        .select('id')
        .eq('template_id', templateId)
        .eq('version_number', versionNumber)
        .single();
      versionId = version?.id;
    }

    const { data: templateWithClauses, error: wcError } = await supabase
      .rpc('get_template_with_clauses', { p_template_version_id: versionId });

    if (wcError) throw wcError;
    res.json(templateWithClauses?.[0] || template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Create new template (admin only)
router.post('/', async (req, res) => {
  try {
    const { data: user } = await supabase.auth.admin.getUserById(req.user.id);
    if (user?.raw_user_meta_data?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create templates' });
    }

    const { name, description, type, category, tags, isDefault } = req.body;

    const { data, error } = await supabase
      .from('contract_templates')
      .insert({
        name,
        description,
        type,
        category,
        tags: tags || [],
        created_by: req.user.id,
        is_default: isDefault || false
      })
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - Update template (admin only)
router.put('/:templateId', async (req, res) => {
  try {
    const { data: user } = await supabase.auth.admin.getUserById(req.user.id);
    if (user?.raw_user_meta_data?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update templates' });
    }

    const { templateId } = req.params;
    const { name, description, category, tags, is_active } = req.body;

    const { data, error } = await supabase
      .from('contract_templates')
      .update({ name, description, category, tags, is_active })
      .eq('id', templateId)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Create template version (admin only)
router.post('/:templateId/versions', async (req, res) => {
  try {
    const { data: user } = await supabase.auth.admin.getUserById(req.user.id);
    if (user?.raw_user_meta_data?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create versions' });
    }

    const { templateId } = req.params;
    const { versionName, changeLogs, preamble, footer } = req.body;

    // Get current version number
    const { data: template } = await supabase
      .from('contract_templates')
      .select('version')
      .eq('id', templateId)
      .single();

    const newVersionNumber = (template?.version || 0) + 1;

    const { data, error } = await supabase
      .from('contract_template_versions')
      .insert({
        template_id: templateId,
        version_number: newVersionNumber,
        version_name: versionName,
        change_log: changeLogs,
        preamble,
        footer,
        created_by: req.user.id
      })
      .select();

    if (error) throw error;

    // Update template version
    await supabase
      .from('contract_templates')
      .update({ 
        version: newVersionNumber,
        current_version_id: data[0]?.id 
      })
      .eq('id', templateId);

    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Publish template version (admin only)
router.post('/:templateId/versions/:versionId/publish', async (req, res) => {
  try {
    const { data: user } = await supabase.auth.admin.getUserById(req.user.id);
    if (user?.raw_user_meta_data?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can publish templates' });
    }

    const { templateId, versionId } = req.params;

    const { data, error } = await supabase
      .from('contract_template_versions')
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
        published_by: req.user.id
      })
      .eq('id', versionId)
      .eq('template_id', templateId)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Get clauses by category
router.get('/clauses/category/:category', async (req, res) => {
  try {
    const { category } = req.params;

    const { data, error } = await supabase
      .from('contract_clauses')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('section_number', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - List all clauses
router.get('/clauses/list/all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contract_clauses')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('section_number', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Add clause to template (admin only)
router.post('/:templateId/versions/:versionId/clauses', async (req, res) => {
  try {
    const { data: user } = await supabase.auth.admin.getUserById(req.user.id);
    if (user?.raw_user_meta_data?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can add clauses' });
    }

    const { templateId, versionId } = req.params;
    const { clauseId, displayOrder, isCustomized, customizedContent, isOptional } = req.body;

    const { data, error } = await supabase
      .from('contract_template_clauses')
      .insert({
        template_version_id: versionId,
        clause_id: clauseId,
        display_order: displayOrder,
        is_customized: isCustomized || false,
        customized_content: customizedContent,
        is_optional: isOptional || false
      })
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Compare template versions (admin only)
router.post('/:templateId/compare-versions', async (req, res) => {
  try {
    const { data: user } = await supabase.auth.admin.getUserById(req.user.id);
    if (user?.raw_user_meta_data?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can compare versions' });
    }

    const { templateId } = req.params;
    const { version1, version2 } = req.body;

    const { data, error } = await supabase
      .rpc('compare_template_versions', {
        p_template_id: templateId,
        p_version_1: version1,
        p_version_2: version2
      });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
