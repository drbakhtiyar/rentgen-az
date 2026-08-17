-- Mərkəz e-poçtu (2026-08-17) — ictimai kartda göstərilir, kliki izlənir.
ALTER TABLE "CenterProfile" ADD COLUMN IF NOT EXISTS "email" TEXT;
