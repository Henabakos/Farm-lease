// ============================================================================
// Meetings module — routes
// ============================================================================
import express from 'express';
import { requireAuth, requireEmailVerified } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  createMeetingSchema,
  updateMeetingSchema,
  listMeetingsSchema,
  meetingIdSchema,
} from './meetings.validators.js';
import {
  createMeeting,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  listMeetings,
  updateMeetingStatus,
} from './meetings.service.js';

const router = express.Router();
router.use(requireAuth);
router.use(requireEmailVerified);

// POST /meetings - Create a new meeting
router.post(
  '/',
  requireAuth,
  validate({ body: createMeetingSchema }),
  async (req, res, next) => {
    try {
      const meeting = await createMeeting(req.user.id, req.body);
      res.status(201).json(meeting);
    } catch (err) {
      next(err);
    }
  }
);

// GET /meetings - List meetings with filters
router.get(
  '/',
  requireAuth,
  validate({ query: listMeetingsSchema }),
  async (req, res, next) => {
    try {
      const result = await listMeetings(req.user.id, req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /meetings/:id - Get meeting by ID
router.get(
  '/:id',
  requireAuth,
  validate({ params: meetingIdSchema }),
  async (req, res, next) => {
    try {
      const meeting = await getMeetingById(req.user.id, req.params.id);
      res.json(meeting);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /meetings/:id - Update meeting details
router.patch(
  '/:id',
  requireAuth,
  validate({ params: meetingIdSchema, body: updateMeetingSchema }),
  async (req, res, next) => {
    try {
      const meeting = await updateMeeting(req.user.id, req.params.id, req.body);
      res.json(meeting);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /meetings/:id/status - Update meeting status
router.patch(
  '/:id/status',
  requireAuth,
  validate({ params: meetingIdSchema, body: updateMeetingSchema.pick({ status: true }) }),
  async (req, res, next) => {
    try {
      const meeting = await updateMeetingStatus(req.user.id, req.params.id, req.body.status);
      res.json(meeting);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /meetings/:id - Delete/cancel a meeting
router.delete(
  '/:id',
  requireAuth,
  validate({ params: meetingIdSchema }),
  async (req, res, next) => {
    try {
      await deleteMeeting(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
