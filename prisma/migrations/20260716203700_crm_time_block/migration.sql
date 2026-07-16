-- CreateTable
CREATE TABLE "CenterTimeBlock" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CenterTimeBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CenterTimeBlock_centerId_startAt_idx" ON "CenterTimeBlock"("centerId", "startAt");

-- AddForeignKey
ALTER TABLE "CenterTimeBlock" ADD CONSTRAINT "CenterTimeBlock_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "CenterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
