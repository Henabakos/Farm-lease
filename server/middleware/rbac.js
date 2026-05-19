// Authorization middlewares. Mount AFTER `requireAuth`.
//
//   router.post('/clusters',
//     requireAuth,
//     requirePermission(PERMISSIONS.CLUSTER_CREATE),
//     controller.create);
//
// For resource-scoped checks (e.g. "owner of this cluster") perform the
// ownership lookup inside the service layer and throw ForbiddenError there;
// keep this middleware coarse.
import { ForbiddenError, UnauthorizedError } from '../shared/errors.js';
import { hasPermission } from '../modules/rbac/permissions.js';

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient role'));
    }
    next();
  };
}

export function requirePermission(permission) {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!hasPermission(req.user.role, permission)) {
      return next(new ForbiddenError(`Missing permission: ${permission}`));
    }
    next();
  };
}
