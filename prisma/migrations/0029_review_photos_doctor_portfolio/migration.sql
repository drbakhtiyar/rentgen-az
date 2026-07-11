-- AlterTable
ALTER TABLE "Review" ADD COLUMN "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN "portfolio" TEXT[] DEFAULT ARRAY[]::TEXT[];
