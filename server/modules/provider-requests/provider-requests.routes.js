// ============================================================================
// Provider Requests module — routes
// ============================================================================
import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  createProviderRequest,
  getProviderRequests,
  getProviderRequestById,
  approveProviderRequest,
  rejectProviderRequest,
  getUserProviderRequests,
} from './provider-requests.service.js';

const router = express.Router();

// POST /provider-requests - Create a new provider request
router.post(
  '/',
  requireAuth,
  async (req, res, next) => {
    try {
      const request = await createProviderRequest(req.user.id, req.body);
      res.status(201).json(request);
    } catch (err) {
      next(err);
    }
  }
);

// GET /provider-requests - Get all provider requests (admin only)
router.get(
  '/',
  requireAuth,
  async (req, res, next) => {
    try {
      const requests = await getProviderRequests(req.query);
      res.json(requests);
    } catch (err) {
      next(err);
    }
  }
);

// GET /provider-requests/user - Get current user's provider requests
router.get(
  '/user',
  requireAuth,
  async (req, res, next) => {
    try {
      const requests = await getUserProviderRequests(req.user.id);
      res.json(requests);
    } catch (err) {
      next(err);
    }
  }
);

// GET /provider-requests/:id - Get a provider request by ID
router.get(
  '/:id',
  requireAuth,
  async (req, res, next) => {
    try {
      const request = await getProviderRequestById(req.params.id);
      res.json(request);
    } catch (err) {
      next(err);
    }
  }
);

// POST /provider-requests/:id/approve - Approve a provider request (admin only)
router.post(
  '/:id/approve',
  requireAuth,
  async (req, res, next) => {
    try {
      const { reviewNotes } = req.body;
      const request = await approveProviderRequest(req.user.id, req.params.id, reviewNotes);
      res.json(request);
    } catch (err) {
      next(err);
    }
  }
);

// POST /provider-requests/:id/reject - Reject a provider request (admin only)
router.post(
  '/:id/reject',
  requireAuth,
  async (req, res, next) => {
    try {
      const { reviewNotes } = req.body;
      const request = await rejectProviderRequest(req.user.id, req.params.id, reviewNotes);
      res.json(request);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
