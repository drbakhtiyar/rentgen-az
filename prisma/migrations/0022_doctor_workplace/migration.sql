-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN "workplaceCenterId" TEXT;
ALTER TABLE "DoctorProfile" ADD COLUMN "workplaceStatus" TEXT;

-- CreateIndex
CREATE INDEX "DoctorProfile_workplaceCenterId_workplaceStatus_idx" ON "DoctorProfile"("workplaceCenterId", "workplaceStatus");

-- AddForeignKey
ALTER TABLE "DoctorProfile" ADD CONSTRAINT "DoctorProfile_workplaceCenterId_fkey" FOREIGN KEY ("workplaceCenterId") REFERENCES "CenterProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
