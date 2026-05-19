// ============================================================================
// Meetings module — service layer
// ============================================================================
import { prisma } from '../../db/prisma.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../../shared/errors.js';
import * as zoomAdapter from '../../integrations/zoom/zoom.js';
import * as googleAdapter from '../../integrations/google/calendar.js';
import { paginate } from '../../shared/pagination.js';

/**
 * Create a new meeting with optional Zoom or Google Meet integration.
 */
export async function createMeeting(userId, data) {
  const { title, description, scheduledAt, durationMinutes, provider, attendeeEmails, proposalId, agreementId } = data;

  // Map platform to provider enum
  const providerMap = { zoom: 'ZOOM', google: 'GOOGLE_MEET', none: 'IN_PERSON' };
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
  let joinUrl = null;
  let startUrl = null;

  // Create external meeting if provider selected
  if (provider === 'zoom') {
    const zoomMeeting = await zoomAdapter.createMeeting({
      topic: title,
      startTime: scheduledAt,
      durationMinutes,
      agenda: description,
    });
    externalMeetingId = String(zoomMeeting.id);
    joinUrl = zoomMeeting.join_url;
    startUrl = zoomMeeting.start_url;
  } else if (provider === 'google') {
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
