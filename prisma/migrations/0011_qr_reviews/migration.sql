-- AlterTable: walk-in (QR) review fields + auto-moderation
ALTER TABLE "Review" ADD COLUMN "flagged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Review" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'appointment';
ALTER TABLE "Review" ADD COLUMN "scoreService" INTEGER;
ALTER TABLE "Review" ADD COLUMN "scoreStaff" INTEGER;
ALTER TABLE "Review" ADD COLUMN "scoreClean" INTEGER;
ALTER TABLE "Review" ADD COLUMN "scoreWait" INTEGER;
ALTER TABLE "Review" ADD COLUMN "scorePrice" INTEGER;
ALTER TABLE "Review" ADD COLUMN "doctorId" TEXT;
ALTER TABLE "Review" ADD COLUMN "doctorName" TEXT;

-- CreateIndex
CREATE INDEX "Review_flagged_idx" ON "Review"("flagged");
