-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "KbDocumentChunk" ADD COLUMN     "embedding" vector(768);
