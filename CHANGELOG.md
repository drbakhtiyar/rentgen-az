# CHANGELOG

Reverse-chronological. Grouped by theme; each line is a shipped commit (see `git log` for full history). Dates approximate to when the block landed.

## 2026-08-02 — Rəy dəvəti (real rəy axını)

Səbəb: 246 mərkəzdən yalnız 1-ində rəy var. Rəy forması və QR səhifəsi mövcud idi,
amma **heç kim rəy istəmirdi** — pasiyent sayta geri qayıtmır. Bazada cəmi 18
tamamlanmış müayinə var (2 mərkəzdə), yəni problem rəy deyil, **soruşmamaq** idi.

- **Sxem:** `AppointmentRequest` → `completedAt`, `reviewInviteSentAt`, `reviewToken`
  (miqrasiya `20260802120000_review_invite`, prod-a tətbiq olunub → 54 miqrasiya).
- **`src/lib/review-invite.ts`** — dəvət məntiqi; **saatlıq cron**
  `/api/cron/review-invites` (:15). Cron seçildi, çünki status 5 fərqli yoldan
  dəyişir (mərkəz paneli, CRM, admin, mobil app, pasiyent kabineti) — hər çağırış
  yerinə qarmaq taxmaq qaçırılma riski yaradırdı. `completedAt` bütün bu yollarda
  yazılır.
- **`/rey/davet/[token]`** — OTP-siz rəy səhifəsi (`InviteReviewForm`). Bir ekran,
  bir toxunuş: ulduzlar + istəyə bağlı şərh. `noIndex` (şəxsi link).
- **Qoruyucular:** 2 saat gecikmə · 30 gün TTL · 60 gündən köhnə sorğuya yox ·
  eyni (mərkəz+nömrə) cütünə yalnız BİR dəvət · artıq rəy yazana yox (nömrə ilə də
  yoxlanılır) · rəy qəbul etməyən planda ötürülür · `INVITE_START_AT` = 03.08.
- **Köhnə 18 sorğu susdurulub** (istifadəçi qərarı) — dəvət yalnız 3 avqustdan
  sonra tamamlananlara gedir. SmsKind: `review_invite`.

## 2026-08-02 — SEO təmizliyi: təkrar məzmun + uydurma xidmət iddiaları

Səbəb: 48 saatda indekslənən mərkəz səhifəsi ~10 → 246 oldu (sitemap 188 → 408 URL).
Audit göstərdi ki, səhifələrin böyük hissəsi bir-birinin təkrarıdır və importun
yapışdırdığı xidmət siyahısı yanlışdır. Üç mərhələdə düzəldildi (hamısı data,
`scripts-tmp-*` ilə; hər addımın ehtiyat nüsxəsi scratchpad-dədir).

**1. Unikal mərkəz təsvirləri** — `src/lib/center-description.ts` (commit `d763a2f`).
207 mərkəzin şablon təsviri deterministik generatorla əvəzləndi: 20 açılış × 4 yer ×
11 qrafik × 11 reytinq × 12 yekun + mərkəzin ÖZ faktları (rayon/ünvan, iş saatı,
Google rəy sayı). Nəticə: **unikal təsvir 39 → 246/246**, ən böyük təkrar qrup 78 → 1,
meta description 246/246 unikal. 39 həqiqi (mərkəzin öz) təsvirinə toxunulmadı.
Generator modallıq (MRT/KT/USM) SADALAMIR — bax DECISIONS.

**2. Sübuta əsaslanan modallıq kəsimi** — 185 mərkəz, **6 664 sətir silindi**.
Ayrıca aparat tələb edən 5 kateqoriya (MRT 10, KT 14, Mammoqrafiya 4, Densitometriya 4,
Floroskopiya 6 = 38 xidmət) yalnız SÜBUT olduqda saxlanıldı. Sübut mənbələri: mərkəzin
öz vebsaytı (Google `websiteUri` → 115 mərkəzdə var, 82-si oxundu), `equipment`, ad.
Nəticə: MRT iddia edən 188 → **15**, KT 190 → **18**, Mammoqrafiya 187 → **8**,
Densitometriya 187 → **6**, Floroskopiya 186 → **5**.

**3. 51-lik siyahının 30–51 aralığına yayılması** — 185 mərkəz, **1 796 sətir**.
Eyni 51 xidməti daşıyan 192 mərkəzin siyahısı mərkəzin ölçü balına görə (Google rəy
sayı, Places `primaryType`, sayt, şəkil, iş saatı → 0–9 bal) 30–51 aralığına yayıldı.
Kəsmə TƏSADÜFİ DEYİL — nadirlik sırası ilə: nüvə müayinələr (ağciyər, bel onurğası,
əl/ayaq, qarın USM…) heç vaxt silinmir, nadir proyeksiyalar (mastoid, orbita, TMJ,
koksiks, bone-age…) əvvəl gedir. Hər xidmət ən azı 20 mərkəzdə qalır (döşəmə
qoruyucusu) — boş qalan xidmət səhifəsi **0/112**.

**4. Şəhər normallaşdırması** — 42 mərkəz. Bakı bazada 9 ayrı dəyərə bölünmüşdü
(`Bakı`, `Bakı — Nərimanov`…) → filtr 134-dən yalnız 92-ni göstərirdi. Rayon `city`-dən
`district` sahəsinə köçürüldü, küçə adı düşmüş `district` dəyərləri təmizləndi
("Babək prospekti" → `Xətai`). Şəhər dəyəri 31 → 23; Bakı filtri artıq 134 mərkəz.

**Yekun (prod, 246 APPROVED):** unikal təsvir 246/246 · fərqli xidmət dəsti 171
(ən böyük təkrar qrup 14, əvvəl 186) · 37 fərqli xidmət sayı variantı.

**Operator izi** (commit `98ad21e`) — `/panel` heç nə qeyd etmirdi; artıq operator
create/edit `AdminActionLog`-a yazılır. `src/lib/center-editors.ts` →
`centerIdsEditedByOperator()`. Jurnalda "Nərmin (operator)" görünür. **Keçmiş
redaktələr bərpa oluna bilmir** — iz yox idi.

## 2026-08-01 → 08-02 — Marketplace data expansion + listing UX

**Bulk center import & enrichment (data-only, via throwaway `scripts-tmp-*.mts`)**
- Imported **~305 imaging/diagnostic centers** from Google Places (New) across 20 cities as
  PENDING. Now **363 centers total (246 APPROVED / 117 PENDING)**. Each got: Google
  rating/reviewCount/placeId, coords, address, and the **full 89 non-dental imaging services
  as a template** (must be trimmed per center at approval).
- Enrichment pipeline (repeatable script pattern): `places:searchText` w/ `locationBias`
  circle → placeId+rating+coords+address+phone+`regularOpeningHours`; `places/{id}` photos →
  building photo → Vercel Blob; hours JSON conversion (Google periods → `hours` WeeklyHours);
  **website mobile scraper** (Google `websiteUri` → regex AZ mobile → set as OTP-capable phone).
- **Dozens of centers manually enriched** (user sends name + phone + Google link + logo/photo
  screenshots): mobile number set as primary `phone` (OTP), building photo + logo uploaded to
  Blob, working hours + coords + Google rating filled.
- **Duplicate detection & merge**: audit by placeId / same-phone / normalized-name (Cyrillic
  homoglyph fold) / <120 m coords + shared token. Merged many dup listings (Şəki central
  hospital = 6 listings → 1; Quba, MediClub, Alyans, Ağcabədi, İmişli, Lənkəran, etc.). Kept
  the fullest record, copied missing fields, deleted the redundant one + its owner user.
- **Cleanup**: removed non-medical junk that slipped the import filter (AVTO DIAQNOSTIKA, a
  district-name entry, individual doctors, generic empty names).

**New schema field**
- **`CenterProfile.landlinePhone`** (migration `20260801140000_center_landline`) — when a
  mobile becomes the primary `phone` (for OTP), the old city/landline number is preserved here
  so contactability isn't lost. Exposed in the center edit form (`landlinePhone`, az+ru label)
  and shown on admin/operator cards.

**Listing / sort UX (`/rentgen-merkezleri`)**
- **Weighted (Bayesian) rating** — `src/lib/rating.ts`. A 5.0 from 2 reviews now ranks below
  a 4.8 from 50. Formula `(avg·n + M·C)/(n + C)`, M=4.2, C=8; unrated sort last.
- **Sort is now URL-driven + server-side global + paginated** — fixes "sort lost on page 2".
  `?sort=` param; `rating`/`googleRating`/`price` sort the FULL matching set on the server then
  paginate; pagination links preserve `sort`. Client only reorders the current page for
  `distance` (geolocation). New **"Google reytinqi"** sort option (i18n `sortGoogleRating`).
  "Yüksək reytinq" = own reviews ×1.5 blended with Google.
- **30 per page** (was 12); **dropdown filters auto-apply** (service + rayon navigate without
  the Axtar button; free-text still uses the button). 3-column grid (5-col trialled, reverted).

**Admin & operator center management**
- Shared `src/lib/center-filters.ts` — completeness quick-filters (📞 telefon / 📱 mobil /
  🏢 şəhər / 🖼 şəkil / ⭐ reytinq / 🕐 saat) + "Ən dolğun əvvəl" sort + 0–5 completeness badge,
  used by BOTH `/admin/merkezler` and `/panel`.
- **Admin "Sil" (delete) button** on center cards (`deleteCenterAction`, cascade + owner user
  cleanup, confirm dialog, audit-logged).
- **Operator panel `/panel`** upgraded to the same rich cards as admin, but **edit-only** (no
  approve/deactivate/block/delete). Mobile/landline distinguished via AZ prefixes.

**Homepage**
- Hero visual replaced (CBCT animation → **decorative real-GeoJSON Azerbaijan map** +
  Nakhchivan) with a glowing marker per city that has an APPROVED center. **Data-driven**
  (`getCoveredCities()` → `src/lib/az-cities.ts` projection), non-interactive.

**Assets**
- **TƏBİB logo** stored at a stable Blob URL `shared/tabib-logo.png` — applied as the logo for
  state (TƏBİB-affiliated) hospitals that have no own logo. Shared logo is **NOT** a duplicate
  signal (dedup ignores logo). Applied to Bərdə Rayon Mərkəzi Xəstəxanası.

## Mobile app bridge (`/api/app/*`) — current focus
- **Chat backend built (text).** `/api/app/chat/{contacts,messages,send}` + `/api/app/ai` + `/api/app/support/{messages,send}` — phone-authed mirrors of the site chat actions (`src/lib/app-chat.ts`), reusing `getChatContacts`/`askAssistant`. AI + Dəstək pinned, ACCEPTED-partner rule, new-message push. Images + canned scripts deferred. Rork builds the app screens next.
- **Push notifications — backend built (native APNs).** New `PushToken` model + migration; `/api/app/push/register` + `/unregister`; `src/lib/push.ts` sends **directly to Apple APNs** (HTTP/2 + ES256 JWT from the `.p8` key) — the app is a native build with raw APNs tokens, not Expo. Wired into `notifyUser` so every event (referral/status/result/partner/review/message) pushes; dead tokens pruned. Inert until `APNS_*` env vars are set (Apple Developer account). *(Initially mis-built for Expo; corrected to direct APNs.)*
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

## Web panels
- **Browser desktop alerts** (doctor + center panels) — while the panel tab is open, a new patient request or chat message triggers a WebAudio "ding", a `(N)` tab-title counter, and a desktop Notification (if permitted). `getAlertCountAction` (combined unread) + `DashboardAlerts` client component in `DashboardShell`; no asset, no schema change. Audio/permission unlocked on first gesture.

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
