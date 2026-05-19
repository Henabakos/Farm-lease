// JWT helpers for the access-token half of the auth flow.
// Refresh tokens are NOT JWTs — they are opaque random strings whose sha256
// hash is stored in the `Session` table (enables revocation + rotation).
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../shared/errors.js';

const ACCESS_ISSUER = 'farm-lease';
const ACCESS_AUDIENCE = 'farm-lease-api';

/**
 * Sign a short-lived access token.
 * @param {{ sub: string, role: string, status: string }} claims
 */
export function signAccessToken(claims) {
  return jwt.sign(claims, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
    issuer: ACCESS_ISSUER,
    audience: ACCESS_AUDIENCE,
    algorithm: 'HS256',
  });
}

/**
 * Verify an access token. Throws UnauthorizedError on any failure so the
 * auth middleware can map cleanly to 401.
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: ACCESS_ISSUER,
      audience: ACCESS_AUDIENCE,
      algorithms: ['HS256'],
    });
  } catch (err) {
    const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    throw new UnauthorizedError('Invalid or expired token', code);
  }
}
