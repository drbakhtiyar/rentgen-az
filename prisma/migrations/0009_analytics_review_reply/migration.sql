-- AlterTable: review reply
ALTER TABLE "Review" ADD COLUMN "reply" TEXT;
ALTER TABLE "Review" ADD COLUMN "repliedAt" TIMESTAMP(3);

-- CreateTable: center analytics events
CREATE TABLE "CenterEvent" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CenterEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CenterEvent_centerId_type_createdAt_idx" ON "CenterEvent"("centerId", "type", "createdAt");
ALTER TABLE "CenterEvent" ADD CONSTRAINT "CenterEvent_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "CenterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
