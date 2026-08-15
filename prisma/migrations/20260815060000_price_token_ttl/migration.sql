-- Girişsiz token müddəti (2026-08-14 auditi). Mövcud tokenlərə "indi" verilir
-- ki, heç bir aktiv dəvət sınmasın — müddət bu andan başlayır.
ALTER TABLE "CenterProfile" ADD COLUMN IF NOT EXISTS "priceTokenAt" TIMESTAMP(3);
UPDATE "CenterProfile" SET "priceTokenAt" = NOW() WHERE "priceToken" IS NOT NULL AND "priceTokenAt" IS NULL;
