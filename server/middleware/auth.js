// JWT authentication middleware. Verifies the bearer token, loads a minimal
// user snapshot, and attaches it to `req.user`. Does NOT hit the database on
// every request — that's by design. Token claims carry { sub, role, status }
// which are sufficient for RBAC. Services that need fresh user data fetch it
// explicitly.
import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../shared/errors.js';

function extractBearer(req) {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

/** Require a valid access token. Populates `req.user = { id, role, status }`. */
export function requireAuth(req, _res, next) {
  const token = extractBearer(req);
  if (!token) return next(new UnauthorizedError('Missing bearer token', 'NO_TOKEN'));

  const claims = verifyAccessToken(token); // throws UnauthorizedError on failure

  if (claims.status === 'SUSPENDED' || claims.status === 'DELETED') {
    return next(new ForbiddenError('Account is not active', 'ACCOUNT_INACTIVE'));
  }
  if (claims.status === 'PENDING_APPROVAL') {
    return next(new ForbiddenError('Account awaiting admin approval', 'PENDING_APPROVAL'));
  }

  req.user = {
    id: claims.sub,
    role: claims.role,
    status: claims.status,
    tokenJti: claims.jti,
  };
  next();
}

/** Optional auth — populates `req.user` if a valid token is present, else continues. */
export function optionalAuth(req, _res, next) {
  const token = extractBearer(req);
  if (!token) return next();
  try {
    const claims = verifyAccessToken(token);
    req.user = { id: claims.sub, role: claims.role, status: claims.status };
  } catch {
    // ignore — anonymous
  }
  next();
}
