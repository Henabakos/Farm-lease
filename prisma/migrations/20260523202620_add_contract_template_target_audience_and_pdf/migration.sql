-- CreateEnum
CREATE TYPE "TemplateTargetAudience" AS ENUM ('FARMER', 'INVESTOR', 'BOTH');

-- CreateEnum
CREATE TYPE "TemplateContentType" AS ENUM ('MARKDOWN', 'PDF');

-- AlterTable
ALTER TABLE "ContractTemplate" ADD COLUMN     "targetAudience" "TemplateTargetAudience" NOT NULL DEFAULT 'BOTH';

-- AlterTable
ALTER TABLE "ContractTemplateVersion" ADD COLUMN     "contentType" "TemplateContentType" NOT NULL DEFAULT 'MARKDOWN',
ADD COLUMN     "pdfStorageKey" TEXT,
ALTER COLUMN "body" DROP NOT NULL;
