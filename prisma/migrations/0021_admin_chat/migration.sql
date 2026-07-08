-- CreateTable
CREATE TABLE "AdminThread" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userReadAt" TIMESTAMP(3),
    "adminReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "fromAdmin" BOOLEAN NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminThread_userId_key" ON "AdminThread"("userId");
CREATE INDEX "AdminThread_lastMessageAt_idx" ON "AdminThread"("lastMessageAt");
CREATE INDEX "AdminMessage_threadId_createdAt_idx" ON "AdminMessage"("threadId", "createdAt");

-- AddForeignKey
ALTER TABLE "AdminThread" ADD CONSTRAINT "AdminThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminMessage" ADD CONSTRAINT "AdminMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "AdminThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
