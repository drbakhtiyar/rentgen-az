-- CreateTable
CREATE TABLE "CenterHoliday" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CenterHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CenterHoliday_centerId_idx" ON "CenterHoliday"("centerId");

-- CreateIndex
CREATE UNIQUE INDEX "CenterHoliday_centerId_date_key" ON "CenterHoliday"("centerId", "date");

-- AddForeignKey
ALTER TABLE "CenterHoliday" ADD CONSTRAINT "CenterHoliday_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "CenterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
