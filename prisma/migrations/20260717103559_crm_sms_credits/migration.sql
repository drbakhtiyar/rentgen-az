-- AlterTable
ALTER TABLE "AppointmentRequest" ADD COLUMN     "reminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CenterProfile" ADD COLUMN     "reminderHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "remindersEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smsBalance" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SmsLog" ADD COLUMN     "centerId" TEXT;

-- CreateTable
CREATE TABLE "CenterSmsCredit" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CenterSmsCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CenterSmsOrder" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "CenterSmsOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CenterSmsCredit_centerId_idx" ON "CenterSmsCredit"("centerId");

-- CreateIndex
CREATE INDEX "CenterSmsOrder_centerId_idx" ON "CenterSmsOrder"("centerId");

-- CreateIndex
CREATE INDEX "CenterSmsOrder_status_idx" ON "CenterSmsOrder"("status");

-- CreateIndex
CREATE INDEX "AppointmentRequest_preferredDate_idx" ON "AppointmentRequest"("preferredDate");

-- CreateIndex
CREATE INDEX "SmsLog_centerId_idx" ON "SmsLog"("centerId");

-- AddForeignKey
ALTER TABLE "CenterSmsCredit" ADD CONSTRAINT "CenterSmsCredit_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "CenterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CenterSmsOrder" ADD CONSTRAINT "CenterSmsOrder_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "CenterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
