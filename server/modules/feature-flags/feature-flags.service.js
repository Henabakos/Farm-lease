// ============================================================================
// Feature flags module — service layer
// ============================================================================
import { prisma } from '../../db/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';
import { paginate } from '../../shared/pagination.js';

// In-memory cache for feature flags (refreshed periodically)
let flagCache = new Map();
let cacheExpiry = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Refresh the flag cache from the database.
 */
async function refreshCache() {
  const now = Date.now();
  if (cacheExpiry > now && flagCache.size > 0) {
    return;
  }

  const flags = await prisma.$queryRaw`
    SELECT * FROM "FeatureFlag" WHERE "isActive" = true
  `;

  flagCache.clear();
  flags.forEach(flag => {
    flagCache.set(flag.key, flag);
  });

  cacheExpiry = now + CACHE_TTL;
}

/**
 * Check if a feature flag is enabled for a user.
 */
export async function isFlagEnabled(key, user) {
  await refreshCache();

  const flag = flagCache.get(key);
  if (!flag || !flag.enabled) {
    return false;
  }

  // If rollout is 100%, it's enabled for everyone
  if (flag.rolloutPercentage >= 100) {
    return true;
  }

  // If rollout is 0%, it's disabled
  if (flag.rolloutPercentage <= 0) {
    return false;
  }

  // Check user segment
  if (flag.userSegment && flag.userSegment !== 'all') {
    const segmentMap = {
      admins: 'ADMIN',
      investors: 'INVESTOR',
      farmers: 'FARMER',
      cluster_reps: 'CLUSTER_REP',
    };

    if (user?.role !== segmentMap[flag.userSegment]) {
      return false;
    }
  }

  // Rollout based on user ID hash
  const hash = user ? simpleHash(user.id) : 0;
  return (hash % 100) < flag.rolloutPercentage;
}

/**
 * Simple hash function for rollout.
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Create a new feature flag (admin only).
 */
export async function createFlag(userId, data) {
  const { key, description, enabled, rolloutPercentage, userSegment } = data;

  // Check if key already exists
  const existing = await prisma.$queryRaw`
    SELECT * FROM "FeatureFlag" WHERE "key" = ${key}
  `;

  if (existing && existing.length > 0) {
    throw new ForbiddenError('Feature flag with this key already exists');
  }

  const flag = await prisma.$queryRaw`
    INSERT INTO "FeatureFlag" ("key", description, enabled, "rolloutPercentage", "userSegment", "isActive", "createdAt", "updatedAt")
    VALUES (${key}, ${description || null}, ${enabled}, ${rolloutPercentage}, ${userSegment || null}, true, NOW(), NOW())
    RETURNING *
  `;

  // Invalidate cache
  flagCache.clear();
  cacheExpiry = 0;

  return flag[0];
}

/**
 * Update a feature flag.
 */
export async function updateFlag(userId, key, updates) {
  const flag = await prisma.$queryRaw`
    SELECT * FROM "FeatureFlag" WHERE "key" = ${key}
  `;

  if (!flag || flag.length === 0) throw new NotFoundError('Feature flag not found');

  const updateFields = [];
  const values = [];

  if (updates.description !== undefined) {
    updateFields.push('description = $2');
    values.push(updates.description);
  }
  if (updates.enabled !== undefined) {
    updateFields.push('enabled = $3');
    values.push(updates.enabled);
  }
  if (updates.rolloutPercentage !== undefined) {
    updateFields.push('rolloutPercentage = $4');
    values.push(updates.rolloutPercentage);
  }
  if (updates.userSegment !== undefined) {
    updateFields.push('userSegment = $5');
    values.push(updates.userSegment);
  }

  if (updateFields.length === 0) {
    return flag[0];
  }

  const updated = await prisma.$queryRaw`
    UPDATE "FeatureFlag"
    SET ${updateFields.join(', ')}, "updatedAt" = NOW()
    WHERE "key" = ${key}
    RETURNING *
  `;

  // Invalidate cache
  flagCache.clear();
  cacheExpiry = 0;

  return updated[0];
}

/**
 * Delete a feature flag.
 */
export async function deleteFlag(userId, key) {
  const flag = await prisma.$queryRaw`
    SELECT * FROM "FeatureFlag" WHERE "key" = ${key}
  `;

  if (!flag || flag.length === 0) throw new NotFoundError('Feature flag not found');

  await prisma.$queryRaw`
    DELETE FROM "FeatureFlag" WHERE "key" = ${key}
  `;

  // Invalidate cache
  flagCache.clear();
  cacheExpiry = 0;

  return { success: true };
}

/**
 * List all feature flags.
 */
export async function listFlags(filters) {
  const { enabled, page, limit } = filters;

  let whereClause = 'WHERE "isActive" = true';
  if (enabled !== undefined) {
    whereClause += ` AND enabled = ${enabled}`;
  }

  const countResult = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as count FROM "FeatureFlag" ${whereClause}
  `);

  const flags = await prisma.$queryRawUnsafe(`
    SELECT * FROM "FeatureFlag" ${whereClause}
    ORDER BY "createdAt" DESC
    LIMIT ${limit} OFFSET ${(page - 1) * limit}
  `);

  return {
    items: flags,
    pagination: {
      page,
      limit,
      total: Number(countResult[0]?.count || 0),
      pages: Math.ceil(Number(countResult[0]?.count || 0) / limit),
    },
  };
}

/**
 * Get a specific flag by key.
 */
export async function getFlagByKey(key) {
  await refreshCache();
  return flagCache.get(key) || null;
}
