// ============================================================================
// AI ingestion worker.
//
// For each KbDocument job:
//   1. Load row, mark PROCESSING.
//   2. Fetch raw bytes (storage or URL).
//   3. Extract text (mime-aware).
//   4. Chunk + batch-embed.
//   5. Persist chunks with vectors in a single transaction.
//   6. Mark INDEXED (or FAILED + error message).
//
// Heavy / unreliable work (LLM API calls, large PDFs) lives here so the API
// request path stays fast and the job retries automatically on failure with
// BullMQ's exponential backoff.
//
// Vector writes go through `$executeRawUnsafe` because Prisma cannot express
// the pgvector `vector` type natively; everything else uses the typed client.
// ============================================================================

import { prisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';
import { getBuffer } from '../integrations/storage/storage.js';
import { embed } from '../integrations/llm/index.js';
import { extractText, chunkText } from '../modules/ai/extract.js';

const BATCH_EMBED_SIZE = 32;

export async function processAiIngestion(job) {
  const documentId = job.data?.documentId ?? job.data?.payload?.documentId;
  if (!documentId) return { skipped: true };

  const doc = await prisma.kbDocument.findUnique({ where: { id: documentId } });
  if (!doc) return { skipped: true, reason: 'document_missing' };
  if (doc.status === 'INDEXED') return { skipped: true, reason: 'already_indexed' };

  await prisma.kbDocument.update({ where: { id: documentId }, data: { status: 'PROCESSING' } });

  try {
    // 1. Fetch source bytes ------------------------------------------------
    let buffer;
    if (doc.source === 'UPLOAD' && doc.storageKey) {
      buffer = await getBuffer(doc.storageKey);
    } else if (doc.source === 'URL' && doc.sourceUrl) {
      const res = await fetch(doc.sourceUrl, { redirect: 'follow' });
      if (!res.ok) throw new Error(`URL fetch failed: ${res.status}`);
      const ab = await res.arrayBuffer();
      buffer = Buffer.from(ab);
    } else {
      throw new Error('Document has no fetchable source');
    }

    // 2. Extract text ------------------------------------------------------
    const text = await extractText({
      buffer,
      mimeType: doc.mimeType ?? 'text/plain',
      fileName: doc.title,
    });
    if (!text || !text.trim()) throw new Error('Extracted text is empty');

    // 3. Chunk -------------------------------------------------------------
    const chunks = chunkText(text, { chunkSize: 1200, overlap: 200 });
    if (chunks.length === 0) throw new Error('No chunks produced');

    // Sanitize chunks to remove null bytes (0x00) which PostgreSQL rejects
    const sanitizedChunks = chunks.map(chunk => chunk.replace(/\x00/g, ''));

    // 4. Embed in batches --------------------------------------------------
    const embeddings = [];
    for (let i = 0; i < sanitizedChunks.length; i += BATCH_EMBED_SIZE) {
      const batch = sanitizedChunks.slice(i, i + BATCH_EMBED_SIZE);
      const vecs = await embed(batch);
      embeddings.push(...vecs);
    }
    if (embeddings.length !== sanitizedChunks.length) {
      throw new Error(`Embedding count mismatch (${embeddings.length} vs ${sanitizedChunks.length})`);
    }

    // 5. Persist chunks + vectors -----------------------------------------
    // We do this in two passes inside a transaction: the typed Prisma client
    // for the row metadata, then $executeRaw for the vector column.
    await prisma.$transaction(async (tx) => {
      await tx.kbDocumentChunk.deleteMany({ where: { documentId } }); // idempotent re-indexing
      // First create rows without the vector (cheap), capture ids.
      const created = await Promise.all(
        sanitizedChunks.map((content, idx) =>
          tx.kbDocumentChunk.create({
            data: { documentId, chunkIndex: idx, content, tokenCount: Math.ceil(content.length / 4) },
            select: { id: true },
          }),
        ),
      );
      // Then bulk-update the vectors. The cast `::vector` is what tells
      // pgvector how to interpret the JSON array literal.
      for (let i = 0; i < created.length; i++) {
        const vecLiteral = `[${embeddings[i].join(',')}]`;
        await tx.$executeRawUnsafe(
          `UPDATE "KbDocumentChunk" SET embedding = $1::vector WHERE id = $2::uuid`,
          vecLiteral,
          created[i].id,
        );
      }
      await tx.kbDocument.update({
        where: { id: documentId },
        data: { status: 'INDEXED', errorMessage: null },
      });
    });

    logger.info({ documentId, chunks: sanitizedChunks.length }, 'document indexed');
    return { ok: true, chunks: sanitizedChunks.length };
  } catch (err) {
    logger.error({ err, documentId }, 'ingestion failed');
    await prisma.kbDocument.update({
      where: { id: documentId },
      data: { status: 'FAILED', errorMessage: String(err?.message ?? err).slice(0, 1000) },
    });
    throw err; // bubble up so BullMQ retries
  }
}
