/*
  Warnings:

  - The `jobTitle` column on the `CareerRecommendation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `company` column on the `CareerRecommendation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `matchScore` column on the `CareerRecommendation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `description` column on the `CareerRecommendation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `skillsMatched` on the `CareerRecommendation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "CareerRecommendation_matchScore_idx";

-- AlterTable
ALTER TABLE "CareerRecommendation" DROP COLUMN "jobTitle",
ADD COLUMN     "jobTitle" TEXT[],
DROP COLUMN "company",
ADD COLUMN     "company" TEXT[],
DROP COLUMN "matchScore",
ADD COLUMN     "matchScore" DOUBLE PRECISION[],
DROP COLUMN "skillsMatched",
ADD COLUMN     "skillsMatched" JSONB NOT NULL,
DROP COLUMN "description",
ADD COLUMN     "description" TEXT[];
