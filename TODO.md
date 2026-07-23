# TODO

Pending work, in rough priority order. `[ ]` open · `[~]` in progress · `[blocked]` waiting on external input.

## Active — mobile app
- [~] **Chat/messaging in app.** **Backend DONE (text)**: `/api/app/chat/{contacts,messages,send}`, `/api/app/ai`, `/api/app/support/{messages,send}` (`src/lib/app-chat.ts`); AI + Dəstək pinned, ACCEPTED-partner rule, new-message push. **Remaining (Rork):** Worker proxy routes + SwiftUI screens (contact list, conversation, AI, support). **Deferred by user:** image/file sending in chat (do next), canned-reply "scripts" (later). Message-pinning not wanted.
- [x] **Center mobile MVP** — DONE & verified live (Worker v18/v19). Login role picker (Həkim·Mərkəz), İdarəetmə dashboard (requests + status workflow via `/center/status`), Mərkəzim profile, offline cache + pull-to-refresh.
- [x] **Worker `/catalog` → no-store** — Worker v19 dropped the `public, max-age=60`; all routes now default to `no-store`. Leak closed at both layers. (Cosmetic: `/health` + fallback still report `version: 18`.)
- [ ] **Result file download in app.** `/referrals` and `/center/requests` return `files:[{...,url:null}]` — Bax/Endir currently bounces to the site. To open in-app: short-lived presigned B2 link behind a partnership/ownership check. Deferred.
- [~] **Push notifications** (Expo). **Backend DONE**: `PushToken` model, `/api/app/push/register` + `/unregister`, `src/lib/push.ts` (Expo sender + dead-token pruning), wired into `notifyUser` so every event pushes. Works end-to-end the moment the app has a push build. **Remaining (Rork + Apple):** app must request permission, register the token via `/push/register` after login, unregister on logout, and navigate on tap — and this needs the Apple Developer account for the APNs-capable build. Optional site env `EXPO_ACCESS_TOKEN`.
- [ ] **Harden Worker auth.** `/referrals?phone=` and `/center/*` are protected only by the obscure Worker URL + knowing a phone — no per-user auth. Add a signed token bound to the logged-in user. Deferred (low real-world risk given URL secrecy + x-app-key).
- [ ] **SMS on center status change from app.** `/api/app/center/status` sends in-app notifications only; the site's status control also SMSes. Wire SMS here for parity.

## Blocked — waiting on external input
- [blocked] **`GOOGLE_PLACES_API_KEY`** — Google rating feature is fully built (connect Place ID, daily refresh cron `google-ratings`), inert until the key is set in Vercel env. User to create.
- [blocked] **Anthropic credit** — AI Yardımçı (Haiku 4.5) needs account credit. Cheap top-up.
- [blocked] **App store accounts** — Apple Developer ($99/yr) + Google Play ($25) for submission.

## Product / site backlog
- [ ] **RU translation** of panel UIs (admin/center/doctor/patient). Public pages + home done; panels deferred by user. Dicts in `src/lib/i18n*.ts`.
- [ ] **DICOM viewer public launch** — `/viewer/[fileId]` gated to Dr. Bakhtiyar (`viewer-access.ts`). Needs 4th-quadrant reference images, then ungate.
- [ ] **Monetization (next big item)** — sell cloud storage to centers as the primary revenue line (see memory `rentgen-az-monetization`). Payriff pipeline + wallet live; business model/pricing to finalize.
- [ ] **Payriff go-live** — pipeline live (Merchant ES1097669); confirm production credentials + settle the fee/business model.
- [ ] **CRM Faza 2** — beyond current Bugün/Təqvim/Pasiyentlər/SMS/Söhbətlər/Jurnal (see memory `rentgen-az-crm`).

## Notes
- Language mix cleanup (AZ/RU) is a recurring low-priority chore — see memory `rentgen-az-pending-tasks`.
- No open bugs known at handoff. Recent fixes are in `CHANGELOG.md`.
