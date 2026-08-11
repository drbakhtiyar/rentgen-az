# CHANGELOG

Reverse-chronological. Grouped by theme; each line is a shipped commit (see `git log` for full history). Dates approximate to when the block landed.

## 2026-08-12 — 🚀 WHATSAPP BOTU CANLIDA — Meta Cloud API qoşuldu

Tam go-live: istifadəçi Meta Business (Axiora) + WABA qurdu, app yaradıldı
(Rentgen.az, id 1602952428191651), SYSTEM_USER daimi token alındı. Webhook API
ilə qeydiyyatdan keçirildi (callback https://rentgen.az/api/whatsapp/webhook,
messages sahəsi, active:true). İlk nömrə qeydi SMB tipli çıxdı (telefon
tətbiqindən) → register mümkün olmadı → istifadəçi tətbiqdən hesabı sildi →
YENİ Cloud nömrə qeydi yaradıldı: WABA 1729407764977766, PHONE_ID
1328305727023335 → API-dən register (PIN: 580131) → status CONNECTED /
CLOUD_API. WABA→app abunəsi API ilə (subscribed_apps). 4 env Vercel prod-da.
CANLI TEST UĞURLU: real WhatsApp mesajına bot cavab verdi. QALAN: operator
cavab körpüsü (panel Söhbətlər → sendWaText) — telefon tətbiqi artıq yoxdur,
insan cavabı hazırda yalnız botdadır.

## 2026-08-11 — Bot sərtləşdirilməsi: canlı test sessiyasından 10+ düzəliş

İstifadəçi sınaq səhifəsində real ssenarilərlə test etdi, hər tapıntı dərhal
qaydaya çevrildi: (1) nömrə tanıma — şəhər nömrəsi (012/018/022...) girişə
qəbul edilmir, mobil istənilir; (2) icra vədi qadağası — bot "əlavə etdim"
demir, operatora ötürür; (3) nömrəli menyu + tək rəqəmlə seçim (defis siyahısı
qadağan); (4) məlumat toplama protokolu — klinika adı+şəhər olmadan "qeyd
etdim" yoxdur, yekunda toplananlar təkrarlanır; (5) terminologiya — "kartınız"
yalnız profil mənasında; (6) parol anlayışı yoxdur; (7) mərkəz adı YALNIZ
bazadan: nameLookupContext — fuzzy axtarış (translit kh→x + Levenshtein),
tapılanda tam adla təsdiq, TAPILMADI blokunda 3-variantlı axın (dəqiq ad /
səhifə linki → slug-la dəqiq tanıma / yeni qeydiyyat); (8) səsli/video mesaja
sabit cavab, şəkil/sənədə təşəkkür (webhook, AI-sız); (9) sınaq çatı: linklər
kliklənən, konteyner-daxili skrol, ulduz-link buqu; (10) cavab limiti 400→800.
ƏSAS: bot Haiku→Sonnet keçdi — Haiku çoxqaydalı axınlarda qaydaları ardıcıl
pozurdu; panel AI yardımçısı Haiku-da qalır. Bot beyni 22 bölmə + /bot-sinaq
paylaşılan test linki.

## 2026-08-10 — Bloq: +3 yeni mövzu (AZ+RU dərhal birlikdə)

Toxunulmamış mövzular, hər biri iki dildə: ağciyər rentgeni/KT
(`agciyer-rentgeni-ne-gosterir` / `chto-pokazyvaet-rentgen-legkih`), tiroid USM
(`tiroid-usm-kime-lazimdir` / `uzi-shchitovidnoy-zhelezy`), uşaqlarda görüntüləmə
təhlükəsizliyi (`usaqlarda-goruntuleme-tehlukesizdirmi` / `rentgen-detyam-bezopasno-li`).
3 yeni brend vektor cover (ağciyər · tiroid+doppler · uşaq+qalxan) Blob-da,
AZ/RU cütlükləri cover-i paylaşır. Bloq cəmi: 21 AZ + 21 RU.

## 2026-08-10 — Bloq: 6 qeyri-dental yazının RU versiyaları

AZ yazıların rusca qarşılıqları ayrı sluglarla (chto-takoe-mrt, kt-ili-mrt-raznica,
rentgen-pri-beremennosti, podgotovka-k-uzi-bryushnoy-polosti,
mammografiya-s-kakogo-vozrasta, chto-takoe-densitometriya-dexa) — DB-yə yazıldı,
cover-lər AZ -v2 fayllarını paylaşır, daxili linklər /ru/ prefikslidir. RU bloq
12→18 yazı; sitemap avtomatik götürür.

## 2026-08-10 — WhatsApp kampaniya mərkəzi: 4 dəvət növü + girişsiz özünəxidmət formları

`/panel/whatsapp` + `/admin/whatsapp` (admin-ə yeni nav bəndi) indi 4 tablıdır,
hamısı ORTAQ gündə-12 limitini bölüşür, hər tabda diakritik-fold ad axtarışı var
("beyaz" ~ "Bəyaz"), mesajlar variantlı və əhəmiyyət-izahlıdır:
- **💰 Qiymət** → `/q/<token>` (mövcud; "+" ilə kataloqdan xidmət əlavə etmə qazandı)
- **❓ FAQ** → `/f/<token>` — 10 sabit sual (center-faq.ts), prefill, boş sahə köhnəni silmir
- **📋 Kart** → `/m/<token>` — xidmət təsdiqi (checkbox-la SİL + "+" ilə ƏLAVƏ),
  qiymətlər, həftəlik iş saatları ("hamısına tətbiq et"); silinənlər jurnal
  meta-sında; foto/loqo "elə çata göndərin" qeydi
- **🔑 Kabinet** → `/merkez-kabineti` eniş səhifəsi (parolsuz giriş 3 addım +
  6 fayda kartı); növbəyə yalnız sahibi placeholder olan (aktivləşməmiş) mərkəzlər
Jurnal açarları: wa_price/faq/card/cabinet_invite + özünəxidmət izləri
price/faq/card_self. Robots DÜZƏLİŞİ: "/f" prefiksi /faq-ı bloklayırdı →
"/q/" "/f/" "/m/". WhatsApp Business profil mətnləri + salamlama/uzaqda/8 sürətli
cavab istifadəçiyə verildi (tətbiqdə qurulur, kod yox).

## 2026-08-10 — FAQ restrukturu + qeydiyyat şəhər siyahısı təmizliyi + Axiora nişanı

- **FAQ** (`/faq`): köhnə 14 dental-dövr sualı → **53 sual × 2 dil**, çip-naviqasiyalı
  tək səhifə (istifadəçi 3 varinatdan bunu seçdi). Sıra: "Platforma haqqında" (10 sual)
  → MRT · KT · USM · Mammoqrafiya · DEXA · Klassik rentgen · Dental (6–7 sual hərəsi).
  `src/content/faq.ts` bölmə strukturu (`getFaqSections`), `faq-sections.tsx` yapışqan
  çip zolağı (IntersectionObserver aktiv çip; bütün bölmələr həmişə DOM-da — SEO).
  Ana səhifə teaseri = platforma ilk 6. Köhnə dental suallar Dental bölməsinə köçdü.
- **Qeydiyyat şəhər siyahısı**: `CITY_NAMES`-dən 12 "Bakı — rayon" seçimi çıxarıldı
  (08-02 qaydası: city yalnız şəhər). Bəyaz Diş (beyaz-dis-2, özü qeydiyyatdan keçmişdi)
  normallaşdırıldı: city=Bakı, district=Nərimanov, "Gənclik metrosu" ünvana keçdi.
- **Axiora**: footer alt zolağının ortasında A-loqo + AXIORA → axiora.az
  (əvvəl "An AXIORA Company", sonra istifadəçi istəyi ilə yalnız "AXIORA");
  Organization JSON-LD-yə parentOrganization. Eyni nişan analizler.az və implant.az-a da
  qoyuldu. implant Vercel-i git-ə bağlıdır (köhnə CLI-only qeydi düzəldildi);
  jafarnajafov/implant upstream remote-u istifadəçi istəyi ilə tam kəsildi.

## 2026-08-09 — Platforma WhatsApp nömrəsi canlıda: +994 99 580 13 13

Nömrə gəldi və hər lazımi yerə yayıldı — mərkəzi mənbə `src/lib/constants.ts`
(`PLATFORM_WHATSAPP` / `_DISPLAY` / `_URL`): `/elaqe` düyməsi (saxta wa.me/994500000000
əvəzləndi, nömrə görünür), footer WhatsApp sətri, `/telimat` dəstək bölməsi,
Organization JSON-LD `contactPoint`+`email`. Yalnız YAZIŞMA — `tel:` linki qəsdən
yoxdur (DECISIONS: yalnız-WhatsApp əlaqə). Bot beyninə DB-də "Əlaqə məlumatları"
bölməsi əlavə edildi. Qalan: WhatsApp Business profili (istifadəçi) + Meta env-lər.

## 2026-08-04 — Əlaqə/brend cilası: telefon çıxarıldı, /telimat, random xidmət blokları, info@, hero başlığı

- **Platforma telefon nömrəsi saytdan çıxarıldı** (istifadəçi qərarı: "zənglər gəlməsin,
  ancaq WhatsApp üzərindən yazacağıq") — footer + `/elaqe` telefon kartı silindi.
  `/elaqe` WhatsApp düyməsi hələ saxta `wa.me/994500000000`-dadır — real nömrə gələndə
  dəyişdiriləcək (TODO blocked).
- **`/telimat`** — mərkəzlər üçün gizli istifadə təlimatı (paketlər, status axını, CRM,
  qiymət/rəy linkləri). İndeksdən tam kənar: `noIndex` meta + `robots.ts` disallow +
  sitemap-da yoxdur; link yalnız əl ilə paylaşılır. Sonra vizual redizayn: tünd hero
  (grid+glow, nömrəli TOC çipləri), qradiyent bölmə kartları, bağlantılı addım xətti.
- **Ana səhifə xidmət bölməsi**: başlıq "Bütün rentgen xidmətləri" + hər ziyarətdə
  təsadüfi 4 kart (hər biri FƏRQLİ kateqoriyadan); **footer**: dental-only 7 xidmət →
  təsadüfi 6 (yenə kateqoriya-fərqli). Ortaq köməkçi `src/lib/random-services.ts`.
- **info@rentgen.az** — ImprovMX yönləndirmə (variant A): Vercel DNS-də MX
  `mx1/mx2.improvmx.com` + SPF TXT; məktublar dr.bakhtiyar.aliyev@gmail.com-a gedir.
  Status: Active (yoxlanılıb). Göndərmə (SMTP) qurulmayıb — yalnız qəbul.
- **Hero başlığı ölkə-səviyyəli**: "Bakıda … tapın" → "Azərbaycanda … tapın" (AZ+RU),
  eyni ifadə meta title + OG şəkildə də dəyişdirildi (306+ mərkəz artıq 23 şəhərdədir).

## 2026-08-04 — Bloq: 6 yeni qeyri-dental SEO yazısı

Mövcud 12 AZ yazının hamısı dental idi — kataloq isə çoxdan ümumi görüntüləməni
əhatə edir. 6 sual-yönümlü yazı (Google axtarış niyyətinə uyğun, hərəsi FAQ
bölməsi + xidmət/şəhər səhifələrinə daxili linklərlə): `mrt-nedir-nece-cekilir`,
`kt-ve-mrt-ferqi`, `hamilelikde-rentgen-olarmi`, `qarin-usm-hazirliq`,
`mammoqrafiya-nece-yasdan`, `densitometriya-dexa-nedir`. Yalnız DB (BlogPost) —
kod dəyişikliyi yoxdur; sitemap avtomatik götürür. Cover-lər: köhnə seriya
AI-foto idi, yenilər brend üslubunda (ink + neon-siyan) vektor SVG→webp,
Vercel Blob `blog-covers/*-v2.webp`. SVG dərsi: `objectBoundingBox` qradiyenti
üfüqi/şaquli `<line>`-larda render olunmur (sıfır bbox) → `userSpaceOnUse`;
Blob CDN köhnə keşi üçün yol adı dəyişdirildi (`-v2`). Daxili link slugları
DB ilə tutuşdurulub (21/21 mövcud). RU versiyaları yazılmayıb (istənilməyib).

## 2026-08-04 — Hero xəritəsi v2: rayon-səviyyəli choropleth

İstifadəçi konsepti: siluet + nöqtələr əvəzinə mərkəzimiz OLAN rayonlar rəngli.
`src/lib/az-rayons.ts` (avtogenerasiya, geoBoundaries AZE ADM2): 79/79 forma,
adaptiv sadələşdirmə, 2898 nöqtə + ADM0 dəqiq xarici kontur. EN→AZ ad xəritəsi
bazadakı `city` ilə üst-üstə düşür → örtük data-driven qalır (yeni şəhər təsdiq
olunanda rayonu özü yanır). **Köhnə görünüş saxlanılıb** (istifadəçi xahişi):
`hero-visual.tsx`-də `VARIANT="dots"` bir sətirlə geri qaytarır.
Qeyd: Şəki yaxınlığındakı tünd ləkə Mingəçevir su anbarıdır — real coğrafiya.

## 2026-08-04 — WhatsApp AI botu + "Bot beyni" admin bölməsi

Mərkəzlərin WhatsApp suallarına avtomatik cavab. Bilik bazası `BotSection`
cədvəlində — admin `/admin/bot`-da redaktə edir, kod dəyişikliyi olmadan;
yanındakı CANLI TEST QUTUSU WhatsApp qoşulmadan botu sınayır (mərkəz nömrəsi
simulyasiyası ilə). Prompt 3 qat: sərt qaydalar (kodda) + aktiv bölmələr +
yazan mərkəzin öz kart vəziyyəti (nömrə bazadan tanınır; qiymətsizsə /q linki
verilir). Webhook `/api/whatsapp/webhook` (imza yoxlamalı); söhbət AdminThread-ə
güzgülənir. `askClaude()` çıxarıldı — panel AI ilə eyni nüvə. 8 başlanğıc bölmə
seed edildi. **Meta env gələnə qədər webhook passivdir** (aşağıda TODO).

## 2026-08-03 — Qiymət toplama kampaniyası (WhatsApp + /q linki)

Qiymət əhatəsi 4/248 idi; mərkəzlər panelə girmir (3 giriş). Həll: operator
`/panel/whatsapp`-dan wa.me linkini HAZIR mesajla açır (5 variantlı mətn,
mərkəzin adı + `/q/<token>` linki), göndəriş jurnala düşür; mərkəz girişsiz
qiymət yazır → dərhal canlıda. **Gündəlik limit 12** (istifadəçi qərarı) —
WhatsApp spam-qorunması alətə tikilib. Token = kimlik (rəy dəvəti məntiqi);
yazılar `center:price_self` kimi izlənir. `priceToken` miqrasiyası prod-da.
Canlı test: keçərsiz token → "Link keçərli deyil", real token → form ✓.

## 2026-08-03 — Dental klinika importu (54 PENDING) + 🦷 filtr

Paralel araşdırmanın nəticəsi (`~/rentgen_az_hedef_klinikalar.xlsx`): A qrupu —
20 klinika avadanlıq sitatla təsdiqli; B qrupu — 39 klinika dövlət reyestrində
2.24+2.27 (stomatologiya + şüa diaqnostikası) lisenziyalı.

- **54 mərkəz PENDING yaradıldı** (5 dublikat ötürüldü). Google Places
  zənginləşdirməsi: placeId/koordinat/reytinq/iş saatı + telefonu olmayan B
  qrupuna Google-dan nömrə. Token-kəsişmə qoruyucusu yanlış uyğunlaşmanı kəsir.
- **Xidmətlər sübuta bağlı** (89-luq şablon YOX): A qrupu sitatdakı modallıqlara
  görə (3D→3d-tomoqrafiya+cbct, panoram, sefalometrik); B qrupu yalnız
  dental-rentgen (lisenziya avadanlıq növünü göstərmir); "Qeyri-müəyyən" A
  sətirləri də yalnız baza. Cihaz modeli `equipment`-ə yazıldı (Sirona
  Orthophos, Planmeca ProMax…).
- **Dublikat tutuşları:** placeId 3 tərcümə dublikatını tutdu (Sağlam Diş →
  SağlamDiş şəbəkəsi, Ömür, Sağlam) — istifadəçinin "Rəqəmsal Diaqnostika
  Dünyası = Digital Diagnostics World" xəbərdarlığının təsdiqi. Batch daxilində
  telefon/placeId dedup A∩B təkrarını kəsdi (German Dental "Clınıc" türk ı ilə,
  Pro Dental).
- **🦷 Dental filtri** (`center-filters.ts`) admin+operator panellərində:
  xidmətdə Dental kateqoriyası VƏ YA adda dental/stomatolo/diş/dent/implant/smile.
  PENDING+Dental = 57.
- Unikal təsvirlər generatorla; mobil nömrəsi olanlara OTP-yə hazır owner.
- **Dərin zənginləşdirmə (2026-08-03):** Google Places fotoları (media endpoint →
  Vercel Blob) + sayt loqoları (img[src*=logo] → og:image → apple-touch-icon,
  <3KB favicon rədd) + tapılmayanlara variant-sorğulu təkrar axtarış. Nəticə:
  şəkilli 0→33 (61%), loqolu 0→9, placeId 39→41, koordinat +2, telefon +1.
  Şəkilsiz qalan 21-in çoxunun Google kartında ümumiyyətlə foto yoxdur.
- **Sayt-skan xidmət yoxlaması (2026-08-03):** dental PENDING saytları modallıq
  sübutu üçün skan edildi. İki YENİ yalan-müsbət növü tapılıb qoruyucuya çevrildi:
  (5) dental klinika saytında "ultrasəs" = diş daşı təmizləmə skaleri, USM deyil;
  (6) dental saytda "3D kompüter tomoqrafiyası" = CBCT, tibbi KT deyil → dental-adlı
  klinikalara ağır modallıq/USM qaydaları ümumiyyətlə tətbiq edilmir. Ortaq domen
  (≥2 mərkəz) korporativ sayt kimi istisna (merkeziklinika.az halı). Nəticə: skan
  sübut vermədi; Megapol-a USM (qarın+tiroid) İSTİFADƏÇİNİN öz müşahidəsi ilə əlavə
  olundu — istifadəçi təsdiqi skrapdan üstün mənbədir.
- İstifadəçi qərarı (2026-08-03): İmaməliyeva (fiziki şəxs), Yeni Qalaaltı Hotel
  (otel) və ATU (domen ölü, zəng tələb edirdi) SİLİNDİ; White Smile PROMAX əlavə
  edilmədi. Yekun: 51 dental PENDING. Baza: 414 mərkəz (248 APPROVED / 166 PENDING).

## 2026-08-02 — FAQ "uşaqlar qəbul edilirmi?" cavabı

Dörd meyar: ad · sayt (pediatriya şöbəsi/ştatda pediatr) · OSM ixtisası · təsvir.
**42 mərkəz** — 16-sı uşaq müəssisəsi ("ixtisaslaşıb"), 26-sı pediatriya şöbəsi
olan ümumi müəssisə ("uşaqlar DA qəbul edilir"). İki fərqli cavab növü, 9 ifadə.
Sayt uyğunluqlarının konteksti əl ilə yoxlanıldı — yalan müsbət yoxdur.

Həmçinin ölçüldü və RƏDD EDİLDİ: **"əlillər üçün giriş"** — OSM-də 1218 tibbi
obyektdən yalnız 8-ində `wheelchair` teqi var, 350 mərkəzdən 1-i uyğunlaşdı
(o da etibarsız). Bax DECISIONS.

**FAQ əhatəsi: 279 / 363 mərkəz** (parkinq 241 · ödəniş 177 · uşaq 42).

## 2026-08-02 — FAQ parkinq cavabı (OpenStreetMap-dən)

İstifadəçi müşahidəsi: mərkəz səhifəsindəki xəritədə "P" nişanları görünür —
onlar OSM-in `amenity=parking` obyektləridir, yəni **sorğulana bilər**.

- **Overpass API** ilə 350 koordinatlı mərkəzin ətrafı taranıb (1728 parkinq
  obyekti). **241 mərkəzdə** parkinq tapıldı, 238-nə cavab yazıldı.
- Məsafə zolaqları: ≤60 m "ərazisində" · 60–90 m "yanında" · 90–300 m "ətraf
  küçələrdə". 17 fərqli ifadə (heşlə sabit seçim).
- **"Parkinq yoxdur" heç vaxt yazılmır** — OSM boşluğu yoxluq sübutu deyil.
- Doğrulama: istifadəçinin göstərdiyi Quba nöqtəsində (41.35696, 48.49479)
  sorğu məhz ekrandakı iki parkinqi tapdı — 28 m və 210 m.
- Texniki tələlər: Overpass başlıqsız POST-a **406**, ölkə bbox-una **504**;
  işləyən üsul form-kodlanmış `data=` + User-Agent + çoxnöqtəli `around`.

**FAQ əhatəsi indi: 271 / 363 mərkəz** (ödəniş 177 · parkinq 241 · hər ikisi 147).

## 2026-08-02 — Bakı mərkəzlərinə FAQ ödəniş cavabı + forma düzəlişi

- **FAQ `payment`** — Bakıdakı **159 mərkəz** (135 APPROVED + 26 PENDING). Mətn 12
  fərqli ifadədə (heşlə sabit seçim) — eyni cümlə 159 səhifədə təkrarlansaydı
  `faqJsonLd` təkrar strukturlu data göndərərdi. Öz cavabı olan 2 mərkəzə
  toxunulmadı. Bu, yoxlanılmış məlumat deyil — bax DECISIONS.
  Nəticə: FAQ bloku olan mərkəz 2 → 161, FAQ rich snippet üçün uyğunluq yarandı.
- **Region şəbəkə filialları** — əlavə **16 mərkəz** (Referans 10, Sağlam Ailə 2,
  MediClub 1, Diamed 1, İnci 1, Zahra 1). Şəbəkələr datadan sübutla aşkarlandı
  (ortaq domen / ortaq telefon / adında "filial" / 2+ Bakı filialında eyni brend
  ifadəsi); yalan qruplar (şəhər adı, nömrəli poliklinika, ad oxşarlığı) kəsildi.
  **Yekun: 177 mərkəzdə ödəniş cavabı** (Bakı 161 + region 16), 14 fərqli ifadə.
- **Mərkəz formunda şəkil yükləmə görünürlüyü** — düymə var idi, amma kiçik boz
  həb kimi sətrin sağında, iş saatı cədvəli ilə xəritənin arasında sıxılmışdı;
  "şəkil yükləmək mümkün deyil" təəssüratı yaradırdı. İndi şəbəkənin içində
  kəsik-xətli "Şəkil əlavə et" xanası var. Funksionallıq dəyişmədi.
  (Plan limiti səbəb deyildi: FREE=5, mərkəzlərdə maksimum 2 şəkil.)

## 2026-08-02 — Xüsusi 404 səhifəsi

Sayt Next-in defolt ingiliscə səhifəsini verirdi ("404: This page could not be
found") — nə brend, nə naviqasiya, nə AZ/RU. Halbuki burada 404 NORMAL haldır:
PENDING mərkəz səhifələri (117), 3-dən az mərkəzi olan şəhərlər, təxirə salınmış
şəhər×xidmət kombinasiyaları (`DEFERRED_SERVICES`), köhnə linklər.

`src/app/not-found.tsx` — çıxılmaz nöqtə yox, davam yolu: mərkəz axtarışı, əsas
kataloqlar və şəhər səhifələrinə keçidlər. i18n `notFoundPage` (az+ru), noIndex.
Başlıq qəsdən dildən asılı deyil ("404") — `not-found.tsx` yalnız statik
`metadata` dəstəkləyir, ona görə RU səhifədə AZ başlıq görünürdü.

## 2026-08-02 — Şəhər / şəhər×xidmət səhifələri + sitemap düzəlişləri

**Şəhər lendinq səhifələri** — `/rentgen-merkezleri/sheher/[slug]`, ≥3 mərkəzi olan
14 şəhər. Giriş mətni şəhərin ÖZ rəqəmlərindən qurulur (mərkəz sayı, rayonlar,
həftənin 7 günü işləyənlər, orta Google reytinqi) → hər səhifədə fərqlidir.
JSON-LD: Breadcrumb + CollectionPage/ItemList. `/rentgen-merkezleri` altına
"Şəhərlər üzrə mərkəzlər" keçid bloku (Google-un tapması üçün yeganə daxili yol).

**Şəhər × xidmət səhifələri** — `/rentgen-merkezleri/sheher/[city]/[service]`.
KURASİYA: bütün 112 xidmətə icazə versək 643 kombinasiya yaranır və çoxu
bir-birinin təkrarı olur ("Bakıda əl rentgeni" ≈ "Bakıda bilək rentgeni" — eyni
aparat). Ona görə yalnız FƏRQLƏNDİRİCİ modallıqlar: dental (4), MRT (5), KT (4),
mammoqrafiya, densitometriya. Klassik rentgen proyeksiyaları və USM növləri
`DEFERRED_SERVICES`-də — hazırda 51-lik bazada hamıda var, yəni Bakıda hər biri
eyni 115 mərkəzi sadalayardı. Mərkəzlər öz siyahılarını dəqiqləşdirdikcə açılacaq.

**Sitemap** — RU URL-ləri artıq ÖZ `<loc>` bloku ilə verilir (əvvəl yalnız
`xhtml:link` alternate idi, yəni RU sitemap-da rəsmən yox idi): 424 → **828 `<loc>`,
413-ü RU**. `x-default` əlavə olundu. `/paketler` + `/hekimler-ucun` əlavə olundu
(`/bize-qoshul`, `/hekim-qoshul` noindex olduğu üçün qəsdən kənarda).

**117 PENDING mərkəzin şablonu təmizləndi** — 113 mərkəz, **5 769 sətir**. APPROVED
ilə eyni qaydalar: sübutsuz MRT/KT/Mammoqrafiya/Densitometriya/Floroskopiya silindi
(115-dən yalnız 3-ünün yeni saytı var idi → sübut demək olar yoxdur; yalnız Baku
City Hospital Görüntüləmə Mərkəzi MRT+mammoqrafiya saxladı), sonra baza 30–51
aralığına yayıldı. Fərqli xidmət dəsti: 102/113.

**Deploy qeydi:** `c43ea8a` (şəhər×xidmət) push olunsa da Vercel webhook-u onu
qaçırdı — səhifələr 404 verirdi. Növbəti push deployu tetiklədi. Belə hallarda
`list_deployments` ilə son build SHA-sını yoxlamaq lazımdır.

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
