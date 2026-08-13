/*
  Warnings:

  - You are about to drop the column `embedding` on the `CareerPath` table. All the data in the column will be lost.
  - You are about to drop the column `embedding` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `embedding` on the `Resume` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CareerPath" DROP COLUMN "embedding";

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "embedding";

-- AlterTable
ALTER TABLE "Resume" DROP COLUMN "embedding";

-- CreateTable
CREATE TABLE "Embedding" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "vector" vector,
    "dimension" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Embedding_entityType_entityId_idx" ON "Embedding"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Embedding_entityType_entityId_model_idx" ON "Embedding"("entityType", "entityId", "model");

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_resumeId_fkey" FOREIGN KEY ("entityId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_careerPathId_fkey" FOREIGN KEY ("entityId") REFERENCES "CareerPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_jobId_fkey" FOREIGN KEY ("entityId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
