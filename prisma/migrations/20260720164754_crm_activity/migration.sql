-- CreateTable
CREATE TABLE "CrmActivity" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "isAssistant" BOOLEAN NOT NULL DEFAULT false,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrmActivity_centerId_createdAt_idx" ON "CrmActivity"("centerId", "createdAt");

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "CenterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
