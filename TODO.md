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
- [x] **`GOOGLE_PLACES_API_KEY` — DONE (2026-07-31).** Key (Places API New) in Vercel prod; ~16 centers auto-connected with live Google ratings (shown on cards + detail + app), daily cron refresh + auto-connect of new centers. 7 centers still need their exact Google link (generic names): Vitamin, Kristal, Dental Clinic Naxçıvan, F Clinic, 3DM Yasamal, 3DM Xalqlar, Implant Dentist.
- [blocked] **Google Play account** ($25) — Android submission (later).

> ~~Anthropic credit~~ — RESOLVED: `ANTHROPIC_API_KEY` is set in Vercel prod and the AI Yardımçı is live (verified: `/api/app/ai` returns real Haiku answers; ~$0.04 used Jul 19–24).

## Marketplace data ops (2026-08 bulk import — active)
- [ ] **54 dental PENDING-i nəzərdən keçir** — `/admin/merkezler?status=PENDING&has=dental`.
  A qrupu (19-u) sitat-təsdiqli 3D/panoram xidmətlərlə gəlir; B qrupu (35) yalnız
  dental-rentgen — zəngdə 3D/panoram dəqiqləşdir. Xüsusi baxış: İmaməliyeva
  (fiziki şəxs), Yeni Qalaaltı Hotel. Mənbə: ~/rentgen_az_hedef_klinikalar.xlsx
- [x] **APPROVED mərkəzlərin şablon siyahısı təmizləndi (2026-08-02).** 185 mərkəz,
  6 664 sətir: MRT/KT/Mammoqrafiya/Densitometriya/Floroskopiya yalnız SÜBUTLA qalır
  (bax DECISIONS). Sonra 51-lik baza 30–51 aralığına yayıldı (185 mərkəz, 1 796 sətir).
- [x] **PENDING şablonu təmizləndi — DONE 2026-08-02.** 113 mərkəz, 5 769 sətir.
- [ ] **Admin-review + approve the PENDING queue.** Use `/admin/merkezler?status=PENDING` with
  the completeness filters + "ən dolğun əvvəl" sort. Delete non-medical junk that slips in.
- [ ] **Add mobile numbers to landline-only centers.** OTP only reaches AZ mobiles. Centers
  with only a city number can't OTP-login; add a mobile → old number auto-preserved in
  `landlinePhone`. Filter `/admin/merkezler` by 🏢 Şəhər nömrəsi to find them. Website scraper
  found ~29 mobiles; the rest need manual entry (user sends them).
- [ ] **Building photos + logos for remaining PENDING.** ~97 had no Google photo; user is
  sending storefront photos/logos which get uploaded to Vercel Blob (pattern in CHANGELOG).
- [x] **Weighted rating + persistent server-side sort** — DONE 2026-08-02 (see CHANGELOG).
- [x] **30/page + auto-filter dropdowns + admin/operator completeness filters** — DONE.
- [x] **Data-driven homepage Azerbaijan map** — DONE (auto-marks cities with APPROVED centers).

## Product / site backlog
- [x] **RU translation — essentially COMPLETE.** All public pages + center/doctor/CRM panels + blog (12 RU posts) are Russian (verified live via ru-cookie cyrillic count). **Admin panel is AZ-only by design — RU version NOT needed, do not track it.** Only `/viewer` (gated pre-launch) + DB content (center/service names, reviews) stay AZ.
- [ ] **DICOM viewer public launch** — `/viewer/[fileId]` gated to Dr. Bakhtiyar (`viewer-access.ts`). Needs 4th-quadrant reference images, then ungate.
- [x] **Monetization: sell storage to centers — FULLY OPERATIONAL.** Platinum-only, +1 TB = 29 ₼ / 30 days (`buyExtraStorageAction`, wallet-debit, `/merkez/paket` UI, upload-limit enforcement, storage-usage bar). Model confirmed 2026-07-25 (Platinum-only, 29₼/TB).
- [x] **Payriff — LIVE.** `PAYRIFF_MERCHANT`/`PAYRIFF_SECRET` in Vercel prod; callback 200. Verified end-to-end: 3 real 1 AZN top-ups settled (PAID → wallet credited via TOPUP ledger). Whole revenue loop works: center tops up wallet via Payriff → buys storage from balance. (1 abandoned PENDING checkout on 2026-07-20 — harmless.)
- [ ] **CRM Faza 2** — beyond current Bugün/Təqvim/Pasiyentlər/SMS/Söhbətlər/Jurnal (see memory `rentgen-az-crm`).

## Analytics / SEO
- [x] **Google Search Console** — domain verified; **sitemap submitted 2026-07-31 (Успешно, 188 URLs discovered).**
- [x] **RU indexing — DONE (2026-08-01).** Russian now at crawlable `/ru/*` URLs with self-canonical + hreflang (az/ru/x-default), sitemap lists both. Was cookie-only (invisible to Google) → now indexable. See memory `rentgen-az-ru-i18n`.
- [x] **SEO quick wins (2026-07-31)** — robots anchored (fixed /hekimler + /merkezler-ucun deindex), next/image card cover, aggregateRating JSON-LD (first-party reviews), richer center meta descriptions.
- [x] **Operator data-entry panel (2026-07-30)** — `/panel` secret-link (role OPERATOR "Nərmin"), loose center create/edit, paste Google link → auto coords+rating+map. Logout fixed 2026-08-01.
- [x] **Şəhər lendinq səhifələri — DONE 2026-08-02.** 14 şəhər.
- [x] **Şəhər × xidmət səhifələri — DONE 2026-08-02.** Yalnız fərqləndirici modallıqlar.
- [x] **Sitemap düzəlişləri — DONE 2026-08-02.** RU öz `<loc>`-u, `x-default`, 2 səhifə.
- [ ] **`DEFERRED_SERVICES`-i aç** — klassik rentgen + USM üçün şəhər×xidmət səhifələri.
  Mərkəzlər öz siyahılarını dəqiqləşdirdikdən SONRA (hazırda hamısında eyni olduğu
  üçün təkrar məzmun olardı). Bax `src/lib/city-service-pages.ts`.
- [x] **Rəy dəvəti mühərriki — DONE 2026-08-02.** Müayinə COMPLETED olandan 2 saat
  sonra pasiyentə SMS + OTP-siz `/rey/davet/[token]` linki. Saatlıq cron. Köhnə 18
  sorğu susdurulub — dəvət 03.08-dən sonra tamamlananlara gedir.
- [ ] **Dəvət konversiyasını izlə** — ilk real dəvətlərdən sonra: neçə SMS getdi,
  neçəsi rəyə çevrildi. `SmsLog.kind = "review_invite"` + `Review.source = "invite"`
  ilə ölçülür. Aşağı olsa mətni/vaxtı dəyiş.
- [x] **FAQ ödəniş + parkinq — DONE 2026-08-02.** 271/363 mərkəzdə FAQ bloku var
  (ödəniş 177, parkinq 241). Parkinq OSM-dən yoxlanılıb; ödəniş Bakı + şəbəkə
  filialları üçün fərziyyədir (bax DECISIONS).
- [ ] **Qalan FAQ sualları — YALNIZ ZƏNGLƏ.** Ölçülüb: OSM-də `wheelchair` datası
  praktiki olaraq yoxdur (1218 obyektdən 8-i), mərkəz saytlarında da bu suallar
  cavablanmır. Nərminin zəng siyahısı: əlil girişi · həkim göndərişi · uşaq qəbulu ·
  nəticə müddəti. Operator paneli (`/panel/[id]`) FAQ redaktorunu artıq göstərir. `CenterFaq` +
  `faqJsonLd` hazırdır. Yalnız YOXLANILA BİLƏN suallar (iş saatı, parkinq, uşaq
  qəbulu, nəticə formatı) mərkəzin öz saytından doldurula bilər — qiymət/keyfiyyət
  iddiaları YOX. Bax DECISIONS (saxta rəy qərarı ilə eyni prinsip).
- **QR plakatlar** — istifadəçi özü edir (3 mərkəzdə sınaqdan keçirilib).
- [x] **Google Analytics 4** — live (`G-CHQ316PK72`, `NEXT_PUBLIC_GA_ID`). Optional: link GA4 ↔ Search Console (GA Admin → Product Links).
- [x] **Admin analytics dashboard** — merged into İcmal (`/admin`): pending centers → totals → access funnels.
- [x] **Search-tracking event (REN-41) — DONE 2026-08-01.** SearchEvent model + TrackSearch on /rentgen-merkezleri; funnel now starts at "Axtarış" (admin İcmal card + row).

## Intentionally left (not really todo)
- **8 lint errors** — React-19 best-practice flags in old code (server-component Date.now false positives, setState-in-effect data-fetch patterns, viewer ref). User chose to leave; build passes.
- **2 redesign cosmetics** — ChatInputBar focus binding (keyboard auto-scroll no-op) + dead FilterChip/CategoryChip structs. Left by choice.

## Automation
- **Linear autonomous agents PAUSED** by user (2026-07-25). On resume, review every agent PR by the rule in memory `rentgen-az-linear-agents` (agents cut branches from stale main — never merge directly; apply real files onto current main).

## Notes
- Language mix cleanup (AZ/RU) is a recurring low-priority chore — see memory `rentgen-az-pending-tasks`.
- No open bugs known. Recent fixes/features in `CHANGELOG.md`.
