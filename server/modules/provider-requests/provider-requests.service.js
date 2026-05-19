// ============================================================================
// Provider Requests module — service layer
// ============================================================================
import { prisma } from '../../db/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';

/**
 * Create a new provider request.
 */
export async function createProviderRequest(userId, data) {
  const { companyName, serviceType, description, contactEmail, contactPhone } = data;

  // Check if user already has a pending request
  const existingRequest = await prisma.providerRequest.findFirst({
    where: {
      userId,
      status: 'PENDING',
    },
  });

  if (existingRequest) {
    throw new ForbiddenError('You already have a pending provider request');
  }

  const request = await prisma.providerRequest.create({
    data: {
      userId,
      companyName,
      serviceType,
      description,
      contactEmail,
      contactPhone,
    },
  });

  return request;
}

/**
 * Get all provider requests (admin only).
 */
export async function getProviderRequests(filters = {}) {
  const { status } = filters;

  const where = {
    ...(status && { status }),
  };

  const requests = await prisma.providerRequest.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return requests;
}

/**
 * Get a provider request by ID.
 */
export async function getProviderRequestById(requestId) {
  const request = await prisma.providerRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!request) {
    throw new NotFoundError('Provider request not found');
  }

  return request;
}

/**
 * Approve a provider request (admin only).
 */
export async function approveProviderRequest(adminId, requestId, reviewNotes) {
  const request = await prisma.providerRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new NotFoundError('Provider request not found');
  }

  if (request.status !== 'PENDING') {
    throw new ForbiddenError('Request is not pending');
  }

  const updated = await prisma.providerRequest.update({
    where: { id: requestId },
    data: {
      status: 'APPROVED',
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewNotes,
    },
  });

  return updated;
}

/**
 * Reject a provider request (admin only).
 */
export async function rejectProviderRequest(adminId, requestId, reviewNotes) {
  const request = await prisma.providerRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new NotFoundError('Provider request not found');
  }

  if (request.status !== 'PENDING') {
    throw new ForbiddenError('Request is not pending');
  }

  const updated = await prisma.providerRequest.update({
    where: { id: requestId },
    data: {
      status: 'REJECTED',
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewNotes,
    },
  });

  return updated;
}

/**
 * Get user's provider requests.
 */
export async function getUserProviderRequests(userId) {
  const requests = await prisma.providerRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return requests;
}
