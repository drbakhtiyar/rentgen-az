-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'SILVER', 'GOLD', 'PLATINUM');

-- AlterTable
ALTER TABLE "CenterProfile"
  ADD COLUMN "bannerUrl" TEXT,
  ADD COLUMN "plan" "Plan" NOT NULL DEFAULT 'FREE',
  ADD COLUMN "planUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DoctorProfile"
  ADD COLUMN "plan" "Plan" NOT NULL DEFAULT 'FREE',
  ADD COLUMN "planUntil" TIMESTAMP(3);
