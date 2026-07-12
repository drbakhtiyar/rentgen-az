-- CreateTable
CREATE TABLE "SignupAttempt" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignupAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SignupAttempt_updatedAt_idx" ON "SignupAttempt"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SignupAttempt_phone_role_key" ON "SignupAttempt"("phone", "role");
