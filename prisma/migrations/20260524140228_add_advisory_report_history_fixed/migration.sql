-- CreateTable
CREATE TABLE "AdvisoryReport" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "clusterId" UUID NOT NULL,
    "focus" TEXT NOT NULL,
    "report" TEXT NOT NULL,
    "sourceCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvisoryReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdvisoryReport_userId_idx" ON "AdvisoryReport"("userId");

-- CreateIndex
CREATE INDEX "AdvisoryReport_clusterId_idx" ON "AdvisoryReport"("clusterId");

-- AddForeignKey
ALTER TABLE "AdvisoryReport" ADD CONSTRAINT "AdvisoryReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvisoryReport" ADD CONSTRAINT "AdvisoryReport_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "Cluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
