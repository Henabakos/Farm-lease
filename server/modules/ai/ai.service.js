// ============================================================================
// AI / RAG service.
//
// Responsibilities:
//   • Knowledge-base CRUD (admin / cluster-rep scopes).
//   • Document upload (multipart) → stores raw bytes in object storage and
//     enqueues an ingestion job. Status transitions:
//         PENDING → PROCESSING → INDEXED        (happy path)
//                              ↘ FAILED        (extraction / embedding error)
//   • Document deletion: cascades to chunks (Prisma onDelete) and removes
//     the underlying object from storage.
//   • Vector retrieval over `KbChunk.embedding` (pgvector cosine).
//   • Chat: assemble retrieval context + system prompt → LlmPort.chat.
//
// Authorization summary (enforced here, not at the gateway):
//   • Manage KB / upload docs : AI_KB_MANAGE (admins + cluster reps).
//   • Read GLOBAL KB           : any authenticated user.
//   • Read CLUSTER KB          : cluster members + admin.
//   • Read USER  KB            : owner + admin.
//   • Chat                     : AI_CHAT (any authenticated user).
// ============================================================================

import { prisma } from '../../db/prisma.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors.js';
import { isAdmin } from '../../shared/scope.js';
import { paginate, paginated } from '../../shared/pagination.js';
import { buildKey, put, remove, signGet } from '../../integrations/storage/storage.js';
import { embed, chat } from '../../integrations/llm/index.js';
import { enqueue } from '../../queues/index.js';
import { recordOutbox } from '../../events/bus.js';
import { logger } from '../../utils/logger.js';

const KB_SCOPES = new Set(['GLOBAL', 'CLUSTER', 'USER']);

function kbDto(k) {
  if (!k) return null;
  return {
    id: k.id,
    name: k.name,
    scope: k.scope,
    owner_id: k.ownerId,
    cluster_id: k.clusterId,
    description: k.description ?? null,
    document_count: k._count?.documents ?? 0,
    created_at: k.createdAt?.toISOString?.() ?? k.createdAt,
    updated_at: k.updatedAt?.toISOString?.() ?? k.updatedAt,
  };
}

function docDto(d) {
  return {
    id: d.id,
    knowledge_base_id: d.knowledgeBaseId,
    title: d.title,
    source: d.source,
    source_url: d.sourceUrl,
    storage_key: d.storageKey,
    mime_type: d.mimeType,
    file_size: d.fileSize,
    status: d.status,
    error_message: d.errorMessage,
    chunk_count: d._count?.chunks ?? 0,
    metadata: d.metadata ?? {},
    created_at: d.createdAt.toISOString(),
    updated_at: d.updatedAt.toISOString(),
  };
}

async function canReadKb(kb, viewer) {
  if (isAdmin(viewer)) return true;
  if (kb.scope === 'GLOBAL') return true;
  if (kb.scope === 'USER')   return kb.ownerId === viewer.id;
  if (kb.scope === 'CLUSTER' && kb.clusterId) {
    const m = await prisma.clusterMembership.findUnique({
      where: { userId_clusterId: { userId: viewer.id, clusterId: kb.clusterId } },
      select: { isActive: true },
    });
    return Boolean(m?.isActive);
  }
  return false;
}

function canManageKb(kb, viewer) {
  if (isAdmin(viewer)) return true;
  if (kb.scope === 'USER' && kb.ownerId === viewer.id) return true;
  if (kb.scope === 'CLUSTER' && viewer.role === 'CLUSTER_REP') return true;
  return false;
}

// ---------------------------------------------------------------- KBs
export async function listKnowledgeBases({ page, pageSize }, viewer) {
  const visibility = isAdmin(viewer)
    ? {}
    : {
        OR: [
          { scope: 'GLOBAL' },
          { scope: 'USER', ownerId: viewer.id },
          { scope: 'CLUSTER', cluster: { memberships: { some: { userId: viewer.id, isActive: true } } } },
        ],
      };
  const [rows, total] = await Promise.all([
    prisma.knowledgeBase.findMany({
      where: visibility,
      include: { _count: { select: { documents: true } } },
      orderBy: { createdAt: 'desc' },
      ...paginate({ page, pageSize }),
    }),
    prisma.knowledgeBase.count({ where: visibility }),
  ]);
  return paginated(rows.map(kbDto), total, { page, pageSize });
}

export async function createKnowledgeBase(body, viewer) {
  const scope = body.scope ?? 'GLOBAL';
  if (!KB_SCOPES.has(scope)) throw new ValidationError('Invalid scope');
  if (scope === 'GLOBAL' && !isAdmin(viewer)) {
    throw new ForbiddenError('Only admin can create a GLOBAL knowledge base');
  }
  if (scope === 'CLUSTER' && !body.cluster_id) {
    throw new ValidationError('cluster_id required for CLUSTER scope');
  }
  const kb = await prisma.knowledgeBase.create({
    data: {
      name: body.name,
      scope,
      ownerId: scope === 'USER' ? viewer.id : null,
      clusterId: scope === 'CLUSTER' ? body.cluster_id : null,
      description: body.description ?? null,
    },
    include: { _count: { select: { documents: true } } },
  });
  return kbDto(kb);
}

export async function deleteKnowledgeBase(id, viewer) {
  const kb = await prisma.knowledgeBase.findUnique({ where: { id } });
  if (!kb) throw new NotFoundError();
  if (!canManageKb(kb, viewer)) throw new ForbiddenError();
  // Collect storage keys before cascade-delete so we can purge S3.
  const docs = await prisma.kbDocument.findMany({
    where: { knowledgeBaseId: id, storageKey: { not: null } },
    select: { storageKey: true },
  });
  await prisma.knowledgeBase.delete({ where: { id } });
  await Promise.allSettled(docs.map((d) => remove(d.storageKey).catch(() => {})));
  return { message: 'Knowledge base deleted' };
}

// ---------------------------------------------------------------- Documents
export async function listDocuments(kbId, { page, pageSize }, viewer) {
  const kb = await prisma.knowledgeBase.findUnique({ where: { id: kbId } });
  if (!kb) throw new NotFoundError();
  if (!(await canReadKb(kb, viewer))) throw new ForbiddenError();
  const where = { knowledgeBaseId: kbId };
  const [rows, total] = await Promise.all([
    prisma.kbDocument.findMany({
      where,
      include: { _count: { select: { chunks: true } } },
      orderBy: { createdAt: 'desc' },
      ...paginate({ page, pageSize }),
    }),
    prisma.kbDocument.count({ where }),
  ]);
  return paginated(rows.map(docDto), total, { page, pageSize });
}

export async function uploadDocument({ kbId, file, title, sourceUrl }, viewer) {
  const kb = await prisma.knowledgeBase.findUnique({ where: { id: kbId } });
  if (!kb) throw new NotFoundError('Knowledge base not found');
  if (!canManageKb(kb, viewer)) throw new ForbiddenError();
  if (!file && !sourceUrl) throw new ValidationError('Either a file or sourceUrl is required');

  let storageKey = null;
  let mimeType = null;
  let fileSize = null;
  if (file) {
    storageKey = buildKey(`kb/${kbId}`, file.originalname);
    await put({ key: storageKey, body: file.buffer, contentType: file.mimetype });
    mimeType = file.mimetype;
    fileSize = file.size;
  }

  const doc = await prisma.$transaction(async (tx) => {
    const created = await tx.kbDocument.create({
      data: {
        knowledgeBaseId: kbId,
        source: file ? 'UPLOAD' : 'URL',
        sourceUrl: sourceUrl ?? null,
        storageKey,
        title: title ?? file?.originalname ?? sourceUrl ?? 'Untitled',
        mimeType,
        fileSize,
        status: 'PENDING',
        metadata: { uploaderId: viewer.id },
      },
    });
    await recordOutbox(tx, {
      eventType: 'kb.document.uploaded',
      aggregateType: 'KbDocument',
      aggregateId: created.id,
      payload: { documentId: created.id, knowledgeBaseId: kbId },
    });
    return created;
  });

  // Enqueue ingestion in addition to the outbox so dev iteration is fast
  // (no need to wait for the dispatcher tick).
  await enqueue.aiIngestion({ documentId: doc.id }).catch((err) =>
    logger.warn({ err, documentId: doc.id }, 'failed to enqueue immediate ingestion; outbox will retry'),
  );

  return docDto(doc);
}

export async function deleteDocument(docId, viewer) {
  const doc = await prisma.kbDocument.findUnique({
    where: { id: docId },
    include: { knowledgeBase: true },
  });
  if (!doc) throw new NotFoundError();
  if (!canManageKb(doc.knowledgeBase, viewer)) throw new ForbiddenError();
  if (doc.storageKey) await remove(doc.storageKey).catch(() => {});
  await prisma.kbDocument.delete({ where: { id: docId } });
  return { message: 'Document deleted' };
}

export async function getDocumentDownloadUrl(docId, viewer) {
  const doc = await prisma.kbDocument.findUnique({
    where: { id: docId },
    include: { knowledgeBase: true },
  });
  if (!doc) throw new NotFoundError();
  if (!(await canReadKb(doc.knowledgeBase, viewer))) throw new ForbiddenError();
  if (!doc.storageKey) throw new ValidationError('Document has no storage object');
  const url = await signGet({ key: doc.storageKey, expiresIn: 600 });
  return { url, expires_in: 600 };
}

// ---------------------------------------------------------------- Retrieval
/**
 * Cosine-similarity retrieval over pgvector. We pass the embedding as a JSON
 * array literal — pgvector accepts the `[...]::vector` cast natively.
 */
export async function retrieve({ query, knowledgeBaseIds, topK = 6 }, viewer) {
  if (!query || !query.trim()) return [];
  const [queryVec] = await embed([query]);
  if (!queryVec) return [];
  const vecLiteral = `[${queryVec.join(',')}]`;

  // Resolve which KBs the viewer can read; intersect with the optional filter.
  const accessibleKbIds = await accessibleKbIdsFor(viewer);
  let kbIds = accessibleKbIds;
  if (Array.isArray(knowledgeBaseIds) && knowledgeBaseIds.length > 0) {
    kbIds = accessibleKbIds.filter((id) => knowledgeBaseIds.includes(id));
  }
  if (kbIds.length === 0) return [];

  // `<=>` is pgvector's cosine-distance operator (0 = identical, 2 = opposite).
  const rows = await prisma.$queryRawUnsafe(
    `
    SELECT c.id, c."documentId", c."chunkIndex", c.content, c.metadata,
           1 - (c.embedding <=> $1::vector) AS similarity
    FROM "KbChunk" c
    JOIN "KbDocument" d ON d.id = c."documentId"
    WHERE d."knowledgeBaseId" = ANY($2::uuid[])
      AND d.status = 'INDEXED'
      AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> $1::vector ASC
    LIMIT $3
    `,
    vecLiteral,
    kbIds,
    Math.max(1, Math.min(20, topK)),
  );
  return rows;
}

async function accessibleKbIdsFor(viewer) {
  if (isAdmin(viewer)) {
    const rows = await prisma.knowledgeBase.findMany({ select: { id: true } });
    return rows.map((r) => r.id);
  }
  const rows = await prisma.knowledgeBase.findMany({
    where: {
      OR: [
        { scope: 'GLOBAL' },
        { scope: 'USER', ownerId: viewer.id },
        { scope: 'CLUSTER', cluster: { memberships: { some: { userId: viewer.id, isActive: true } } } },
      ],
    },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

// ---------------------------------------------------------------- Chat
const SYSTEM_PROMPT = `You are Farm Lease's professional agricultural investment assistant.
You answer questions about lease proposals, agreements, payments, cluster operations,
and general agronomy. Be concise, data-driven, and cite sources from the provided
context when relevant. If the answer is not in the provided context, say so and
suggest who to contact. Use markdown for formatting.`;

export async function answerChat({ chatId, message, knowledgeBaseIds }, viewer) {
  // 1. Persist user message + retrieve history.
  const chatRow = chatId
    ? await prisma.aiChat.findUnique({
        where: { id: chatId },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
      })
    : await prisma.aiChat.create({
        data: { userId: viewer.id, title: message.slice(0, 80) },
        include: { messages: true },
      });
  if (!chatRow) throw new NotFoundError('Chat not found');
  if (chatRow.userId !== viewer.id && !isAdmin(viewer)) throw new ForbiddenError();

  await prisma.aiChatMessage.create({
    data: { chatId: chatRow.id, role: 'USER', content: message },
  });

  // 2. Retrieve context chunks.
  const chunks = await retrieve({ query: message, knowledgeBaseIds, topK: 6 }, viewer);
  const context = chunks
    .map((c, i) => `[Source ${i + 1}]\n${c.content}`)
    .join('\n\n---\n\n');

  // 3. Build prompt: system + last N turns + retrieved context + new question.
  const history = chatRow.messages.map((m) => ({
    role: m.role.toLowerCase(),
    content: m.content,
  }));
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(context ? [{ role: 'system', content: `Context:\n${context}` }] : []),
    ...history,
    { role: 'user', content: message },
  ];

  // 4. Call the LLM.
  let answer = '';
  try {
    const res = await chat(messages, { temperature: 0.2, maxTokens: 1024 });
    answer = res.content || '';
  } catch (err) {
    logger.error({ err }, 'LLM chat failed');
    answer = "I'm unable to reach the AI service right now. Please try again shortly.";
  }

  const citations = chunks.map((c, i) => ({
    index: i + 1,
    document_id: c.documentId,
    chunk_id: c.id,
    similarity: Number(c.similarity ?? 0).toFixed(3),
    snippet: String(c.content).slice(0, 220),
  }));

  // 5. Persist assistant message.
  const saved = await prisma.aiChatMessage.create({
    data: {
      chatId: chatRow.id,
      role: 'ASSISTANT',
      content: answer,
      citations,
    },
  });

  return {
    chat_id: chatRow.id,
    message_id: saved.id,
    role: 'assistant',
    content: answer,
    citations,
    created_at: saved.createdAt.toISOString(),
  };
}

export async function getChatHistory(chatId, viewer) {
  const c = await prisma.aiChat.findUnique({
    where: { id: chatId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!c) throw new NotFoundError();
  if (c.userId !== viewer.id && !isAdmin(viewer)) throw new ForbiddenError();
  return {
    id: c.id,
    title: c.title,
    messages: c.messages.map((m) => ({
      id: m.id,
      role: m.role.toLowerCase(),
      content: m.content,
      citations: m.citations ?? [],
      created_at: m.createdAt.toISOString(),
    })),
  };
}

export async function listMyChats(viewer) {
  const rows = await prisma.aiChat.findMany({
    where: { userId: viewer.id },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
  return rows.map((c) => ({
    id: c.id,
    title: c.title,
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
  }));
}
