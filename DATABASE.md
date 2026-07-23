# DATABASE

**Postgres on Supabase** (project `yunonkioubsvozqmezvp`, PRO plan, SMALL compute). Accessed **only via Prisma 7** (direct connection, PrismaPg pooled adapter in `src/lib/db.ts`) — PostgREST/Data API is unused (the recurring `pg_pgrst_no_exposed_schemas` 503 in Supabase logs is therefore harmless). **The same DB backs the live site and the mobile app.**

Schema: `prisma/schema.prisma` (single file). Client generated to `src/generated/prisma` → import from `@/generated/prisma/client` + `@/generated/prisma/enums`. Migrations: `prisma/migrations/*` (48). Apply: `npm run db:migrate:dev -- --name <x>`. **Never reset the DB password without updating Vercel `DATABASE_URL` + `DIRECT_URL` in the same step**, or the site 500s.

## Conventions
- IDs: `cuid()`. Money: **minor units** (qəpik, `Int` — 2000 = 20.00 AZN). Times: `DateTime` UTC, computed/displayed in **Asia/Baku**.
- Phone: canonical `+994XXXXXXXXX` on `User.phone` (`@unique`); match tolerance = last 9 digits (`nationalDigits`).
- Soft-delete/trash on files (`deletedAt`/`purgeAt`), moderation flags on reviews (`hidden`/`flagged`).

## Enums
- `Role`: PATIENT · CENTER · DOCTOR · ASSISTANT · ADMIN
- `CenterStatus`: PENDING · APPROVED · DEACTIVATED (also reused by `DoctorProfile.status`)
- `RequestStatus`: NEW · CONTACTED · COMPLETED · CANCELLED (AppointmentRequest lifecycle)
- `ReferralStatus`: NEW · CONTACTED · COMPLETED (legacy `Referral` model)
- `Plan`: FREE · SILVER · GOLD · PLATINUM
- `PartnerStatus`: PENDING · ACCEPTED · REJECTED (center↔doctor partnership)

## Models (41)

### Identity & money
- **User** — phone (unique, normalized), role, isBlocked, **`sessionVersion`** (bumped to invalidate all JWTs — assistant removal/block), locale, lastLoginAt. 1:1 to profile models below.
- **Wallet** / **WalletLedger** — prepaid coin balance (qəpik); ledger `type` TOPUP|PLAN|REFUND|ADMIN.
- **Payment** — Payriff payments; amount in qəpik; `paymentStatus` APPROVED = paid.
- **AdminThread** / **AdminMessage** — admin ↔ user (center/doctor) chat, one thread per user, read cursors.
- **Notification** — in-app notifications (bell); polling.

### Profiles
- **PatientProfile** — patient details, favorites (→ centers), reviews.
- **CenterProfile** — the big one. name/slug/phone/address/city/geo, structured `hours` (Json) + human `workingHours`, equipment, logo/license/images/banner, `status`, `plan`+`planUntil`+`planExpiredAt`, `apiKey` (Platinum), **Google rating** (`googlePlaceId`/`googleRating`/`googleReviewCount`/`googleRatingAt`), `extraStorageTb`+`extraStorageUntil` (sold storage blocks), **CRM slot settings** (`slotBookingEnabled`/`slotMinutes`/`slotCapacity`/lunch/reminders), `smsBalance` (CRM SMS credits). Relations: services, requests, reviews, doctorPartners, conversations, assistants, holidays, timeBlocks, crmActivities, smsCredits/Orders, workplaceDoctors.
- **DoctorProfile** — name, clinic, `specializations[]`, city, photo/banner, socials, documents, `status`, `onboarded` (false = QR draft), **workplace** (`workplaceCenterId`+`workplaceStatus` PENDING|ACCEPTED|REJECTED), plan.

### Assistants (max 1 each; ASSISTANT role resolved dynamically)
- **CenterAssistant** — links a User (assistant) to a CenterProfile. `User.assistantOf`.
- **DoctorAssistant** — links a User to a DoctorProfile. `User.doctorAssistantOf`.

### Services catalog
- **Service** — global taxonomy (112 services / 15 categories): slug, name, shortName, description, icon/iconUrl, category, order, featured, isActive.
- **CenterService** — a center's offering of a Service: `price`/`priceTo` (AZN), `durationMin` (CRM slot blocking). Unique (centerId, serviceId). *The app catalog shows only Services that appear here.*

### Requests, referrals, files
- **AppointmentRequest** — the core booking/referral row. patient?/center?/doctor? (all SetNull), `name`/`phone`, `serviceSlug`, note, `preferredDate`, **`status`** (RequestStatus), `completedBy` (CENTER|PATIENT), `patientUpdated`, `resultUrl` (legacy), `reminderSentAt` (CRM dedup), files[]. **Mobile referrals create these rows.**
- **Referral** — older lightweight referral (doctorName/clinic/phone, examType, center?). Distinct from AppointmentRequest.
- **RentgenFile** — B2 file metadata only (bytes live in Backblaze). `key` (unique B2 object key), fileName, size, contentType, uploadedById, **trash** (`deletedAt`/`deletedById`/`purgeAt` — cron purges). Belongs to a request.
- **FileAuditLog** — UPLOAD|DOWNLOAD|DELETE audit (medical data: who/when/what).

### Reviews, partnerships, comms
- **Review** — 1..5 rating + 5 sub-scores, comment, photos, `verified`, `hidden`/`flagged` (moderation), center `reply`, `source` appointment|qr. Unique (centerId, patientId).
- **CenterDoctor** — center↔doctor partnership (PartnerStatus). Unique (centerId, doctorId).
- **Conversation** / **Message** — center↔doctor 1:1 chat (polling); Message has senderRole CENTER|DOCTOR, optional file.

### CRM & SMS
- **CenterHoliday**, **CenterTimeBlock** — CRM calendar blocks (holidays, lunch, manual blocks).
- **CrmActivity** — CRM activity/journal log (owner-only Jurnal).
- **CenterSmsCredit** (GRANT|PURCHASE top-ups), **CenterSmsOrder** (package order → admin confirms → balance loaded). Spend is recorded per-send in **SmsLog** (`kind` otp|center_request|patient_status|reminder|other, `centerId` if CRM SMS, `provider` lsim|dev). Platform SMS (OTP, request notify) don't touch center balance.

### Auth & misc
- **OTPCode** — phone, `codeHash` (sha256(code+secret)), expiresAt, consumed, attempts, ip.
- **SignupAttempt** / **WaitlistSignup** — incomplete signups / waitlist.
- **CenterEvent** / **DoctorEvent** — view analytics.
- **BlogPost**, **City**, **SeoSetting**, **AdminActionLog** — content, geo, SEO, admin audit.

> When in doubt, `prisma/schema.prisma` is the source of truth — every model carries AZ comments explaining intent.
