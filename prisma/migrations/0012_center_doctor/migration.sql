-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "CenterDoctor" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CenterDoctor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CenterDoctor_centerId_doctorId_key" ON "CenterDoctor"("centerId", "doctorId");
CREATE INDEX "CenterDoctor_centerId_status_idx" ON "CenterDoctor"("centerId", "status");
CREATE INDEX "CenterDoctor_doctorId_status_idx" ON "CenterDoctor"("doctorId", "status");
ALTER TABLE "CenterDoctor" ADD CONSTRAINT "CenterDoctor_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "CenterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CenterDoctor" ADD CONSTRAINT "CenterDoctor_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
