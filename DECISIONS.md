# DECISIONS

Architectural & product decisions that live only in conversation (not obvious from the code). Newest-relevant first. Each: **decision — why — consequence.**

## Mobile app = Worker proxy → site API (NOT WebView, NOT direct DB)
- **Decision:** the companion iOS app (built in Rork, SwiftUI) talks to a thin **Cloudflare Worker** (`rentgen-az-sync-backend.rork.app`) which proxies to the site's `/api/app/*` endpoints (Prisma → Supabase).
- **Why:** user explicitly rejected a WebView ("app should feel native, not a wrapped site"). Direct DB access from the app was also rejected — leaks credentials into the app bundle and floods the free/small-tier Postgres with unpooled connections. Routing through the site keeps all business logic and one pooled connection in a single place, so app writes are automatically consistent with the site (patient auto-created/linked, right `AppointmentRequest` fields, notifications fire).
- **Consequence:** every mobile capability needs a site endpoint first. The Worker holds no Supabase creds — only the `APP_API_KEY` (env) it adds as `x-app-key`.

## App is stateless; login = OTP + `whoami` (no registry download)
- **Decision:** the app does not download the accounts registry to log in. It runs OTP verify (proxied to the site's real login server actions) then calls `whoami?phone=&role=` for the single matching account.
- **Why:** an earlier design pulled `/accounts` (all doctors + centers, with phones) to the device — a phone-number leak. `whoami` returns exactly one account.
- **Consequence:** `whoami` takes a `role` param so a dual-role number (both doctor & center) resolves to the tab the user picked, not a fixed priority. (Fixed after Rork flagged doctor-only login failing for such numbers — commit `6d730cf`.)

## `/api/app/*` personal data is `no-store`
- **Decision:** catalog/accounts/whoami/etc. send `Cache-Control: no-store` (not `public, max-age`).
- **Why:** a public cache header let Vercel/CDN serve an authorized (keyed) response to a later **keyless** caller — an auth bypass leaking phone numbers.
- **Consequence:** fixed in `f753fd2`; verified keyless→401, keyed→200. Keep personal-data routes uncached.

## App catalog shows only services centers actually offer
- **Decision:** `/api/app/catalog` filters the 112-service SEO taxonomy down to services offered by ≥1 approved center (`offeredSlugs`).
- **Why:** the full taxonomy exists for SEO landing pages; showing all 112 in the app's service picker is noise — patients/doctors should pick from bookable services.
- **Consequence:** app service list ≠ site `/xidmetler`. Site keeps all 112 for SEO.

## Doctor app collapsed to 3 tabs (Sorğular tab removed)
- **Decision:** doctor MVP = Pasiyentlər · Xidmətlər · Mərkəzlər. The separate "Sorğular" (requests) tab was removed; its value (New/Total counters + status chips) moved into Pasiyentlər.
- **Why:** user judged Sorğular redundant with Pasiyentlər — same data, two screens.

## Referral requires patient OTP
- **Decision:** creating a referral from the app requires the **patient** to confirm via OTP (`code` field mandatory on `POST /referrals`).
- **Why:** a doctor shouldn't be able to register a patient at a center without the patient's consent/knowledge; the OTP proves the patient's phone.

## Assistants: shared ASSISTANT role, resolved dynamically, max 1 each
- **Decision:** one `ASSISTANT` enum role serves both center-assistants and doctor-assistants; the actual link (CenterAssistant / DoctorAssistant) is resolved at request time via `getActingCenter/getActingDoctor`. Each owner may have max 1 active assistant. Assistants log in phone-only (CRM) or via main-site tab; they do day-to-day work but owner-only settings/SMS/billing stay gated; removal hard-revokes their session (`bumpSessionVersion`).
- **Why:** avoids duplicating role plumbing; keeps least-privilege; instant revocation on removal is a security requirement.
- **Consequence:** audit findings #1–#7 closed (e.g. #1 `349d9c9`: eligibility must also reject numbers that are already a doctor, to prevent hijacking a doctor's phone as a center assistant).

## DICOM viewer gated pre-launch
- **Decision:** `/viewer/[fileId]` is restricted to Dr. Bakhtiyar only (`src/lib/viewer-access.ts`).
- **Why:** the MPR/measure/implant tooling isn't finished (4th-quadrant reference images pending); not ready for public/center use.

## Same Supabase DB for site + app; never rotate password blindly
- **Decision:** site and mobile app share one Supabase project (`yunonkioubsvozqmezvp`, PRO, SMALL compute).
- **Why/Consequence:** resetting the DB password 500s the live site unless Vercel `DATABASE_URL` + `DIRECT_URL` are updated in the same change. The recurring `pg_pgrst_no_exposed_schemas` 503 in Supabase logs is harmless — PostgREST/Data API is unused; everything goes through direct Prisma.

## Standing user directives
- **Always commit & push** every change immediately (Vercel auto-deploys from `main`); never leave work uncommitted locally.
- **Autonomous:** don't block on small decisions — act. Only ask on big forks / destructive actions.
- **Never delete** anything without asking; touch only exactly what was requested.
- Secrets (`APP_API_KEY`, DB password, `ADMIN_ACCESS_KEY`, etc.) live only in `.env.local` + Vercel env — never in code, the app bundle, or GitHub.
