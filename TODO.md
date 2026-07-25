# TODO

Pending work, in rough priority order. `[ ]` open · `[~]` in progress · `[blocked]` waiting on external input.

## Mobile app (Rork) — mostly DONE; these remain
- [x] **Doctor + Center MVP, chat, push, map/filters, share, assistant login, redesign, tab icons** — all built & verified. Chat (partner+AI+support, mark-read, deep-link), push (native APNs backend + app), catalog lat/lng+hours, `/summary` for widget — done.
- [ ] **Chat image sending** — deferred by user ("do next"). Backend B2 presign flow ready; needs `/api/app/chat/upload` + app picker + gated download.
- [ ] **Chat canned-reply "scripts"** — deferred by user (later). No backend yet.
- [ ] **Result file download in app.** `/referrals` and `/center/requests` return `files:[{url:null}]`. Needs short-lived presigned B2 link behind partnership/ownership check.
- [ ] **Widget + Siri (app side).** Backend `/api/app/summary` DONE; Rork must build WidgetKit (App Group) + App Intents. Worker needs `/summary` proxy route.
- [ ] **Harden Worker auth** — `/referrals?phone=` / `/center/*` protected only by obscure Worker URL + phone. Add signed per-user token. Deferred (low risk).
- [ ] **SMS on center status change from app** — `/api/app/center/status` sends in-app only; site also SMSes. Wire for parity.
- [ ] **Center rating/endorsement (#12)** — deferred by user ("hələ saxla"); decide model (doctor endorsement vs patient review vs favorite).

## Blocked — waiting on external input
- [blocked] **Apple Developer account** ($99/yr) — push code (native APNs) fully built; needs the `.p8` key + `APNS_*` Vercel env to go live, and the account for App Store submission. Biggest blocker for the app.
- [blocked] **`GOOGLE_PLACES_API_KEY`** — Google rating feature fully built (Place ID, daily `google-ratings` cron), inert until the key is in Vercel env.
- [blocked] **Google Play account** ($25) — Android submission (later).

> ~~Anthropic credit~~ — RESOLVED: `ANTHROPIC_API_KEY` is set in Vercel prod and the AI Yardımçı is live (verified: `/api/app/ai` returns real Haiku answers; ~$0.04 used Jul 19–24).

## Product / site backlog
- [ ] **RU translation** of panel UIs (admin/center/doctor/patient). Public pages + home done; panels deferred by user. Dicts in `src/lib/i18n*.ts`.
- [ ] **DICOM viewer public launch** — `/viewer/[fileId]` gated to Dr. Bakhtiyar (`viewer-access.ts`). Needs 4th-quadrant reference images, then ungate.
- [x] **Monetization: sell storage to centers — FULLY OPERATIONAL.** Platinum-only, +1 TB = 29 ₼ / 30 days (`buyExtraStorageAction`, wallet-debit, `/merkez/paket` UI, upload-limit enforcement, storage-usage bar). Model confirmed 2026-07-25 (Platinum-only, 29₼/TB).
- [x] **Payriff — LIVE.** `PAYRIFF_MERCHANT`/`PAYRIFF_SECRET` in Vercel prod; callback 200. Verified end-to-end: 3 real 1 AZN top-ups settled (PAID → wallet credited via TOPUP ledger). Whole revenue loop works: center tops up wallet via Payriff → buys storage from balance. (1 abandoned PENDING checkout on 2026-07-20 — harmless.)
- [ ] **CRM Faza 2** — beyond current Bugün/Təqvim/Pasiyentlər/SMS/Söhbətlər/Jurnal (see memory `rentgen-az-crm`).

## Analytics / SEO
- [x] **Google Search Console** — domain verified (DNS TXT via Vercel DNS, covers all subdomains). **Sitemap submit still pending** (Search Console → Sitemaps → `sitemap.xml`, 154 URLs).
- [x] **Google Analytics 4** — live (`G-CHQ316PK72`, `NEXT_PUBLIC_GA_ID`). Optional: link GA4 ↔ Search Console (GA Admin → Product Links).
- [x] **Admin analytics dashboard** — merged into İcmal (`/admin`): pending centers → totals → access funnels.
- [ ] **Search-tracking event** (REN-41 gap) — patient search step not instrumented, so the discovery funnel starts at center view, not search.

## Intentionally left (not really todo)
- **8 lint errors** — React-19 best-practice flags in old code (server-component Date.now false positives, setState-in-effect data-fetch patterns, viewer ref). User chose to leave; build passes.
- **2 redesign cosmetics** — ChatInputBar focus binding (keyboard auto-scroll no-op) + dead FilterChip/CategoryChip structs. Left by choice.

## Automation
- **Linear autonomous agents PAUSED** by user (2026-07-25). On resume, review every agent PR by the rule in memory `rentgen-az-linear-agents` (agents cut branches from stale main — never merge directly; apply real files onto current main).

## Notes
- Language mix cleanup (AZ/RU) is a recurring low-priority chore — see memory `rentgen-az-pending-tasks`.
- No open bugs known. Recent fixes/features in `CHANGELOG.md`.
