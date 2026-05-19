// ============================================================================
// Analytics module — routes
// ============================================================================
import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import {
  getDashboardStats,
  getUserStatsByRole,
  getProposalStatsByStatus,
  getPaymentStatsByMonth,
  getTopClustersByProposals,
  getActivityFeed,
} from './analytics.service.js';

const router = express.Router();

// GET /analytics/dashboard - Overall dashboard statistics
router.get(
  '/dashboard',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const stats = await getDashboardStats();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
);

// GET /analytics/users/by-role - User statistics by role
router.get(
  '/users/by-role',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const stats = await getUserStatsByRole();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
);

// GET /analytics/proposals/by-status - Proposal statistics by status
router.get(
  '/proposals/by-status',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const stats = await getProposalStatsByStatus();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
);

// GET /analytics/payments/by-month - Monthly payment statistics
router.get(
  '/payments/by-month',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const months = req.query.months ? parseInt(req.query.months) : 12;
      const stats = await getPaymentStatsByMonth(months);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
);

// GET /analytics/clusters/top - Top clusters by proposal count
router.get(
  '/clusters/top',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const stats = await getTopClustersByProposals(limit);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
);

// GET /analytics/activity - Recent activity feed
router.get(
  '/activity',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;
      const feed = await getActivityFeed(limit);
      res.json(feed);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
