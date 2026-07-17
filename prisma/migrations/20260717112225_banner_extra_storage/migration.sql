-- AlterTable
ALTER TABLE "CenterProfile" ADD COLUMN     "extraStorageTb" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "extraStorageUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN     "bannerUrl" TEXT;
