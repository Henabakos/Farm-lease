-- Run this AFTER `prisma migrate dev --name init` to create the pgvector
-- index used by KbChunk similarity searches. Prisma can't model `vector`
-- indexes declaratively, so we manage this with raw SQL.
--
-- Apply with:
--   psql $DATABASE_URL -f prisma/sql/pgvector_index.sql
--
-- Notes:
--   • ivfflat is a good default for <1M vectors with `lists = floor(sqrt(N))`.
--   • Reindex after large bulk loads for best recall (see `REINDEX INDEX`).

CREATE INDEX IF NOT EXISTS kb_chunk_embedding_cosine_idx
  ON "KbChunk"
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
