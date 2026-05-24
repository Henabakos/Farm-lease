/*
  Warnings:

  - A unique constraint covering the columns `[user1Id,user2Id,context]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Conversation_user1Id_user2Id_context_relatedId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_user1Id_user2Id_context_key" ON "Conversation"("user1Id", "user2Id", "context");
