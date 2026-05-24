-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "deletedAt" TIMESTAMPTZ;

-- CreateIndex
CREATE INDEX "Payment_deletedAt_idx" ON "Payment"("deletedAt");
