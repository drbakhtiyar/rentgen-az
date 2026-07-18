-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ASSISTANT';

-- CreateTable
CREATE TABLE "CenterAssistant" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CenterAssistant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CenterAssistant_userId_key" ON "CenterAssistant"("userId");

-- CreateIndex
CREATE INDEX "CenterAssistant_centerId_idx" ON "CenterAssistant"("centerId");

-- AddForeignKey
ALTER TABLE "CenterAssistant" ADD CONSTRAINT "CenterAssistant_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "CenterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CenterAssistant" ADD CONSTRAINT "CenterAssistant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
