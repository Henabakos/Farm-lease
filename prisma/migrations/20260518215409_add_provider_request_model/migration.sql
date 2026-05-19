-- CreateEnum
CREATE TYPE "ProviderRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ProviderRequest" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "companyName" TEXT NOT NULL,
    "serviceType" "ResourceCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "status" "ProviderRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMPTZ,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ProviderRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderRequest_userId_idx" ON "ProviderRequest"("userId");

-- CreateIndex
CREATE INDEX "ProviderRequest_status_idx" ON "ProviderRequest"("status");

-- AddForeignKey
ALTER TABLE "ProviderRequest" ADD CONSTRAINT "ProviderRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
