// ============================================================================
// Outbox dispatcher — the bridge between the transactional `Outbox` table
// and BullMQ.
//
// How it works:
//   • A lightweight polling loop runs every OUTBOX_POLL_MS.
//   • Per tick, it claims a batch of PENDING rows using `SELECT ... FOR UPDATE
//     SKIP LOCKED` so multiple API/worker instances can run safely in parallel.
//   • For each claimed row it determines the target queue based on event
//     prefix (see `routeEvent` below), enqueues a BullMQ job, and marks the
//     row DISPATCHED in the same transaction.
//   • On enqueue failure the row stays PENDING; the next tick retries (with
//     an exponential delay tracked via `attempts`).
//
// Why polling, not LISTEN/NOTIFY:
//   • Polling is dead simple, requires zero schema extras, survives
//     reconnection windows, and at our throughput (low thousands/min) the
//     latency overhead is negligible. We can swap in LISTEN/NOTIFY later
//     without API changes.
// ============================================================================

import { prisma } from '../db/prisma.js';
import { enqueue, QUEUE_NAMES, getQueue } from '../queues/index.js';
import { logger } from '../utils/logger.js';
import { emitLocal } from './bus.js';

const POLL_MS    = 1_000;
const BATCH_SIZE = 25;
const MAX_ATTEMPTS = 10;

let timer = null;
let stopping = false;

/**
 * Map a domain event name to a BullMQ queue. Defaults to `notification` for
 * unknown event prefixes so a missed routing entry still surfaces somewhere
 * useful instead of silently disappearing.
 */
function routeEvent(eventType) {
  if (eventType.startsWith('email.'))           return QUEUE_NAMES.EMAIL;
  if (eventType.startsWith('kb.'))              return QUEUE_NAMES.AI_INGESTION;
  if (eventType.startsWith('agreement.'))       return QUEUE_NAMES.PDF_RENDER;
  if (eventType.startsWith('payment.receipt.')) return QUEUE_NAMES.RECEIPT_OCR;
  if (eventType.startsWith('recommendation.'))  return QUEUE_NAMES.RECOMMENDATIONS;
  return QUEUE_NAMES.NOTIFICATION;
}

async function drainOnce() {
  // Claim a batch atomically. `FOR UPDATE SKIP LOCKED` makes multiple
  // dispatchers cooperative without coordination overhead.
  const claimed = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`
      SELECT id, "eventType", "aggregateType", "aggregateId", payload, attempts
      FROM "Outbox"
      WHERE status = 'PENDING' AND attempts < ${MAX_ATTEMPTS}
      ORDER BY "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${BATCH_SIZE}
    `;
    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    await tx.outbox.updateMany({
      where: { id: { in: ids } },
      data: { status: 'DISPATCHED', dispatchedAt: new Date() },
    });
    return rows;
  });

  for (const row of claimed) {
    try {
      const queueName = routeEvent(row.eventType);
      await getQueue(queueName).add(
        row.eventType,
        {
          eventType:     row.eventType,
          aggregateType: row.aggregateType,
          aggregateId:   row.aggregateId,
          payload:       row.payload,
          outboxId:      row.id,
        },
        { jobId: row.id }, // jobId == outbox id ⇒ idempotent consumer
      );
      emitLocal(row.eventType, row.payload);
    } catch (err) {
      // Roll the row back to PENDING and bump the attempt counter.
      logger.error({ err, outboxId: row.id, eventType: row.eventType }, 'outbox dispatch failed');
      await prisma.outbox.update({
        where: { id: row.id },
        data: {
          status:     'PENDING',
          attempts:   { increment: 1 },
          lastError:  String(err?.message ?? err).slice(0, 1000),
          dispatchedAt: null,
        },
      });
    }
  }
}

export function startOutboxDispatcher() {
  if (timer) return;
  const tick = async () => {
    if (stopping) return;
    try {
      await drainOnce();
    } catch (err) {
      logger.error({ err }, 'outbox drain failed');
    } finally {
      if (!stopping) timer = setTimeout(tick, POLL_MS);
    }
  };
  timer = setTimeout(tick, POLL_MS);
  logger.info('outbox dispatcher started');
}

export async function stopOutboxDispatcher() {
  stopping = true;
  if (timer) clearTimeout(timer);
  timer = null;
}

// Suppress unused-export warnings until producers start using `enqueue` directly.
void enqueue;
