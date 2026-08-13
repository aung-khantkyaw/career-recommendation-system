-- Remove deprecated career path market-metric fields.
ALTER TABLE "CareerPath"
  DROP COLUMN "jobOpenings",
  DROP COLUMN "growthRate";
