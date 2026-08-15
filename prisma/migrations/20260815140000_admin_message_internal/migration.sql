-- Daxili izləmə qeydləri (2026-08-15): mərkəz/həkim öz panelində 👀/✅
-- qeydlərini görməməlidir. Mövcud qeydlər də daxili kimi işarələnir.
ALTER TABLE "AdminMessage" ADD COLUMN IF NOT EXISTS "internal" BOOLEAN NOT NULL DEFAULT false;
UPDATE "AdminMessage" SET "internal" = true WHERE "content" LIKE '👀%' OR "content" LIKE '✅%' OR "content" LIKE '⚠️%';
