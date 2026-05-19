// ============================================================================
// BullMQ queue registry.
//
// Each queue corresponds to a category of asynchronous work that lives off
// the request path. Producers (controllers / outbox dispatcher) push jobs
// here; workers (server/workers.js) consume them in a separate process.
//
// Naming convention: kebab-case nouns describing the work, not the producer.
//
// Adding a new queue:
//   1. Declare its name below in QUEUE_NAMES.
//   2. Export a producer factory from this file.
//   3. Implement the consumer in `server/workers/<name>.worker.js`.
//   4. Register the worker in `server/workers.js`.
// ============================================================================

import { Queue, QueueEvents } from 'bullmq';
import { bullConn } from '../db/redis.js';
import { logger } from '../utils/logger.js';

export const QUEUE_NAMES = Object.freeze({
  EMAIL:           'email',
  NOTIFICATION:    'notification',
  OUTBOX_DISPATCH: 'outbox-dispatch',     // internal: drains the Outbox table
  AI_INGESTION:    'ai-ingestion',
  PDF_RENDER:      'pdf-render',
  RECEIPT_OCR:     'receipt-ocr',
  RECOMMENDATIONS: 'recommendations',
});

const DEFAULT_JOB_OPTS = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 2_000 },
  removeOnComplete: { age: 24 * 3600, count: 1_000 },
  removeOnFail:     { age: 7 * 24 * 3600 },
};

const queues = new Map();

export function getQueue(name) {
  if (!Object.values(QUEUE_NAMES).includes(name)) {
    throw new Error(`Unknown queue name: ${name}`);
  }
  if (!queues.has(name)) {
    queues.set(name, new Queue(name, { connection: bullConn, defaultJobOptions: DEFAULT_JOB_OPTS }));
  }
  return queues.get(name);
}

/** Convenience helpers — typed call sites read better than raw `getQueue(...).add(...)`. */
export const enqueue = {
  email:           (data, opts) => getQueue(QUEUE_NAMES.EMAIL).add('send',           data, opts),
  notification:    (data, opts) => getQueue(QUEUE_NAMES.NOTIFICATION).add('fanout',  data, opts),
  outboxDispatch:  (data, opts) => getQueue(QUEUE_NAMES.OUTBOX_DISPATCH).add('drain', data, opts),
  aiIngestion:     (data, opts) => getQueue(QUEUE_NAMES.AI_INGESTION).add('process',  data, opts),
  pdfRender:       (data, opts) => getQueue(QUEUE_NAMES.PDF_RENDER).add('render',     data, opts),
  receiptOcr:      (data, opts) => getQueue(QUEUE_NAMES.RECEIPT_OCR).add('scan',      data, opts),
  recommendations: (data, opts) => getQueue(QUEUE_NAMES.RECOMMENDATIONS).add('compute', data, opts),
};

/** Attach a lightweight log listener to every queue. Useful in dev. */
export function attachQueueLoggers() {
  for (const name of Object.values(QUEUE_NAMES)) {
    const events = new QueueEvents(name, { connection: bullConn });
    events.on('failed',    ({ jobId, failedReason }) => logger.warn({ name, jobId, failedReason }, 'job failed'));
    events.on('completed', ({ jobId })              => logger.debug({ name, jobId }, 'job completed'));
  }
}

export async function closeQueues() {
  await Promise.allSettled([...queues.values()].map((q) => q.close()));
}
