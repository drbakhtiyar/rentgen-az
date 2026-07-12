-- AlterTable
ALTER TABLE "RentgenFile" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "purgeAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "RentgenFile_purgeAt_idx" ON "RentgenFile"("purgeAt");
