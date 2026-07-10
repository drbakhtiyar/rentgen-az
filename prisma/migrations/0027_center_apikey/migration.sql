-- AlterTable
ALTER TABLE "CenterProfile" ADD COLUMN "apiKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CenterProfile_apiKey_key" ON "CenterProfile"("apiKey");
