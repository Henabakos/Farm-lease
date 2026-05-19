// ============================================================================
// Token issuance + refresh rotation.
//
// Why two token types:
//   • Access token  — short-lived (15m) JWT signed HS256. Stateless; checked
//                     on every request by middleware/auth.js without a DB hit.
//   • Refresh token — long-lived (7d) opaque random string. Only its sha256
//                     hash is stored in the `Session` table. Used once: every
//                     refresh issues a NEW refresh token (rotation) and marks
//                     the old one `replacedBy`. Presenting an already-rotated
//                     token => the entire `familyId` is revoked (theft signal).
//
// This combo gives us:
//   • Stateless authz on the hot path (no DB read).
//   • Revocation + theft detection for long-lived sessions.
//   • Clean logout (delete the row, future refreshes fail).
// ============================================================================

import { randomToken, sha256 } from '../../utils/crypto.js';
import { signAccessToken } from '../../utils/jwt.js';
import { env } from '../../config/env.js';
import { prisma } from '../../db/prisma.js';
import { UnauthorizedError } from '../../shared/errors.js';
import { logger } from '../../utils/logger.js';
import { randomUUID } from 'node:crypto';

// Parse strings like "7d", "15m" into milliseconds. Keeps env config human-readable.
function parseDuration(spec) {
  const m = /^(\d+)\s*([smhd])$/.exec(spec.trim());
  if (!m) throw new Error(`Invalid duration: ${spec}`);
  const n = Number(m[1]);
  const unit = m[2];
  const mult = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return n * mult;
}

const REFRESH_TTL_MS = parseDuration(env.JWT_REFRESH_TTL);

/**
 * Issue a brand-new (access, refresh) pair, starting a fresh session family.
 * Used on successful login + register-then-login flows.
 */
export async function issueTokenPair(user, { userAgent, ipAddress } = {}) {
  const familyId = randomUUID();
  return rotate(user, familyId, null, { userAgent, ipAddress });
}

/**
 * Rotate a refresh token. Either continues an existing family (`familyId`
 * supplied) or starts a new one (when called from `issueTokenPair`).
 * If `previousSessionId` is supplied it's marked as replaced.
 */
async function rotate(user, familyId, previousSessionId, { userAgent, ipAddress } = {}) {
  const refreshToken = randomToken(32);
  const refreshTokenHash = sha256(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  const session = await prisma.$transaction(async (tx) => {
    const created = await tx.session.create({
      data: {
        userId: user.id,
        familyId,
        refreshTokenHash,
        expiresAt,
        userAgent: userAgent?.slice(0, 500) ?? null,
        ipAddress: ipAddress ?? null,
      },
    });
    if (previousSessionId) {
      await tx.session.update({
        where: { id: previousSessionId },
        data: { revokedAt: new Date(), replacedById: created.id },
      });
    }
    return created;
  });

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    status: user.status,
    jti: session.id,
  });

  return { accessToken, refreshToken, session };
}

/**
 * Exchange a refresh token for a new pair. Implements reuse detection:
 *   • If the token hash isn't found       => 401 (invalid).
 *   • If it's expired                     => 401 (expired).
 *   • If the row was already revoked      => the family was compromised;
 *                                            revoke every session in the
 *                                            family and 401 the caller.
 */
export async function refreshTokens(refreshToken, { userAgent, ipAddress } = {}) {
  if (!refreshToken || typeof refreshToken !== 'string') {
    throw new UnauthorizedError('Refresh token required', 'NO_REFRESH_TOKEN');
  }
  const hash = sha256(refreshToken);
  const session = await prisma.session.findUnique({
    where: { refreshTokenHash: hash },
    include: { user: true },
  });

  if (!session) {
    throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  if (session.revokedAt) {
    // REUSE DETECTED — someone presented a token that's already been rotated.
    // The original token may have been stolen. Revoke the whole family.
    logger.warn(
      { userId: session.userId, familyId: session.familyId, sessionId: session.id },
      'refresh token reuse detected — revoking family',
    );
    await prisma.session.updateMany({
      where: { familyId: session.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new UnauthorizedError('Refresh token reuse detected', 'REFRESH_REUSE');
  }

  if (session.expiresAt < new Date()) {
    throw new UnauthorizedError('Refresh token expired', 'REFRESH_EXPIRED');
  }

  if (session.user.status !== 'ACTIVE') {
    throw new UnauthorizedError('Account is not active', 'ACCOUNT_INACTIVE');
  }

  return rotate(session.user, session.familyId, session.id, { userAgent, ipAddress });
}

/**
 * Revoke a single refresh token (logout). Idempotent: unknown tokens are a
 * no-op so a stale localStorage token doesn't 500 the logout button.
 */
export async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return;
  const hash = sha256(refreshToken);
  await prisma.session
    .updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    .catch(() => {});
}

/** Revoke every active session for a user. Called on suspension / password reset. */
export async function revokeAllSessions(userId) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
