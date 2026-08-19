# PROJECT_STATUS

**Project:** rentgen.az — Azerbaijan's dental/medical radiology marketplace (centers, doctors, patients).
**Live:** https://rentgen.az (Vercel, auto-deploy from `main`). CRM subdomain: https://crm.rentgen.az.
**Repo:** github.com/drbakhtiyar/rentgen-az (public). **Stack:** Next.js 16.2.9 (App Router, React 19.2, TS, Turbopack) + Prisma 7 + Supabase Postgres (PRO plan, project `yunonkioubsvozqmezvp`).
**Companion mobile app:** built in Rork (SwiftUI/iOS) — see `ARCHITECTURE.md` §Mobile.

> Read `ARCHITECTURE.md`, `API.md`, `DATABASE.md`, `DECISIONS.md`, `TODO.md` alongside this. Language of the product & UI copy: **Azerbaijani** (RU partially). Admin panel is AZ-only by choice.

---

## Overall status: LIVE and in active development

The web platform is production-live and used by real centers/doctors/patients. The mobile app (doctor MVP) is functionally complete and end-to-end verified; the center MVP is in progress.

**Live numbers (2026-08-04 prod DB):** 418 centers (**292 APPROVED / 126 PENDING**, PENDING-də 🦷 dental qrup), 112 active services (15 categories), 17 doctors, 482 users, 30 published blog posts (18 AZ + 12 RU), 24 cities with APPROVED centers.

### 2026-08 marketplace expansion (this session — see CHANGELOG)
- **~305 imaging centers bulk-imported** from Google Places across 20 cities (PENDING),
  then many manually enriched (mobile phone, building photo, logo, hours, coords, Google
  rating). Repeatable enrichment via throwaway `scripts-tmp-*.mts` (never committed).
- **New field `CenterProfile.landlinePhone`** — preserves the city/landline number when a
  mobile becomes the primary `phone` (OTP only reaches AZ mobiles: 010/050/051/055/060/070/
  077/099). Editable in the center form; shown on admin/operator cards.
- **Listing sort is now URL-driven, server-side global, paginated** (fixed "sort lost on
  page 2"); **weighted Bayesian rating** (`src/lib/rating.ts`) so few-review 5.0s don't beat
  many-review 4.8s; new **"Google reytinqi"** sort. 30/page, auto-filtering dropdowns.
- **Admin/operator center lists**: shared completeness filters + "ən dolğun əvvəl" sort +
  0–5 badge (`src/lib/center-filters.ts`); admin got a **Sil** (delete) button; operator
  panel upgraded to rich edit-only cards.
- **Duplicate policy**: dedup by placeId / same-phone / normalized-name (Cyrillic fold) /
  near-coords — **NOT** by logo or shared switchboard phone. Many network branches share one
  central number and are legit; TƏBİB state hospitals share one logo. Merged dozens of true
  dup listings this session.
- **Homepage hero** → data-driven Azerbaijan map (marker per city with an APPROVED center).
- **TƏBİB logo** stored at stable Blob URL `shared/tabib-logo.png` for state hospitals.

### 2026-08-17/19 blok — QİYMƏT DÖVRÜ, ŞƏBƏKƏ ADMİNLƏRİ (bax CHANGELOG)

- **REAL QİYMƏTLƏR CANLIDA:** 11 mərkəz mənbəli qiymətlərlə dolduruldu —
  Sağlam Ailə 5 filial (saglamaile.az), Dimed (PDF), Diaqnoz (diaqnoz.az,
  304 sətir → 53 xidmət), Mərkəzi Klinika 4 mərkəz (rəsmi kitabça; Gəncə
  −30% + 5-ə yuxarı yuvarlaq). Kataloq 120 xidmət (9 yeni USM/rentgen).
  SEO: AggregateOffer + priceRange schema, «X qiyməti — N–M ₼» title-ları.
- **Xidmət ikonları 111/111 TAMAM**; «3d-tomoqrafiya» generiki deaktiv.
- **ŞƏBƏKƏ ADMİN SİSTEMİ** (Referans/Mərkəzi Klinika/Diamed kimi çoxfiliallılar):
  adminPhone + superAdminPhone (yalnız sayt rəhbəri təyin edir), OTP girişi,
  /merkez/secim filial siyahısı, «⇄ Şəbəkə siyahısı» linki. Bax DECISIONS.
- **CenterProfile.email** sahəsi (kartda mailto + klik izləmə + formalar).
- **Xidmət səhifəsi:** sort-before-limit buqu düzəldi (qiymətlilər indi
  həmişə üstdə), analizler.az üslubunda sıra-siyahı (ServiceCenterRows).
- **Fold-axtarış:** «saglam aile» → Sağlam Ailə (diakritik+translit+boşluq).
- **Panel Impilo restyle** (scoped CSS token override — struktura toxunulmadan);
  «boz yumru panel» ortaq dili (FAQ/xidmətlər/kataloq); 5 səhifədə vahid
  hero→panel boşluğu; interaktiv ana səhifə xəritəsi (klik → şəhər filtri).
- **pacs.rentgen.az** subdomeni (qarşılama + /viewer hazır infrastruktur).
- **/haqqimizda** səhifəsi (AZ+RU, canlı rəqəmlər).
- **Əlaqə formu:** həkim sahəsi çıxdı, «müraciətin mövzusu» seçimi gəldi.
- MediStyle/Rahimov/Piccasa kart yeniləmələri; Bəyaz Diş dublikatı deaktiv
  (qeydiyyat axını dedup ETMİR — bilinən boşluq, TODO-da).

### 2026-08-13/15 blok — DİZAYN v2, STATİSTİKA, TƏHLÜKƏSİZLİK (bax CHANGELOG)

- **DİZAYN v2 «Impilo» CANLI (2026-08-13):** saytın bütün ictimai hissəsi kökündən
  yenidən işlənib — tünd iris (bənövşəyi-göy) ailəsi, Pearl fon, Manrope 500/600,
  pill düymələr, 24px kartlar. Tokenlər `src/app/globals.css` `@theme` blokunda,
  üslub bələdçisi **`DESIGN.md`**-də. Köhnə dizayna qayıdış NƏZƏRDƏ TUTULMUR
  (`design-v1` tagı istifadəçi qərarı ilə silindi). Panellər (admin/mərkəz/həkim/
  CRM) HƏLƏ köhnə vizualdadır, redizayn edilməyib.
- **Xidmət ikonları (33) + səhifə hero ikonları (6):** istifadəçi ChatGPT-də
  yaradır, mən `sharp` ilə kəsib Vercel Blob-a yükləyirəm; xəritə
  `src/lib/service-icon-map.ts` (DB-yə YAZILMIR). CSS animasiyalı çərçivələr:
  `service-icon-visual.tsx` (xidmət detalı), `services-hero-visual.tsx`
  (`PAGE_HERO` xəritəsi ilə 6 daxili səhifə). **Qayda: örtük/ikon generasiyasını
  MƏN etmirəm — yalnız istifadəçinin göndərdiyini emal edirəm** (bax DECISIONS).
- **Statistika sistemi (4 faza, hamısı canlı):** izləmə genişləndi (directions,
  license, faq, website, instagram); `/merkez/statistika` (8 metrik, ±% müqayisə,
  SVG qrafik, 7/30 gün); `/admin/merkez-statistika` (bu gün/7/30, reytinq sırası);
  həftəlik WhatsApp hesabatı cronu (B.e 09:00 Bakı, `heftelik_hesabat` şablonu
  TƏSDİQLƏNİB ✅, yalnız ≥3 hadisəli mərkəzlərə). **Qapı (gating) HƏLƏLİK
  AÇIQDIR** — sonra Silver+ paketə bağlanacaq.
- **Bot özünəxidmət:** bot artıq mərkəzə öz `/q` `/f` `/m` linklərini verə bilir,
  amma **üçmərhələli təhlükəsizliklə**: (1) kod qatı — nömrə mərkəzin qeydə alınmış
  nömrəsi ilə uyğun gəlmirsə link kontekstə HEÇ DÜŞMÜR (LLM avtorizasiya etmir);
  (2) dialoq təsdiqi; (3) hücum-rədd qaydası + few-shot nümunə.
- **TƏHLÜKƏSİZLİK AUDİTİ (2026-08-14/15) — bax `SECURITY.md`:** CI (CodeQL,
  Semgrep, TruffleHog, OSV, Scorecard, Dependabot); təhlükəsizlik başlıqları;
  sürət limiti sistemi (`RateLimit` cədvəli, 10+ endpoint); token TTL 45 gün;
  IDOR auditi TƏMİZ; admin 2FA kodunun loglanması silindi (tapılan tək real qüsur);
  balans artırmada 10 000 ₼ yuxarı hədd. **Qayda: ZAP/Nuclei/fuzzing CANLI SAYTA
  ƏSLA yönəldilmir** — yalnız staging (staging bazası istifadəçi qərarı ilə
  hələlik ALINMAYIB).
- **WhatsApp ↔ sayt söhbətləri AYRILDI:** `AdminMessage.internal` sahəsi — güzgü
  mesajları (📲/🤖), körpü cavabları, ⚠️ xəbərdarlıqlar və 👀/✅ izləmə qeydləri
  mərkəzin öz panelində GÖRÜNMÜR, yalnız admin/operator görür (697 mesajın 69-u
  geriyə dönük işarələndi). Söhbət başlığında **24 saatlıq Meta pəncərəsi**
  göstəricisi (🟢 açıq · N saat / 🔒 bağlı).
- **Robot-robot qoruması (2026-08-15):** klinikaların WhatsApp Business
  greeting/away şablonlarına bot cavab yazırdı → mənasız yazışma. İndi
  `src/lib/wa-auto-reply.ts` belə mətnləri tanıyır və **bot susur**; əlavə döngə
  qoruması (təkrar mətn 15 dəq / bot 5 cavab həddi).

### 2026-08-11/12 blok — WHATSAPP BOTU CANLI (bax CHANGELOG)
- **Meta Cloud API GO-LIVE:** +994 99 580 13 13 CONNECTED/CLOUD_API. Kimliklər:
  App id=1602952428191651 · WABA=1729407764977766 · PHONE_ID=1328305727023335 ·
  register PIN=580131. Daimi SYSTEM_USER token + app secret + verify token
  YALNIZ Vercel prod env-də (4 × WHATSAPP_*). Telefon tətbiqindən nömrə tam
  çıxarılıb. Real testdə bot cavab verdi.
- **Bot:** claude-sonnet-5 (Haiku qaydaları pozurdu — bax DECISIONS), sərt
  qaydalar toplusu (nömrəli menyu + tək-rəqəm seçim, məlumat toplama protokolu,
  ad-yalnız-bazadan + fuzzy axtarış/TAPILMADI axını, nömrə tanıma
  mobil/şəhər, icra-vədi qadağası, parol-yoxdur, terminologiya), 22 BotSection,
  7 gün/20 dövr yaddaş, səsli/şəkil sabit cavablar. Sınaq: /bot-sinaq/<token>.
- **Əməliyyat mərkəzi:** "WhatsApp söhbətləri" bölməsi (admin+operator),
  cavab körpüsü (24s pəncərə), bot susma 30 dəq + "🤫" nişanı, naməlum
  nömrələr də güzgülənir, nişanlar system/whatsapp bölünür.
- **Şablonlu dəvətlər:** wa.me ləğv — 4 kampaniya platforma nömrəsindən Meta
  şablonu ilə gedir (⏳ şablonlar PENDING, ödəniş kartı ✓). Məntiqli növbə +
  səbəb sətri + soyuma qaydaları qüvvədə.
- **Operator paneli** admin vizualında (DashboardShell): 7 bənd, Bot beyni
  yalnız-baxış, toplu mesaj operatora açıq (yalnız daxili!).
- Bloq 21 AZ + 21 RU; FAQ 53×2 çip-naviqasiyalı; SEO dental-Bakı irsi
  təmizləndi; şəhər səhifələri RU; Jurnal = vahid sistem lenti; Alliance
  Clinic PENDING əlavə edildi.

### 2026-08-03/04 blok (bax CHANGELOG — hamısı canlıda)
- **Dental klinika importu:** ~/rentgen_az_hedef_klinikalar.xlsx-dən 54 PENDING (sonra 3
  istifadəçi qərarı ilə silindi, +fərdi əlavələr: Swissdent, Piccasa, Dentinn, Dent-Inn);
  🦷 Dental filtri admin/operator siyahılarında; dərin zənginləşdirmə (33 foto, 9 loqo).
- **Qiymət toplama kampaniyası:** `/panel/whatsapp` (Nərmin, gündə 12 wa.me göndərişi) +
  girişsiz `/q/<token>` qiymət formu. Konversiya ~1 həftəyə ölçülməli.
- **WhatsApp AI botu:** webhook + `/admin/bot` "Bot beyni" (BotSection DB) + canlı test
  qutusu. **Meta env-ləri gələnə qədər PASSİV** (bax TODO blocked).
- **Rəy dəvəti mühərriki:** COMPLETED müayinədən 2 saat sonra SMS + OTP-siz
  `/rey/davet/<token>`; yalnız 03.08 20:00 UTC-dən sonra tamamlananlara.
- **Hero xəritəsi v2:** rayon-səviyyəli choropleth (79 rayon, `az-rayons.ts`), 15 şəhər
  etiketi; köhnə variant `VARIANT="dots"` ilə saxlanılıb. Başlıq: "Azərbaycanda … tapın".
- **Bloq:** +6 qeyri-dental SEO yazısı (MRT, KT-MRT fərqi, hamiləlik, USM hazırlıq,
  mammoqrafiya, DEXA) — brend vektor cover-lərlə.
- **Əlaqə:** platforma telefonu saytdan çıxarıldı (yalnız WhatsApp yazışması —
  nömrə gözlənilir); **info@rentgen.az** canlı (ImprovMX → gmail, yalnız qəbul).
- **/telimat:** mərkəzlər üçün gizli (noindex) istifadə təlimatı, redizayn edilib.

### 2026-08-02 SEO təmizliyi (data-only — bax CHANGELOG/DECISIONS)
Sayt 48 saatda ~10 → 246 indekslənən mərkəz səhifəsinə çıxdı; audit kütləvi təkrar məzmun
və uydurma xidmət iddiaları aşkarladı. Düzəldildi: **unikal təsvir 39 → 246/246**;
modallıq iddiaları sübutla məhdudlaşdırıldı (**MRT 188 → 15, KT 190 → 18**); eyni 51-lik
siyahı 30–51 aralığına yayıldı (**fərqli xidmət dəsti 171/246**, ən böyük təkrar qrup
186 → 14); şəhər dəyəri 31 → 23 (Bakı filtri 92 → **134**). Boş xidmət səhifəsi 0/112.

**⚠️ Follow-up owed:** the 117 PENDING centers still carry the **full 89-service template** —
eyni sübut qaydası + yayılma təsdiqdən əvvəl onlara da tətbiq edilməlidir. Landline-only
centers need a mobile before they can OTP-login. See TODO.md.

## Roles (enum `Role`): PATIENT · CENTER · DOCTOR · ASSISTANT · ADMIN
- Multi-role: one phone/account can be patient + center + doctor simultaneously (role picked at login tab). `ASSISTANT` is a shared role for center-assistants and doctor-assistants (resolved dynamically).

## Completed / live features

**Public site:** center directory (`/rentgen-merkezleri`), doctor directory (`/hekimler`), full services catalog (`/xidmetler`, 112 services / 15 categories, modality-aware SEO), packages/pricing (`/paketler`), blog, FAQ, contact, patient booking form (with occupancy-aware real slots + type-ahead service/doctor inputs for guests).

**Auth:** phone + OTP (SMS via Lsim.az), role tabs (Pasiyent/Mərkəz/Həkim) on `/giris`; admin via secret link `/admin-giris/<ADMIN_ACCESS_KEY>` (+ optional email 2FA). Session = JWT cookie (`rx_session`), shared across `.rentgen.az`. `User.sessionVersion` embedded in token → bump invalidates all tokens (used on assistant removal/deactivation).

**Center panel** (`/merkez/*`): profile (hours, services, address, **Google rating** connect), patients/requests (status flow NEW→CONTACTED→COMPLETED/CANCELLED), rentgen file upload (B2), services & prices (category-grouped + search), partner doctors, reviews, package/balance (Payriff card payments), trash bin, export.

**CRM** (`crm.rentgen.az`, PLATINUM-only): Bugün, Təqvim (Day/3-day/Week/Month, drag-reschedule, time blocks, lunch, holidays), Pasiyentlər (manual add + file upload synced with center panel), SMS-lər (balance, packages 1000=60₼/5000=280₼/10000=500₼, campaigns, reminders), Ayarlar (slot booking, assistant management max 1), Söhbətlər (partner+admin chat + AI helper), Jurnal (owner-only activity log). Mobile: 3-day calendar view, hamburger nav.

**Doctor panel** (`/hekim/*`): referrals overview, patients + results, partner centers, chat, notifications, profile (+ assistant management max 1), package/balance. Doctor QR referral.

**Assistants** (center + doctor): OTP-added (max 1 each), phone-only CRM login / main-site tab login; day-to-day work only; owner-gated settings/SMS/billing; "you are X's assistant" banner; dedicated `/admin/asistentler`; hard session revocation on removal. Full audit `#1–#7` closed (see DECISIONS).

**Admin panel** (`/admin/*`): centers, doctors, patients, requests (status+center filters), reviews (center-name autocomplete + date filters), referrals, partnerships, blog, payments, services, SMS, params, journal, incomplete-signups, assistants, AI helper, chats.

**Monetization pipeline:** Payriff live (Merchant ES1097669, APPROVED=paid); wallet ledger; plan auto-downgrade cron; SMS credits sold from platform Lsim pool (reserve 1000). CRM = Platinum feature.

**AI Yardımçı** (panels): Anthropic Haiku 4.5 system Q&A helper, inside Söhbətlər/chat. Needs Anthropic account credit.

**DICOM viewer** (`/viewer/[fileId]`): MPR/measure/implant tools — **PRE-LAUNCH gated to Dr. Bakhtiyar only** (`src/lib/viewer-access.ts`), waiting for reference images for the 4th quadrant.

**Google rating:** centers connect a Place ID/name → cached rating shown on their page; daily cron refresh. **Needs `GOOGLE_PLACES_API_KEY` env to activate.**

**Mobile app (`/api/app/*` bridge):** doctor MVP complete (login via whoami+OTP, referral with patient OTP, patient list w/ status filter + files). **Center MVP complete & verified live** (Worker v18): Həkim·Mərkəz login role picker, `whoami?role=CENTER`, İdarəetmə dashboard (incoming requests, New/Total counters, status chips, status workflow writing back via `/center/status`), Mərkəzim profile, per-phone offline cache + pull-to-refresh.

## Known gaps / not done (see TODO.md for full list)
- Mobile: result file Bax/Endir opens site (files return `url:null`); no push notifications; Worker endpoints unauthenticated beyond obscure URL (token hardening deferred).
- RU translation of panel UIs (admin/center/doctor/patient) — deferred by user.
- DICOM viewer 4th quadrant + public launch pending.

## Waiting on external input (blocked-pending)
- **Meta şablon təsdiqi** — dəvət şablonları (qiymet/faq/kart/kabinet_devet) və
  `heftelik_hesabat` ✅ TƏSDİQLƏNİB, real dəvətlər göndərilir. Qalan yeni
  şablonlar üçün status: GET /1729407764977766/message_templates.
- **Meta Business verification (Step 3)** — Axiora sənədləri ilə; limitləri
  qaldırır (250→1000+/gün), şablon yoxlamalarını sürətləndirir.
- Apple Developer ($99/yr) + Google Play ($25) accounts for app store submission.
- **`GOOGLE_PLACES_API_KEY`** — mərkəzlərin Google reytinqi üçün (bax memory
  `rentgen-az-google-rating`).

## Critical operational notes
- **Same Supabase DB powers site + mobile app.** Never reset the DB password without updating Vercel `DATABASE_URL` + `DIRECT_URL` (else the live site 500s). Supabase `pg_pgrst_no_exposed_schemas` 503 logs are harmless (PostgREST/Data API is unused).
- Deploy = push to `main` (Vercel). Migrations: `npm run db:migrate:dev -- --name X`.
- **Deploy yoxlaması SHA ilə:** "canlıda görünmür" şübhəsində `since`-timestamp
  müqayisəsinə güvənmə (bir dəfə yalançı "webhook işləmir" diaqnozu verdi) — canlı
  deployment-in commit SHA-sını `git log` ilə tutuşdur. Sessiyasız qorunan marşrut
  (məs. /panel) 307 qaytarır — bunu marşrutun mövcudluğu kimi oxuma (BUILDING ola bilər).
- User directives (persistent): **always commit & push every change; don't ask for small decisions, act; never delete without asking; touch only what's requested.**
