// ============================================================================
// Plots module — routes
// ============================================================================
import express from 'express';
import { requireAuth, requireEmailVerified } from '../../middleware/auth.js';
import { requireVerified } from '../../middleware/verification.js';
import {
  createPlot,
  getClusterPlots,
  updatePlot,
  deletePlot,
} from './plots.service.js';

const router = express.Router();
router.use(requireAuth);
router.use(requireEmailVerified);

// POST /plots - Create a new plot
router.post(
  '/',
  requireAuth,
  requireVerified,
  async (req, res, next) => {
    try {
      const plot = await createPlot(req.user.id, req.body);
      res.status(201).json(plot);
    } catch (err) {
      next(err);
    }
  }
);

// GET /plots/cluster/:clusterId - Get plots for a cluster
router.get(
  '/cluster/:clusterId',
  requireAuth,
  async (req, res, next) => {
    try {
      const plots = await getClusterPlots(req.user.id, req.params.clusterId);
      res.json(plots);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /plots/:id - Update a plot
router.patch(
  '/:id',
  requireAuth,
  requireVerified,
  async (req, res, next) => {
    try {
      const plot = await updatePlot(req.user.id, req.params.id, req.body);
      res.json(plot);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /plots/:id - Delete a plot
router.delete(
  '/:id',
  requireAuth,
  requireVerified,
  async (req, res, next) => {
    try {
      await deletePlot(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
