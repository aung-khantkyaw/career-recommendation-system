/*
  Warnings:

  - A unique constraint covering the columns `[skillId]` on the table `Embedding` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Embedding" ADD COLUMN     "skillId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Embedding_skillId_key" ON "Embedding"("skillId");

-- CreateIndex
CREATE INDEX "Embedding_skillId_idx" ON "Embedding"("skillId");

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
