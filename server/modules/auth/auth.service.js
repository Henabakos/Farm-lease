// ============================================================================
// Auth service — orchestrates the use-cases listed below. Controllers must
// never touch Prisma directly; everything goes through this layer so business
// invariants (admin-approval gating, role restrictions, event emission) live
// in exactly one place and remain testable.
//
// Use cases:
//   • register            — create user, enqueue verification email, audit
//   • login               — verify credentials, gate inactive accounts, issue tokens
//   • refresh             — rotate refresh token with reuse detection
//   • logout              — revoke the presented refresh token
//   • getMe               — return the current user snapshot
//   • requestPasswordReset / resetPassword
//   • verifyEmail
// ============================================================================

import { prisma } from '../../db/prisma.js';
import { env } from '../../config/env.js';
import { hashPassword, verifyPassword } from '../../utils/crypto.js';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../shared/errors.js';
import { logger } from '../../utils/logger.js';
import { recordOutbox } from '../../events/bus.js';
import { issueTokenPair, refreshTokens, revokeRefreshToken, revokeAllSessions } from './tokens.js';
import { issueVerificationToken, consumeVerificationToken } from './verification.js';
import { normalizeRole, toUserDto } from './dto.js';

// Roles a user may self-assign at registration. ADMIN is intentionally
// excluded — admin accounts must be seeded or created by another admin.
const SELF_ASSIGNABLE_ROLES = new Set(['INVESTOR', 'CLUSTER_REP', 'FARMER']);

/** Build the response envelope expected by the frontend AuthContext. */
function authPayload({ accessToken, refreshToken, user }) {
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: toUserDto(user),
  };
}

// ----------------------------------------------------------------------------
// register
// ----------------------------------------------------------------------------
export async function register({ email, password, fullName, role: rawRole }, ctx = {}) {
  const role = normalizeRole(rawRole);
  if (!role) {
    throw new ValidationError('Invalid role', [{ path: 'role', message: 'Unknown role' }]);
  }
  if (!SELF_ASSIGNABLE_ROLES.has(role)) {
    throw new ForbiddenError('This role cannot self-register', 'ROLE_NOT_SELF_ASSIGNABLE');
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    // Conflict by design — alternative would be to silently succeed to avoid
    // user-enumeration. We expose the conflict here because the frontend
    // shows distinct register / login flows and the UX value beats the small
    // enumeration risk; rate limiting on /auth/register is the real defense.
    throw new ConflictError('Email already registered', 'EMAIL_TAKEN');
  }

  const passwordHash = await hashPassword(password);
  const initialStatus = env.REQUIRE_ADMIN_APPROVAL ? 'PENDING_APPROVAL' : 'ACTIVE';

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role,
        status: initialStatus,
        verificationStatus: 'UNVERIFIED',
      },
    });

    await recordOutbox(tx, {
      eventType: 'user.registered',
      aggregateType: 'User',
      aggregateId: user.id,
      payload: { userId: user.id, email: user.email, role: user.role, requiresApproval: initialStatus === 'PENDING_APPROVAL' },
    });

    return user;
  });

  // Mint a verification token AFTER the transaction commits so a rollback
  // never leaves orphan tokens. The plaintext is enqueued onto the email
  // queue; the email worker (Phase 8) sends the actual message.
  const verifyToken = await issueVerificationToken(result.id, 'EMAIL_VERIFICATION');
  // We could enqueue directly to the email queue here, but routing through
  // the outbox is more uniform and gives us at-least-once delivery + audit.
  await prisma.outbox.create({
    data: {
      eventType: 'email.verification.send',
      aggregateType: 'User',
      aggregateId: result.id,
      payload: {
        to: result.email,
        userId: result.id,
        verifyUrl: `${env.CLIENT_URL}/verify-email?token=${verifyToken}`,
      },
    },
  });

  logger.info({ userId: result.id, role, requiresApproval: initialStatus === 'PENDING_APPROVAL' }, 'user registered');
  void ctx;
  return { user: toUserDto(result), requiresApproval: initialStatus === 'PENDING_APPROVAL' };
}

// ----------------------------------------------------------------------------
// login
// ----------------------------------------------------------------------------
export async function login({ email, password }, { userAgent, ipAddress } = {}) {
  // Single generic error message regardless of which step fails. Prevents
  // user-enumeration through timing/error differences.
  const genericFail = () => new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Run a dummy hash compare to keep timing roughly constant.
    await verifyPassword('$argon2id$v=19$m=19456,t=2,p=1$' + 'a'.repeat(22) + '$' + 'b'.repeat(43), password);
    throw genericFail();
  }
  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) throw genericFail();

  // Status gating — done AFTER credential check so attackers can't probe
  // which accounts are suspended.
  if (user.status === 'SUSPENDED' || user.status === 'DELETED') {
    throw new ForbiddenError('Account is not active', 'ACCOUNT_INACTIVE');
  }
  if (user.status === 'PENDING_APPROVAL') {
    throw new ForbiddenError('Account awaiting admin approval', 'PENDING_APPROVAL');
  }

  const { accessToken, refreshToken } = await issueTokenPair(user, { userAgent, ipAddress });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return authPayload({ accessToken, refreshToken, user });
}

// ----------------------------------------------------------------------------
// refresh
// ----------------------------------------------------------------------------
export async function refresh({ refreshToken }, { userAgent, ipAddress } = {}) {
  const { accessToken, refreshToken: newRefresh } = await refreshTokens(refreshToken, {
    userAgent,
    ipAddress,
  });
  return {
    access_token: accessToken,
    refresh_token: newRefresh,
  };
}

// ----------------------------------------------------------------------------
// logout
// ----------------------------------------------------------------------------
export async function logout({ refreshToken } = {}) {
  await revokeRefreshToken(refreshToken);
  return { message: 'Logged out' };
}

// ----------------------------------------------------------------------------
// getMe
// ----------------------------------------------------------------------------
export async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');
  return toUserDto(user);
}

// ----------------------------------------------------------------------------
// verifyEmail
// ----------------------------------------------------------------------------
export async function verifyEmail({ token }) {
  const row = await consumeVerificationToken(token, 'EMAIL_VERIFICATION');
  const updated = await prisma.user.update({
    where: { id: row.userId },
    data: {
      emailVerifiedAt: new Date(),
      verificationStatus: row.user.verificationStatus === 'UNVERIFIED' ? 'PENDING' : row.user.verificationStatus,
    },
  });
  return { user: toUserDto(updated) };
}

// ----------------------------------------------------------------------------
// requestPasswordReset
// ----------------------------------------------------------------------------
export async function requestPasswordReset({ email }) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success regardless of whether the email exists to avoid
  // user-enumeration. The email worker silently no-ops on unknown addresses.
  if (user && (user.status === 'ACTIVE' || user.status === 'PENDING_APPROVAL')) {
    const token = await issueVerificationToken(user.id, 'PASSWORD_RESET');
    await prisma.outbox.create({
      data: {
        eventType: 'email.password_reset.send',
        aggregateType: 'User',
        aggregateId: user.id,
        payload: {
          to: user.email,
          userId: user.id,
          resetUrl: `${env.CLIENT_URL}/reset-password?token=${token}`,
        },
      },
    });
  }
  return { message: 'If an account exists for that email, a reset link has been sent.' };
}

// ----------------------------------------------------------------------------
// resetPassword
// ----------------------------------------------------------------------------
export async function resetPassword({ token, password }) {
  const row = await consumeVerificationToken(token, 'PASSWORD_RESET');
  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    });
    // Revoke every active refresh-token family for this user — any stolen
    // session that motivated the reset is now invalidated.
    await tx.session.updateMany({
      where: { userId: row.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await recordOutbox(tx, {
      eventType: 'user.password_reset',
      aggregateType: 'User',
      aggregateId: row.userId,
      payload: { userId: row.userId },
    });
  });

  return { message: 'Password reset successful. Please log in again.' };
}

// Re-export for the admin module to revoke sessions on suspension etc.
export { revokeAllSessions };

// Sentinel so the file always has a unique import surface even if we tree-shake later.
export const __AUTH_SERVICE__ = true;
void AppError;
