// Single-use signed tokens for email verification + password reset.
//
// Storage model: only the sha256 hash is persisted (so a DB leak can't be
// used to verify emails or reset passwords). The plaintext is returned to
// the caller once at creation time so it can be embedded into an email link.
//
// Verification flow guarantees:
//   • Tokens are one-time (`usedAt` timestamp).
//   • Tokens expire (`expiresAt` enforced at consume-time).
//   • Issuing a fresh reset token invalidates older outstanding ones for the
//     same (user, purpose) — prevents a stale email from working after the
//     user requests a new one.
import { prisma } from '../../db/prisma.js';
import { randomToken, sha256 } from '../../utils/crypto.js';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../shared/errors.js';

function parseDuration(spec) {
  const m = /^(\d+)\s*([smhd])$/.exec(spec.trim());
  const n = Number(m[1]);
  const mult = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[m[2]];
  return n * mult;
}

const TTL = {
  EMAIL_VERIFICATION: parseDuration(env.EMAIL_VERIFY_TTL),
  PASSWORD_RESET:     parseDuration(env.PASSWORD_RESET_TTL),
};

export async function issueVerificationToken(userId, purpose) {
  const token = randomToken(32);
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + TTL[purpose]);

  await prisma.$transaction([
    // Invalidate prior outstanding tokens for this (user, purpose).
    prisma.verificationToken.updateMany({
      where: { userId, purpose, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.verificationToken.create({
      data: { userId, purpose, tokenHash, expiresAt },
    }),
  ]);

  return token; // plaintext — embed into the email link, never log
}

/**
 * Consume a token. Throws on any failure mode. On success returns the
 * VerificationToken row (with the related User).
 */
export async function consumeVerificationToken(token, purpose) {
  if (!token || typeof token !== 'string') {
    throw new UnauthorizedError('Invalid token', 'INVALID_VERIFICATION_TOKEN');
  }
  const tokenHash = sha256(token);
  const row = await prisma.verificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!row || row.purpose !== purpose) {
    throw new UnauthorizedError('Invalid token', 'INVALID_VERIFICATION_TOKEN');
  }
  if (row.usedAt) {
    throw new UnauthorizedError('Token already used', 'TOKEN_ALREADY_USED');
  }
  if (row.expiresAt < new Date()) {
    throw new UnauthorizedError('Token expired', 'TOKEN_EXPIRED');
  }
  await prisma.verificationToken.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });
  return row;
}
