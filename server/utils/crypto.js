// Cryptographic primitives used across the auth/session layer.
//   • Password hashing: argon2id (memory-hard, OWASP-recommended).
//   • Token hashing  : sha256 (fast, one-way) for refresh tokens & verification tokens
//                      so we can compare without ever storing the secret.
//   • Random tokens  : 32 cryptographically-random bytes encoded base64url.
import argon2 from 'argon2';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

const ARGON_OPTS = {
  type: argon2.argon2id,
  // Tuned conservatively for typical server hardware; revisit on prod hardware.
  memoryCost: 19_456,  // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plain) {
  return argon2.hash(plain, ARGON_OPTS);
}

export async function verifyPassword(hash, plain) {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

// 32-byte URL-safe random string. Use for refresh tokens, verification codes.
export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

export function sha256(input) {
  return createHash('sha256').update(input).digest('hex');
}

// Constant-time string equality. Both inputs must be hex of equal length.
export function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
