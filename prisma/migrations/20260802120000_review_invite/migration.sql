-- Rəy dəvəti: müayinə tamamlandıqdan sonra pasiyentə birdəfəlik link ilə SMS.
-- İdempotent saxlanılır (bax DATABASE.md — prod-a scripts-tmp ilə tətbiq olunur).
ALTER TABLE "AppointmentRequest" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
ALTER TABLE "AppointmentRequest" ADD COLUMN IF NOT EXISTS "reviewInviteSentAt" TIMESTAMP(3);
ALTER TABLE "AppointmentRequest" ADD COLUMN IF NOT EXISTS "reviewToken" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "AppointmentRequest_reviewToken_key"
  ON "AppointmentRequest"("reviewToken");
CREATE INDEX IF NOT EXISTS "AppointmentRequest_reviewInviteSentAt_idx"
  ON "AppointmentRequest"("reviewInviteSentAt");
