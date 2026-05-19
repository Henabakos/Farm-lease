// ============================================================================
// Domain event bus.
//
// Two delivery modes:
//   1. In-process (synchronous): services may subscribe via `on(eventType, handler)`
//      to react inside the same request (e.g. update unread counters before
//      the response returns). Failures here will fail the request.
//
//   2. Transactional outbox (asynchronous): services that need to perform
//      side-effects across processes (send email, run AI ingestion, broadcast
//      via Socket.IO) MUST call `recordOutbox(tx, event)` inside the same
//      Prisma transaction as the state change. The outbox dispatcher worker
//      polls `Outbox` rows and enqueues them onto BullMQ, guaranteeing
//      at-least-once delivery (no lost events if the API crashes after commit).
//
// Why outbox instead of "emit then enqueue":
//   • If we enqueue then commit fails → ghost job referencing nonexistent row.
//   • If we commit then enqueue and the process crashes → lost event.
//   • Writing the event row inside the same DB tx solves both atomically.
// ============================================================================

import { EventEmitter } from 'node:events';
import { logger } from '../utils/logger.js';

const emitter = new EventEmitter();
emitter.setMaxListeners(100);

/** Subscribe to an in-process domain event. */
export function on(eventType, handler) {
  const wrapped = (payload) => {
    Promise.resolve(handler(payload)).catch((err) =>
      logger.error({ err, eventType }, 'in-process event handler failed'),
    );
  };
  emitter.on(eventType, wrapped);
  return () => emitter.off(eventType, wrapped);
}

/** Synchronously fan out an in-process event. Fire-and-forget for subscribers. */
export function emitLocal(eventType, payload) {
  emitter.emit(eventType, payload);
}

/**
 * Write a domain event into the transactional outbox.
 * MUST be called with the transaction's Prisma client (`tx`) so the row is
 * committed atomically with the originating state change.
 *
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @param {{
 *   eventType: string,
 *   aggregateType: string,
 *   aggregateId: string,
 *   payload: Record<string, unknown>
 * }} event
 */
export async function recordOutbox(tx, event) {
  await tx.outbox.create({
    data: {
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      payload: event.payload,
    },
  });
}

/**
 * Convenience: do both in a single transaction.
 *   await publish(prisma, { eventType, aggregateType, aggregateId, payload, work })
 *   where `work(tx)` performs the state change.
 */
export async function publish(prisma, { eventType, aggregateType, aggregateId, payload, work }) {
  return prisma.$transaction(async (tx) => {
    const result = await work?.(tx);
    await recordOutbox(tx, { eventType, aggregateType, aggregateId, payload });
    // Synchronous in-process emission happens AFTER commit (see below).
    process.nextTick(() => emitLocal(eventType, payload));
    return result;
  });
}
