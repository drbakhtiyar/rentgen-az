# PROJECT_STATUS

**Project:** rentgen.az — Azerbaijan's dental/medical radiology marketplace (centers, doctors, patients).
**Live:** https://rentgen.az (Vercel, auto-deploy from `main`). CRM subdomain: https://crm.rentgen.az.
**Repo:** github.com/drbakhtiyar/rentgen-az (public). **Stack:** Next.js 16.2.9 (App Router, React 19.2, TS, Turbopack) + Prisma 7 + Supabase Postgres (PRO plan, project `yunonkioubsvozqmezvp`).
**Companion mobile app:** built in Rork (SwiftUI/iOS) — see `ARCHITECTURE.md` §Mobile.

> Read `ARCHITECTURE.md`, `API.md`, `DATABASE.md`, `DECISIONS.md`, `TODO.md` alongside this. Language of the product & UI copy: **Azerbaijani** (RU partially). Admin panel is AZ-only by choice.

---

## Overall status: LIVE and in active development

The web platform is production-live and used by real centers/doctors/patients. The mobile app (doctor MVP) is functionally complete and end-to-end verified; the center MVP is in progress.

## Roles (enum `Role`): PATIENT · CENTER · DOCTOR · ASSISTANT · ADMIN
- Multi-role: one phone/account can be patient + center + doctor simultaneously (role picked at login tab). `ASSISTANT` is a shared role for center-assistants and doctor-assistants (resolved dynamically).

## Completed / live features

**Public site:** center directory (`/rentgen-merkezleri`), doctor directory (`/hekimler`), full services catalog (`/xidmetler`, 112 services / 15 categories, modality-aware SEO), packages/pricing (`/paketler`), blog, FAQ, contact, patient booking form (with occupancy-aware real slots + type-ahead service/doctor inputs for guests).

**Auth:** phone + OTP (SMS via Lsim.az), role tabs (Pasiyent/Mərkəz/Həkim) on `/giris`; admin via secret link `/admin-giris/<ADMIN_ACCESS_KEY>` (+ optional email 2FA). Session = JWT cookie (`rx_session`), shared across `.rentgen.az`. `User.sessionVersion` embedded in token → bump invalidates all tokens (used on assistant removal/deactivation).

**Center panel** (`/merkez/*`): profile (hours, services, address, **Google rating** connect), patients/requests (status flow NEW→CONTACTED→COMPLETED/CANCELLED), rentgen file upload (B2), services & prices (category-grouped + search), partner doctors, reviews, package/balance (Payriff card payments), trash bin, export.

**CRM** (`crm.rentgen.az`, PLATINUM-only): Bugün, Təqvim (Day/3-day/Week/Month, drag-reschedule, time blocks, lunch, holidays), Pasiyentlər (manual add + file upload synced with center panel), SMS-lər (balance, packages 1000=60₼/5000=280₼/10000=500₼, campaigns, reminders), Ayarlar (slot booking, assistant management max 1), Söhbətlər (partner+admin chat + AI helper), Jurnal (owner-only activity log). Mobile: 3-day calendar view, hamburger nav.

**Doctor panel** (`/hekim/*`): referrals overview, patients + results, partner centers, chat, notifications, profile (+ assistant management max 1), package/balance. Doctor QR referral.

**Assistants** (center + doctor): OTP-added (max 1 each), phone-only CRM login / main-site tab login; day-to-day work only; owner-gated settings/SMS/billing; "you are X's assistant" banner; dedicated `/admin/asistentler`; hard session revocation on removal. Full audit `#1–#7` closed (see DECISIONS).

**Admin panel** (`/admin/*`): centers, doctors, patients, requests (status+center filters), reviews (center-name autocomplete + date filters), referrals, partnerships, blog, payments, services, SMS, params, journal, incomplete-signups, assistants, AI helper, chats.

**Monetization pipeline:** Payriff live (Merchant ES1097669, APPROVED=paid); wallet ledger; plan auto-downgrade cron; SMS credits sold from platform Lsim pool (reserve 1000). CRM = Platinum feature.

**AI Yardımçı** (panels): Anthropic Haiku 4.5 system Q&A helper, inside Söhbətlər/chat. Needs Anthropic account credit.

**DICOM viewer** (`/viewer/[fileId]`): MPR/measure/implant tools — **PRE-LAUNCH gated to Dr. Bakhtiyar only** (`src/lib/viewer-access.ts`), waiting for reference images for the 4th quadrant.

**Google rating:** centers connect a Place ID/name → cached rating shown on their page; daily cron refresh. **Needs `GOOGLE_PLACES_API_KEY` env to activate.**

**Mobile app (`/api/app/*` bridge):** doctor MVP complete (login via whoami+OTP, referral with patient OTP, patient list w/ status filter + files). Center MVP in progress (endpoints ready, Rork building screens).

## Known gaps / not done (see TODO.md for full list)
- Mobile: result file Bax/Endir opens site (files return `url:null`); no push notifications; Worker endpoints unauthenticated beyond obscure URL (token hardening deferred).
- RU translation of panel UIs (admin/center/doctor/patient) — deferred by user.
- DICOM viewer 4th quadrant + public launch pending.

## Waiting on external input (blocked-pending)
- `GOOGLE_PLACES_API_KEY` (Google rating) — user to create.
- Anthropic credit top-up (AI helper) — cheap.
- Apple Developer ($99/yr) + Google Play ($25) accounts for app store submission.

## Critical operational notes
- **Same Supabase DB powers site + mobile app.** Never reset the DB password without updating Vercel `DATABASE_URL` + `DIRECT_URL` (else the live site 500s). Supabase `pg_pgrst_no_exposed_schemas` 503 logs are harmless (PostgREST/Data API is unused).
- Deploy = push to `main` (Vercel). Migrations: `npm run db:migrate:dev -- --name X`.
- User directives (persistent): **always commit & push every change; don't ask for small decisions, act; never delete without asking; touch only what's requested.**
