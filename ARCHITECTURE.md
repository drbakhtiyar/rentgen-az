# ARCHITECTURE

## Stack
- **Next.js 16.2.9** (App Router, React 19.2, TypeScript, **Turbopack** default). Async request APIs (`cookies()`, `headers()`, `params`, `searchParams` are Promises — always `await`). Middleware is `src/proxy.ts` (exported fn `proxy()`, nodejs runtime). See `AGENTS.md` for the Next 16 breaking-change cheat sheet.
- **Prisma 7** + Supabase Postgres. Client generated to `src/generated/prisma` — **import from `@/generated/prisma/client` and `@/generated/prisma/enums`, NOT `@prisma/client`**. DB access via `src/lib/db.ts` (`prisma`, PrismaPg adapter, pooled, `max:3`).
- **Hosting:** Vercel (region fra1), auto-deploy on push to `main`. Crons in `vercel.json`.
- **PACS:** `pacs.rentgen.az` — ayrıca Hetzner serveri (Orthanc + OHIF + Caddy + auth qapısı), bax `infra/pacs/README.md`; sayt tərəfi `src/lib/pacs.ts` (imzalı açılış linkləri + server-tərəfli Orthanc oxuma), `/admin/pacs`.
- **Storage:** Backblaze B2 (S3-compatible, private bucket) for rentgen files — `src/lib/b2.ts`, presigned up/download.
- **SMS:** Lsim.az QuickSMS (`src/lib/sms.ts`, provider `lsim`). **Email:** FormSubmit/Resend (`src/lib/email.ts`).
- **Payments:** Payriff v3 (`src/lib/payriff.ts` + `payments.ts`; `paymentStatus "APPROVED"` = paid).
- **AI:** Anthropic REST (`src/lib/ai-assistant.ts`, `askClaude(system,history,maxTokens,model)`): panel yardımçısı **Haiku 4.5**, WhatsApp botu **claude-sonnet-5** (bax DECISIONS).

## Environment variables (hamısı Vercel prod-da; `src/lib/env.ts` tipli oxuyur)

| Qrup | Dəyişənlər | Qeyd |
|---|---|---|
| **Baza** | `DATABASE_URL`, `DIRECT_URL` | Supabase. **Parolu dəyişəndə HƏR İKİSİNİ eyni addımda yenilə**, yoxsa sayt 500 verir. Preview mühitinə də əlavə edilib. |
| **Auth** | `AUTH_SECRET`, `OTP_SECRET`, `ADMIN_ACCESS_KEY`, `OPERATOR_ACCESS_KEY`, `ADMIN_PHONE`, `ADMIN_2FA`, `ADMIN_ALERT_PHONE` | Admin gizli link `/admin-giris/<ADMIN_ACCESS_KEY>`; operator `/panel/acar/<OPERATOR_ACCESS_KEY>`. |
| **SMS** | `SMS_PROVIDER=lsim`, `LSIM_LOGIN`, `LSIM_PASSWORD`, `LSIM_SENDER` | Lsim.az QuickSMS. |
| **WhatsApp** | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `WA_DAILY_LIMIT` (50), `WA_STATS_MIN_EVENTS` (3) | Meta Cloud API. Env yoxdursa webhook **passivdir**. Limitlər deploy-suz dəyişir. |
| **AI** | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `WA_TRANSCRIBE_MODEL` | Anthropic = bot + panel yardımçısı; OpenAI = səsli mesaj STT (`gpt-4o-transcribe`) və şəkil generasiyası. |
| **Ödəniş** | `PAYRIFF_MERCHANT`, `PAYRIFF_SECRET`, `PAYRIFF_BASE` | Payriff v3, CANLI. |
| **Fayl** | `B2_KEY_ID`, `B2_APP_KEY`, `B2_BUCKET`, `B2_ENDPOINT`, `B2_REGION` | Backblaze B2 (private). |
| **Mobil** | `APP_API_KEY`, `APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID`, `APNS_ENV` | `APNS_*` **Apple hesabı gələnə qədər passiv**. |
| **Digər** | `CRON_SECRET`, `GOOGLE_PLACES_API_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GA_ID`, `PANEL_SHARED_SECRET`, `EMAIL_PROVIDER`/`RESEND_*`/`NOTIFY_EMAIL` | `PANEL_SHARED_SECRET` = Axiora admin panelinin `/api/panel/stats-today` çağırışı. |

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
  not-found.tsx                # qlobal 404 (brendli, az/ru, kataloq+şəhər keçidləri)
  proxy.ts                     # middleware: subdomain routing + route gating
prisma/schema.prisma           # single schema; 51 migrations
```

### Key `src/lib` modules
`db.ts` (prisma), `env.ts` (typed env), `auth/` (jwt, session, rbac, acting, revoke; +`operator.ts` = OPERATOR "Nərmin" secret-link), `queries.ts` (public+catalog reads; incl. `getApprovedCenters`, `getCoveredCities`), `center-write.ts` (`saveCenterLoose` — loose center create/edit, placeholder owner phone, coord extraction from pasted Maps link), `center-filters.ts` (shared admin+operator completeness filters/where/score), **`rating.ts`** (Bayesian weighted rating — server+client sort), **`az-cities.ts`** (Azerbaijan border GeoJSON + city coords for the hero map), `crm.ts` (slot engine), `crm-activity.ts`, `notify.ts`+`notifications.ts` (SMS+in-app), `otp.ts`, `sms.ts`+`center-sms.ts`, `wallet.ts`+`payments.ts`+`payriff.ts`, `b2.ts`, `plans.ts` (`centerLimits`/`doctorLimits`), `phone.ts` (`normalizePhone` → `+994XXXXXXXXX`), `hours.ts` (Baku tz, slots, `formatHoursSummary`/`WeeklyHours`), `i18n.ts`/`i18n-panel.ts`/`i18n-crm.ts` (az/ru dicts), `constants.ts` (CITIES, EXAM_TYPES, DENTAL_SPECIALIZATIONS), `google-rating.ts` (**Places API New** — `searchText`/place details; legacy Places API disabled), `viewer-access.ts`, **`app-api.ts` + `app-catalog.ts`** (mobile bridge), **`center-description.ts`** (unikal mərkəz təsviri generatoru + `locative()` yerlik hal), **`city-pages.ts`** (şəhər lendinq səhifələri), **`city-service-pages.ts`** (şəhər×xidmət, kurasiyalı `HEADLINE_SERVICES`), **`review-invite.ts`** (rəy dəvəti + cron məntiqi), **`center-editors.ts`** (mərkəzə kim toxunub — operator/admin izi), **`price-invite.ts`** (WhatsApp qiymət kampaniyası: gündəlik limit, wa.me mesajları, `/q/<token>` həlledicisi), **`wa-bot.ts`** (WhatsApp AI botu: sərt qaydalar + DB-dən BotSection bilik bazası + mərkəz konteksti), **`whatsapp.ts`** (Meta Cloud API göndərişi; env-siz passiv), **`az-rayons.ts`** (avtogenerasiya, 60KB: 79 rayon poliqonu + ADM0 kontur — hero xəritə v2), **`random-services.ts`** (`pickCrossCategoryRandom` — footer 6 + ana səhifə 4 random xidmət linki, hər biri fərqli kateqoriyadan), **`wa-transcribe.ts`** (səsli mesaj → Graph media → OpenAI `gpt-4o-transcribe` + Claude təmizləmə), **`wa-auto-reply.ts`** (qarşı tərəfin şablon cavabını tanıyır → bot susur), **`rate-limit.ts`** (`clientIp`/`rateLimit`/`tooManyRequests` — fail-open bucket limiter), **`link-visit.ts`** (token linklərinin açılma/doldurma izləməsi, 👀/✅ daxili qeyd), **`service-icon-map.ts`** (111 xidmət ikonunun Blob URL xəritəsi — DB-yə yazılmır), **`blog-categories.ts`** (bloq kateqoriyaları slug+AZ+RU), **`blog-services.ts`** (yazıda keçən müayinələr — mətndən çıxarılır, bazaya yazılmır), **`az-cities.ts`-də `CITY_RU`+`cityLabel`** (şəhər adlarının RU görünüşü — dəyər həmişə AZ qalır), **`auth/acting.ts`-də `centersManagedByPhone`** (şəbəkə admin girişi).

**Şəbəkə admin axını (2026-08-19):** OTP girişdə profilsiz CENTER nömrəsi
`adminPhone`/`superAdminPhone`-da axtarılır → tək mərkəz = birbaşa panel,
çox = `/merkez/secim` (seçim `rx_center` cookie, yalnız icazəli siyahıdan);
shell sol sütununda «⇄ Şəbəkə siyahısı». Super sahələrini yalnız admin formu
yazır (`superEditable`); `saveCenterProfileAction` onları qəbul etmir.

**pacs.rentgen.az:** proxy `isPacs` branch — kök `/pacs` qarşılama (noindex),
`/viewer` bu hostda işləyir, qalan yollar rentgen.az-a redirect.

**Digər qeyd olunmalı marşrutlar:** `/telimat` (mərkəzlər üçün GİZLİ istifadə təlimatı —
noIndex + robots disallow + sitemap-dan kənar), `/q/[token]` (girişsiz qiymət formu),
`/rey/davet/[token]` (OTP-siz rəy dəvəti), `/api/whatsapp/webhook` (Meta doğrulama GET +
imzalı POST). Hero xəritəsi `src/components/hero-visual.tsx` — `VARIANT: "rayons"|"dots"`
(köhnə görünüş bir sətirlə geri qayıdır).

**E-poçt (info@rentgen.az):** ImprovMX yönləndirmə — Vercel DNS-də MX `mx1/mx2.improvmx.com`
+ SPF TXT; məktublar dr.bakhtiyar.aliyev@gmail.com-a düşür. Yalnız QƏBUL — göndərmə (SMTP)
qurulmayıb. Bloq cover-ləri Vercel Blob `blog-covers/` altındadır (yeni seriya `<slug>-v2.webp`).

**SEO marşrutları:** `/rentgen-merkezleri/sheher/[slug]` (şəhər) və
`/rentgen-merkezleri/sheher/[slug]/[service]` (şəhər×xidmət). Hər ikisində
`getCityBySlug`/`getCityServicePage` DB xətasını UDMUR — `notFound()` ISR-də
keşlənəcəyi üçün bir anlıq nasazlıq səhifəni 404-də saxlayardı.

**Operator panel** (`/panel`, role OPERATOR): rich edit-only center cards (`src/components/operator/*`), same `center-filters.ts` as admin; secret-link login `/panel/acar/[key]`, logout `/panel/cixis`. **Admin center cards** (`src/components/admin/*`) add approve/deactivate/block + **delete** (`deleteCenterAction`) + completeness badge.

## WhatsApp alt-sistemi (Meta Cloud API — 2026-08-12-dən CANLI)

```
Mərkəz/pasiyent ──WhatsApp──► Meta Cloud API ──POST──► /api/whatsapp/webhook
                                                        │  imza yoxlanışı (APP_SECRET)
                                                        │  humanActive? (30 dəq) → bot susur
                                                        │  waHistory (7 gün/20 dövr, güzgüdən)
                                                        ▼
                                              answerWaMessage (wa-bot.ts, SONNET)
                                              HARD_RULES + 22 BotSection + centerContext
                                              + nameLookupContext (fuzzy ad axtarışı)
                                                        │
                                              sendWaText ◄──── cavab
                                                        │
                          mirror(): AdminThread güzgüsü (📲 gələn / 🤖 bot)
                          naməlum nömrə → User upsert by phone (PATIENT)
```

- **Kimliklər:** WABA 1729407764977766 · PHONE_ID 1328305727023335 · App
  1602952428191651 · register PIN 580131. Env (yalnız Vercel prod):
  WHATSAPP_TOKEN (daimi SYSTEM_USER) / PHONE_ID / VERIFY_TOKEN / APP_SECRET.
- **Bölmələr:** /admin/whatsapp-sohbetler + /panel/whatsapp-sohbetler —
  getAdminThreads("whatsapp") (📲-lı thread-lər); adi Söhbətlər "system"
  filtri. Nişanlar adminUnreadTotal() → {system, whatsapp}.
- **Cavab körpüsü:** adminSendToUserAction — thread son 24 saatda 📲 alıbsa
  cavab sendWaText ilə gedir (Meta 24s pəncərəsi); uğursuzda ⚠️ qeydi.
- **Bot susma:** webhook humanActive() — son 30 dəq-də 🤖-siz fromAdmin mesaj
  varsa bot cavab vermir; UI-də botMutedUntil nişanı. İKİ YERDƏ sinxron 30 dəq.
- **Şablonlu dəvətlər:** sendWaTemplate (whatsapp.ts) + sendWaInviteAction
  (panel/actions.ts) — WA_TEMPLATE xəritəsi (qiymet/faq/kart/kabinet_devet, az);
  dəvət 🤖 kimi güzgülənir → bot kontekstini görür. wa.me axını LƏĞV edilib.
- **Sabit cavablar (AI-sız):** audio/video → "yazı ilə göndərin"; image/document
  → "aldıq, komanda yerləşdirəcək".
- **Sınaq:** /bot-sinaq/<token> (token = sha256(ADMIN_ACCESS_KEY-dən), link
  /admin/bot və /panel/bot-da) — answerWaMessage ilə EYNİ mühərrik.
- **Operator paneli** DashboardShell üzərindədir (admin ilə eyni sol sütun);
  operatorNav role-navs.tsx-də; Bot beyni operator üçün yalnız-baxış
  (/panel/bot), redaktə yalnız /admin/bot.

### WhatsApp botunun qorunma qatları (webhook ardıcıllığı)
```
gələn mesaj → imza (APP_SECRET)
  → humanActive(30 dəq)?     → bot susur, yalnız güzgü
  → isAutoReply(mətn)?       → bot SUSUR + 🔇 qeydi   (wa-auto-reply.ts)
  → loopGuard(təkrar/burst)? → bot SUSUR + 🔇 qeydi   (15 dəq / 5 cavab)
  → waHistory → answerWaMessage (Sonnet) → sendWaText → mirror
```
`mirror()` bütün güzgü mesajlarını `internal: true` ilə yazır — mərkəzin öz
panelində görünmür (bax DECISIONS «WhatsApp yazışması ≠ sayt söhbəti»).

## Dizayn sistemi (v2 «Impilo», 2026-08-13)
Tam bələdçi: **`DESIGN.md`**. Tokenlər `src/app/globals.css` `@theme` blokunda
(`--color-iris-*`, `clinical`, `mint-vital`, `pearl`). Yalnız Manrope 500/600;
pill düymələr; 24px kartlar; kölgə əvəzinə ton fərqi. Animasiya köməkçiləri
eyni fayldadır (`.beam-ring`, `halo-breathe`, `hero-scan`, `chip-sheen`,
`card-lift`, `.bg-observatory`) — hamısı `prefers-reduced-motion` dostudur.
Panellər (admin/mərkəz/həkim/CRM) qəsdən
köhnə vizualdadır. Vizual aktivlər (ikon/örtük) **istifadəçi tərəfindən verilir**,
mən yalnız emal edirəm.

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
