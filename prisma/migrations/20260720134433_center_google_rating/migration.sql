-- AlterTable
ALTER TABLE "CenterProfile" ADD COLUMN     "googlePlaceId" TEXT,
ADD COLUMN     "googleRating" DOUBLE PRECISION,
ADD COLUMN     "googleRatingAt" TIMESTAMP(3),
ADD COLUMN     "googleReviewCount" INTEGER;
