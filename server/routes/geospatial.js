import express from 'express';
import { authenticate, authorize } from '../middleware/index.js';
import { supabase } from '../index.js';

const router = express.Router();

// Get all boundaries for a cluster
router.get('/boundaries/cluster/:clusterId', authenticate, async (req, res) => {
  try {
    const { clusterId } = req.params;
    const userId = req.user.id;

    // Check if user has access to this cluster
    const { data: cluster, error: clusterError } = await supabase
      .from('farm_clusters')
      .select('*')
      .eq('id', clusterId)
      .single();

    if (clusterError || !cluster) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    // Check RBAC
    const hasAccess = cluster.owner_id === userId || req.user.role === 'admin';
    if (!hasAccess) {
      return res.status(403).json({ error: 'No access to this cluster' });
    }

    // Get boundaries
    const { data: boundaries, error } = await supabase
      .from('land_boundaries')
      .select('*')
      .eq('cluster_id', clusterId)
      .eq('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: boundaries,
      count: boundaries?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single boundary with details
router.get('/boundaries/:boundaryId', authenticate, async (req, res) => {
  try {
    const { boundaryId } = req.params;

    const { data: boundary, error: boundaryError } = await supabase
      .from('land_boundaries')
      .select(`
        *,
        created_by:users!created_by(id, full_name, email),
        verified_by:users!verified_by(id, full_name)
      `)
      .eq('id', boundaryId)
      .single();

    if (boundaryError || !boundary) {
      return res.status(404).json({ error: 'Boundary not found' });
    }

    // Get associated surveys
    const { data: surveys, error: surveysError } = await supabase
      .from('land_surveys')
      .select('*')
      .eq('boundary_id', boundaryId)
      .order('created_at', { ascending: false });

    if (surveysError) throw surveysError;

    // Get audit logs
    const { data: auditLogs, error: auditError } = await supabase
      .from('geospatial_audit_logs')
      .select('*')
      .eq('boundary_id', boundaryId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (auditError) throw auditError;

    res.json({
      success: true,
      data: {
        ...boundary,
        surveys: surveys || [],
        auditLogs: auditLogs || []
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new boundary (from drawing)
router.post('/boundaries', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      cluster_id,
      name,
      description,
      coordinates,
      geometry,
      accuracy_rating,
      survey_date
    } = req.body;

    // Validate cluster access
    const { data: cluster, error: clusterError } = await supabase
      .from('farm_clusters')
      .select('*')
      .eq('id', cluster_id)
      .single();

    if (clusterError || !cluster) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    if (cluster.owner_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No permission to create boundaries' });
    }

    // Validate coordinates
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 3) {
      return res.status(400).json({ error: 'At least 3 coordinates required' });
    }

    // Calculate area using simple algorithm (for more accuracy, use PostGIS on backend)
    const area = calculatePolygonArea(coordinates);
    const areaSqm = area;
    const areaHectares = area / 10000;

    // Create boundary
    const { data: boundary, error: boundaryError } = await supabase
      .from('land_boundaries')
      .insert({
        cluster_id,
        created_by: userId,
        name,
        description,
        coordinates,
        geometry: geometry || createGeoJSONFromCoordinates(coordinates),
        area_sqm: areaSqm,
        area_hectares: areaHectares,
        accuracy_rating: accuracy_rating || 3,
        survey_date: survey_date || new Date().toISOString(),
        source: 'manual_drawing'
      })
      .select()
      .single();

    if (boundaryError) throw boundaryError;

    // Log to audit trail
    await supabase.from('geospatial_audit_logs').insert({
      boundary_id: boundary.id,
      user_id: userId,
      action: 'created',
      new_geometry: boundary.geometry,
      change_details: { name, area_hectares: areaHectares }
    });

    res.status(201).json({
      success: true,
      message: 'Boundary created successfully',
      data: boundary
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update boundary
router.put('/boundaries/:boundaryId', authenticate, async (req, res) => {
  try {
    const { boundaryId } = req.params;
    const userId = req.user.id;
    const {
      name,
      description,
      coordinates,
      geometry,
      accuracy_rating,
      survey_date
    } = req.body;

    // Get boundary and check access
    const { data: boundary, error: boundaryError } = await supabase
      .from('land_boundaries')
      .select('*')
      .eq('id', boundaryId)
      .single();

    if (boundaryError || !boundary) {
      return res.status(404).json({ error: 'Boundary not found' });
    }

    // Check cluster ownership
    const { data: cluster } = await supabase
      .from('farm_clusters')
      .select('owner_id')
      .eq('id', boundary.cluster_id)
      .single();

    if (cluster.owner_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No permission to update this boundary' });
    }

    // Recalculate area if coordinates changed
    let areaSqm = boundary.area_sqm;
    let areaHectares = boundary.area_hectares;

    if (coordinates) {
      areaSqm = calculatePolygonArea(coordinates);
      areaHectares = areaSqm / 10000;
    }

    // Update boundary
    const { data: updated, error: updateError } = await supabase
      .from('land_boundaries')
      .update({
        name: name || boundary.name,
        description: description !== undefined ? description : boundary.description,
        coordinates: coordinates || boundary.coordinates,
        geometry: geometry || (coordinates ? createGeoJSONFromCoordinates(coordinates) : boundary.geometry),
        area_sqm: areaSqm,
        area_hectares: areaHectares,
        accuracy_rating: accuracy_rating || boundary.accuracy_rating,
        survey_date: survey_date || boundary.survey_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', boundaryId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log to audit trail
    await supabase.from('geospatial_audit_logs').insert({
      boundary_id: boundaryId,
      user_id: userId,
      action: 'updated',
      old_geometry: boundary.geometry,
      new_geometry: updated.geometry,
      change_details: {
        name: name || null,
        area_hectares: areaHectares,
        accuracy_rating: accuracy_rating || null
      }
    });

    res.json({
      success: true,
      message: 'Boundary updated successfully',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify boundary (admin/owner only)
router.post('/boundaries/:boundaryId/verify', authenticate, async (req, res) => {
  try {
    const { boundaryId } = req.params;
    const userId = req.user.id;
    const { verified_notes } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can verify boundaries' });
    }

    const { data: updated, error } = await supabase
      .from('land_boundaries')
      .update({
        is_active: true,
        verified_at: new Date().toISOString(),
        verified_by: userId
      })
      .eq('id', boundaryId)
      .select()
      .single();

    if (error) throw error;

    // Log verification
    await supabase.from('geospatial_audit_logs').insert({
      boundary_id: boundaryId,
      user_id: userId,
      action: 'verified',
      change_details: { verification_notes: verified_notes }
    });

    res.json({
      success: true,
      message: 'Boundary verified successfully',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete boundary (soft delete)
router.delete('/boundaries/:boundaryId', authenticate, async (req, res) => {
  try {
    const { boundaryId } = req.params;
    const userId = req.user.id;

    const { data: boundary } = await supabase
      .from('land_boundaries')
      .select('*, farm_clusters!inner(owner_id)')
      .eq('id', boundaryId)
      .single();

    if (boundary.farm_clusters.owner_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No permission to delete this boundary' });
    }

    const { error } = await supabase
      .from('land_boundaries')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', boundaryId);

    if (error) throw error;

    // Log deletion
    await supabase.from('geospatial_audit_logs').insert({
      boundary_id: boundaryId,
      user_id: userId,
      action: 'deleted',
      old_geometry: boundary.geometry,
      change_details: { deleted: true }
    });

    res.json({
      success: true,
      message: 'Boundary deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload survey file
router.post('/surveys/upload', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      boundary_id,
      survey_type,
      file_url,
      file_name,
      file_size,
      extracted_coordinates,
      extracted_metrics,
      accuracy_meters,
      confidence_score,
      quality_rating
    } = req.body;

    // Validate boundary access
    const { data: boundary } = await supabase
      .from('land_boundaries')
      .select('*, farm_clusters!inner(owner_id)')
      .eq('id', boundary_id)
      .single();

    if (boundary.farm_clusters.owner_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No permission to upload surveys' });
    }

    // Create survey record
    const { data: survey, error } = await supabase
      .from('land_surveys')
      .insert({
        boundary_id,
        uploaded_by: userId,
        survey_type,
        file_url,
        file_name,
        file_size,
        extracted_coordinates,
        extracted_metrics,
        accuracy_meters,
        confidence_score,
        quality_rating: quality_rating || 3,
        status: 'completed'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Survey uploaded successfully',
      data: survey
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get survey details
router.get('/surveys/:surveyId', authenticate, async (req, res) => {
  try {
    const { surveyId } = req.params;

    const { data: survey, error } = await supabase
      .from('land_surveys')
      .select(`
        *,
        boundary:land_boundaries!inner(cluster_id, farm_clusters!inner(owner_id)),
        uploaded_by:users!uploaded_by(id, full_name, email),
        verified_by:users!verified_by(id, full_name)
      `)
      .eq('id', surveyId)
      .single();

    if (error || !survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    res.json({
      success: true,
      data: survey
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify survey
router.post('/surveys/:surveyId/verify', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { surveyId } = req.params;
    const userId = req.user.id;
    const { verification_notes } = req.body;

    const { data: updated, error } = await supabase
      .from('land_surveys')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by: userId,
        verification_notes
      })
      .eq('id', surveyId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Survey verified successfully',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get boundary statistics for a cluster
router.get('/statistics/cluster/:clusterId', authenticate, async (req, res) => {
  try {
    const { clusterId } = req.params;

    const { data: stats, error } = await supabase
      .from('boundary_statistics')
      .select('*')
      .eq('cluster_id', clusterId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate polygon area (shoelace formula)
function calculatePolygonArea(coordinates) {
  if (!coordinates || coordinates.length < 3) return 0;

  // Convert lat/lng to approximate meters for area calculation
  // Using simple flat-earth approximation
  let area = 0;
  const R = 6371000; // Earth radius in meters

  for (let i = 0; i < coordinates.length; i++) {
    const [lat1, lng1] = coordinates[i];
    const [lat2, lng2] = coordinates[(i + 1) % coordinates.length];

    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    area += distance * distance;
  }

  return Math.abs(area / 2);
}

// Helper function to create GeoJSON from coordinates
function createGeoJSONFromCoordinates(coordinates) {
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates.map(([lat, lng]) => [lng, lat])]
      },
      properties: {
        type: 'land_boundary'
      }
    }]
  };
}

export default router;
