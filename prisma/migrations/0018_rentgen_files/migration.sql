-- CreateTable
CREATE TABLE "RentgenFile" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "contentType" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RentgenFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fileId" TEXT,
    "requestId" TEXT,
    "userId" TEXT,
    "role" TEXT,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FileAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RentgenFile_key_key" ON "RentgenFile"("key");
CREATE INDEX "RentgenFile_requestId_idx" ON "RentgenFile"("requestId");
CREATE INDEX "FileAuditLog_requestId_idx" ON "FileAuditLog"("requestId");
CREATE INDEX "FileAuditLog_userId_idx" ON "FileAuditLog"("userId");

-- AddForeignKey
ALTER TABLE "RentgenFile" ADD CONSTRAINT "RentgenFile_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AppointmentRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
