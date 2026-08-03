-- WhatsApp botunun redaktə olunan bilik bazası (admin: /admin/bot).
CREATE TABLE IF NOT EXISTS "BotSection" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BotSection_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "BotSection_order_idx" ON "BotSection"("order");
