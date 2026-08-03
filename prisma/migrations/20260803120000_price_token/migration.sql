-- Qiymət toplama kampaniyası: /q/<token> linki üçün birdəfəlik token.
ALTER TABLE "CenterProfile" ADD COLUMN IF NOT EXISTS "priceToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "CenterProfile_priceToken_key" ON "CenterProfile"("priceToken");
