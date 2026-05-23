// ============================================================================
// Worker process entrypoint.
//
// Runs in a separate Node process from the API (`npm run dev:worker`). Hosts
// every BullMQ Worker so heavy / latency-sensitive work (email, OCR, AI
// ingestion, PDF rendering, recommendation crunching) never blocks request
// handling — and can be scaled horizontally independent of the API tier.
//
// Per-queue processors are stub-only right now; the auth/business/AI phases
// fill them in incrementally. This file's only job is to:
//   • create one Worker per queue,
//   • route the job to the appropriate processor module,
//   • log + crash on fatal infra failure,
//   • shut down cleanly on SIGINT / SIGTERM.
// ============================================================================

import { Worker } from 'bullmq';
import { bullConn } from './db/redis.js';
import { QUEUE_NAMES } from './queues/index.js';
import { logger } from './utils/logger.js';
import { disconnectPrisma } from './db/prisma.js';
import { disconnectRedis } from './db/redis.js';
import { processAiIngestion } from './workers/aiIngestion.worker.js';
import { processEmail } from './workers/email.worker.js';
import { processNotification } from './workers/notification.worker.js';

// Stub processor used by queues whose real implementation hasn't shipped yet.
function stubProcessor(queueName) {
  return async (job) => {
    logger.info({ queue: queueName, jobId: job.id, name: job.name }, 'stub job');
    return { ok: true, stub: true };
  };
}

function makeWorker(name, processor, opts = {}) {
  const worker = new Worker(name, processor, {
    connection: bullConn,
    concurrency: opts.concurrency ?? 4,
  });
  worker.on('failed', (job, err) =>
    logger.error({ queue: name, jobId: job?.id, err }, 'job failed'),
  );
  worker.on('error', (err) => logger.error({ queue: name, err }, 'worker error'));
  return worker;
}

const workers = [
  makeWorker(QUEUE_NAMES.EMAIL,           processEmail),
  makeWorker(QUEUE_NAMES.NOTIFICATION,    processNotification),
  makeWorker(QUEUE_NAMES.OUTBOX_DISPATCH, stubProcessor(QUEUE_NAMES.OUTBOX_DISPATCH)),
  // AI ingestion can be slow (LLM calls); cap concurrency to avoid hammering
  // the upstream provider and bumping into rate limits.
  makeWorker(QUEUE_NAMES.AI_INGESTION,    processAiIngestion, { concurrency: 2 }),
  makeWorker(QUEUE_NAMES.PDF_RENDER,      stubProcessor(QUEUE_NAMES.PDF_RENDER)),
  makeWorker(QUEUE_NAMES.RECEIPT_OCR,     stubProcessor(QUEUE_NAMES.RECEIPT_OCR)),
  makeWorker(QUEUE_NAMES.RECOMMENDATIONS, stubProcessor(QUEUE_NAMES.RECOMMENDATIONS)),
];

logger.info({ queues: workers.map((w) => w.name) }, 'workers started');

async function shutdown(signal) {
  logger.info({ signal }, 'worker shutdown initiated');
  await Promise.allSettled(workers.map((w) => w.close()));
  await disconnectPrisma();
  await disconnectRedis();
  logger.info('worker shutdown complete');
  process.exit(0);
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) =>
  logger.error({ reason }, 'unhandled rejection in worker'),
);
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught exception in worker — exiting');
  process.exit(1);
});
