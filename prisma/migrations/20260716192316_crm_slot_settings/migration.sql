-- AlterTable
ALTER TABLE "CenterProfile" ADD COLUMN     "slotBookingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slotCapacity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "slotMinutes" INTEGER NOT NULL DEFAULT 30;
