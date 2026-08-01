/**
 * Unikal mərkəz təsviri generatoru.
 *
 * NƏ ÜÇÜN: 2026-08 toplu importunda ~200 APPROVED mərkəz eyni şablon cümləni
 * aldı (78-i bayt-bayt eyni). Google üçün bu, kütləvi təkrar məzmun deməkdir.
 * Bu modul hər mərkəzə HƏM fərqli söz quruluşu, HƏM də mərkəzin ÖZ faktlarını
 * (rayon/ünvan, iş qrafiki, Google reytinqi) daşıyan təsvir qurur.
 *
 * QAYDA: burada HEÇ BİR modallıq iddiası edilmir (MRT/KT/rentgen/USM
 * sadalanmır) — mərkəzlərin real xidmət siyahısı hələ dəqiqləşdirilməyib,
 * uydurma iddia təkrar mətndən daha zərərlidir. Bunun əvəzinə dürüst
 * çağırış istifadə olunur: "xidmətləri mərkəzdən dəqiqləşdirin".
 *
 * Seçim DETERMİNİSTİKDİR (mərkəz id-sinin heşi) — eyni mərkəz həmişə eyni
 * mətni alır, təkrar icra mətnləri "çalxalamır".
 */

import { DAY_KEYS, parseHours, type WeeklyHours } from "./hours";

/* ---------------------------------------------------------------- heş ---- */

/** FNV-1a 32-bit — sabit, platformadan asılı olmayan heş. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** `seed` üçün `pool`-dan sabit element seçir; `shift` kolliziya həllində fırlatmaq üçün. */
function pick<T>(pool: readonly T[], seed: string, salt: string, shift = 0): T {
  return pool[(hash(`${seed}|${salt}`) + shift) % pool.length];
}

/* -------------------------------------------------------------- qrammatika */

/** Azərbaycan dilində yerlik hal şəkilçisi: son sait qalın → -da, incə → -də. */
export function locative(word: string): string {
  const back = "aıou";
  const front = "eəiöü";
  const chars = [...word.toLowerCase()];
  for (let i = chars.length - 1; i >= 0; i--) {
    if (back.includes(chars[i])) return `${word}da`;
    if (front.includes(chars[i])) return `${word}də`;
  }
  return `${word}da`;
}

/** Mərkəz növü — adından çıxarılır. Bütün hal formaları öncədən yazılıb ki,
 *  şəkilçi generatoruna ehtiyac olmasın. */
type CenterType = {
  /** adlıq: "klinika" */ n: string;
  /** xəbərlik: "klinikadır" */ pred: string;
  /** cəm-çıxışlıq: "klinikalardan biri" */ plAbl: string;
};

const T = {
  hospital: { n: "xəstəxana", pred: "xəstəxanadır", plAbl: "xəstəxanalarından biri" },
  dental: { n: "diş klinikası", pred: "diş klinikasıdır", plAbl: "diş klinikalarından biri" },
  imaging: { n: "görüntüləmə mərkəzi", pred: "görüntüləmə mərkəzidir", plAbl: "görüntüləmə mərkəzlərindən biri" },
  diagnostic: { n: "diaqnostika mərkəzi", pred: "diaqnostika mərkəzidir", plAbl: "diaqnostika mərkəzlərindən biri" },
  clinic: { n: "klinika", pred: "klinikadır", plAbl: "klinikalarından biri" },
  medical: { n: "tibb mərkəzi", pred: "tibb mərkəzidir", plAbl: "tibb mərkəzlərindən biri" },
} as const satisfies Record<string, CenterType>;

export function detectType(name: string): CenterType {
  const s = name.toLowerCase();
  if (/xəstəxana|xestexana|hospital|госпитал|больниц/.test(s)) return T.hospital;
  if (/dental|diş |dis |stomatolo|smile|dent\b/.test(s)) return T.dental;
  if (/mrt|tomoqraf|tomograf|rentgen|görüntülə|goruntule|radiolo/.test(s)) return T.imaging;
  if (/diaqnostik|diagnostic|diagnostik|laborator/.test(s)) return T.diagnostic;
  if (/klinika|clinic|klinik/.test(s)) return T.clinic;
  return T.medical;
}

/** Ünvan təsvirə yalnız TƏMİZ olduqda salınır. İmport zamanı Google-dan gələn
 *  Plus-kodlar ("Q2CR+3J2"), Kiril mətn, yarımçıq mötərizə/dırnaq və başqa
 *  zibil ünvanlar mətni korlayır — belələri buraxılır. */
export function isCleanAddress(a: string | null | undefined): a is string {
  if (!a) return false;
  const s = a.trim();
  if (s.length < 10 || s.length > 90) return false;
  if (/[Ѐ-ӿ]/.test(s)) return false; // Kiril
  if (/\b[A-Z0-9]{4,6}\+[A-Z0-9]{2,4}\b/i.test(s)) return false; // Plus-kod
  // Balanssız mötərizə / dırnaq
  const cnt = (re: RegExp) => (s.match(re) ?? []).length;
  if (cnt(/\(/g) !== cnt(/\)/g)) return false;
  if (cnt(/"/g) % 2 !== 0) return false;
  if (/,\s*$/.test(s) || /\s,/.test(s)) return false; // asılı vergül
  return /[a-zA-ZəƏıİöÖüÜçÇşŞğĞ]{3,}/.test(s);
}

/** İmportda `district` sahəsinə bəzən küçə/prospekt düşüb ("Babək prospekti").
 *  Yalnız həqiqi rayon adına oxşayanları qəbul edirik. */
export function isValidDistrict(d: string | null | undefined): d is string {
  if (!d) return false;
  const s = d.trim();
  if (s.length < 3 || s.length > 30) return false;
  if (/\d/.test(s)) return false;
  if (/prospekt|küçə|kucə|küç\.|kuc\.|street|st\.|qəsəbə|mkr|döngə/i.test(s)) return false;
  return true;
}

/** "Bakı — Nərimanov" → { city: "Bakı", district: "Nərimanov" } */
export function splitCity(raw: string | null): { city: string | null; district: string | null } {
  if (!raw) return { city: null, district: null };
  const m = raw.split(/\s*[—–-]\s*/);
  if (m.length >= 2 && m[0].trim() && m[1].trim()) {
    return { city: m[0].trim(), district: m.slice(1).join(" ").trim() };
  }
  return { city: raw.trim(), district: null };
}

/* ------------------------------------------------------------ iş qrafiki -- */

type HoursFact =
  | { kind: "always" }
  | { kind: "range"; days: number; open: string; close: string }
  | null;

function hoursFact(hours: unknown): HoursFact {
  const w: WeeklyHours | null = parseHours(hours);
  if (!w) return null;
  const open = DAY_KEYS.map((k) => w[k]).filter((d): d is { open: string; close: string } => !!d);
  if (open.length === 0) return null;
  const allDay = open.length === 7 && open.every((d) => d.open === "00:00" && (d.close === "23:59" || d.close === "00:00"));
  if (allDay) return { kind: "always" };
  const earliest = open.reduce((a, d) => (d.open < a ? d.open : a), open[0].open);
  const latest = open.reduce((a, d) => (d.close > a ? d.close : a), open[0].close);
  return { kind: "range", days: open.length, open: earliest, close: latest };
}

/* ------------------------------------------------------------- variantlar - */

/** A1 — açılış, mərkəzin NÖVÜNÜ işlədən variantlar (ad növü təkrarlamayanda). */
const OPENERS_TYPED: readonly ((c: Ctx) => string)[] = [
  (c) => `${c.name} — ${c.cityLoc} fəaliyyət göstərən ${c.type.n}.`,
  (c) => `${c.name}, ${c.cityLoc} xidmət göstərən ${c.type.pred}.`,
  (c) => `${c.cityLoc} yerləşən ${c.type.n}: ${c.name}.`,
  (c) => `${c.name} — ${c.city} şəhərinin ${c.type.plAbl}.`,
  (c) => `${c.name} — ${c.cityLoc} diaqnostika xidmətləri təklif edən ${c.type.n}.`,
  (c) => `${c.name} ${c.city} şəhərində yerləşən ${c.type.pred}.`,
  (c) => `${c.city} şəhərində fəaliyyət göstərən ${c.name} — ${c.type.n}.`,
  (c) => `${c.name} — ${c.city} sakinləri üçün ${c.type.n}.`,
  (c) => `${c.name}: ${c.cityLoc} fəaliyyət göstərən ${c.type.n} haqqında ətraflı məlumat.`,
  (c) => `${c.type.n} — ${c.name}, ${c.city}.`,
];

/** A2 — açılış, növü ÇƏKMƏYƏN variantlar. Mərkəzin adı artıq növü daşıyırsa
 *  ("Yaşam Tibb Mərkəzi"), təkrar olmasın deyə bunlardan seçilir. */
const OPENERS_PLAIN: readonly ((c: Ctx) => string)[] = [
  (c) => `${c.name} ${c.cityLoc} pasiyentlərə xidmət göstərir.`,
  (c) => `${c.cityLoc} fəaliyyət göstərən ${c.name} rentgen.az kataloqunda qeydiyyatdadır.`,
  (c) => `Rentgen.az kataloqunda ${c.cityLoc} yerləşən ${c.name} haqqında məlumat.`,
  (c) => `${c.cityLoc} müraciət edə biləcəyiniz ünvanlardan biri — ${c.name}.`,
  (c) => `${c.cityLoc} xidmət göstərən ${c.name} rentgen.az-da təqdim olunur.`,
  (c) => `${c.name} ${c.cityLoc} yerləşir və pasiyentləri qəbul edir.`,
  (c) => `${c.name} — ${c.city}. Mərkəz haqqında məlumat rentgen.az kataloqundadır.`,
  (c) => `${c.cityLoc} yerləşən ${c.name} pasiyentləri qəbul edir.`,
  (c) => `${c.name} — ${c.cityLoc} fəaliyyət göstərir.`,
  (c) => `${c.name}, ${c.city}. Mərkəzin əsas məlumatları rentgen.az kataloqunda toplanıb.`,
];

/** B — yer: rayon və ya ünvan (varsa). */
const PLACE_DISTRICT: readonly ((c: Ctx) => string)[] = [
  (c) => `Mərkəz ${c.district} rayonunda yerləşir.`,
  (c) => `${c.district} rayonunda xidmət göstərir.`,
  (c) => `Yerləşdiyi ərazi — ${c.district} rayonu.`,
  (c) => `${c.district} rayonunda, şəhərin əlçatan hissəsindədir.`,
];

const PLACE_ADDRESS: readonly ((c: Ctx) => string)[] = [
  (c) => `Ünvan: ${c.address}.`,
  (c) => `Mərkəzin ünvanı — ${c.address}.`,
  (c) => `${c.address} ünvanında qəbul edir.`,
  (c) => `Ünvanı: ${c.address}.`,
];

/** C — iş qrafiki (varsa). */
const HOURS_RANGE: readonly ((c: Ctx, h: { days: number; open: string; close: string }) => string)[] = [
  (_c, h) => `Həftənin ${h.days} günü, saat ${h.open}–${h.close} arası işləyir.`,
  (_c, h) => `İş qrafiki: həftədə ${h.days} gün, ${h.open}–${h.close}.`,
  (_c, h) => `Qəbul saatları ${h.open}–${h.close} aralığındadır (həftədə ${h.days} gün).`,
  (_c, h) => `Həftə ərzində ${h.days} gün açıqdır, iş saatı ${h.open}–${h.close}.`,
  (_c, h) => `${h.open}–${h.close} saatları arasında, həftədə ${h.days} gün fəaliyyət göstərir.`,
];

const HOURS_WEEK: readonly ((c: Ctx, h: { open: string; close: string }) => string)[] = [
  (_c, h) => `Həftənin bütün günləri ${h.open}–${h.close} işləyir.`,
  (_c, h) => `Hər gün, o cümlədən həftəsonu, ${h.open}–${h.close} açıqdır.`,
  (_c, h) => `İş qrafiki: 7 gün, ${h.open}–${h.close}.`,
];

const HOURS_ALWAYS: readonly string[] = [
  `Sutkalıq — 24 saat rejimində fəaliyyət göstərir.`,
  `Mərkəz 24 saat, həftənin bütün günləri açıqdır.`,
  `Qəbul sutka ərzində, fasiləsiz aparılır.`,
];

/** D — Google reytinqi (varsa). */
const RATING_WITH_COUNT: readonly ((c: Ctx, r: { v: string; n: number }) => string)[] = [
  (_c, r) => `Google-da reytinqi ${r.v} ulduzdur (${r.n} rəy).`,
  (_c, r) => `İstifadəçilər Google xəritələrində mərkəzi ${r.v} ulduzla qiymətləndirib — ${r.n} rəy.`,
  (_c, r) => `Google xəritələrindəki qiymətləndirmə: ${r.v}/5, ${r.n} rəy əsasında.`,
  (_c, r) => `${r.n} Google rəyi əsasında orta qiymət — ${r.v} ulduz.`,
  (_c, r) => `Google rəyçilərinin verdiyi orta bal: ${r.v} (${r.n} rəy).`,
];

const RATING_BARE: readonly ((c: Ctx, r: { v: string }) => string)[] = [
  (_c, r) => `Google xəritələrindəki reytinqi — ${r.v}/5.`,
  (_c, r) => `Google-da ${r.v} ulduz toplayıb.`,
  (_c, r) => `Google qiymətləndirməsi: ${r.v} ulduz.`,
];

/** Reytinq 4.0-dan aşağı olanda balı meta-təsvirə yazmırıq — əvəzinə yalnız
 *  rəy sayını göstəririk. Bal onsuz da səhifədə canlı Google nişanında görünür,
 *  yəni heç nə gizlədilmir; sadəcə mərkəzin axtarış snippetində aşağı bal
 *  önə çıxarılmır. */
const REVIEW_COUNT_ONLY: readonly ((c: Ctx, r: { n: number }) => string)[] = [
  (_c, r) => `Google xəritələrində ${r.n} istifadəçi rəyi var.`,
  (_c, r) => `Mərkəz haqqında Google-da ${r.n} rəy yazılıb.`,
  (_c, r) => `Google xəritələrində ${r.n} rəy toplayıb.`,
];

/** E — dürüst yekun / çağırış. Modallıq iddiası YOXDUR. */
const CTAS: readonly string[] = [
  `Xidmətlərin dəqiq siyahısı və qiymətlər üçün mərkəzlə birbaşa əlaqə saxlaya bilərsiniz.`,
  `Müayinə növləri və qiymətləri barədə məlumatı mərkəzdən ala bilərsiniz.`,
  `Qəbul üçün rentgen.az üzərindən sorğu göndərə və ya birbaşa zəng edə bilərsiniz.`,
  `Ətraflı məlumat və qeydiyyat üçün rentgen.az-dakı sorğu formasından istifadə edin.`,
  `Hansı müayinələrin aparıldığını dəqiqləşdirmək üçün mərkəzə zəng etməyiniz tövsiyə olunur.`,
  `Qiymətlər və boş vaxtlar barədə mərkəzlə əvvəlcədən əlaqə saxlamaq məsləhətdir.`,
  `Rentgen.az üzərindən qəbul sorğusu göndərə bilərsiniz — mərkəz sizinlə əlaqə saxlayacaq.`,
  `Müayinəyə yazılmaq üçün əvvəlcədən qeydiyyatdan keçmək tövsiyə olunur.`,
  `Xidmət və qiymət siyahısı mərkəz tərəfindən yenilənir.`,
  `Sorğunuzu rentgen.az üzərindən göndərin, mərkəz sizə geri dönüş edəcək.`,
  `Əlavə suallar üçün mərkəzin telefon nömrəsi ilə əlaqə saxlaya bilərsiniz.`,
  `Müayinəyə yazılmaq üçün rentgen.az-dakı formanı doldura bilərsiniz.`,
];

/* ------------------------------------------------------------------ giriş - */

export type CenterForDescription = {
  id: string;
  name: string;
  city: string | null;
  district?: string | null;
  address?: string | null;
  hours?: unknown;
  googleRating?: number | null;
  googleReviewCount?: number | null;
};

type Ctx = {
  name: string;
  city: string;
  cityLoc: string;
  district: string | null;
  address: string | null;
  type: CenterType;
};

/**
 * Mərkəz üçün unikal təsvir qurur.
 * `shift` — kolliziya olduqda variant seçimini fırlatmaq üçün (adətən 0).
 */
export function buildCenterDescription(c: CenterForDescription, shift = 0): string {
  const parsed = splitCity(c.city);
  const city = parsed.city ?? "Azərbaycan";
  // "Xətai rayonu" → "Xətai" (cümlədə "…rayonunda" onsuz da əlavə olunur)
  const stripRayon = (d: string | null) => d?.replace(/\s*rayonu?$/i, "").trim() || null;
  const dbDistrict = isValidDistrict(c.district) ? stripRayon(c.district) : null;
  const cityDistrict = isValidDistrict(parsed.district) ? stripRayon(parsed.district) : null;
  const ctx: Ctx = {
    name: c.name.trim(),
    city,
    cityLoc: locative(city),
    district: dbDistrict ?? cityDistrict,
    address: isCleanAddress(c.address) ? c.address.trim() : null,
    type: detectType(c.name),
  };

  // Ad artıq növü daşıyırsa ("Yaşam Tibb Mərkəzi"), növü təkrarlamayan açılış seç.
  const nameHasType = ctx.name.toLowerCase().includes(ctx.type.n.toLowerCase());
  const openers = nameHasType ? OPENERS_PLAIN : OPENERS_TYPED;
  const parts: string[] = [pick(openers, c.id, "open", shift)(ctx)];

  // B — yer: rayon üstündür, yoxdursa təmiz ünvan
  if (ctx.district) {
    parts.push(pick(PLACE_DISTRICT, c.id, "place", shift)(ctx));
  } else if (ctx.address) {
    parts.push(pick(PLACE_ADDRESS, c.id, "place", shift)(ctx));
  }

  // C — iş qrafiki
  const h = hoursFact(c.hours);
  if (h?.kind === "always") {
    parts.push(pick(HOURS_ALWAYS, c.id, "hours", shift));
  } else if (h?.kind === "range") {
    parts.push(
      h.days === 7
        ? pick(HOURS_WEEK, c.id, "hours", shift)(ctx, h)
        : pick(HOURS_RANGE, c.id, "hours", shift)(ctx, h),
    );
  }

  // D — Google reytinqi (4.0+ balı göstərilir, aşağısında yalnız rəy sayı)
  if (c.googleRating != null) {
    const v = c.googleRating.toFixed(1);
    const n = c.googleReviewCount ?? 0;
    if (c.googleRating >= 4) {
      parts.push(
        n > 0
          ? pick(RATING_WITH_COUNT, c.id, "rating", shift)(ctx, { v, n })
          : pick(RATING_BARE, c.id, "rating", shift)(ctx, { v }),
      );
    } else if (n >= 5) {
      parts.push(pick(REVIEW_COUNT_ONLY, c.id, "rating", shift)(ctx, { n }));
    }
  }

  // E — çağırış
  parts.push(pick(CTAS, c.id, "cta", shift));

  return capitalize(parts.join(" ").replace(/\s+/g, " ").trim());
}

/** İlk HƏRFİ böyüdür (mətn dırnaqla başlaya bilər: `"Biolab" …`). */
function capitalize(s: string): string {
  const i = s.search(/\p{L}/u);
  if (i < 0) return s;
  return s.slice(0, i) + s[i].toLocaleUpperCase("az") + s.slice(i + 1);
}

/**
 * Bir dəst mərkəz üçün QARŞILIQLI unikal təsvirlər qurur — eyni mətn çıxarsa,
 * variant seçimi fırladılaraq təkrar cəhd edilir.
 */
export function buildUniqueDescriptions(
  centers: CenterForDescription[],
): Map<string, string> {
  const out = new Map<string, string>();
  const seen = new Set<string>();
  for (const c of centers) {
    let text = "";
    for (let shift = 0; shift < 64; shift++) {
      text = buildCenterDescription(c, shift);
      if (!seen.has(text)) break;
    }
    seen.add(text);
    out.set(c.id, text);
  }
  return out;
}
