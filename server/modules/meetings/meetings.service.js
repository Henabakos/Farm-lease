// ============================================================================
// Meetings module — service layer
// ============================================================================
import { prisma } from '../../db/prisma.js';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../../shared/errors.js';
import * as zoomAdapter from '../../integrations/zoom/zoom.js';
import * as googleAdapter from '../../integrations/google/calendar.js';
import { paginate } from '../../shared/pagination.js';
import { emitLocal } from '../../events/bus.js';

/**
 * Create a new meeting with optional Zoom or Google Meet integration.
 */
export async function createMeeting(userId, data) {
  const { title, description, scheduledAt, durationMinutes, provider, attendeeEmails, proposalId, agreementId, joinUrl: customJoinUrl, participantIds } = data;

  // Map platform to provider enum
  const providerMap = { zoom: 'ZOOM', google: 'GOOGLE_MEET', none: 'IN_PERSON', google_meet: 'GOOGLE_MEET' };
  const providerEnum = providerMap[provider] || 'IN_PERSON';

  // Verify proposal/agreement exists if provided
  if (proposalId) {
    const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
    if (!proposal) throw new NotFoundError('Proposal not found');
  }
  if (agreementId) {
    const agreement = await prisma.agreement.findUnique({ where: { id: agreementId } });
    if (!agreement) throw new NotFoundError('Agreement not found');
  }

  let externalMeetingId = null;
  let joinUrl = customJoinUrl || null;
  let startUrl = null;

  // Create external meeting if provider selected and no custom join URL provided
  if (provider === 'zoom' && !customJoinUrl) {
    const zoomMeeting = await zoomAdapter.createMeeting({
      topic: title,
      startTime: scheduledAt,
      durationMinutes,
      agenda: description,
    });
    externalMeetingId = String(zoomMeeting.id);
    joinUrl = zoomMeeting.join_url;
    startUrl = zoomMeeting.start_url;
  } else if (provider === 'google' && !customJoinUrl) {
    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const googleEvent = await googleAdapter.createEvent({
      summary: title,
      description,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      attendees: attendeeEmails || [],
      createMeet: true,
    });
    externalMeetingId = googleEvent.id;
    joinUrl = googleAdapter.extractMeetLink(googleEvent);
  }

  // Determine relatedId and relatedType
  let relatedId = null;
  let relatedType = null;
  if (proposalId) {
    relatedId = proposalId;
    relatedType = 'proposal';
  } else if (agreementId) {
    relatedId = agreementId;
    relatedType = 'agreement';
  }

  // Create meeting record
  const meeting = await prisma.meeting.create({
    data: {
      title,
      description,
      provider: providerEnum,
      externalMeetingId,
      joinUrl,
      startUrl,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: durationMinutes || 30,
      status: 'SCHEDULED',
      relatedId,
      relatedType,
      notes: description,
      hostId: userId,
    },
    include: {
      host: { select: { id: true, email: true, fullName: true } },
    },
  });

  // Add participants if provided
  if (participantIds && Array.isArray(participantIds) && participantIds.length > 0) {
    try {
      await prisma.meetingParticipant.createMany({
        data: participantIds.map(userId => ({
          meetingId: meeting.id,
          userId,
          role: 'ATTENDEE',
        })),
        skipDuplicates: true,
      });
    } catch (participantError) {
      console.error('Failed to add participants:', participantError);
      // Continue without failing the meeting creation
    }
  }

  return meeting;
}

/**
 * Get a meeting by ID with access control.
 */
export async function getMeetingById(userId, meetingId) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      host: { select: { id: true, email: true, fullName: true } },
      participants: {
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      },
    },
  });

  if (!meeting) throw new NotFoundError('Meeting not found');

  // Access control: host or participant
  const hasAccess =
    meeting.hostId === userId ||
    meeting.participants.some(p => p.userId === userId);

  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this meeting');
  }

  return meeting;
}

/**
 * Update meeting details.
 */
export async function updateMeeting(userId, meetingId, updates) {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) throw new NotFoundError('Meeting not found');

  if (meeting.hostId !== userId) {
    throw new ForbiddenError('Only the meeting host can update it');
  }

  // Map status to schema enum
  const statusMap = { 'scheduled': 'SCHEDULED', 'in-progress': 'ONGOING', 'completed': 'COMPLETED', 'cancelled': 'CANCELLED' };
  const statusEnum = updates.status ? statusMap[updates.status] : undefined;

  // Update external meeting if exists
  if (meeting.externalMeetingId && meeting.provider === 'ZOOM') {
    if (updates.title || updates.description) {
      await zoomAdapter.updateMeeting(meeting.externalMeetingId, {
        topic: updates.title,
        agenda: updates.description,
      });
    }
  } else if (meeting.externalMeetingId && meeting.provider === 'GOOGLE_MEET') {
    if (updates.title || updates.description) {
      await googleAdapter.updateEvent(meeting.externalMeetingId, {
        summary: updates.title,
        description: updates.description,
      });
    }
  }

  const updated = await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      ...updates,
      scheduledAt: updates.scheduledAt ? new Date(updates.scheduledAt) : undefined,
      status: statusEnum,
      notes: updates.description,
    },
    include: {
      host: { select: { id: true, email: true, fullName: true } },
    },
  });

  return updated;
}

/**
 * Delete/cancel a meeting.
 */
export async function deleteMeeting(userId, meetingId) {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) throw new NotFoundError('Meeting not found');

  if (meeting.hostId !== userId) {
    throw new ForbiddenError('Only the meeting host can delete it');
  }

  // Cancel external meeting if exists
  if (meeting.externalMeetingId && meeting.provider === 'ZOOM') {
    await zoomAdapter.deleteMeeting(meeting.externalMeetingId);
  } else if (meeting.externalMeetingId && meeting.provider === 'GOOGLE_MEET') {
    await googleAdapter.deleteEvent(meeting.externalMeetingId);
  }

  await prisma.meeting.delete({ where: { id: meetingId } });

  return { success: true };
}

/**
 * List meetings with filtering and pagination.
 */
export async function listMeetings(userId, filters) {
  const { status, platform, proposalId, agreementId, page, limit } = filters;

  // Map status to schema enum
  const statusMap = { 'scheduled': 'SCHEDULED', 'in-progress': 'ONGOING', 'completed': 'COMPLETED', 'cancelled': 'CANCELLED' };
  const statusEnum = status ? statusMap[status] : undefined;

  // Map platform to provider enum
  const providerMap = { zoom: 'ZOOM', google: 'GOOGLE_MEET', none: 'IN_PERSON' };
  const providerEnum = platform ? providerMap[platform] : undefined;

  const where = {
    ...(statusEnum && { status: statusEnum }),
    ...(providerEnum && { provider: providerEnum }),
    ...(proposalId && { relatedId: proposalId, relatedType: 'proposal' }),
    ...(agreementId && { relatedId: agreementId, relatedType: 'agreement' }),
    // Access control: only show meetings user hosts or participates in
    OR: [
      { hostId: userId },
      { participants: { some: { userId } } },
    ],
  };

  const [total, items] = await Promise.all([
    prisma.meeting.count({ where }),
    prisma.meeting.findMany({
      where,
      include: {
        host: { select: { id: true, email: true, fullName: true } },
        participants: {
          include: {
            user: { select: { id: true, email: true, fullName: true } },
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
      ...paginate({ page, pageSize: limit }),
    }),
  ]);

  return {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

/**
 * Update meeting status (e.g., mark as in-progress or completed).
 */
export async function updateMeetingStatus(userId, meetingId, status) {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) throw new NotFoundError('Meeting not found');

  if (meeting.hostId !== userId) {
    throw new ForbiddenError('Only the meeting host can update status');
  }

  // Map status to schema enum
  const statusMap = { 'scheduled': 'SCHEDULED', 'in-progress': 'ONGOING', 'completed': 'COMPLETED', 'cancelled': 'CANCELLED' };
  const statusEnum = statusMap[status];

  const updated = await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      status: statusEnum,
      ...(status === 'in-progress' && { startedAt: new Date() }),
      ...(status === 'completed' && { endedAt: new Date() }),
    },
    include: {
      host: { select: { id: true, email: true, fullName: true } },
    },
  });

  return updated;
}

// ── Availability ──────────────────────────────────────────────────────────

/** CLUSTER_REP creates a recurring availability slot. */
export async function createAvailability(userId, data) {
  // Only CLUSTER_REP may define availability — callers should already guard this
  const slot = await prisma.availability.create({
    data: { userId, ...data },
  });
  return slot;
}

/** List availability slots for a given user (public — investors can query). */
export async function listAvailabilityForUser(targetUserId) {
  return prisma.availability.findMany({
    where: { userId: targetUserId, isActive: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
}

/** CLUSTER_REP updates one of their own slots. */
export async function updateAvailability(requestingUserId, availabilityId, updates) {
  const slot = await prisma.availability.findUnique({ where: { id: availabilityId } });
  if (!slot) throw new NotFoundError('Availability slot not found');
  if (slot.userId !== requestingUserId) throw new ForbiddenError('Not your availability slot');
  return prisma.availability.update({ where: { id: availabilityId }, data: updates });
}

/** CLUSTER_REP deletes one of their own slots. */
export async function deleteAvailability(requestingUserId, availabilityId) {
  const slot = await prisma.availability.findUnique({ where: { id: availabilityId } });
  if (!slot) throw new NotFoundError('Availability slot not found');
  if (slot.userId !== requestingUserId) throw new ForbiddenError('Not your availability slot');
  await prisma.availability.delete({ where: { id: availabilityId } });
  return { success: true };
}

// ── Slot booking ──────────────────────────────────────────────────────────

/**
 * INVESTOR books a specific slot on a specific date.
 * Prevents double-booking by checking for an overlapping SCHEDULED meeting.
 */
export async function bookSlot(investorId, { hostId, slotDate, availabilityId, durationMinutes, notes }) {
  // 1. Verify availability slot belongs to host and is active
  const slot = await prisma.availability.findUnique({ where: { id: availabilityId } });
  if (!slot || !slot.isActive || slot.userId !== hostId) {
    throw new NotFoundError('Availability slot not found or inactive');
  }

  // 2. Compute exact ISO startTime for the chosen date
  const [startHour, startMin] = slot.startTime.split(':').map(Number);
  const scheduledAt = new Date(slotDate);
  scheduledAt.setHours(startHour, startMin, 0, 0);

  const endAt = new Date(scheduledAt.getTime() + durationMinutes * 60_000);

  // 3. Conflict check — host must not already have a SCHEDULED meeting overlapping
  const conflict = await prisma.meeting.findFirst({
    where: {
      hostId,
      status: 'SCHEDULED',
      scheduledAt: { lt: endAt },
      // scheduledAt + durationMinutes > scheduledAt of this new meeting
      AND: {
        scheduledAt: {
          gte: new Date(scheduledAt.getTime() - 24 * 60 * 60_000), // broad window
        },
      },
    },
  });

  if (conflict) {
    // Refined overlap check in JS (Prisma can't easily compute endTime)
    const conflictEnd = new Date(
      new Date(conflict.scheduledAt).getTime() + conflict.durationMinutes * 60_000,
    );
    if (conflict.scheduledAt < endAt && conflictEnd > scheduledAt) {
      throw new ConflictError('Host already has a meeting during this time slot', 'SLOT_CONFLICT');
    }
  }

  // 4. Create the Meeting record (host = CLUSTER_REP, investor is participant)
  const meeting = await prisma.$transaction(async (tx) => {
    const m = await tx.meeting.create({
      data: {
        hostId,
        title: `Farm Meeting — ${slotDate}`,
        description: notes || null,
        provider: 'IN_PERSON',
        scheduledAt,
        durationMinutes,
        status: 'SCHEDULED',
        relatedType: 'availability_booking',
        notes: notes || null,
      },
      include: {
        host: { select: { id: true, email: true, fullName: true } },
      },
    });

    // Add investor as a participant
    await tx.meetingParticipant.create({
      data: { meetingId: m.id, userId: investorId },
    });

    return m;
  });

  // 5. Fire in-process event so broadcaster sends real-time notification to the host
  emitLocal('meeting.scheduled', {
    meetingId: meeting.id,
    participantIds: [hostId],           // notify the CLUSTER_REP
  });

  return meeting;
}

// ── Admin ─────────────────────────────────────────────────────────────────

/** Admin lists ALL meetings across the platform. */
export async function adminListMeetings(filters) {
  const { status, page = 1, limit = 20 } = filters;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const statusMap = { scheduled: 'SCHEDULED', 'in-progress': 'ONGOING', completed: 'COMPLETED', cancelled: 'CANCELLED' };
  const where = status ? { status: statusMap[status] } : {};

  const [total, items] = await Promise.all([
    prisma.meeting.count({ where }),
    prisma.meeting.findMany({
      where,
      include: {
        host: { select: { id: true, email: true, fullName: true } },
        participants: { include: { user: { select: { id: true, email: true, fullName: true } } } },
      },
      orderBy: { scheduledAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
  ]);

  return { items, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } };
}

/** Admin cancels any meeting. */
export async function adminCancelMeeting(meetingId, reason) {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) throw new NotFoundError('Meeting not found');
  if (meeting.status === 'CANCELLED') throw new ConflictError('Meeting is already cancelled');

  const updated = await prisma.meeting.update({
    where: { id: meetingId },
    data: { status: 'CANCELLED' },
    include: { host: { select: { id: true, email: true, fullName: true } } },
  });

  // Notify all participants
  const participants = await prisma.meetingParticipant.findMany({ where: { meetingId } });
  const notifyIds = [meeting.hostId, ...participants.map(p => p.userId)];
  emitLocal('meeting.scheduled', { meetingId, participantIds: notifyIds });

  return updated;
}

/** Send meeting invitation to an email address. */
export async function sendMeetingInvitation(meetingId, email, senderId) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { host: { select: { id: true, email: true, fullName: true } } },
  });
  if (!meeting) throw new NotFoundError('Meeting not found');

  // Check if user with this email exists
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ValidationError('User with this email does not exist');
  }

  // Check if already a participant
  const existing = await prisma.meetingParticipant.findUnique({
    where: { meetingId_userId: { meetingId, userId: user.id } },
  });
  if (existing) {
    throw new ConflictError('User is already a participant');
  }

  // Add as participant
  try {
    await prisma.meetingParticipant.create({
      data: {
        meetingId,
        userId: user.id,
      },
    });
  } catch (err) {
    console.error('Failed to create meeting participant:', err);
    throw new ValidationError('Failed to add user as participant');
  }

  // Notify
  try {
    emitLocal('meeting.scheduled', { meetingId, participantIds: [user.id] });
  } catch (err) {
    console.error('Failed to emit meeting notification:', err);
    // Continue even if notification fails
  }

  return { success: true, message: 'Invitation sent successfully' };
}
