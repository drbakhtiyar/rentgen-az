-- CreateTable
CREATE TABLE "DoctorEvent" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DoctorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DoctorEvent_doctorId_type_createdAt_idx" ON "DoctorEvent"("doctorId", "type", "createdAt");

-- AddForeignKey
ALTER TABLE "DoctorEvent" ADD CONSTRAINT "DoctorEvent_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
