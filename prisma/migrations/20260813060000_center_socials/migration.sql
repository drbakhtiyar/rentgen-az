-- Mərkəz sosial linkləri (2026-08-13): ictimai səhifədə göstərmək + klik izləmək üçün
ALTER TABLE "CenterProfile" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "CenterProfile" ADD COLUMN IF NOT EXISTS "instagram" TEXT;
