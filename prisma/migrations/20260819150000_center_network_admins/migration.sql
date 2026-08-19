-- Şəbəkə idarəetməsi (2026-08-19): mərkəz admini + super admin (şəbəkə rəhbəri).
ALTER TABLE "CenterProfile" ADD COLUMN IF NOT EXISTS "adminPhone" TEXT;
ALTER TABLE "CenterProfile" ADD COLUMN IF NOT EXISTS "adminName" TEXT;
ALTER TABLE "CenterProfile" ADD COLUMN IF NOT EXISTS "superAdminPhone" TEXT;
ALTER TABLE "CenterProfile" ADD COLUMN IF NOT EXISTS "superAdminName" TEXT;
CREATE INDEX IF NOT EXISTS "CenterProfile_adminPhone_idx" ON "CenterProfile"("adminPhone");
CREATE INDEX IF NOT EXISTS "CenterProfile_superAdminPhone_idx" ON "CenterProfile"("superAdminPhone");
