-- AlterTable
ALTER TABLE "CenterProfile" ADD COLUMN     "lunchDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "lunchEnd" TEXT,
ADD COLUMN     "lunchStart" TEXT;
