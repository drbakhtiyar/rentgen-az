-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "DoctorProfile" ADD COLUMN "instagram" TEXT;
ALTER TABLE "DoctorProfile" ADD COLUMN "website" TEXT;
ALTER TABLE "DoctorProfile" ADD COLUMN "diplomaUrl" TEXT;
ALTER TABLE "DoctorProfile" ADD COLUMN "certificateUrl" TEXT;
