CREATE TABLE "CareerPath" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requiredSkills" TEXT[],
    "softSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "roadmap" JSONB,
    "averageSalary" TEXT NOT NULL,
    "jobOpenings" INTEGER NOT NULL DEFAULT 0,
    "growthRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerPath_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CareerPath_title_key" ON "CareerPath"("title");
CREATE INDEX "CareerPath_category_idx" ON "CareerPath"("category");
CREATE INDEX "CareerPath_active_idx" ON "CareerPath"("active");
