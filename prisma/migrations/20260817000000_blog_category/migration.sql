-- Bloq kateqoriyası (2026-08-17): slug bazada, adlar kodda (AZ+RU).
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "category" TEXT;
