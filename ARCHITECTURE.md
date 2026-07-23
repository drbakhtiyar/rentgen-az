# ARCHITECTURE

## Stack
- **Next.js 16.2.9** (App Router, React 19.2, TypeScript, **Turbopack** default). Async request APIs (`cookies()`, `headers()`, `params`, `searchParams` are Promises — always `await`). Middleware is `src/proxy.ts` (exported fn `proxy()`, nodejs runtime). See `AGENTS.md` for the Next 16 breaking-change cheat sheet.
- **Prisma 7** + Supabase Postgres. Client generated to `src/generated/prisma` — **import from `@/generated/prisma/client` and `@/generated/prisma/enums`, NOT `@prisma/client`**. DB access via `src/lib/db.ts` (`prisma`, PrismaPg adapter, pooled, `max:3`).
- **Hosting:** Vercel (region fra1), auto-deploy on push to `main`. Crons in `vercel.json`.
- **Storage:** Backblaze B2 (S3-compatible, private bucket) for rentgen files — `src/lib/b2.ts`, presigned up/download.
- **SMS:** Lsim.az QuickSMS (`src/lib/sms.ts`, provider `lsim`). **Email:** FormSubmit/Resend (`src/lib/email.ts`).
- **Payments:** Payriff v3 (`src/lib/payriff.ts` + `payments.ts`; `paymentStatus "APPROVED"` = paid).
- **AI:** Anthropic REST, Haiku 4.5 (`src/lib/ai-assistant.ts`).

## Folder structure
```
src/
  app/                         # App Router pages + API routes
    (public pages)             # /, /rentgen-merkezleri, /hekimler, /xidmetler, /paketler, /blog, /faq, /elaqe, /giris ...
    admin/                     # /admin/* platform admin (AZ only)
    merkez/                    # center panel
    hekim/                     # doctor panel
    kabinet/                   # patient cabinet
    crm/                       # crm.rentgen.az app (rewritten from crm host)
    viewer/[fileId]/           # in-browser DICOM/file viewer (gated)
    api/
      app/                     # MOBILE APP BRIDGE (catalog, accounts, whoami, referrals, referrals/otp, center/*)
      cron/                    # scheduled jobs
      pay/callback, upload, v1/requests, merkez/export
  components/                  # admin ai centers chat dashboard doctors documents forms join layout map partnership rentgen reviews ui viewer
  lib/                         # domain logic (see below)
  generated/prisma/            # generated Prisma client (import from here)
  proxy.ts                     # middleware: subdomain routing + route gating
prisma/schema.prisma           # single schema; 48 migrations
```

### Key `src/lib` modules
`db.ts` (prisma), `env.ts` (typed env), `auth/` (jwt, session, rbac, acting, revoke), `queries.ts` (public+catalog reads), `crm.ts` (slot engine), `crm-activity.ts`, `notify.ts`+`notifications.ts` (SMS+in-app), `otp.ts`, `sms.ts`+`center-sms.ts`, `wallet.ts`+`payments.ts`+`payriff.ts`, `b2.ts`, `plans.ts` (`centerLimits`/`doctorLimits`), `phone.ts` (`normalizePhone` → `+994XXXXXXXXX`), `hours.ts` (Baku tz, slots), `i18n.ts`/`i18n-panel.ts`/`i18n-crm.ts` (az/ru dicts), `constants.ts` (CITIES, EXAM_TYPES, DENTAL_SPECIALIZATIONS), `google-rating.ts`, `viewer-access.ts`, **`app-api.ts` + `app-catalog.ts`** (mobile bridge).

## Auth & sessions
- **Login:** `/giris` (role tabs). `requestOtpAction`/`verifyOtpAction` in `src/app/giris/actions.ts`. OTP created/verified in `src/lib/otp.ts` (OTPCode table, sha256 hash). On verify → `setSessionCookie({userId, role, phone})` (`src/lib/auth/session.ts`) → JWT cookie `rx_session` (`src/lib/auth/jwt.ts`, jose HS256, 30d, domain `.rentgen.az` in prod). Token carries `v` = `User.sessionVersion`.
- **`getCurrentUser()`** (`src/lib/auth/rbac.ts`, React-cached): loads user; returns null if blocked, if token `v` ≠ DB `sessionVersion`, or if an ASSISTANT with no active link.
- **`getActingCenter()` / `getActingDoctor()`** (`src/lib/auth/acting.ts`): resolve owner OR active assistant → `{userId, center/doctor, isOwner}`. `assistantAccount(userId)` → mobile/nav dashboard for assistants.
- **`requireRole(role[])`, `requireUser()`** redirect if unauthorized. `bumpSessionVersion(userId)` (`revoke.ts`) invalidates tokens.
- **Route gating:** `src/proxy.ts` PROTECTED prefixes (`/admin`→ADMIN, `/merkez`→CENTER, `/crm`→CENTER+ASSISTANT, `/hekim`→DOCTOR+ASSISTANT, `/kabinet`→PATIENT).

## Subdomain routing (`src/proxy.ts`)
- Host `crm.*` → rewrites every path to `/crm/*`; only CENTER+ASSISTANT; unauth → `crm.rentgen.az/giris` (phone-only login, `resolveCrmRole`). Main host `/crm/giris` public passthrough.
- Session cookie domain `.rentgen.az` (prod) so login is shared across apex + crm.

## Mobile app architecture (companion iOS app, built in Rork)
**Decision:** NOT a WebView (user rejected), NOT direct DB access (rejected: security + free-tier connection floods). Instead a **thin Cloudflare Worker proxy**.

```
iOS app (SwiftUI) ──HTTPS──► Cloudflare Worker ──HTTPS + x-app-key──► rentgen.az /api/app/*  ──Prisma──► Supabase
   (no DB creds)         (rentgen-az-sync-backend.rork.app)        (all business logic, one pooled conn)
```
- **Worker** (`index.ts` in Rork project): pure proxy. Adds secret `x-app-key` header (env `APP_API_KEY`). Routes: `/catalog /accounts /whoami /referrals /referrals/otp /center/requests /center/status` → site `/api/app/*`. OTP (`/otp/send /otp/verify`) is proxied to the site's real login server actions (Worker scrapes action-ids from `/giris` JS chunks at runtime; they change per deploy). Worker holds NO Supabase creds.
- **Site endpoints** (`src/app/api/app/*`, all gated by `x-app-key` = env `APP_API_KEY`, `Cache-Control: no-store` for personal data). Logic in `src/lib/app-catalog.ts` + `src/lib/app-api.ts`. See `API.md`.
- **App auth:** stateless. Login = OTP verify (site) + `whoami?phone=&role=` → single account (no full-registry download → no phone leak). `whoami` role param resolves dual-role numbers (a phone that is both doctor & center → the requested role).
- **App shape:** doctor MVP = 3 tabs (Pasiyentlər / Xidmətlər / Mərkəzlər). Center MVP building (login role picker + dashboard of incoming requests + status change).

## Data flow rules
- Mobile writes go through site logic (patient auto-created/linked, correct `AppointmentRequest` fields, status NEW, notifications) — never raw DB rows. This is why the app writes appear correctly on the site.
- `phone` canonical form everywhere: `+994XXXXXXXXX` (`normalizePhone`). Match tolerance: last 9 digits (`nationalDigits`).

## Conventions
- Server Components by default; `"use client"` only where needed. Server Actions for mutations (`"use server"`). API routes for the mobile bridge & webhooks.
- TS strict; import Prisma types from `@/generated/prisma/*`. Zod validation in `src/lib/validation.ts`.
- i18n: server dicts via `getDict`/`getPanelDict`/`getCrmDict`; client via `useLocale()` (LocaleProvider in DashboardShell).
- Money in **minor units** (qəpik, Int). Times computed in **Asia/Baku**; slot/date helpers in `hours.ts`/`crm.ts`.
- Temp scripts: `scripts-tmp-*.mts` in repo root, `import "dotenv/config"` + `config({path:[".env.local",".env"]})`, PrismaPg adapter; delete after use. `server-only` modules can't be imported by tsx — inline logic.
