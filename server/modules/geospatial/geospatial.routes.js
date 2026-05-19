// ============================================================================
// Geospatial module — routes
// ============================================================================
import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createBoundarySchema,
  updateBoundarySchema,
  listBoundariesSchema,
  boundaryIdSchema,
} from './geospatial.validators.js';
import {
  createBoundary,
  getBoundaryById,
  updateBoundary,
  deleteBoundary,
  listBoundaries,
  getClusterStatistics,
} from './geospatial.service.js';

const router = express.Router();

// POST /geospatial/boundaries - Create a new boundary
router.post(
  '/boundaries',
  requireAuth,
  validate({ body: createBoundarySchema }),
  async (req, res, next) => {
    try {
      const boundary = await createBoundary(req.user.id, req.body);
      res.status(201).json(boundary);
    } catch (err) {
      next(err);
    }
  }
);

// GET /geospatial/boundaries - List boundaries with filters
router.get(
  '/boundaries',
  requireAuth,
  validate({ query: listBoundariesSchema }),
  async (req, res, next) => {
    try {
      const result = await listBoundaries(req.user.id, req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /geospatial/boundaries/cluster/:clusterId - Get boundaries for a specific cluster
router.get(
  '/boundaries/cluster/:clusterId',
  requireAuth,
  async (req, res, next) => {
    try {
      const result = await listBoundaries(req.user.id, { clusterId: req.params.clusterId, page: 1, limit: 100 });
      res.json(result.items);
    } catch (err) {
      next(err);
    }
  }
);

// GET /geospatial/boundaries/:id - Get boundary by ID
router.get(
  '/boundaries/:id',
  requireAuth,
  validate({ params: boundaryIdSchema }),
  async (req, res, next) => {
    try {
      const boundary = await getBoundaryById(req.user.id, req.params.id);
      res.json(boundary);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /geospatial/boundaries/:id - Update boundary
router.patch(
  '/boundaries/:id',
  requireAuth,
  validate({ params: boundaryIdSchema, body: updateBoundarySchema }),
  async (req, res, next) => {
    try {
      const boundary = await updateBoundary(req.user.id, req.params.id, req.body);
      res.json(boundary);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /geospatial/boundaries/:id - Delete boundary
router.delete(
  '/boundaries/:id',
  requireAuth,
  validate({ params: boundaryIdSchema }),
  async (req, res, next) => {
    try {
      await deleteBoundary(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// GET /geospatial/statistics/cluster/:clusterId - Get cluster statistics
router.get(
  '/statistics/cluster/:clusterId',
  requireAuth,
  async (req, res, next) => {
    try {
      const statistics = await getClusterStatistics(req.user.id, req.params.clusterId);
      res.json(statistics);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
