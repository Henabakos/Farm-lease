-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN     "reviewedAt" TIMESTAMPTZ,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Proposal_version_idx" ON "Proposal"("version");
