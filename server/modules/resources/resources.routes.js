// ============================================================================
// Resources module — routes
// ============================================================================
import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
} from './resources.service.js';

const router = express.Router();

// POST /resources - Create a new resource (admin only)
router.post(
  '/',
  requireAuth,
  async (req, res, next) => {
    try {
      const resource = await createResource(req.user.id, req.body);
      res.status(201).json(resource);
    } catch (err) {
      next(err);
    }
  }
);

// GET /resources - Get all resources with optional filtering
router.get(
  '/',
  async (req, res, next) => {
    try {
      const filters = {
        category: req.query.category,
        cropType: req.query.cropType,
        search: req.query.search,
      };
      const resources = await getResources(filters);
      res.json(resources);
    } catch (err) {
      next(err);
    }
  }
);

// GET /resources/:id - Get a resource by ID
router.get(
  '/:id',
  async (req, res, next) => {
    try {
      const resource = await getResourceById(req.params.id);
      res.json(resource);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /resources/:id - Update a resource (admin only)
router.patch(
  '/:id',
  requireAuth,
  async (req, res, next) => {
    try {
      const resource = await updateResource(req.user.id, req.params.id, req.body);
      res.json(resource);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /resources/:id - Delete a resource (admin only)
router.delete(
  '/:id',
  requireAuth,
  async (req, res, next) => {
    try {
      await deleteResource(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
