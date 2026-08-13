-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "processingStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Skill_processingStatus_idx" ON "Skill"("processingStatus");
