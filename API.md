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
Only APPROVED doctors/centers resolve.

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

## Internal
- `POST /api/pay/callback` — Payriff payment callback (verifies order via API, settles wallet).
- `POST /api/upload` — authenticated upload helper.
- `GET /api/v1/requests` — Platinum center API (apiKey).
- `GET /api/merkez/export` — center CSV export.
- Crons (Bearer `CRON_SECRET`): `/api/cron/purge-trash` (03:00), `plan-downgrade` (04:00), `appointment-reminders` (hourly), `sms-pool-check` (09:00), `google-ratings` (05:30).

## Worker OTP proxy (Rork side, not in this repo)
`/otp/send` & `/otp/verify` on the Worker call the site's real `requestOtpAction`/`verifyOtpAction` server actions by discovering their action-ids from `/giris` JS chunks at runtime (ids change per deploy; the Worker re-discovers on staleness). SMS goes through the site's Lsim provider.
