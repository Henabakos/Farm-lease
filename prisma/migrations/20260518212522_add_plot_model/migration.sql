-- CreateEnum
CREATE TYPE "PlotStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "Plot" (
    "id" UUID NOT NULL,
    "clusterId" UUID NOT NULL,
    "location" TEXT NOT NULL,
    "size" DECIMAL(12,2) NOT NULL,
    "status" "PlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Plot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Plot_clusterId_idx" ON "Plot"("clusterId");

-- CreateIndex
CREATE INDEX "Plot_status_idx" ON "Plot"("status");

-- AddForeignKey
ALTER TABLE "Plot" ADD CONSTRAINT "Plot_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "Cluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
