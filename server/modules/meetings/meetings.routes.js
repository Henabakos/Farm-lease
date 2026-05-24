// ============================================================================
// Meetings module — routes
// ============================================================================
import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  createMeetingSchema,
  updateMeetingSchema,
  listMeetingsSchema,
  meetingIdSchema,
  createAvailabilitySchema,
  updateAvailabilitySchema,
  availabilityIdSchema,
  availabilityUserSchema,
  bookSlotSchema,
} from './meetings.validators.js';
import {
  createMeeting,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  listMeetings,
  updateMeetingStatus,
  createAvailability,
  listAvailabilityForUser,
  updateAvailability,
  deleteAvailability,
  bookSlot,
  adminListMeetings,
  adminCancelMeeting,
  sendMeetingInvitation,
} from './meetings.service.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────
// AVAILABILITY — CLUSTER_REP manages their own weekly slots
// ─────────────────────────────────────────────────────────────────────────

// POST /meetings/availability — create a slot
router.post(
  '/availability',
  requireAuth,
  requireRole('CLUSTER_REP'),
  validate({ body: createAvailabilitySchema }),
  async (req, res, next) => {
    try {
      const slot = await createAvailability(req.user.id, req.body);
      res.status(201).json(slot);
    } catch (err) { next(err); }
  }
);

// GET /meetings/availability/me — CLUSTER_REP views their own slots
router.get(
  '/availability/me',
  requireAuth,
  requireRole('CLUSTER_REP'),
  async (req, res, next) => {
    try {
      const slots = await listAvailabilityForUser(req.user.id);
      res.json(slots);
    } catch (err) { next(err); }
  }
);

// GET /meetings/availability/:userId — any authenticated user views a rep's slots
router.get(
  '/availability/:userId',
  requireAuth,
  validate({ params: availabilityUserSchema }),
  async (req, res, next) => {
    try {
      const slots = await listAvailabilityForUser(req.params.userId);
      res.json(slots);
    } catch (err) { next(err); }
  }
);

// PATCH /meetings/availability/:id — CLUSTER_REP edits their slot
router.patch(
  '/availability/:id',
  requireAuth,
  requireRole('CLUSTER_REP'),
  validate({ params: availabilityIdSchema, body: updateAvailabilitySchema }),
  async (req, res, next) => {
    try {
      const slot = await updateAvailability(req.user.id, req.params.id, req.body);
      res.json(slot);
    } catch (err) { next(err); }
  }
);

// DELETE /meetings/availability/:id — CLUSTER_REP removes their slot
router.delete(
  '/availability/:id',
  requireAuth,
  requireRole('CLUSTER_REP'),
  validate({ params: availabilityIdSchema }),
  async (req, res, next) => {
    try {
      const result = await deleteAvailability(req.user.id, req.params.id);
      res.json(result);
    } catch (err) { next(err); }
  }
);

// ─────────────────────────────────────────────────────────────────────────
// SLOT BOOKING — INVESTOR books an open slot
// ─────────────────────────────────────────────────────────────────────────

// POST /meetings/book — investor books a slot
router.post(
  '/book',
  requireAuth,
  requireRole('INVESTOR'),
  validate({ body: bookSlotSchema }),
  async (req, res, next) => {
    try {
      const meeting = await bookSlot(req.user.id, req.body);
      res.status(201).json(meeting);
    } catch (err) { next(err); }
  }
);

// ─────────────────────────────────────────────────────────────────────────
// ADMIN — master dashboard
// ─────────────────────────────────────────────────────────────────────────

// GET /meetings/admin/all — admin lists all meetings
router.get(
  '/admin/all',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const result = await adminListMeetings(req.query);
      res.json(result);
    } catch (err) { next(err); }
  }
);

// DELETE /meetings/admin/:id — admin cancels any meeting
router.delete(
  '/admin/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: meetingIdSchema }),
  async (req, res, next) => {
    try {
      const result = await adminCancelMeeting(req.params.id, req.body?.reason);
      res.json(result);
    } catch (err) { next(err); }
  }
);

// POST /meetings/:id/invite — Send invitation to a participant
router.post(
  '/:id/invite',
  requireAuth,
  validate({ params: meetingIdSchema, body: z.object({ email: z.string().email() }) }),
  async (req, res, next) => {
    try {
      const result = await sendMeetingInvitation(req.params.id, req.body.email, req.user.id);
      res.json(result);
    } catch (err) { next(err); }
  }
);

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
