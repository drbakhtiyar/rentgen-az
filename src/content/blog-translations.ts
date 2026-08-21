/**
 * AZ ↔ RU bloq yazılarının cütləşdirilməsi.
 *
 * Bloq yazıları hər dil üçün AYRI sətirdir (`BlogPost.locale`) və hər birinin
 * ÖZ slug-u var — yəni `/blog/cbct-nedir` ilə `/ru/blog/cbct-chto-eto` eyni
 * məqalənin iki dil versiyasıdır. Bazada onları bağlayan sahə yoxdur, ona görə
 * cütlər burada, kodda saxlanılır.
 *
 * Nəyə lazımdır:
 *  1. Dil dəyişdirici (`LocaleToggle`) sadəcə yola `/ru` prefiksi əlavə edir.
 *     Cütləşdirmə olmasa `/ru/blog/cbct-nedir` açılır və rus interfeysində
 *     azərbaycanca mətn göstərilir. Bu xəritə ilə düzgün URL-ə yönləndiririk.
 *  2. Sitemap və `<link rel="alternate" hreflang>` üçün doğru qarşılıq.
 *
 * Admin paneldən yeni yazı əlavə edilirsə, cütü də bura yazılmalıdır — əks
 * halda dil dəyişdiriləndə istifadəçi həmin yazının öz dilindəki URL-inə
 * qaytarılır (dil qarışığı yenə baş vermir, sadəcə tərcüməyə keçid olmur).
 */

/** AZ slug → RU slug. Tək istinad mənbəyi; əks istiqamət avtomatik qurulur. */
export const BLOG_SLUG_AZ_TO_RU: Record<string, string> = {
  // ---- Dental ----
  "panoramik-rentgen-nedir": "panoramnyy-rentgen",
  "dis-rentgeni-nedir": "rentgen-zuba-chto-eto",
  "implantdan-evvel-3d-tomoqrafiya": "3d-tomografiya-pered-implantaciey",
  "bitewing-rentgen-nedir": "chto-takoe-bitewing-rentgen",
  "agil-disi-cekilmezden-evvel-rentgen": "rentgen-pered-udaleniem-zuba-mudrosti",
  "sefalometrik-rentgen-istifadesi": "cefalometricheskiy-rentgen",
  "cbct-nedir": "cbct-chto-eto",
  "cene-sumuyunun-analizi": "analiz-chelyustnoy-kosti",
  "sinus-lift-emeliyyatindan-evvel-tomoqrafiya": "tomografiya-pered-sinus-liftingom",
  "dental-rentgen-tehlukelidirmi": "opasen-li-stomatologicheskiy-rentgen",
  "ortodontik-mualiceden-evvel-goruntuleme": "vizualizaciya-pered-ortodonticheskim-lecheniem",
  // ---- DEXA ----
  "densitometriya-dexa-nedir": "chto-takoe-densitometriya-dexa",
  // ---- Mammoqrafiya ----
  "mammoqrafiya-nece-yasdan": "mammografiya-s-kakogo-vozrasta",
  // ---- MRT / KT ----
  "mrt-nedir-nece-cekilir": "chto-takoe-mrt",
  "kt-ve-mrt-ferqi": "kt-ili-mrt-raznica",
  "bel-agrisinda-mrt": "mrt-poyasnicy-pri-boli-v-spine",
  "kontrastli-kt-ve-mrt": "kt-i-mrt-s-kontrastom",
  // ---- Rentgen ----
  "agciyer-rentgeni-ne-gosterir": "chto-pokazyvaet-rentgen-legkih",
  // ---- Uşaqlar / hamiləlik ----
  "hamilelikde-rentgen-olarmi": "rentgen-pri-beremennosti",
  "usaqlarda-dental-rentgen": "dentalnyy-rentgen-u-detey",
  "usaqlarda-goruntuleme-tehlukesizdirmi": "rentgen-detyam-bezopasno-li",
  // ---- USM ----
  "qarin-usm-hazirliq": "podgotovka-k-uzi-bryushnoy-polosti",
  "tiroid-usm-kime-lazimdir": "uzi-shchitovidnoy-zhelezy",
  "doppler-usm-nedir": "doppler-uzi-sosudov",
};

/** RU slug → AZ slug (yuxarıdakı xəritənin tərsi). */
export const BLOG_SLUG_RU_TO_AZ: Record<string, string> = Object.fromEntries(
  Object.entries(BLOG_SLUG_AZ_TO_RU).map(([az, ru]) => [ru, az]),
);

/**
 * `slug`-un `target` dilindəki qarşılığını qaytarır.
 * Slug artıq həmin dildədirsə özünü, cütü yoxdursa `null` qaytarır.
 */
export function blogSlugForLocale(
  slug: string,
  target: "az" | "ru",
): string | null {
  if (target === "ru") {
    if (BLOG_SLUG_RU_TO_AZ[slug]) return slug; // onsuz da RU slug-dur
    return BLOG_SLUG_AZ_TO_RU[slug] ?? null;
  }
  if (BLOG_SLUG_AZ_TO_RU[slug]) return slug; // onsuz da AZ slug-dur
  return BLOG_SLUG_RU_TO_AZ[slug] ?? null;
}
