-- Sürət limiti sayğacı (2026-08-14 təhlükəsizlik auditi)
CREATE TABLE IF NOT EXISTS "RateLimit" (
  "id" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RateLimit_bucket_key" ON "RateLimit"("bucket");
CREATE INDEX IF NOT EXISTS "RateLimit_expiresAt_idx" ON "RateLimit"("expiresAt");
