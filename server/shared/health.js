// Liveness vs readiness:
//   • /healthz  — liveness: process is responsive. No external checks.
//   • /readyz   — readiness: DB + Redis reachable. Used by orchestrators to
//                 gate traffic; returning 503 evicts the pod from the LB.
import { prisma } from '../db/prisma.js';
import { redis } from '../db/redis.js';

export function registerHealthRoutes(app) {
  app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

  app.get('/readyz', async (_req, res) => {
    const checks = { db: 'ok', redis: 'ok' };
    let healthy = true;
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      checks.db = 'fail';
      healthy = false;
    }
    try {
      await redis.ping();
    } catch {
      checks.redis = 'fail';
      healthy = false;
    }
    res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', checks });
  });

  // Legacy path used by frontend probes; alias to /healthz.
  app.get('/api/health', (_req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() }),
  );
}
