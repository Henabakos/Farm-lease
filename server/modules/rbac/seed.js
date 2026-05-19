// Seeds the RolePermission table from the static DEFAULT_ROLE_PERMISSIONS map
// on every boot, then loads the resulting rows into the in-memory cache.
//
// Idempotent — uses skipDuplicates so re-running doesn't error and admin-made
// modifications/additions are preserved (we only INSERT missing defaults,
// never DELETE).
import { prisma } from '../../db/prisma.js';
import { logger } from '../../utils/logger.js';
import {
  DEFAULT_ROLE_PERMISSIONS,
  loadPermissionsIntoCache,
} from './permissions.js';

export async function seedAndLoadPermissions() {
  const rows = [];
  for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    for (const permission of permissions) {
      rows.push({ role, permission });
    }
  }

  const result = await prisma.rolePermission.createMany({
    data: rows,
    skipDuplicates: true,
  });
  if (result.count > 0) {
    logger.info({ inserted: result.count }, 'seeded role permissions');
  }

  const all = await prisma.rolePermission.findMany({
    select: { role: true, permission: true },
  });
  loadPermissionsIntoCache(all);
  logger.info({ total: all.length }, 'rbac cache loaded');
}
