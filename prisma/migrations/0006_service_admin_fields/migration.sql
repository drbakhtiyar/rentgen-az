-- AlterTable
ALTER TABLE "Service" ADD COLUMN "iconUrl" TEXT;
ALTER TABLE "Service" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
