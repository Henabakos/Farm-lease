// Notifications service.
//
// `create()` is the canonical entrypoint used by every other module
// (directly or via the realtime broadcaster reacting to outbox events).
// Idempotency is provided by the `dedupeKey` unique constraint on
// (recipientId, dedupeKey) — re-emitting the same notification updates the
// row instead of inserting a duplicate.
import { prisma } from '../../db/prisma.js';
import { ForbiddenError, NotFoundError } from '../../shared/errors.js';
import { paginate, paginated } from '../../shared/pagination.js';

function toDto(n) {
  return {
    id: n.id,
    type: (n.type ?? 'INFO').toUpperCase(),
    title: n.title,
    message: n.body ?? '',
    link: n.link ?? null,
    related_id: n.relatedId,
    related_type: n.relatedType,
    actor_id: n.actorId,
    read: n.isRead,
    read_at: n.readAt?.toISOString?.() ?? null,
    timestamp: n.createdAt.toISOString(),
  };
}

export async function create({ recipientId, actorId, type, title, body, link, relatedId, relatedType, dedupeKey }) {
  if (dedupeKey) {
    return prisma.notification.upsert({
      where: { recipientId_dedupeKey: { recipientId, dedupeKey } },
      update: { title, body, link, isRead: false, readAt: null },
      create: { recipientId, actorId, type: type ?? 'INFO', title, body, link, relatedId, relatedType, dedupeKey },
    });
  }
  return prisma.notification.create({
    data: { recipientId, actorId, type: type ?? 'INFO', title, body, link, relatedId, relatedType },
  });
}

export async function list({ page, pageSize, unread }, viewer) {
  const where = { recipientId: viewer.id, ...(unread ? { isRead: false } : {}) };
  const [rows, total] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, ...paginate({ page, pageSize }) }),
    prisma.notification.count({ where }),
  ]);
  return paginated(rows.map(toDto), total, { page, pageSize });
}

export async function unreadCount(viewer) {
  return { count: await prisma.notification.count({ where: { recipientId: viewer.id, isRead: false } }) };
}

export async function getById(id, viewer) {
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n) throw new NotFoundError();
  if (n.recipientId !== viewer.id) throw new ForbiddenError();
  return toDto(n);
}

export async function markRead(id, viewer) {
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n) throw new NotFoundError();
  if (n.recipientId !== viewer.id) throw new ForbiddenError();
  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });
  return toDto(updated);
}

export async function markAllRead(viewer) {
  const r = await prisma.notification.updateMany({
    where: { recipientId: viewer.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return { updated: r.count };
}

export async function remove(id, viewer) {
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n) throw new NotFoundError();
  if (n.recipientId !== viewer.id) throw new ForbiddenError();
  await prisma.notification.delete({ where: { id } });
  return { message: 'Deleted' };
}

export async function deleteAllRead(viewer) {
  const r = await prisma.notification.deleteMany({
    where: { recipientId: viewer.id, isRead: true },
  });
  return { deleted: r.count };
}
