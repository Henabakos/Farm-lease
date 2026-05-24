// Verification gate.
//
// Some high-trust actions (creating proposals, signing agreements, sending
// money) must only be available to users whose identity has been verified
// through the KYC flow. Admins bypass this check.
//
// Mount AFTER `requireAuth`:
//
//   router.post('/proposals',
//     requireAuth,
//     requireVerified,
//     ...handler);
import { prisma } from '../db/prisma.js';
import { ForbiddenError, UnauthorizedError } from '../shared/errors.js';

export function requireVerified(req, _res, next) {
  if (!req.user) return next(new UnauthorizedError());
  if (req.user.role === 'ADMIN') return next();

  prisma.user
    .findUnique({
      where: { id: req.user.id },
      select: { verificationStatus: true },
    })
    .then((user) => {
      const status = user?.verificationStatus ?? 'UNVERIFIED';
      req.user.verificationStatus = status;
      if (status !== 'VERIFIED') {
        return next(
          new ForbiddenError(
            'Account must be identity-verified to perform this action',
            'NOT_VERIFIED',
          ),
        );
      }
      next();
    })
    .catch(next);
}
