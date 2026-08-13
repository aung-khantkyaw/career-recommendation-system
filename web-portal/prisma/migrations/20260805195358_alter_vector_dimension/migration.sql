-- Alter CareerPath table
ALTER TABLE "CareerPath" ALTER COLUMN "embedding" TYPE vector USING "embedding"::vector;

-- Alter Job table
ALTER TABLE "Job" ALTER COLUMN "embedding" TYPE vector USING "embedding"::vector;

-- Alter Resume table
ALTER TABLE "Resume" ALTER COLUMN "embedding" TYPE vector USING "embedding"::vector;