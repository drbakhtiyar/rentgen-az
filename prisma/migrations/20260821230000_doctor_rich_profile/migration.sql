-- Həkim profili zənginləşdirmə (2026-08-21): təcrübə ili + strukturlu təhsil/
-- kurs/karyera/ekspertiza siyahıları (e-hekim.az təhlilindən sonra istifadəçi qərarı)
ALTER TABLE "DoctorProfile" ADD COLUMN IF NOT EXISTS "careerStartYear" INTEGER;
ALTER TABLE "DoctorProfile" ADD COLUMN IF NOT EXISTS "education" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "DoctorProfile" ADD COLUMN IF NOT EXISTS "courses" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "DoctorProfile" ADD COLUMN IF NOT EXISTS "workHistory" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "DoctorProfile" ADD COLUMN IF NOT EXISTS "expertise" TEXT[] NOT NULL DEFAULT '{}';
