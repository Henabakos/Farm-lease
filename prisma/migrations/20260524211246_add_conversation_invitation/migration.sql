-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "ConversationInvitation" (
    "id" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "message" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ConversationInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConversationInvitation_receiverId_status_idx" ON "ConversationInvitation"("receiverId", "status");

-- CreateIndex
CREATE INDEX "ConversationInvitation_senderId_status_idx" ON "ConversationInvitation"("senderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationInvitation_senderId_receiverId_key" ON "ConversationInvitation"("senderId", "receiverId");

-- AddForeignKey
ALTER TABLE "ConversationInvitation" ADD CONSTRAINT "ConversationInvitation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationInvitation" ADD CONSTRAINT "ConversationInvitation_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
