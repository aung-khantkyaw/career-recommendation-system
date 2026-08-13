/*
  Warnings:

  - You are about to drop the column `entityId` on the `Embedding` table. All the data in the column will be lost.
  - You are about to drop the column `entityType` on the `Embedding` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[resumeId]` on the table `Embedding` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[careerPathId]` on the table `Embedding` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[jobId]` on the table `Embedding` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Embedding" DROP CONSTRAINT "Embedding_careerPathId_fkey";

-- DropForeignKey
ALTER TABLE "Embedding" DROP CONSTRAINT "Embedding_jobId_fkey";

-- DropForeignKey
ALTER TABLE "Embedding" DROP CONSTRAINT "Embedding_resumeId_fkey";

-- DropIndex
DROP INDEX "Embedding_entityType_entityId_idx";

-- DropIndex
DROP INDEX "Embedding_entityType_entityId_model_idx";

-- AlterTable
ALTER TABLE "Embedding" DROP COLUMN "entityId",
DROP COLUMN "entityType",
ADD COLUMN     "careerPathId" TEXT,
ADD COLUMN     "jobId" TEXT,
ADD COLUMN     "resumeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Embedding_resumeId_key" ON "Embedding"("resumeId");

-- CreateIndex
CREATE UNIQUE INDEX "Embedding_careerPathId_key" ON "Embedding"("careerPathId");

-- CreateIndex
CREATE UNIQUE INDEX "Embedding_jobId_key" ON "Embedding"("jobId");

-- CreateIndex
CREATE INDEX "Embedding_resumeId_idx" ON "Embedding"("resumeId");

-- CreateIndex
CREATE INDEX "Embedding_careerPathId_idx" ON "Embedding"("careerPathId");

-- CreateIndex
CREATE INDEX "Embedding_jobId_idx" ON "Embedding"("jobId");

-- CreateIndex
CREATE INDEX "Embedding_model_idx" ON "Embedding"("model");

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_careerPathId_fkey" FOREIGN KEY ("careerPathId") REFERENCES "CareerPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
