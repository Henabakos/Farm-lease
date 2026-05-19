// Shared ioredis connections.
//   • `redis`     — general-purpose client (caching, rate limit, presence).
//   • `bullConn`  — BullMQ-specific connection (must have maxRetriesPerRequest: null).
//   • `pubClient` / `subClient` — for Socket.IO redis adapter.
import IORedis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

function build(name, opts = {}) {
  const client = new IORedis(env.REDIS_URL, {
    lazyConnect: false,
    enableReadyCheck: true,
    ...opts,
  });
  client.on('error', (err) => logger.error({ err, name }, 'redis error'));
  client.on('connect', () => logger.debug({ name }, 'redis connected'));
  return client;
}

export const redis = build('redis');

// BullMQ requires `maxRetriesPerRequest: null` and `enableReadyCheck: false`
// for workers; we apply the same to producers for consistency.
export const bullConn = build('bullmq', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const pubClient = build('socket-pub');
export const subClient = pubClient.duplicate();

export async function disconnectRedis() {
  await Promise.allSettled([
    redis.quit(),
    bullConn.quit(),
    pubClient.quit(),
    subClient.quit(),
  ]);
}
