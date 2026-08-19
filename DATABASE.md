# DATABASE

**Postgres on Supabase** (project `yunonkioubsvozqmezvp`, PRO plan, SMALL compute). Accessed **only via Prisma 7** (direct connection, PrismaPg pooled adapter in `src/lib/db.ts`) — PostgREST/Data API is unused (the recurring `pg_pgrst_no_exposed_schemas` 503 in Supabase logs is therefore harmless). **The same DB backs the live site and the mobile app.**

Schema: `prisma/schema.prisma` (single file). Client generated to `src/generated/prisma` → import from `@/generated/prisma/client` + `@/generated/prisma/enums`. Migrations: `prisma/migrations/*` (51; newest `20260801140000_center_landline`, `..._center_faq_reports`, `..._search_event`, `..._operator_role`). Apply: `npm run db:migrate:dev -- --name <x>`. **Never reset the DB password without updating Vercel `DATABASE_URL` + `DIRECT_URL` in the same step**, or the site 500s.

> **Applying a migration on prod:** the datasource block has no `url` (driver-adapter setup), so a raw `prisma migrate deploy` may not connect. The 2026-08 `landlinePhone` column was applied by running the `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` via a `scripts-tmp` PrismaPg script **and** recording the row in `_prisma_migrations` (id + sha256 checksum of the migration.sql) so history stays consistent. Keep migration SQL idempotent.

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

## Models (42)

### Identity & money
- **User** — phone (unique, normalized), role, isBlocked, **`sessionVersion`** (bumped to invalidate all JWTs — assistant removal/block), locale, lastLoginAt. 1:1 to profile models below.
- **Wallet** / **WalletLedger** — prepaid coin balance (qəpik); ledger `type` TOPUP|PLAN|REFUND|ADMIN.
- **Payment** — Payriff payments; amount in qəpik; `paymentStatus` APPROVED = paid.
- **AdminThread** / **AdminMessage** — admin ↔ user (center/doctor) chat, one thread per user, read cursors. **`AdminMessage.internal`** (2026-08-15, miqrasiya `20260815140000_admin_message_internal`) — DAXİLİ qeyd: WhatsApp güzgüsü (📲/🤖), körpü cavabı, ⚠️ xəbərdarlıq, 👀/✅ link izləməsi, 🔇 bot-susma qeydi. **`true` olanlar istifadəçinin öz panelində GÖRÜNMÜR** (yalnız admin/operator). Yeni güzgü/sistem mesajı yazanda MÜTLƏQ `internal: true`; yeni istifadəçi-tərəfli sorğuya `internal: false` filtri.
- **Notification** — in-app notifications (bell); polling.

### Profiles
- **PatientProfile** — patient details, favorites (→ centers), reviews.
- **CenterProfile** — the big one. `city` **yalnız şəhər** saxlayır, rayon `district`-dədir
  (2026-08-02 normallaşdırması — ictimai filtr `city` üzrə dəqiq bərabərlik axtarır).
  name/slug/phone/`whatsapp`/**`landlinePhone`** (2nd/city
  number, kept when a mobile takes over `phone` for OTP)/address/city/district/geo (`lat`/`lng`/
  `mapsUrl`), structured `hours` (Json `{mon:{open,close}|null,...}`) + human `workingHours`,
  equipment, logo/license/images[]/banner, `status`, `plan`+`planUntil`+`planExpiredAt`,
  `apiKey` (Platinum), **Google rating** (`googlePlaceId`/`googleRating`/`googleReviewCount`/
  `googleRatingAt`), `faqAnswers` (Json), `extraStorageTb`+`extraStorageUntil` (sold storage
  blocks), **CRM slot settings** (`slotBookingEnabled`/`slotMinutes`/`slotCapacity`/lunch/
  reminders), `smsBalance` (CRM SMS credits). Relations: services, requests, reviews,
  doctorPartners, conversations, assistants, holidays, timeBlocks, crmActivities,
  smsCredits/Orders, workplaceDoctors. Written via `src/lib/center-write.ts` `saveCenterLoose`
  (never-rejects create/edit; placeholder `User.phone` = `placeholder:<uuid>` for owner-less
  bulk centers; extracts coords from a pasted Google Maps link).
- **DoctorProfile** — name, clinic, `specializations[]`, city, photo/banner, socials, documents, `status`, `onboarded` (false = QR draft), **workplace** (`workplaceCenterId`+`workplaceStatus` PENDING|ACCEPTED|REJECTED), plan.

### Assistants (max 1 each; ASSISTANT role resolved dynamically)
- **CenterAssistant** — links a User (assistant) to a CenterProfile. `User.assistantOf`.
- **DoctorAssistant** — links a User to a DoctorProfile. `User.doctorAssistantOf`.

### Services catalog
- **Service** — global taxonomy (112 services / 15 categories): slug, name, shortName, description, icon/iconUrl, category, order, featured, isActive.
- **CenterService** — a center's offering of a Service: `price`/`priceTo` (AZN), `durationMin` (CRM slot blocking). Unique (centerId, serviceId). *The app catalog shows only Services that appear here.*

### Requests, referrals, files
- **AppointmentRequest** — the core booking/referral row. patient?/center?/doctor? (all SetNull), `name`/`phone`, `serviceSlug`, note, `preferredDate`, **`status`** (RequestStatus), `completedBy` (CENTER|PATIENT), `patientUpdated`, `resultUrl` (legacy), `reminderSentAt` (CRM dedup), **`completedAt`** (status COMPLETED olan an — 5 yolun hamısında yazılır), **`reviewInviteSentAt`** + **`reviewToken`** (rəy dəvəti dedup + link tokeni, bax `src/lib/review-invite.ts`), files[]. **Mobile referrals create these rows.**
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
- **PushToken** — mobile push tokens. Token = **raw APNs hex** (native iOS build); Expo
  `ExponentPushToken[...]` da qəbul edilir (köhnə uyğunluq). `token` unique, `platform`
  ios|android, → User (Cascade). Hər `notifyUser` **birbaşa Apple APNs**-ə push göndərir
  (`src/lib/push.ts`, HTTP/2 + ES256 JWT); APNs rədd etdiyi tokenlər avtomatik silinir.
  `/api/app/push/register` ilə qeydiyyat. **`APNS_*` env gələnə qədər passivdir.**
- **SignupAttempt** / **WaitlistSignup** — incomplete signups / waitlist.
- **CenterEvent** / **DoctorEvent** — view analytics.
- **BlogPost**, **City**, **SeoSetting**, **AdminActionLog** — content, geo, SEO, admin audit.
  BlogPost: `slug` unique **per-locale deyil, qlobal** — AZ və RU yazıların slugları
  FƏRQLİDİR (`locale` "az"|"ru"); `content` markdown (`##` H2), `coverImage` Vercel Blob
  URL (yeni seriya `blog-covers/<slug>-v2.webp`, brend vektor üslub — bax DECISIONS).
  AdminActionLog həm audit, həm əməliyyat sayğacıdır (məs. `center:wa_price_invite`
  gündəlik WhatsApp limitini hesablayır; `center:price_self` — mərkəzin /q özü-yazması).
- **BotSection** (2026-08-04) — WhatsApp botunun redaktə olunan bilik bazası: `title`,
  `content`, `order`, `isActive`. `/admin/bot`-dan idarə olunur; sərt qaydalar kodda
  (`src/lib/wa-bot.ts` `HARD_RULES`).

**WhatsApp qeydi (2026-08-12):** naməlum nömrədən WhatsApp yazışması gələndə
webhook `User`-i telefonla upsert edir (role PATIENT) — hər WA söhbətinin
AdminThread-i olsun deyə. Bu istifadəçilər real qeydiyyat deyil, çat kimliyidir.

**Sahə əlavələri:** `CenterProfile.priceToken` (`@unique`, girişsiz /q qiymət
formu tokeni), `AppointmentRequest.completedAt`/`reviewInviteSentAt`/`reviewToken`
(rəy dəvəti axını — bax `src/lib/review-invite.ts`).

### 2026-08-13/15 miqrasiyaları (4)
- **`20260813060000_center_socials`** — `CenterProfile.website` + `.instagram`
  (ictimai səhifədə göstərilir, klikləri `CenterEvent`-ə yazılır).
- **`20260814080000_rate_limit`** — **`RateLimit`** cədvəli: sürət limiti bucket-i
  (`key` unique = `<ad>:<subyekt>:<pəncərəId>`, `count`, `expiresAt`). Upsert ilə
  artırılır (1 DB əməliyyatı), **fail-open** (DB xətası istifadəçini bloklamır),
  cron təmizləyir. İşlədən modul: `src/lib/rate-limit.ts`.
- **`20260815060000_price_token_ttl`** — `CenterProfile.priceTokenAt`: token
  verilmə vaxtı. TTL **45 gün** (`PRICE_TOKEN_TTL_DAYS`); müddəti bitmiş token
  dəvət göndəriləndə avtomatik yenilənir (`ensurePriceToken`).
- **`20260815140000_admin_message_internal`** — `AdminMessage.internal` (yuxarıda).

### 2026-08-17/19 miqrasiyaları (3)
- **`20260817000000_blog_category`** — `BlogPost.category` (slug; adlar
  `src/lib/blog-categories.ts`-də AZ+RU).
- **`20260817120000_center_email`** — `CenterProfile.email` (ictimai mailto,
  kliki CenterEvent «email» tipi).
- **`20260819150000_center_network_admins`** — `CenterProfile.adminPhone/
  adminName/superAdminPhone/superAdminName` (+2 index). Şəbəkə girişi:
  `centersManagedByPhone()` (acting.ts); seçim cookie `rx_center`.
- Qeyd: `Service` «3d-tomoqrafiya» `isActive=false` (2026-08-16); 9 yeni
  xidmət slug-ları: said-sumukleri-rentgeni, yasti-pencelik-rentgeni,
  turk-yeheri-rentgeni, irriqoskopiya, dos-qefesi-rentgenoskopiyasi,
  ginekoloji-usm, uroloji-usm, limfa-duyunleri-usm, yumsaq-toxuma-usm.

> **Statistika:** ayrıca cədvəl YOXDUR — hər şey mövcud **`CenterEvent`**
> üzərində qurulub. 2026-08-13-də `type` dəyərləri genişləndi: `view`, `call`,
> `whatsapp` + **`directions`, `license`, `faq`, `website`, `instagram`**.
> `/merkez/statistika` və `/admin/merkez-statistika` bunu `groupBy` ilə oxuyur.

> When in doubt, `prisma/schema.prisma` is the source of truth — every model carries AZ comments explaining intent.
