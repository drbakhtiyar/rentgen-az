-- Per-center FAQ answers
ALTER TABLE "CenterProfile" ADD COLUMN "faqAnswers" JSONB;

-- "Məlumat düzgün deyil?" content reports
CREATE TABLE "ContentReport" (
    "id" TEXT NOT NULL,
    "centerId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ContentReport_resolved_createdAt_idx" ON "ContentReport"("resolved", "createdAt");
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "CenterProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
