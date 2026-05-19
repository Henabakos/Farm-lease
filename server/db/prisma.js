// Singleton PrismaClient. Reused across the process to avoid exhausting the
// connection pool. Hot-reload-safe via a global cache in dev.
import { PrismaClient } from '@prisma/client';
import { env, isDev } from '../config/env.js';
import { logger } from '../utils/logger.js';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: isDev
      ? [{ emit: 'event', level: 'query' }, 'info', 'warn', 'error']
      : ['warn', 'error'],
  });

if (isDev) {
  globalForPrisma.__prisma = prisma;
  // Surface slow queries in dev only; trim verbosity in prod.
  prisma.$on?.('query', (e) => {
    if (e.duration >= 250) {
      logger.warn({ duration: e.duration, query: e.query }, 'slow query');
    }
  });
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
