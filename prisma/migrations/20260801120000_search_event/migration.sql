-- Aggregate-only search analytics (top of the discovery funnel).
CREATE TABLE "SearchEvent" (
    "id" TEXT NOT NULL,
    "query" TEXT,
    "city" TEXT,
    "service" TEXT,
    "results" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SearchEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SearchEvent_createdAt_idx" ON "SearchEvent"("createdAt");
