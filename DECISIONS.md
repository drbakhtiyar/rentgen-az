# DECISIONS

Architectural & product decisions that live only in conversation (not obvious from the code). Newest-relevant first. Each: **decision — why — consequence.**

## Qarşı tərəfin avtomatik cavabına BOT SUSUR (cavab yazmır)
- **Qərar (2026-08-15):** klinikanın WhatsApp Business greeting/away şablonu
  tanınanda bot heç nə göndərmir — mesaj yalnız güzgüyə düşür + 🔇 qeydi.
- **Səbəb:** qarşı tərəfdə insan yoxdur. Cavab yazsaq onların robotu yenidən işə
  düşə bilər (real hadisə: eyni şablon iki dəfə gəldi, bot iki dəfə cavab verdi).
  Üstəlik bot deyiləsi sözü olmayanda absurd cümlə qurur («Rica etmirəm,
  gözləyirəm») — bu, mərkəzə pis təəssürat yaradır.
- **Nəticə:** detektor `src/lib/wa-auto-reply.ts` (STRONG = 1 uyğunluq, WEAK = 2).
  Yalançı-müsbət görsən naxışları dəqiqləşdir — susmaq ucuzdur (operator güzgüdə
  görür), amma real sualı susdurmaq baha başa gəlir. Əlavə `loopGuard`: təkrar
  mətn 15 dəq / bot 5 cavab həddi — tanımadığımız robot növləri üçün son sipər.

## WhatsApp yazışması ≠ sayt söhbəti (`AdminMessage.internal`)
- **Qərar (2026-08-15, istifadəçi):** «whatsapp yazishmalar - sohbetler biri
  birinden ayri olsun». Güzgü mesajları, körpü cavabları, sistem qeydləri
  `internal: true` — mərkəzin öz panelində GÖRÜNMÜR.
- **Səbəb:** mərkəz öz panelində «👀 Mərkəz kart formunu açdı» kimi DAXİLİ izləmə
  qeydlərini görürdü — bu, bizim əməliyyat qeydimizdir, müştəriyə göstərilməməli.
  Həm də WhatsApp yazışması ilə sayt-daxili dəstək söhbəti iki fərqli kanaldır.
- **Nəticə:** YENİ WhatsApp güzgüsü və ya sistem qeydi yazanda MÜTLƏQ
  `internal: true` qoy. İstifadəçi-tərəfli hər yeni sorğuya `internal: false`
  filtri əlavə et (hazırda: panel siyahısı, önizləmə, oxunmamış sayğacı, mobil).

## 24 saatlıq pəncərəni yalnız MÜŞTƏRİNİN mesajı açır
- **Qərar/fakt (2026-08-15):** Meta qaydası — sərbəst mətn yalnız müştərinin son
  mesajından 24 saat ərzində göndərilə bilər. **Botun cavabı sayğacı UZATMIR.**
- **Nəticə:** söhbət başlığındakı nişan (🟢 açıq · N saat / 🔒 bağlı) yalnız
  gələn 📲 mesajlarından hesablanır. Pəncərə bağlıdırsa operator sərbəst mətn
  yaza bilmir — şablon dəvəti göndərilməlidir. Canlı söhbətdə pəncərə praktiki
  olaraq həmişə açıq qalır (mərkəz yazdıqca uzanır).

## Örtük/ikon generasiyası MƏNİM işim DEYİL
- **Qərar (2026-08-13, istifadəçi geribildirimi):** «senin etdiyini beyenmedim
  bunlari et» — mənim yaratdığım bloq örtükləri və ikonlar bəyənilmədi.
- **Nəticə:** vizual aktivləri istifadəçi ChatGPT-də yaradır və göndərir; mən
  yalnız EMAL edirəm (kəsim, ölçü, format, Blob-a yükləmə, xəritəyə qoşma).
  Öz təşəbbüsümlə şəkil generasiya etmə. Fayllar adətən `~/Downloads/icon/` və
  `~/Downloads/rentgen bloq kover/` qovluqlarında olur.

## Dizayn v2 «Impilo» — köhnə dizayna qayıdış yoxdur
- **Qərar (2026-08-13, istifadəçi):** «saytın dizaynını tamamilə kökündən
  dəyişmək istəyirəm… əvvəlki versiyanı yadda saxla ki, qayıda bilək».
- **Nəticə (yenilənib 2026-08-16):** başlanğıcda `design-v1` tagı qoyulmuşdu,
  amma yeni dizayn oturduğu üçün istifadəçi tagı SİLDİRDİ («sil getsin lazım
  deyil») — köhnə dizayna qayıdış NƏZƏRDƏ TUTULMUR, yeni iş planlaşdırarkən
  «geri dönə bilərik» ehtimalını hesaba qatma. Yeni sistem `DESIGN.md`-də
  sənədləşdirilib, tokenlər `globals.css` `@theme`-də.
  **Panellər (admin/mərkəz/həkim/CRM) qəsdən köhnə vizualda qaldı** — yalnız
  ictimai sayt redizayn edildi.

## Statistika qapısı hələlik AÇIQ (sonra Silver+)
- **Qərar (2026-08-13, istifadəçi):** «Qapı funksiyası qoymuşam. Hələ ki,
  free-da, hamıya görsəniz.»
- **Nəticə:** `/merkez/statistika` bütün paketlərə açıqdır. Qapı istənəndə plan
  yoxlaması əlavə edilməli («açmaq istəyəndə Silver-ə keç» ekranı). Həftəlik
  hesabat üçün 1 oktyabr gözləməsi LƏĞV edildi — əvəzinə minimal aktivlik həddi
  (`WA_STATS_MIN_EVENTS`, default 3) qoyuldu: sıfır-aktivlikli mərkəzə hesabat
  göndərmək mənasızdır.

## Bot özünəxidmətində avtorizasiya qərarını KOD verir, LLM yox
- **Qərar (2026-08-13, istifadəçi istəyi: «çox sərt qayda… üç mərhələli»):**
  (1) **Kod qatı** — yazan nömrə mərkəzin qeydə alınmış nömrəsi ilə uyğun
  gəlmirsə token linki `centerContext`-ə HEÇ DÜŞMÜR; (2) **dialoq təsdiqi** —
  bot mərkəz adını təsdiqlətdirir; (3) **hücum-rədd qaydası** + few-shot
  «HÜCUM CƏHDİ» nümunəsi.
- **Səbəb:** prompt-la qorunan sirr sirr deyil. LLM-ə «bu nömrəyə link vermə»
  demək kifayət deyil — link kontekstdə varsa, nə vaxtsa sızdırılacaq.
- **Nəticə:** hər yeni özünəxidmət funksiyasında eyni naxış — həssas dəyər
  kontekstə YALNIZ kod yoxlamasından sonra düşür.

## ZAP/Nuclei/fuzzing CANLI SAYTA ƏSLA yönəldilmir
- **Qərar (2026-08-15):** aktiv skan yalnız staging mühitində.
- **Səbəb:** `/q` `/f` `/m` autentifikasiyasız YAZIR (mərkəz məlumatı dəyişir),
  webhook real WhatsApp mesajı göndərir. Skan real data korlaya və müştərilərə
  zibil mesaj göndərə bilər.
- **Nəticə:** staging bazası lazım olacaq (Supabase yeni layihə ~$10/ay).
  **İstifadəçi qərarı (2026-08-15): «hələlik lazım deyil»** — kod səviyyəli
  auditlə davam. ZAP aşağı prioritetdir: bizim stack-də (Vercel managed, Prisma,
  React escape) gözlənilən dəyər azdır.

## WhatsApp bot = Sonnet; panel AI = Haiku
- **Qərar (2026-08-11):** wa-bot claude-sonnet-5 işlədir; panel AI Yardımçısı Haiku-da qalır.
- **Səbəb:** Haiku çoxqaydalı axınlarda (menyu nömrələmə, məlumat toplama, ad
  təsdiqi, TAPILMADI axını) qaydaları ardıcıl pozurdu — 10+ canlı testdə sübut
  olundu; prompt-sərtləşdirmə kömək etmədi. Bot həcmi az → xərc fərqi cüzi.
- **Nəticə:** yeni davranış problemi çıxanda əvvəl HARD_RULES-a NÜMUNƏ DİALOQ
  əlavə et (few-shot abstrakt qaydadan güclüdür), model endirmə.

## Bot: mərkəz adı YALNIZ bazadan; sistem-tərəf ad axtarışı
- **Qərar:** bot ad təsdiqini yalnız kontekstə verilən "MƏRKƏZ AD AXTARIŞI"
  blokundan edir (nameLookupContext: token-fold + translit kh→x + Levenshtein
  ≤1-2; slug-linkdən dəqiq tanıma). Tapılmayanda axın DAYANIR: 3 variant
  (dəqiq ad / səhifə linki / "yeni" qeydiyyat). Boş nəticə AÇIQ "TAPILMADI"
  bloku kimi verilir — blokun yoxluğu model üçün zəif siqnaldır.
- **Səbəb:** bot "Smile Bəxtiyar" kimi ad uydururdu; yanlış mərkəzə dəyişiklik
  düşə bilərdi.

## İnsan müdaxiləsi: operator yazandan sonra bot 30 dəq susur
- **Qərar (2026-08-12):** WhatsApp thread-inə 🤖-siz fromAdmin mesaj düşəndən
  30 dəq bot həmin nömrəyə cavab vermir; gələnlər güzgülənir; UI-də
  "🤫 bot susub — HH:MM-dək" nişanı (Bakı vaxtı). Hər əl cavabı sayğacı
  sıfırlayır.
- **Səbəb:** insan və bot eyni anda cavab verib bir-birinin üstünə yazırdı.
- **Nəticə:** webhook HUMAN_TAKEOVER_MS və admin-chat mutedUntil SİNXRON
  saxlanmalıdır (hər ikisi 30 dəq).

## WhatsApp yazışmaları ayrıca bölmədə; toplu mesaj yalnız daxilidir
- **Qərar:** 📲-lı thread-lər "WhatsApp söhbətləri" bölməsində (admin+operator),
  panel söhbətləri ayrı; nişanlar bölünür. "Toplu mesaj" (Hamısı/Həkim/Mərkəz)
  YALNIZ daxili paneldir və WhatsApp bölməsində gizlədilir — WhatsApp-a kütləvi
  göndəriş yalnız təsdiqli şablonlarla, gündə-12 limiti ilə dəvətlərdən gedir.

## Dəvətlər platforma nömrəsindən (şablonlarla); wa.me ləğv
- **Qərar (2026-08-12):** kampaniya düyməsi wa.me açmır — sendWaInviteAction
  Meta şablonu ilə (qiymet/faq/kart/kabinet_devet) platforma nömrəsindən
  göndərir; mərkəz cavab yazanda söhbəti bot aparır. Dəvət 🤖 kimi güzgülənir
  ki, bot kontekstində olsun.
- **Ön şərt:** Meta şablon təsdiqi + WABA-da ödəniş kartı (əlavə olunub).
- **Nəticə:** operator telefonuna ehtiyac qalmır; 24s pəncərə şablona aid deyil.

## Platforma əlaqəsi YALNIZ yazışma ilə (WhatsApp) — telefon saytda göstərilmir
- **Qərar (2026-08-04):** platformanın telefon nömrəsi saytın heç yerində göstərilmir;
  əlaqə kanalları: WhatsApp yazışması + info@rentgen.az. Nömrə alınanda yalnız
  WhatsApp düyməsinə bağlanacaq (`/elaqe`), zəng üçün dərc edilməyəcək.
- **Səbəb:** istifadəçi: "zənglər gəlməsin, ancaq WhatsApp üzərindən yazacağıq".
- **Nəticə:** `/elaqe` WhatsApp düyməsi müvəqqəti saxta nömrədədir (wa.me/994500000000);
  real nömrə gələndə TƏK yenilənməli yer oradır. Mərkəzlərin öz nömrələri isə
  səhifələrində qalır — qərar yalnız platformanın öz nömrəsinə aiddir.

## Tokenli link = sahiblik sübutu (OTP YOX) — /q və /rey/davet nümunəsi
- **Qərar:** girişsiz formalarda (qiymət formu `/q/<token>`, rəy dəvəti
  `/rey/davet/<token>`) OTP istifadə olunmur. Link mərkəzin/pasiyentin ÖZ nömrəsinə
  göndərilir → linkə sahib olmaq nömrəyə sahib olmağı sübut edir.
- **Səbəb:** OTP əlavə sürtünmə yaradır və konversiyanı öldürür; təhdid modeli zəifdir
  (token uzun, təsadüfi, unikal; yalnız öz obyektinə yazır).
- **Nəticə:** tokenlər `@unique` sahələrdə saxlanır (`CenterProfile.priceToken`,
  `AppointmentRequest.reviewToken`); marşrutlar `robots.ts`-də disallow-dur.

## WhatsApp toplu göndəriş limiti — gündə 12
- **Qərar:** operator qiymət kampaniyasında (`/panel/whatsapp`) gündəlik göndərmə
  limiti 12 mərkəzdir; mesaj mətni 5 variantdan fırlanır; sıralama APPROVED əvvəl,
  sonra Google rəy sayı.
- **Səbəb:** yeni/adi nömrədən kütləvi eyni-mətnli wa.me göndərişləri WhatsApp-ın
  spam-blok həddinə düşə bilər; istifadəçi limiti özü 12 seçdi.
- **Nəticə:** göndəriş `AdminActionLog` (`center:wa_price_invite`) ilə qeydə alınır —
  gündəlik say və dedup oradan hesablanır.

## Bot beyni DB-də (admin redaktə edir), sərt qaydalar kodda
- **Qərar:** WhatsApp botunun bilik bazası `BotSection` cədvəlindədir və `/admin/bot`
  səhifəsindən kod dəyişikliyi olmadan redaktə olunur; dəyişilməz təhlükəsizlik
  qaydaları (qiymət uydurma, tibbi məsləhət vermə və s.) isə kodda `HARD_RULES`-dadır.
- **Səbəb:** istifadəçi: "mən hamısını görüm, ehtiyac olsa edit edim" — amma
  qoruyucu qaydalar təsadüfən silinə bilməməlidir.
- **Nəticə:** yeni funksiya əlavə olunanda bot bölmələri `/admin/bot`-dan yenilənir
  (kod yox); canlı test qutusu WhatsApp qoşulmadan cavabları sınayır.

## Daxili linklər random, amma kateqoriya-fərqli (footer + ana səhifə)
- **Qərar:** footer 6 və ana səhifə 4 xidmət linki hər renderde təsadüfi seçilir,
  hər element FƏRQLİ kateqoriyadan (`src/lib/random-services.ts`).
- **Səbəb:** sabit siyahı ya çox uzun olur, ya həmişə eyni səhifələrə link verir;
  rotasiya zamanla BÜTÜN 112 xidmət səhifəsinə daxili link paylayır (SEO), kateqoriya
  şərti isə eyni tipli 6 dental linkin yığılmasının qarşısını alır.
- **Nəticə:** renderdə `Math.random` qəsdəndir (ziyarət-başına müxtəliflik) — bunu
  "deterministik olmalıdır" deyə refaktor ETMƏ.

## Hero xəritəsi v2 rayon-choropleth; köhnə variant SAXLANILIR
- **Qərar:** hero xəritəsi rayon-səviyyəli choropleth-dir (mərkəzimiz olan rayonlar
  yanır, `az-rayons.ts` avtogenerasiya); köhnə siluet+nöqtə görünüşü silinməyib —
  `hero-visual.tsx`-də `VARIANT="dots"` bir sətirlə geri qayıdır.
- **Səbəb:** istifadəçi: "bu versiyanı da yadda saxla, birdən yenisi xoşuma gəlməz".
- **Nəticə:** hero başlığı da ölkə-səviyyəlidir ("Azərbaycanda … tapın", 2026-08-04;
  meta title + OG şəkil də eyni cür) — "Bakıda" formasına qaytarma.

## Bloq cover siyasəti: yeni yazılar brend vektor seriyası
- **Qərar:** köhnə 12 dental yazının cover-ləri AI-foto idi (təkrarlana bilmir);
  2026-08-04-dən yeni yazıların cover-ləri brend üslubunda vektor SVG→webp-dir
  (ink fon + grid + neon-siyan ikonoqrafiya), Vercel Blob `blog-covers/<slug>-v2.webp`.
- **Texniki dərslər:** (1) SVG `objectBoundingBox` qradiyenti üfüqi/şaquli `<line>`-da
  render olunmur (sıfır bbox) → `userSpaceOnUse` işlət; (2) Blob CDN üzərinə-yazmada
  köhnə keşi verir → yenilənəndə YOL ADINI dəyiş (`-v2`), keşin bitməsini gözləmə.
- **Nəticə:** yeni yazı üçün eyni seriya davam etdirilməlidir (nümunə üslub: MRT
  halqaları, qalxan+ana, USM ötürücüsü…). RU yazıları ayrı slug + `locale:"ru"`.

## İstifadəçi təsdiqi SÜBUTDUR (sübut qaydasının əlavəsi)
- **Qərar:** "sübut yoxdursa, iddia da yoxdur" qaydasında istifadəçinin (Dr. Bəxtiyar)
  şəxsi təsdiqi tam sübut sayılır — məs. Megapol USM ("saytında gördüm"), Dentinn və
  Dent-Inn-ə panoram rentgen, Dent-Inn≠Dentinn (ad oxşarlığına baxmayaraq ayrı
  klinikalardır — "oxşar olsa da fərqli yerlərdi").
- **Səbəb:** sahibkar yerli bazarı birbaşa tanıyır; bu, veb-sübutdan zəif deyil.
- **Nəticə:** belə təsdiqlə əlavə olunan xidməti sonrakı "sübutsuz iddia" təmizliyi
  SİLMƏMƏLİDİR.

## "Uşaqlar qəbul edilirmi?" — dörd meyar, iki fərqli cavab
- **Meyarlar (istifadəçi təklifi + genişləndirmə):** (1) mərkəzin **adında**
  uşaq/pediatr/kids/детск; (2) **saytında** pediatriya şöbəsi və ya ştatda pediatr
  (`pediatr|neonatolo|uşaq həkimi|детск`); (3) **OSM** `healthcare:speciality=paediatrics`;
  (4) mərkəzin **öz təsvirində** eyni açar sözlər. Nəticə: **42 mərkəz**.
- **İki AYRI cavab növü** — bu vacibdir: adı uşaq müəssisəsi olanlar (16) yalnız
  uşaqlara xidmət göstərir → "Mərkəz uşaq pasiyentlərə ixtisaslaşıb". Saytında
  pediatriya şöbəsi olan ümumi müəssisələr (26) → "Uşaq pasiyentlər DƏ qəbul
  edilir". Hər ikisini eyni cümlə ilə yazsaydıq, hər iki halda yanlış olardı.
- **Yalan müsbət yoxdur:** 14 sayt uyğunluğunun konteksti əl ilə yoxlanıldı —
  hamısı həqiqi "Pediatriya şöbəsi" siyahısı və ya ştatdakı pediatr idi (Ege
  Hospital: "0-16 yaş arası uşaqların"). `pediatr`/`neonatolo` kökləri kifayət
  qədər özəldir; müqayisə üçün `nağd` kökü "Dr. Nağdəliyev"i tutmuşdu.
- **Şəbəkə korporativ saytları kənarda** (3+ mərkəz paylaşan domen) — filialın
  yox, qrupun portfelini sadalayır.

## "Əlillər üçün giriş" AVTOMATLAŞDIRILMIR — OSM-də data yoxdur (ölçülüb)
- **Nəticə (2026-08-02 ölçmə):** mərkəzlərin ətrafındakı **1218 tibbi obyektdən
  yalnız 8-ində** `wheelchair` teqi var (5 yes · 1 limited · 2 no), `ramp=yes`
  **0**. Bizim 350 mərkəzdən cəmi **1-i** uyğunlaşdı — o da adı fərqli qonşu
  obyektə (14 m) düşdü, yəni etibarsızdır. Faktiki əhatə: **sıfır**.
- **Qərar:** bu sual OSM-dən doldurulmur. Parkinqdən fərqli olaraq burada data
  sadəcə mövcud deyil.
- **Niyə "təxmin edək" demirik:** səhvin qiyməti asimmetrikdir — əlil arabasındakı
  pasiyentə "giriş uyğundur" desək və uyğun olmasa, o adam boş yerə yol gedir.
  Yanlış "uyğun deyil" isə mərkəzi pasiyentdən məhrum edir. Hər iki istiqamətdə
  fərziyyə qəbuledilməzdir.
- **Doğru yol:** Nərminin zəng siyahısı — 5 saniyəlik sual, qəti cavab.
- **Təkrar yoxlamağa ehtiyac yoxdur** — sorğu nəticəsi `scratchpad/osm-health.json`
  (1218 obyekt) keşdədir.

## Parkinq cavabı OpenStreetMap-dən — YOXLANILMIŞ məlumat
- **Qərar:** FAQ `parking` cavabı OSM-dən Overpass API ilə çəkilir: mərkəzin
  koordinatı ətrafında `amenity=parking` / `amenity=parking_space` obyektləri
  axtarılır və məsafəyə görə üç zolağa bölünür — **≤60 m** "ərazisində/həyətində",
  **60–90 m** "yanında/bitişiyində" (ehtiyatlı ifadə), **90–300 m** "ətraf
  küçələrdə/yaxınlıqda". Bir neçə parkinq tapılsa cəm halında yazılır.
- **Niyə üç zolaq:** 60–90 m böyük xəstəxana kampusunda həyət, sıx şəhər blokunda
  isə QONŞUNUN parkinqi ola bilər — o aralıqda "həyətində" demək iddiadır.
- **PARKİNQ YOXDUR HEÇ VAXT YAZILMIR.** OSM-də obyekt olmaması parkinqin
  olmaması demək deyil (Azərbaycan regionlarında OSM əhatəsi natamamdır).
  Cavab yalnız POZİTİV tapıntıda yazılır; tapılmayan 109 mərkəz boş qalır.
- **Nəticə:** 350 koordinatlı mərkəzdən **241-də** parkinq tapıldı (72-si ≤90 m).
  Bu, ödəniş cavabından fərqli olaraq **fərziyyə deyil** — xəritə məlumatıdır.
- **Texniki:** Overpass başlıqsız POST-a 406, ölkə bbox-una 504 qaytarır. İşləyən
  üsul: form-kodlanmış `data=` + User-Agent + çoxnöqtəli `around` (40 mərkəzlik
  dəstələr). Nəticə keşdə: `scratchpad/osm-parking.json` (1728 obyekt).

## Bakı mərkəzlərinə ödəniş cavabı — sahibkarın bazar biliyi ilə doldurulub
- **Qərar:** Bakıdakı 159 mərkəzin FAQ `payment` cavabı "nağd və kartla ödəniş"
  kimi doldurulub (istifadəçi qərarı, 2026-08-02: "Bakıda hamı kart istifadə edir").
- **Bu, YOXLANILMIŞ məlumat DEYİL** — mərkəzdən soruşulmayıb, sahibkarın bazar
  biliyinə əsaslanan defoltdur. Ona görə burada açıq yazılır: kartla ödəniş qəbul
  etməyən mərkəz varsa, cavab səhvdir. Mərkəz özü (və ya admin/operator) bir
  redaktə ilə düzəldə bilər.
- **Niyə saxta rəydən fərqlidir:** bu, uydurma insan şəhadəti deyil, biznes
  atributudur; `aggregateRating`-ə qatılmır; səhv olsa nəticəsi kiçikdir və
  mərkəzin özü düzəldə bilər. Rəy isə mövcud olmayan pasiyentin adından
  yazılardı — bax aşağıdakı qərar.
- **İfadə 12 variantda yazılıb** (mərkəz id-sinin heşi ilə sabit seçim): eyni mətn
  159 səhifədə birebir təkrarlansa, `faqJsonLd` onu eyni strukturlu data kimi
  göndərərdi. Öz cavabı olan 2 mərkəzə (Smile, Sağlam Ailə 28 May) toxunulmayıb.
- **Regiona genişləndirmə YALNIZ şəbəkə filiallarına** (2026-08-02): Bakıda da,
  regionda da filialı olan şəbəkənin ödəniş infrastrukturu eynidir — bu, "bütün
  region klinikaları" fərziyyəsindən qat-qat əsaslıdır. Şəbəkə ƏL İLƏ sadalanmayıb,
  datadan SÜBUTLA aşkarlanıb: (1) eyni sayt domeni, (2) eyni telefon (mərkəzi
  kommutator), (3) adında "filial" + brend uyğunluğu, (4) eyni iki sözlük brend
  ifadəsini ən azı 2 Bakı filialı daşıyır. Nəticə: 16 filial (Referans 10,
  Sağlam Ailə 2, MediClub 1, Diamed 1, İnci 1, Zahra 1).
- **Kənarlaşdırılan yalan şəbəkələr:** şəhər adını daşıyanlar ("Sumqayıt Hospital"
  + "Sumqayıt klinika" — müstəqil mərkəzlər), nömrəli dövlət poliklinikaları
  ("1 saylı", "3 saylı"), hallanmış ümumi sözlər ("Uşaq poliklinikası"×5) və
  təsadüfi ad oxşarlığı ("Med City" ≠ "City Hospital", "Sağlam Ailə" ≠ "Sağlam Həyat").

## Saxta rəy YAZILMIR (2026-08-02 — təklif edildi, rədd edildi)
- **Qərar:** mərkəzlərə uydurma pasiyent rəyi yazılmır; Google rəylərinin mətni
  saytа köçürülmür. Google reytinqi yalnız **Google-a aid olduğu göstərilərək**
  ayrıca nişanda göstərilir və bizim `aggregateRating` JSON-LD-mizə QATILMIR.
- **Niyə:** ⭐ rich snippet `aggregateRating`-dən qidalanır, Google isə onun saytın
  öz istifadəçilərindən toplanmasını tələb edir — uydurma rəylə qurulmuş reytinq
  manual action-ın klassik səbəbidir (ulduzlar itir, domenə etimad düşür), yəni
  məqsədin əksini verir. Google şərh mətnini köçürmək həm başqasının məzmununu
  təkrar dərc etməkdir, həm də təzəcə təmizlədiyimiz duplicate content problemini
  geri gətirir. Üstəlik bu tibbi kataloqdur — pasiyent bu rəylərə baxıb qərar verir.
- **Əvəzinə:** rəy dəvəti mühərriki (aşağıda) + mərkəz QR plakatları + mərkəzin öz
  FAQ mətni. Rəy azlığının əsl səbəbi trafikdir: bazada cəmi 18 tamamlanmış müayinə.

## Rəy dəvətində OTP YOXDUR; tetikleyici cron-dur
- **Qərar:** `/rey/davet/[token]` səhifəsi OTP soruşmur — token sahibliyi sübut edir.
  QR axını (`/rey/[slug]`) isə OTP tələb edir.
- **Niyə:** QR-i küçədən kimsə skan edə bilər, ona görə orada nömrə təsdiqlənməlidir.
  Dəvət linkini isə BİZ məhz sorğudakı nömrəyə göndəririk — əlavə OTP yalnız
  konversiyanı öldürür. Rəy `verified: true`, `source: "invite"`.
- **Qərar 2:** dəvəti status dəyişən yerdə deyil, **saatlıq cron**-da göndəririk.
- **Niyə:** status 5 fərqli yoldan COMPLETED olur (mərkəz paneli, CRM, admin, mobil
  app, pasiyent kabineti). Cron heç birini qaçırmır və 2 saatlıq gecikməni təbii
  şəkildə verir (pasiyent hələ mərkəzdə ola bilər).

## Xidmət iddiası SÜBUT tələb edir — sübut yoxdursa, iddia da yoxdur
- **Qərar:** ayrıca bahalı aparat tələb edən kateqoriyalar (MRT, KT, Mammoqrafiya,
  Densitometriya, Floroskopiya) mərkəzin siyahısında yalnız SÜBUT olduqda qalır.
  Qəbul edilən sübut: mərkəzin **öz** vebsaytı, `equipment` sahəsi, mərkəzin adı.
  Sübut yoxdursa kateqoriya bütövlükdə silinir. Rentgen proyeksiyaları + USM (51-lik
  baza) sübut tələb etmir — bir aparatla edilir.
- **Niyə:** import 186 mərkəzə eyni 89-luq şablon yapışdırmışdı; `/xidmetler/mammoqrafiya`
  mammoqrafiya etməyən mərkəzləri sadalayırdı. Tibbi kataloqda uydurma iddia təkrar
  mətndən daha zərərlidir və məhz reytinq gətirən xidmət səhifələrini korlayır.
- **Qəbul edilməyən sübut (yalan müsbətlər — yoxlanılıb tapılıb):**
  **(1) şəbəkənin korporativ saytı** — bir domeni 3+ mərkəz paylaşırsa, o sayt QRUPUN
  portfelini sadalayır, filialın deyil (referansclc.com → 17 filial); **(2) çatbot/FAQ
  sualı** — "MRT varmı?" xidmət iddiası deyil; **(3) dental CBCT ≠ tibbi KT** —
  "konus-şüalı kompüter tomoqraf (Planmeca)" diş aparatıdır; **(4) sosial profil** —
  Instagram bio-su xidmət siyahısı deyil.
- **Nəticə:** şəbəkə/sosial sübutu olan 18 mərkəz (17 Referans filialı + HH klinika)
  ƏL İLƏ qərara saxlanıldı; istifadəçi **toxunmamağı** seçdi (2026-08-02) — onlar
  MRT+KT+Mammoqrafiya+Densitometriya iddiasını saxlayır.

## Şablon xidmət siyahısı 30–51 aralığına yayılır (təsadüfi yox, nadirliyə görə)
- **Qərar:** eyni 51-lik siyahını daşıyan 192 mərkəzin siyahısı 30–51 aralığına yayılır.
  Ölçü balı (Google rəy sayı + Places `primaryType` + sayt + şəkil + iş saatı = 0–9)
  hədəf sayı verir; kəsmə **nadirlik sırası** ilə gedir — nüvə müayinələr (ağciyər,
  bel onurğası, əl/ayaq, kəllə, qarın/tiroid USM) **heç vaxt** silinmir, nadir
  proyeksiyalar (mastoid, orbita, TMJ, koksiks, sternum, bone-age) əvvəl gedir.
- **Niyə:** 192 eyni siyahı həm təkrar məzmun idi, həm də özü təsdiqlənməmiş fərziyyə.
  Təsadüfi kəsmək məlumatı əks istiqamətdə pozardı — rentgen aparatı olan mərkəzdən
  "ayaq rentgeni"ni silmək onu həmin axtarışda görünməz edir.
- **Nəticə:** hər xidmət ən azı **20 mərkəzdə** qalır (döşəmə qoruyucusu) — boş xidmət
  səhifəsi 0/112. Fərqli xidmət dəsti 171/246. Mərkəzlər panelə girdikcə öz siyahılarını
  özləri dəqiqləşdirəcək — bu, yayılmanın əsas məqsədidir.

## Mərkəz təsvirləri deterministik generatorla unikallaşdırılır
- **Qərar:** şablon təsvirlər `src/lib/center-description.ts` ilə əvəzlənir. Hər mərkəz
  həm fərqli cümlə quruluşu, həm də ÖZ faktlarını (rayon/ünvan, iş qrafiki, Google rəy
  sayı) alır. Seçim mərkəz id-sinin heşi ilə **sabitdir**.
- **Niyə:** sadəcə sinonim yazmaq ("spin content") Google-un təkrar aşkarlamasını
  aldatmır — mətnin məna barmaq izinə baxılır. Fərq məzmunda olmalıdır.
- **Qaydalar:** modallıq (MRT/KT/rentgen/USM) SADALANMIR — real xidmət siyahısı hələ
  dəqiqləşdirilməyib. Google-dan gələn zibil ünvanlar (Plus-kod, Kiril, balanssız
  mötərizə) və küçə adı düşmüş `district` dəyərləri süzülür. Google reytinqi 4.0-dan
  aşağı olanda meta-təsvirə **bal yox, yalnız rəy sayı** yazılır (bal onsuz da səhifədəki
  canlı Google nişanında görünür — gizlədilmir, sadəcə snippetdə önə çıxarılmır).

## `city` = yalnız şəhər, rayon `district`-dədir
- **Qərar:** `CenterProfile.city` yalnız şəhər adını saxlayır ("Bakı"); rayon ayrıca
  `district` sahəsindədir. Əvvəl Bakı 9 ayrı `city` dəyərinə bölünmüşdü.
- **Niyə:** ictimai filtr (`centerWhere`) `city` üzrə DƏQİQ bərabərlik axtarır — ona görə
  "Bakı" seçən istifadəçi 134 mərkəzdən yalnız 92-ni görürdü. Şəhər lendinq səhifələri
  üçün də vahid açar lazımdır.
- **Nəticə:** şəhər dəyəri 31 → 23. `district` ictimai filtrdə İŞLƏNMİR (yalnız formalar
  və admin/operator kartları), ona görə doldurmaq təhlükəsizdir. Yeni mərkəz əlavə
  edərkən rayonu `city`-yə yazma.

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
