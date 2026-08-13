/*
  Warnings:

  - You are about to drop the column `company` on the `CareerRecommendation` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `CareerRecommendation` table. All the data in the column will be lost.
  - You are about to drop the column `jobTitle` on the `CareerRecommendation` table. All the data in the column will be lost.
  - The `skillsMatched` column on the `CareerRecommendation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `jobs` to the `CareerRecommendation` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `matchScore` on the `CareerRecommendation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "CareerRecommendation" DROP COLUMN "company",
DROP COLUMN "description",
DROP COLUMN "jobTitle",
ADD COLUMN     "jobs" JSONB NOT NULL,
DROP COLUMN "matchScore",
ADD COLUMN     "matchScore" DOUBLE PRECISION NOT NULL,
DROP COLUMN "skillsMatched",
ADD COLUMN     "skillsMatched" TEXT[];
