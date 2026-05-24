-- Run this AFTER `prisma migrate dev --name init` to create the pgvector
-- index used by KbDocumentChunk similarity searches. Prisma can't model `vector`
-- indexes declaratively, so we manage this with raw SQL.
--
-- Apply with:
--   psql $DATABASE_URL -f prisma/sql/pgvector_index.sql
--
-- Notes:
--   • Using basic vector_cosine_ops index for compatibility
--   • Vector dimensions: 768 for nomic-embed-text-v1.5, 1536 for OpenAI text-embedding-3-small
--   • When switching providers, you must re-index all embeddings with the correct dimension.

CREATE INDEX IF NOT EXISTS kb_document_chunk_embedding_cosine_idx
  ON "KbDocumentChunk"
  USING gin (embedding vector_cosine_ops);
