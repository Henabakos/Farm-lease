-- CreateEnum
CREATE TYPE "ResourceCategory" AS ENUM ('INSURANCE', 'LABOR', 'SUPPORT');

-- CreateEnum
CREATE TYPE "CropType" AS ENUM ('MAIZE', 'SOYBEANS', 'COCOA', 'RICE', 'CASSAVA');

-- CreateTable
CREATE TABLE "Resource" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ResourceCategory" NOT NULL,
    "provider" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceRange" TEXT,
    "rating" DECIMAL(3,2) NOT NULL,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "cropTypes" "CropType"[],
    "imageUrl" TEXT,
    "contactEmail" TEXT,
    "websiteUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Resource_category_idx" ON "Resource"("category");

-- CreateIndex
CREATE INDEX "Resource_isActive_idx" ON "Resource"("isActive");
