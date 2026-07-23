# CHANGELOG

Reverse-chronological. Grouped by theme; each line is a shipped commit (see `git log` for full history). Dates approximate to when the block landed.

## Mobile app bridge (`/api/app/*`) — current focus
- **Chat backend built (text).** `/api/app/chat/{contacts,messages,send}` + `/api/app/ai` + `/api/app/support/{messages,send}` — phone-authed mirrors of the site chat actions (`src/lib/app-chat.ts`), reusing `getChatContacts`/`askAssistant`. AI + Dəstək pinned, ACCEPTED-partner rule, new-message push. Images + canned scripts deferred. Rork builds the app screens next.
- **Push notifications — backend built.** New `PushToken` model + migration; `/api/app/push/register` + `/unregister`; `src/lib/push.ts` (Expo push, dead-token pruning); wired into `notifyUser` so every event (referral/status/result/partner/review) pushes to the user's devices. No Apple/Google keys on the site (Expo handles APNs/FCM). Ready the moment the app has a push build.
- **Center mobile MVP shipped (Worker v18)** — login role picker (Həkim·Mərkəz), İdarəetmə dashboard (incoming requests + New/Total counters + status chips + status workflow via `/center/status`), Mərkəzim profile, per-phone offline cache + pull-to-refresh. Verified end-to-end.
- **Security: dropped `accounts` from `/api/app/catalog`** — it embedded every doctor/center phone; the Worker serves `/catalog` keyless and publicly cacheable, reopening the f753fd2 leak. Login uses `whoami`; registry stays only at gated `/accounts`.
- `8d605e9` **Center endpoints** — `GET /center/requests` (incoming requests) + `POST /center/status` (advance status, one-way, notifies patient+doctor). Enables the center mobile MVP (Rork building screens).
- `8b62a87` **Catalog filtered** — app catalog shows only services a center actually offers (not all 112 SEO services).
- `6d730cf` **whoami role param** — dual-role numbers (doctor & center) resolve to the requested role; fixes doctor-only login for such numbers.
- `6ad4bf2` **whoami added** — single-account login resolver (no full-registry download → no phone leak) + richer doctor info.
- `dd9f597` **Referral requires patient OTP** — same consent gate as the site.
- `4e1921e` accounts include doctor photo + center logo (absolute URLs).
- `f753fd2` **Security: fixed `/api/app` auth bypass** — public CDN cache had served authorized (keyed) responses to keyless callers, leaking phone numbers. Personal-data routes now `no-store`.
- `d186673` **Initial mobile backend** — `/api/app/*` bridge behind `x-app-key`.

## Admin panel filters
- `a8f4244` Requests: status chips + center filter.
- `671b0d3` / `44dd47c` Reviews: center-name autocomplete + date-range filter.
- `3e9ca53` Dedicated **Asistentlər** section; assistants dropped from incomplete-signups.

## Assistants (center + doctor) — audit #1–#7
- `85e3d86` **#5/#6**: hard session revocation + owner-only file delete.
- `b617374` **#4**: CRM activity log records who (owner/assistant) acted.
- `2e44283` "You are working as X's assistant" banner.
- `7dd792c` Revoke removed/deactivated assistant sessions (no dead-end).
- `349d9c9` **#1**: harden center-assistant eligibility (reject numbers already a doctor — anti-hijack).
- `5494356` Fix "Hesabım" for assistants (was bouncing home).
- `5196b70` Doctor assistants can refer patients on the doctor's behalf.
- `3310d6b` Add doctor assistants (max 1, system-detected login).
- `20474dc` Limit centers to a single assistant.
- `de7e7b2` CRM assistants see only day-to-day sections.
- `08bb2b5` Add center assistants: phone-only CRM login, owner-gated settings/SMS.

## Bug fixes
- `012661a` Fix flaky **RAR** uploads (browser MIME roulette → map `.rar` + allow rar MIME variants).
- `f486639` Fix `/admin/sms` 500 for assistant-recipient SMS logs (missing ROLE_META entry).

## Google rating
- `f976b04` Show centers' Google rating (Place ID → cached rating → page badge; daily cron). *Inert until `GOOGLE_PLACES_API_KEY` env set.*

## AI helper
- `0e482a8` CRM **Söhbətlər** tab with AI helper inside (dropped separate AI link).
- `19e7575` / `926c861` AI Yardımçı (Haiku 4.5) in all panels + env pickup. *Needs Anthropic credit.*

## DICOM viewer
- `9c875d8` Gate tomography viewer to Dr. Bakhtiyar's account (pre-launch).

## CRM & UX
- `4a71c47` Center service manager: group by category + search.
- `165f015` / `b8bd71f` CRM mobile: 3-day calendar view + hamburger nav.
- `efa24d8` / `64ac151` Hide public-site nav/CTA inside CRM.
- `8ea2f30` CRM RU i18n part 3 (modals, forms, SMS panels).
- `d6f318b` Doctors page: type-ahead filters.
- `a76484f` Guest booking form: type-ahead service/doctor inputs.
- `3398b52` Compact contact cards on mobile.

## Handoff docs (this session)
- Added root docs: `PROJECT_STATUS.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `TODO.md`, `API.md`, `DATABASE.md`, `CHANGELOG.md` — so a fresh Claude session can continue from docs alone.
