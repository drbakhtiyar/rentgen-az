# DECISIONS

Architectural & product decisions that live only in conversation (not obvious from the code). Newest-relevant first. Each: **decision — why — consequence.**

## Rating sort = weighted (Bayesian) + server-side global + URL param
- **Decision:** the centers list sorts by a Bayesian weighted rating `(avg·n + 4.2·8)/(n + 8)`
  (unrated → last), NOT raw average. "Yüksək reytinq" blends the platform's own reviews (×1.5)
  with Google; a separate "Google reytinqi" sort uses Google only. Sorting + pagination happen
  **on the server over the full matching set**, driven by `?sort=`; pagination links carry it.
- **Why:** a 5.0 from 2 reviews shouldn't outrank a 4.8 from 50 (user's explicit example). The
  old sort was client-side per-page, so it "disappeared on page 2" — server-global fixes that.
- **Consequence:** shared `src/lib/rating.ts` (server + client). Only `distance` stays
  client-side (needs geolocation), reordering just the current page.

## Duplicate detection ignores logo & shared switchboard phone
- **Decision:** centers are considered duplicates by **placeId / same phone / normalized name
  (Cyrillic-homoglyph folded) / <120 m coords + shared distinctive word** — never by logo, and
  same-central-number across a network's branches is NOT treated as a duplicate.
- **Why:** networks (BMP, Sağlam Ailə, SağlamDiş, Diamed, Referans) route all branches through
  one switchboard; TƏBİB state hospitals all use the one TƏBİB logo. These are legitimately
  distinct listings.
- **Consequence:** merges keep the fullest record, copy missing fields (photo/rating/hours/
  coords), delete the redundant profile + its owner-less CENTER user. Same-generic-name centers
  in DIFFERENT cities are kept separate.

## OTP needs a mobile; landline preserved in `landlinePhone`
- **Decision:** OTP SMS only reaches AZ mobile prefixes (010/050/051/055/060/070/077/099). When
  a mobile is added as a center's primary `phone`, the previous city/landline number moves to
  the new `landlinePhone` field (not discarded). For owner-less bulk centers a placeholder
  `User.phone` (`placeholder:<uuid>`) holds the account until a real mobile is set.
- **Why:** user: "mobil olması bizim üçün həlledicidir — OTP ancaq mobil nömrələrə gəlir", but
  contactability via the landline must not be lost.
- **Consequence:** admin/operator lists filter by 📱 mobil / 🏢 şəhər nömrəsi; a website scraper
  auto-found mobiles for centers that publish them.

## Bulk import = PENDING + full-service template + admin trims
- **Decision:** centers scraped from Google Places are created **PENDING** with the **full 89
  non-dental imaging service set** as a template; the admin trims to real modalities at approval.
- **Why:** we can't know each center's exact modalities from Places; PENDING keeps them off the
  public site until curated; a template is faster to trim than to build.
- **Consequence:** never treat PENDING service lists as authoritative. All import/enrichment
  runs via throwaway `scripts-tmp-*.mts` (dotenv + PrismaPg, `npx tsx`, deleted after) — none
  committed. Google **Places API (New)** only (legacy API is disabled on the key).

## Operator (data-entry) role — rich cards, edit-only
- **Decision:** the OPERATOR role ("Nərmin", secret-link `/panel`) sees the same rich center
  cards + completeness filters as admin, but the ONLY action is **Redaktə** (+ Yeni mərkəz).
  No approve / deactivate / block / delete — those stay admin-only.
- **Why:** operators enrich data; approval/moderation/deletion are owner/admin responsibilities.

## Homepage hero map is data-driven, decorative, non-interactive
- **Decision:** the hero shows a real (simplified GeoJSON) Azerbaijan silhouette + Nakhchivan
  with a glowing marker per city that has an **APPROVED** center (`getCoveredCities()` →
  `src/lib/az-cities.ts` coord table + projection). It's purely decorative — no links.
- **Why:** conveys nationwide coverage; markers must appear automatically as new cities go live.
- **Consequence:** adding an approved center in a new city auto-adds its marker; no manual edit.

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
