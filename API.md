# API

Two API surfaces: (1) the **mobile-app bridge** (`/api/app/*`, consumed by the Rork Cloudflare Worker), and (2) internal webhooks/crons/upload. Most web functionality uses **Server Actions**, not REST.

Base: `https://rentgen.az`. All `/api/app/*` require header **`x-app-key: <APP_API_KEY>`** (env, in `.env.local` + Vercel). Missing/wrong → 401. Personal-data responses are `Cache-Control: no-store` (a public cache once leaked authorized data to keyless callers — fixed in `f753fd2`).

Implementation: routes in `src/app/api/app/*/route.ts`; logic in `src/lib/app-catalog.ts` + `src/lib/app-api.ts`.

## Mobile bridge — `/api/app/*`

### `GET /api/app/catalog`
Full catalog for the app. Returns `{ version, updatedAt, categories, services[], cities[], examTypes[], specializations[], centers[] }`.
- `services`: **only services offered by ≥1 approved center** (not all 112 SEO services). Each `{slug,name,shortName,description,icon,category,order,featured}`.
- `centers[]`: `{id, slug, name, city, district, address, phone, workingHours, about, equipment, responsiblePerson, logoUrl(abs), imageUrl(abs), rating, reviewCount, services:[{slug,name,price,priceTo}]}`. Rating = avg of non-hidden reviews, else Google rating fallback.
- **No `accounts` field** — it embedded every doctor/center phone and the Worker serves `/catalog` keyless (public-cacheable), which reopened the f753fd2 leak. Login uses `whoami`; the registry lives only at the gated `/accounts`.

### `GET /api/app/accounts`
Full sign-in registry (doctors + centers). Largely superseded by `whoami` (privacy). `{ok, accounts[]}`.

### `GET /api/app/whoami?phone=<+994...>&role=<DOCTOR|CENTER|PATIENT>`
**Login resolver.** Single account for one phone (no full-registry download). `role` mirrors the login tab: a dual-role number resolves to the requested role; without `role`, priority doctor→center→patient. Returns `{ok, account}` where `account` is null if not registered for that role, else:
- DOCTOR: `{phone, role:"DOCTOR", name, centerSlug:null, assistantOf:null, centerSlugs:[ACCEPTED partner slugs], photoUrl(abs), clinic, specializations[], city, workplace(ACCEPTED workplace center name), instagram, website}`
- CENTER: `{phone, role:"CENTER", name, centerSlug, assistantOf:null, photoUrl(logo abs)}`
- PATIENT: `{role:"PATIENT", phone, name}`
Only APPROVED doctors/centers resolve. **Assistants** resolve too: a doctor-assistant signs in as the doctor they assist (role DOCTOR), a center-assistant as their center (role CENTER) — acting on the owner's behalf, keeping their own phone, with `assistantOf` set to the owner's name. All app endpoints resolve the assistant's phone to the acting owner (chat via `resolveAppParticipant`, centers via `getAppCenterForPhone`, referrals via `findDoctorByPhone`).

### `POST /api/app/referrals/otp`
Send an OTP SMS to the **patient's** phone (referral confirmation). Body `{patientPhone}`. Returns `{ok, devCode}` (devCode only in dev). Uses site `createOtp`+`sendOtpSms`.

### `POST /api/app/referrals`
Create a doctor referral. Body `{doctorPhone, centerSlug, serviceSlug?|serviceName?, patientName, patientPhone, code(patient OTP, REQUIRED), note?, preferredDate?}`. Verifies the patient OTP (`verifyOtp`), finds doctor by phone (DoctorProfile), finds center by slug **or id**, resolves/creates patient (User+PatientProfile), creates `AppointmentRequest` (status NEW, doctorId=DoctorProfile.id, centerId, patientId, serviceSlug), notifies the center (in-app + email). Returns `{ok, id, centerName, serviceSlug, linkedPatient, patientCreated}`.

### `GET /api/app/referrals?phone=<doctor +994...>`
A doctor's referral history. `{ok, requests:[{id, patientName, patientPhone, centerId(slug), centerName, serviceSlug, serviceName, status, note, preferredDate, createdAt, files:[{id,name,sizeLabel,url:null}]}]}`. Files return `url:null` (download deferred — would need presigned + access gate).

### `GET /api/app/center/requests?phone=<center owner/assistant +994...>`
A center's incoming requests. `{ok, center:{id,name,slug}, requests:[{id, patientName, patientPhone, registered, referringDoctor, serviceSlug, serviceName, status, note, preferredDate, createdAt, files:[{...,url:null}]}]}`.

### `POST /api/app/center/status`
Center advances a request. Body `{phone(center), requestId, status}`. One-way transitions: NEW→CONTACTED|CANCELLED, CONTACTED→COMPLETED|CANCELLED. Verifies the request belongs to that center. Notifies patient + referring doctor (in-app), like the site's status control. Returns `{ok, status}`. (SMS on status change NOT yet wired here — deferred.)

### `POST /api/app/push/register`
Register a device's **Expo** push token for the signed-in user. Body `{phone, token(`ExponentPushToken[...]`), platform?("ios"|"android")}`. Resolves user by phone (`resolveUserIdByPhone`, tolerant of +994/0/national), upserts on `token` (unique) → re-points a shared device to the current account. Returns `{ok}`; 400 bad/missing token, 404 unknown phone. See `src/lib/push.ts`.

### `POST /api/app/push/unregister`
Drop a token on sign-out so a shared phone stops getting the previous account's pushes. Body `{token}`. Deletes by token alone. Returns `{ok}`.

> **Push delivery (native APNs):** the iOS app is a **native** build (not Expo) — it stores the raw APNs hex device token. The server sends **directly to Apple APNs** over HTTP/2 with an ES256 JWT signed by the `.p8` auth key (`src/lib/push.ts`). Every `notifyUser(...)` call (new referral, status, result, partner, review, new message, etc.) also pushes, best-effort; custom keys (`link`, `type`) ride at the payload top level for tap-navigation. Tokens APNs rejects (410/`BadDeviceToken`) are auto-pruned. **Inert until these env vars are set** (like the Google key): `APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID`, `APNS_ENV` (production|sandbox) — all obtained from the Apple Developer account. `/push/register` accepts native APNs hex tokens (and Expo tokens for compatibility).

### Chat / messaging (mobile) — text only (images deferred)
Phone-authed REST mirrors of the site's chat server actions (the app has no session), in `src/lib/app-chat.ts`. `resolveAppParticipant(phone, role)` maps a phone → CENTER/DOCTOR profile (incl. active assistants). Partner rule unchanged: only **ACCEPTED** partners.
- `GET /api/app/chat/contacts?phone=&role=` → `{ok, contacts:[{id(profileId|"ai"|"admin"), conversationId, name, sub, avatar(abs), preview, unread, kind:"ai"|"admin"|"partner"}]}`. AI + Dəstək pinned on top, then every ACCEPTED partner.
- `GET /api/app/chat/messages?phone=&role=&conversationId=` **or `&peerId=`** → `{ok, messages:[{id, mine, content, hasFile, fileName, readAt, createdAt}], conversationId}`. Pass `peerId` (the partner's profile id) before the first message when there's no conversationId yet — it resolves the thread (empty + `conversationId:null` if not started) and echoes `conversationId` back so the app can lock onto it. Marks the other party's messages read. Polling endpoint (~4 s).
- `POST /api/app/chat/read` — mark a thread read when the user opens it and get the fresh badge back. Body `{phone, role, conversationId}` (partner) or `{phone, role, support:true}` (rentgen.az support thread) → `{ok, unread}` where `unread` = the app's total Söhbətlər badge (unread partner + admin messages). Lets the app zero the badge instantly instead of waiting for the next contacts poll. Idempotent; foreign conversationId → 403.
- `POST /api/app/chat/send` — body `{phone, role, conversationId?|peerId?, content}`. With `peerId` (other party's profile id) it opens the conversation on first send after the ACCEPTED check. Returns `{ok, id, conversationId}`. Notifies recipient → fires push.
- `POST /api/app/ai` — body `{phone, messages:[{role:"user"|"assistant", content}]}` → `{ok, answer}`. AI Yardımçı (Claude Haiku via `askAssistant`); stateless, last turn must be a user question (≤12 turns, ≤1500 chars each).
- `GET /api/app/support/messages?phone=` / `POST /api/app/support/send {phone, content}` — the user's rentgen.az support (AdminThread) chat; admin replies from the site's Söhbətlər panel.

## Internal
- `POST /api/pay/callback` — Payriff payment callback (verifies order via API, settles wallet).
- `POST /api/upload` — authenticated upload helper.
- `GET /api/v1/requests` — Platinum center API (apiKey).
- `GET /api/merkez/export` — center CSV export.
- Crons (Bearer `CRON_SECRET`): `/api/cron/purge-trash` (03:00), `plan-downgrade` (04:00), `appointment-reminders` (hourly), `sms-pool-check` (09:00), `google-ratings` (05:30).

## Worker OTP proxy (Rork side, not in this repo)
`/otp/send` & `/otp/verify` on the Worker call the site's real `requestOtpAction`/`verifyOtpAction` server actions by discovering their action-ids from `/giris` JS chunks at runtime (ids change per deploy; the Worker re-discovers on staleness). SMS goes through the site's Lsim provider.
