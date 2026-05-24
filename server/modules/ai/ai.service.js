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
//   • Vector retrieval over `KbDocumentChunk.embedding` (pgvector cosine).
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
export async function retrieve({ query, knowledgeBaseIds, topK = 10 }, viewer) {
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
           kb.name AS "kbName",
           1 - (c.embedding <=> $1::vector) AS similarity
    FROM "KbDocumentChunk" c
    JOIN "KbDocument" d ON d.id = c."documentId"
    JOIN "KnowledgeBase" kb ON kb.id = d."knowledgeBaseId"
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
Your task is to answer user questions about investments, lease proposals, agreements, payments, cluster operations, and agronomy based on the provided technical documentation.

INSTRUCTIONS:
- Answer ONLY based on the provided context chunks.
- If the answer is not found in the context, state that you do not have enough information based on the documents. Do not hallucinate or use external knowledge.
- Reference your sources clearly in your response (e.g., "According to Source 1...").
- Keep your tone professional, concise, and data-driven.`;

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
  logger.debug({ message, knowledgeBaseIds }, 'Retrieving chunks for chat');
  const chunks = await retrieve({ query: message, knowledgeBaseIds, topK: 8 }, viewer);
  logger.debug({ count: chunks.length }, 'Chunks retrieved');
  const context = chunks
    .map((c, i) => `--- SOURCE ${i + 1} (From Knowledge Base: ${c.kbName}) ---\n${c.content}`)
    .join('\n\n');

  // 3. Build prompt: system (instructions + context) + history + new question.
  const history = chatRow.messages.map((m) => ({
    role: m.role.toLowerCase(),
    content: m.content,
  }));
  const messages = [
    { 
      role: 'system', 
      content: `${SYSTEM_PROMPT}\n\n${context ? `### CONTEXT:\n${context}` : 'No relevant document context found.'}`
    },
    ...history,
    { role: 'user', content: message },
  ];

  // 4. Call the LLM.
  let answer = '';
  try {
    logger.debug({ messages }, 'Sending request to LLM');
    const res = await chat(messages, { temperature: 0.2, maxTokens: 1024 });
    logger.debug({ res }, 'Received response from LLM');
    answer = res.content || '';
  } catch (err) {
    logger.error({ err }, 'LLM chat failed');
    answer = "I'm unable to reach the AI service right now. Please try again shortly.";
  }

  const citations = chunks.map((c, i) => ({
    index: i + 1,
    document_id: c.documentId,
    kb_name: c.kbName,
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

/**
 * Generate AI-powered insights or recommendations for a user (e.g. an investor)
 * based on the Knowledge Base content.
 */
export async function getAiInsights({ userId, topic, knowledgeBaseIds }, viewer) {
  const query = topic || 'investment opportunities and risk analysis';
  const chunks = await retrieve({ query, knowledgeBaseIds, topK: 10 }, viewer);
  
  if (chunks.length === 0) {
    return { 
      insights: "No relevant documents found in the selected knowledge bases to generate insights.",
      data_driven: false 
    };
  }

  const context = chunks.map((c, i) => `--- SOURCE ${i + 1} (KB: ${c.kbName}) ---\n${c.content}`).join('\n\n');
  const messages = [
    { 
      role: 'system', 
      content: `You are an expert Agricultural Investment Analyst. 
      Analyze the provided documents and provide a structured risk and opportunity assessment.
      Structure:
      1. Key Opportunities
      2. Risk Assessment
      3. Strategic Recommendations` 
    },
    { role: 'user', content: `Analyze the following context for: ${query}\n\nRELEVANT DOCUMENT CONTEXT:\n${context}` }
  ];

  try {
    const res = await chat(messages, { temperature: 0.1, maxTokens: 1500 });
    return {
      topic: query,
      insights: res.content,
      source_count: chunks.length,
      data_driven: true
    };
  } catch (err) {
    logger.error({ err }, 'AI insights failed');
    throw new Error('Failed to generate AI insights');
  }
}

/**
 * Perform semantic analysis for analytics data.
 */
export async function analyzeLeaseTrends({ knowledgeBaseIds }, viewer) {
  const query = "economic trends, lease rates, soil health impacts, and market conditions";
  const chunks = await retrieve({ query, knowledgeBaseIds, topK: 8 }, viewer);
  
  const context = chunks.map((c, i) => `--- SOURCE ${i + 1} (KB: ${c.kbName}) ---\n${c.content}`).join('\n\n');
  const messages = [
    { 
      role: 'system', 
      content: 'You are a Data Scientist specializing in Agriculture. Summarize key lease and market trends from the metadata and documents.' 
    },
    { role: 'user', content: `Summarize trends based on this context:\n\n${context}` }
  ];

  const res = await chat(messages, { temperature: 0.3 });
  return { trends: res.content };
}

/**
 * Generates an investment advisory report for a specific cluster.
 * @param {Object} params
 * @param {string} params.clusterId
 * @param {string} params.focus - The user's focus (e.g., ROI, Sustainability, Crop Type)
 * @param {string[]} [params.knowledgeBaseIds]
 * @param {Object} viewer
 */
export async function getAdvisoryReport({ clusterId, focus, knowledgeBaseIds }, viewer) {
  // 1. Fetch Cluster Data
  const cluster = await prisma.cluster.findUnique({
    where: { id: clusterId },
    include: {
      agreements: {
        where: { status: 'ACTIVE' },
        select: { totalAmount: true, startDate: true, endDate: true }
      },
      proposals: {
        where: { status: 'PUBLISHED' },
        select: { proposedAmount: true }
      },
      _count: { select: { memberships: { where: { isActive: true } }, plots: true } }
    }
  });

  if (!cluster) throw new NotFoundError('Cluster not found');

  // 2. Prepare Context from Knowledge Base
  const searchResult = await retrieve(
    { query: focus, knowledgeBaseIds, topK: 5 },
    viewer
  );
  const kbContext = searchResult.map((c, i) => `--- SOURCE ${i + 1} (KB: ${c.kbName}) ---\n${c.content}`).join('\n\n');

  // 3. Prepare Cluster Context
  const activeCapital = cluster.agreements.reduce((sum, a) => sum + Number(a.totalAmount), 0);
  const pendingCapital = cluster.proposals.reduce((sum, p) => sum + Number(p.proposedAmount), 0);
  
  const clusterData = `
    Cluster Name: ${cluster.name}
    Location: ${cluster.location} (${cluster.region || 'Unknown Region'})
    Area: ${cluster.areaHectares || 0} hectares
    Active Investment: ${activeCapital}
    Pending Proposals: ${pendingCapital}
    Active Members: ${cluster._count.memberships}
    Total Plots: ${cluster._count.plots}
    Description: ${cluster.description || 'No description provided.'}
  `;

  // 4. Prompt LLM
  const messages = [
    {
      role: 'system',
      content: `You are an AI Agricultural Investment Advisor. 
      Your goal is to analyze a specific Farm Cluster and provide a "Best-Fit Business Model" based on the user's focus.
      
      User Focus: ${focus}
      
      Requirements:
      - Use the Cluster Stats and the Knowledge Base segments provided.
      - Calculate potential ROI or scalability if data allows.
      - Propose a specific crop rotation or business strategy.
      - Format your response in Markdown with the following headers:
        # Investment Report: [Cluster Name]
        ## Strategic Fit
        ## Estimated Financial Performance
        ## Recommended Strategy
        ## Risk Mitigation`
    },
    {
      role: 'user',
      content: `Cluster Data:\n${clusterData}\n\nSupporting Technical Knowledge:\n${kbContext || 'No relevant knowledge base segments found.'}`
    }
  ];

  try {
    const res = await chat(messages, { temperature: 0.2, maxTokens: 2000 });
    const reportContent = res.content;

    // 5. Save to database history
    const savedReport = await prisma.advisoryReport.create({
      data: {
        userId: viewer.id,
        clusterId,
        focus,
        report: reportContent,
        sourceCount: searchResult.length
      }
    });

    return {
      id: savedReport.id,
      cluster_id: clusterId,
      focus,
      report: reportContent,
      stats: {
        activeCapital,
        pendingCapital,
        area: cluster.areaHectares
      },
      source_count: searchResult.length,
      timestamp: savedReport.createdAt
    };
  } catch (err) {
    logger.error({ err, clusterId }, 'Advisory report generation failed');
    throw new Error('Could not generate advisory report');
  }
}

/**
 * Lists history of advisory reports for a cluster.
 */
export async function listAdvisoryHistory(clusterId, viewer) {
  return await prisma.advisoryReport.findMany({
    where: { clusterId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Generates predictive analytics for a hypothetical investment.
 */
export async function getPredictiveAnalytics({ landSize, budget, region, knowledgeBaseIds }, viewer) {
  // 1. Retrieve technical context for the region and general agricultural trends
  const query = `Agricultural yield and ROI for ${region} region with ${landSize} hectares and ${budget} USD budget.`;
  const chunks = await retrieve({ query, knowledgeBaseIds, topK: 5 }, viewer);
  const context = chunks.map((c, i) => `--- SOURCE ${i + 1} (KB: ${c.kbName}) ---\n${c.content}`).join('\n\n');

  // 2. Build precision prompt for JSON output
  const messages = [
    {
      role: 'system',
      content: `You are a Precise Agricultural Data Scientist. 
      Based on the provided context and inputs, calculate realistic predictive metrics.
      Return ONLY a JSON object with these exact keys:
      {
        "yield": number, 
        "roi": number, 
        "cost": number, 
        "confidence": number, 
        "risks": string[],
        "reasoning": string 
      }
      Yield in tons, ROI in percentage, cost in USD, confidence 0-100.`
    },
    {
      role: 'user',
      content: `Inputs: Land Size: ${landSize}ha, Budget: $${budget}, Region: ${region}.
      Technical Context:
      ${context || 'No specific regional data found. Use general agricultural models.'}`
    }
  ];

  try {
    const res = await chat(messages, { temperature: 0.1, responseFormat: { type: 'json_object' } });
    const prediction = JSON.parse(res.content);
    return {
      ...prediction,
      landSize,
      budget,
      region,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    logger.error({ err }, 'Predictive analytics failed');
    // Fallback if AI fails or doesn't return JSON
    return {
      yield: Math.round(landSize * 45),
      roi: 15,
      cost: budget * 0.8,
      confidence: 70,
      risks: ['Market Volatility'],
      reasoning: 'Fallback calculation used due to processing error.'
    };
  }
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
