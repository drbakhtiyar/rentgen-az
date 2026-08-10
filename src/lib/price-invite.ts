import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/env";
import { AZ_MOBILE_PREFIXES } from "@/lib/center-filters";
import { CENTER_FAQ_KEYS, parseFaqAnswers } from "@/content/center-faq";

/**
 * Qiymət toplama kampaniyası — WhatsApp üzərindən.
 *
 * AXIN: operator `/panel/whatsapp` səhifəsində günlük partiyanı görür →
 * "WhatsApp aç" düyməsi `wa.me` linkini hazır mətnlə açır (mətndə mərkəzin
 * adı + onun `/q/<token>` linki) → operator "göndər"ə basır → sistem göndərişi
 * jurnala yazır. Mərkəz linki açıb girişsiz qiymətlərini yazır.
 *
 * NİYƏ OTP YOXDUR: linki BİZ mərkəzin öz nömrəsinə göndəririk — token
 * sahibliyi sübut edir (rəy dəvətindəki eyni məntiq). Səhifədə şəxsi məlumat
 * yoxdur; edilə bilən yeganə şey öz kartının qiymətini yazmaqdır və hər
 * dəyişiklik jurnala düşür.
 *
 * NİYƏ GÜNDƏ 12: tanımadığın nömrələrə kütləvi eyni-mətnli mesaj WhatsApp-ın
 * spam siqnalıdır; aşağı temp + variantlı mətn + ikitərəfli söhbət nömrəni
 * qoruyur (istifadəçi qərarı, 2026-08-03). Limit alətə tikilib ki, operator
 * qaydanı bilmədən də poza bilməsin.
 */

/** Gündəlik WhatsApp göndəriş limiti (istifadəçi qərarı: 12). */
export const WA_DAILY_LIMIT = 12;
/** Jurnalda göndəriş qeydinin `action` açarı. */
export const WA_LOG_ACTION = "center:wa_price_invite";
/** FAQ dəvəti üçün jurnal açarı (2026-08-10 — ikinci kampaniya). */
export const WA_FAQ_LOG_ACTION = "center:wa_faq_invite";
/** Kart (xidmət təsdiqi + qiymət + saat) dəvəti — 2026-08-10, üçüncü kampaniya. */
export const WA_CARD_LOG_ACTION = "center:wa_card_invite";
/** Kabinet aktivləşdirmə dəvəti — 2026-08-10, dördüncü kampaniya. */
export const WA_CABINET_LOG_ACTION = "center:wa_cabinet_invite";

/** Kampaniya növü. Limit HAMISI ÜÇÜN ORTAQDIR — nömrəni qoruyan gündəlik 12
 *  ümumi göndərişə aiddir, mesajın mövzusuna yox. */
export type WaKind = "price" | "faq" | "card" | "cabinet";
const WA_ACTIONS: Record<WaKind, string> = {
  price: WA_LOG_ACTION,
  faq: WA_FAQ_LOG_ACTION,
  card: WA_CARD_LOG_ACTION,
  cabinet: WA_CABINET_LOG_ACTION,
};
export const waAction = (kind: WaKind) => WA_ACTIONS[kind];

const mobileOr = AZ_MOBILE_PREFIXES.map((p) => ({ whatsapp: { startsWith: p } }));
const mobilePhoneOr = AZ_MOBILE_PREFIXES.map((p) => ({ phone: { startsWith: p } }));

/** Bakı günü üzrə bugünün başlanğıcı (UTC+4). */
export function bakuDayStart(now = new Date()): Date {
  const baku = new Date(now.getTime() + 4 * 3600_000);
  baku.setUTCHours(0, 0, 0, 0);
  return new Date(baku.getTime() - 4 * 3600_000);
}

/** Bu gün neçə göndəriş olub — BÜTÜN kampaniyalar birlikdə (ortaq limit). */
export async function sentToday(): Promise<number> {
  return prisma.adminActionLog.count({
    where: {
      action: { in: Object.values(WA_ACTIONS) },
      createdAt: { gte: bakuDayStart() },
    },
  });
}

export type WaCandidate = {
  centerId: string;
  name: string;
  city: string | null;
  status: string;
  waPhone: string;
  waUrl: string;
  qUrl: string;
  googleReviewCount: number | null;
  /** "Niyə məhz bu mərkəz?" — operatora görünən seçim səbəbi. */
  reason?: string;
};

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

/** Mesaj mətni — variantlı (eyni cümlə yüzlərlə nömrəyə getməsin). */
export function waMessage(centerName: string, qUrl: string, seed: string): string {
  const V = [
    `Salam! ${centerName} — rentgen.az kataloqunda səhifəniz var. Qiymətlərinizi əlavə etsəniz, pasiyentlər sizi qiymətə görə də tapacaq. 1 dəqiqə çəkir: ${qUrl}`,
    `Salam, ${centerName}! Biz rentgen.az-ıq — Azərbaycanın rentgen/diaqnostika kataloqu. Xidmət qiymətlərinizi bu linkdən qeyd edə bilərsiniz (girişsiz, 1 dəqiqə): ${qUrl}`,
    `Salam! rentgen.az-da ${centerName} səhifəsinə pasiyentlər baxır. Qiymətləri göstərsək, müraciət sayı artır. Qeyd etmək üçün: ${qUrl}`,
    `Salam, ${centerName}! rentgen.az kataloqunda qiyməti göstərilən mərkəzlər axtarışda önə çıxır. Qiymətlərinizi bura yaza bilərsiniz: ${qUrl}`,
    `Salam! ${centerName} üçün rentgen.az-da qiymət bölməsi hazırladıq — doldurmaq 1 dəqiqə çəkir, giriş tələb olunmur: ${qUrl}`,
  ];
  return V[hash(seed) % V.length];
}

/**
 * FAQ dəvəti mesajı — 3-4 cümləlik, ƏHƏMİYYƏTİ vurğulayan variantlar
 * (istifadəçi istəyi: "niyə vacibdir" mütləq izah olunsun).
 */
export function waFaqMessage(centerName: string, fUrl: string, seed: string): string {
  const V = [
    `Salam! ${centerName} — rentgen.az-dakı səhifənizdə pasiyentlərin ən çox soruşduğu 10 sualın (ödəniş üsulu, əlil arabası ilə giriş, parkinq, nəticə müddəti və s.) cavab bölməsi var. Bu cavablar dolu olanda pasiyent sizə zəng etmədən qərar verir və müraciət sayı nəzərəçarpacaq artır — həm də səhifəniz Google-da bu suallarla axtarışda önə çıxır. Doldurmaq cəmi 2-3 dəqiqə çəkir, giriş tələb olunmur: ${fUrl}`,
    `Salam, ${centerName}! Pasiyentlər mərkəz seçəndə əvvəlcə praktik suallara baxır: ödəniş nə ilə olur, parkinq varmı, əlil arabası ilə giriş mümkündürmü, nəticə nə vaxt hazır olur. rentgen.az səhifənizdə bu 10 sualın cavab yeri hazırdır — dolu olan səhifələr həm daha çox müraciət alır, həm Google axtarışında irəli düşür. 2 dəqiqənizi ayırın, girişsiz doldurulur: ${fUrl}`,
    `Salam! rentgen.az-da ${centerName} səhifəsinə baxan pasiyentlərin ən çox axtardığı məlumat 10 praktik sualın cavabıdır — ödəniş üsulları, əlil girişi, parkinq, uşaq qəbulu, nəticə müddəti. Cavabları siz yazın ki, pasiyent zəngə ehtiyac duymadan sizi seçsin — bu bölməsi dolu mərkəzlərə müraciət daha çox olur. Link girişsizdir, 2-3 dəqiqə çəkir: ${fUrl}`,
    `Salam, ${centerName}! Mərkəzinizin rentgen.az səhifəsində "Tez-tez verilən suallar" bölməsi pasiyentin qərarına ən çox təsir edən hissədir: ödəniş, parkinq, əlil arabası ilə giriş, nəticənin forması və müddəti. Bu 10 cavabı dolduran mərkəzlər həm pasiyentə əziyyət vermir, həm də Google-da həmin suallarla tapılır. Doldurma linki (girişsiz, 2 dəqiqə): ${fUrl}`,
  ];
  return V[hash(seed) % V.length];
}

/**
 * Kart dəvəti mesajı — xidmət təsdiqi + qiymət + iş saatları bir linkdə;
 * foto/loqo elə WhatsApp çatına istənilir. Əhəmiyyət vurğulanır.
 */
export function waCardMessage(centerName: string, mUrl: string, seed: string): string {
  const V = [
    `Salam! ${centerName} — rentgen.az kataloqunda səhifəniz hazırdır, amma xidmət siyahınızı dəqiqləşdirmək üçün sizin təsdiqiniz lazımdır. Bu linkdə göstərmədiyiniz xidmətləri silə, çatışmayanları əlavə edə, qiymət və iş saatlarınızı qeyd edə bilərsiniz — dəqiq kart pasiyentə inam verir və müraciəti artırır. 3-4 dəqiqə çəkir, giriş tələb olunmur: ${mUrl} Loqo və binanızın fotosunu isə elə bu çata göndərin — biz yerləşdirək.`,
    `Salam, ${centerName}! rentgen.az-da kartınızdakı xidmət siyahısını yalnız siz dəqiq bilirsiniz — linkdə artıq olanları çıxarın, olmayanları əlavə edin, qiymət və iş qrafikinizi yazın. Siyahısı dəqiq, qiyməti görünən mərkəzlər axtarışda önə çıxır və pasiyent zəng etmədən seçim edir. Girişsiz, 3-4 dəqiqə: ${mUrl} Bir də loqo və giriş fotosunu bu çata atsanız, kartınıza əlavə edərik.`,
    `Salam! ${centerName} üçün rentgen.az-da özünüidarə linki hazırladıq: xidmətlərinizi təsdiqləyin (sil/əlavə et), qiymətləri və iş saatlarını qeyd edin — hamısı bir səhifədə, girişsiz. Kartı dolu olan mərkəzlərə pasiyent müraciəti nəzərəçarpacaq dərəcədə çoxdur: ${mUrl} Loqo və bina şəklinizi də elə buradaca WhatsApp-la göndərə bilərsiniz.`,
  ];
  return V[hash(seed) % V.length];
}

/**
 * Kabinet dəvəti mesajı — GENİŞ izah (istifadəçi istəyi): girişin nə qədər asan
 * olduğu + kabinetin nə verdiyi. Link izah səhifəsinə aparır.
 */
export function waCabinetMessage(centerName: string, seed: string): string {
  const url = `${SITE_URL}/merkez-kabineti`;
  const V = [
    `Salam! ${centerName} — rentgen.az-da səhifəniz artıq mövcuddur və pasiyentlər ona baxır. Sizin üçün pulsuz idarəetmə kabineti də hazırdır: giriş çox asandır — kartınızdakı telefon nömrəsi + SMS kod, heç bir parol yoxdur. Kabinetdə pasiyent sorğularını qəbul edir, xidmət və qiymətlərinizi özünüz yeniləyir, foto-loqo əlavə edir, rəylərə cavab verirsiniz. Ətraflı və giriş: ${url}`,
    `Salam, ${centerName}! rentgen.az-dakı səhifənizi özünüz idarə edə bilərsiniz — kabinet pulsuzdur və girişi 30 saniyə çəkir: telefon nömrəniz + SMS kod (parol yaddaşda saxlamalı deyilsiniz). İçəridə: gələn pasiyent sorğuları, xidmət-qiymət redaktəsi, iş qrafiki, foto və rəy idarəsi. Niyə vacibdir və necə girməli — burada izah etmişik: ${url}`,
    `Salam! ${centerName} üçün xoş xəbər: rentgen.az səhifənizin idarəçiliyini sizə veririk. Kabinetə giriş parolsuz-filansızdır — kartdakı nömrəyə SMS kod gəlir, daxil olursunuz. Pasiyent müraciətlərini bir yerdə görmək, qiymətləri anında dəyişmək, foto əlavə etmək və rəylərə cavab vermək — hamısı pulsuzdur. Bir dəqiqəlik izah: ${url}`,
  ];
  return V[hash(seed) % V.length];
}

/** Mərkəzin tokenini qaytarır, yoxdursa yaradır. */
export async function ensurePriceToken(centerId: string): Promise<string> {
  const c = await prisma.centerProfile.findUnique({ where: { id: centerId }, select: { priceToken: true } });
  if (c?.priceToken) return c.priceToken;
  const token = randomBytes(16).toString("hex");
  await prisma.centerProfile.update({ where: { id: centerId }, data: { priceToken: token } });
  return token;
}

const isMobileNum = (p: string | null) =>
  !!p && AZ_MOBILE_PREFIXES.some((x) => p.startsWith(x));

type CenterLite = {
  id: string; name: string; city: string | null; status: string;
  phone: string; whatsapp: string | null;
  googleReviewCount: number | null; priceToken: string | null;
};

/** Mərkəz → göndərişə hazır sətir (link + hazır mesaj, kampaniyaya görə). */
async function toCandidate(c: CenterLite, kind: WaKind): Promise<WaCandidate> {
  const waPhone = isMobileNum(c.whatsapp) ? c.whatsapp! : c.phone;
  let url = `${SITE_URL}/merkez-kabineti`;
  let msg: string;
  if (kind === "cabinet") {
    msg = waCabinetMessage(c.name, c.id);
  } else {
    const token = c.priceToken ?? (await ensurePriceToken(c.id));
    const path = kind === "faq" ? "f" : kind === "card" ? "m" : "q";
    url = `${SITE_URL}/${path}/${token}`;
    msg =
      kind === "faq"
        ? waFaqMessage(c.name, url, c.id)
        : kind === "card"
          ? waCardMessage(c.name, url, c.id)
          : waMessage(c.name, url, c.id);
  }
  return {
    centerId: c.id, name: c.name, city: c.city, status: c.status,
    waPhone, qUrl: url,
    waUrl: `https://wa.me/${waPhone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`,
    googleReviewCount: c.googleReviewCount,
  };
}

/** Mərkəzə hər hansı kampaniyadan son dəvətin tarixi + link formlarına reaksiyası. */
const SELF_ACTIONS = ["center:price_self", "center:faq_self", "center:card_self"];
const COOLDOWN_DAYS = 7;

/**
 * Bugünkü partiya — MƏNTİQLİ NÖVBƏ (istifadəçi istəyi, 2026-08-10):
 * təsadüfi siyahı yox, hər mərkəz üçün görünən SƏBƏBLƏ sıralanmış təkliflər.
 *
 * Ümumi qaydalar (bütün tablar):
 *   - Soyuma: son 7 gündə HƏR HANSI kampaniyadan mesaj alan mərkəz heç bir
 *     tabda təklif olunmur — eyni nömrəyə dalbadal fərqli mövzular yazmayaq.
 *   - Linkə əvvəl reaksiya vermiş mərkəz (price/faq/card_self) İRƏLİ çəkilir —
 *     cavab verən nömrəyə yazmaq həm nəzakətli, həm nəticəlidir.
 *   - APPROVED (canlı səhifə) PENDING-dən əvvəl; bərabərlikdə böyük mərkəz
 *     (Google rəy sayı) əvvəl — təsir ən çox orada görünür.
 *
 * Tab-spesifik məntiq:
 *   card    — hələ kart dəvəti almayıb və özü kartını təsdiqləməyib; ŞABLON
 *             ŞÜBHƏSİ (25+ xidmət — toplu importdan qalma) ən yuxarı.
 *   price   — qiyməti yoxdur; kart dəvəti son 14 gündə gedibsə GÖZLƏYİR
 *             (kart linkində qiymət yeri onsuz da var — təkrar yazmayaq).
 *   faq     — cavabların yarıdan azı dolu; kartı/qiyməti həll etmiş (reaksiya
 *             vermiş) mərkəzlər əvvəl — funnel: kart → qiymət → FAQ.
 *   cabinet — sahibi hələ aktivləşməyib; linklərə reaksiya verənlər əvvəl
 *             (onlar kabinetə bir addımdadır) — funnel-in son pilləsi.
 */
export async function todaysBatch(
  kind: WaKind = "price",
): Promise<{ remaining: number; candidates: WaCandidate[] }> {
  const used = await sentToday();
  const remaining = Math.max(0, WA_DAILY_LIMIT - used);

  // Bütün dəvət + reaksiya jurnalı bir sorğuda — mərkəz üzrə qruplaşdırırıq.
  const logs = await prisma.adminActionLog.findMany({
    where: { action: { in: [...Object.values(WA_ACTIONS), ...SELF_ACTIONS] } },
    select: { action: true, targetId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  const sentThisKind = new Set<string>();
  const lastAnyInvite = new Map<string, Date>();
  const lastCardInvite = new Map<string, Date>();
  const responded = new Set<string>();
  const didCardSelf = new Set<string>();
  for (const l of logs) {
    if (!l.targetId) continue;
    if (l.action === waAction(kind)) sentThisKind.add(l.targetId);
    if (Object.values(WA_ACTIONS).includes(l.action)) {
      if (!lastAnyInvite.has(l.targetId)) lastAnyInvite.set(l.targetId, l.createdAt);
      if (l.action === WA_CARD_LOG_ACTION && !lastCardInvite.has(l.targetId))
        lastCardInvite.set(l.targetId, l.createdAt);
    }
    if (SELF_ACTIONS.includes(l.action)) {
      responded.add(l.targetId);
      if (l.action === "center:card_self") didCardSelf.add(l.targetId);
    }
  }
  const daysAgo = (d: Date | undefined) =>
    d ? (Date.now() - d.getTime()) / 86_400_000 : Infinity;

  const centers = await prisma.centerProfile.findMany({
    where: {
      status: { in: ["APPROVED", "PENDING"] },
      OR: [...mobileOr, ...mobilePhoneOr],
      services: { some: {} },
      ...(kind === "price"
        ? { NOT: { services: { some: { price: { not: null } } } } }
        : {}),
      ...(kind === "cabinet"
        ? { user: { phone: { startsWith: "placeholder:" } } }
        : {}),
    },
    select: {
      id: true, name: true, city: true, status: true, phone: true, whatsapp: true,
      googleReviewCount: true, priceToken: true, faqAnswers: true,
      _count: { select: { services: true } },
    },
  });

  type Scored = { c: (typeof centers)[number]; score: number; reason: string };
  const scored: Scored[] = [];
  for (const c of centers) {
    if (sentThisKind.has(c.id)) continue;
    if (daysAgo(lastAnyInvite.get(c.id)) < COOLDOWN_DAYS) continue; // soyuma

    const faqCount = Object.keys(parseFaqAnswers(c.faqAnswers)).length;
    const svc = c._count.services;
    const live = c.status === "APPROVED";
    const big = (c.googleReviewCount ?? 0) >= 100;
    const reacted = responded.has(c.id);
    let score = (live ? 3 : 0) + (reacted ? 2 : 0);
    const why: string[] = [];

    if (kind === "card") {
      if (didCardSelf.has(c.id)) continue; // kartını artıq özü təsdiqləyib
      if (svc >= 25) { score += 3; why.push(`${svc} xidmət — şablon təsdiqi vacibdir`); }
      if (live && !why.length) why.push("canlı səhifə — dəqiqlik pasiyentə görünür");
    } else if (kind === "price") {
      if (daysAgo(lastCardInvite.get(c.id)) < 14) continue; // kart linki hələ təzədir
      why.push("qiyməti yoxdur");
      if (big) why.push(`${c.googleReviewCount} rəylik mərkəz — qiymət ən çox burada işləyir`);
    } else if (kind === "faq") {
      if (faqCount >= CENTER_FAQ_KEYS.length / 2) continue;
      why.push(`FAQ ${faqCount}/${CENTER_FAQ_KEYS.length} dolu`);
      if (reacted) why.push("əvvəlki linkə cavab verib");
    } else {
      // cabinet
      if (reacted) { score += 2; why.push("linkə reaksiya verib — kabinetə bir addımdadır"); }
      else if (big) why.push("böyük mərkəz — kabinetdən ən çox o qazanar");
    }
    if (big) score += 1;
    if (!why.length && reacted) why.push("əvvəlki linkə cavab verib");
    if (!why.length) why.push(live ? "canlı səhifə" : "təsdiq gözləyir");

    scored.push({ c, score, reason: why.join(" · ") });
  }

  const pool = scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.c.googleReviewCount ?? 0) - (a.c.googleReviewCount ?? 0),
    )
    .slice(0, remaining);

  const candidates: WaCandidate[] = [];
  for (const s of pool)
    candidates.push({ ...(await toCandidate(s.c, kind)), reason: s.reason });
  return { remaining, candidates };
}

/** "Bəyaz Diş" ~ "beyaz dis" — axtarış üçün diakritik-həssas olmayan fold. */
function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/ə/g, "e").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ç/g, "c")
    .replace(/ö/g, "o").replace(/ü/g, "u").replace(/ğ/g, "g")
    .normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export type WaSearchResult = WaCandidate & {
  /** Bu mərkəzə (bu kampaniya üzrə) əvvəl göndərilibsə — nə vaxt. */
  alreadySentAt: Date | null;
  /** Artıq dolu sayılır: price→qiyməti var, faq→cavabların çoxu yazılıb. */
  hasPrices: boolean;
};

/**
 * Ad üzrə əl ilə mərkəz axtarışı — avtomatik 12-liyə düşməyən mərkəzi operator/
 * admin özü seçib göndərə bilsin (istifadəçi istəyi, 2026-08-10). Yalnız mobil
 * WhatsApp/telefonu olanlar çıxır (əks halda wa.me işləmir). "Göndərilib" və
 * "qiyməti var" vəziyyətləri gizlədilmir — nişanla göstərilir, qərar insandadır.
 * Gündəlik limit burada da eyni sayğacdan işləyir (markWaSentAction).
 */
export async function searchWaCandidates(
  q: string,
  kind: WaKind = "price",
): Promise<WaSearchResult[]> {
  const needle = fold(q.trim());
  if (needle.length < 2) return [];

  const centers = await prisma.centerProfile.findMany({
    where: {
      status: { in: ["APPROVED", "PENDING"] },
      OR: [...mobileOr, ...mobilePhoneOr],
    },
    select: {
      id: true, name: true, city: true, status: true, phone: true, whatsapp: true,
      googleReviewCount: true, priceToken: true, faqAnswers: true,
      user: { select: { phone: true } },
      services: { where: { price: { not: null } }, select: { id: true }, take: 1 },
    },
  });

  const matches = centers.filter((c) => fold(c.name).includes(needle)).slice(0, 10);
  if (matches.length === 0) return [];

  const sentLogs = await prisma.adminActionLog.findMany({
    where: { action: waAction(kind), targetId: { in: matches.map((c) => c.id) } },
    select: { targetId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  const sentAt = new Map<string, Date>();
  for (const l of sentLogs) if (l.targetId && !sentAt.has(l.targetId)) sentAt.set(l.targetId, l.createdAt);

  // Axtarış nəticəsində də seçim konteksti görünsün (istifadəçi rəyi:
  // "axtardım, amma FAQ-ın neçəsi dolu olduğu görünmür").
  const svcCounts = await prisma.centerService.groupBy({
    by: ["centerId"],
    where: { centerId: { in: matches.map((c) => c.id) } },
    _count: true,
  });
  const svcCount = new Map(svcCounts.map((s) => [s.centerId, s._count]));

  const out: WaSearchResult[] = [];
  for (const c of matches) {
    const faqCount = Object.keys(parseFaqAnswers(c.faqAnswers)).length;
    const activated = !c.user.phone.startsWith("placeholder:");
    const filled =
      kind === "faq"
        ? faqCount >= CENTER_FAQ_KEYS.length / 2
        : kind === "cabinet"
          ? activated
          : kind === "card"
            ? false
            : c.services.length > 0;
    const reason =
      kind === "faq"
        ? `FAQ ${faqCount}/${CENTER_FAQ_KEYS.length} dolu`
        : kind === "price"
          ? c.services.length > 0
            ? "qiyməti artıq var"
            : "qiyməti yoxdur"
          : kind === "card"
            ? `${svcCount.get(c.id) ?? 0} xidmət siyahıdadır`
            : activated
              ? "kabinet artıq aktivdir"
              : "kabinet hələ aktivləşməyib";
    out.push({
      ...(await toCandidate(c, kind)),
      alreadySentAt: sentAt.get(c.id) ?? null,
      hasPrices: filled,
      reason,
    });
  }
  return out;
}

export type PriceTarget = {
  centerId: string;
  centerName: string;
  slug: string;
  rows: { centerServiceId: string; serviceName: string; category: string | null; price: number | null }[];
  /** Kataloqda olub mərkəzin siyahısında OLMAYAN xidmətlər — "+" ilə əlavə üçün. */
  addable: { serviceId: string; name: string; category: string | null }[];
};

export type FaqTarget = {
  centerId: string;
  centerName: string;
  slug: string;
  /** Mövcud cavablar (yalnız tanınan açarlar). */
  answers: Record<string, string>;
};

export type CardTarget = PriceTarget & {
  /** Mövcud iş qrafiki (Json-dan, null = qeyd olunmayıb). */
  hours: unknown;
};

/** Token → tam kart (/m formu üçün: xidmətlər + qiymətlər + saatlar). */
export async function resolveCardToken(token: string): Promise<CardTarget | null> {
  const base = await resolvePriceToken(token);
  if (!base) return null;
  const c = await prisma.centerProfile.findUnique({
    where: { id: base.centerId },
    select: { hours: true },
  });
  return { ...base, hours: c?.hours ?? null };
}

/** Token → mərkəz + mövcud FAQ cavabları (/f formu üçün; eyni token). */
export async function resolveFaqToken(token: string): Promise<FaqTarget | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const c = await prisma.centerProfile.findUnique({
    where: { priceToken: token },
    select: { id: true, name: true, slug: true, status: true, faqAnswers: true },
  });
  if (!c || c.status === "DEACTIVATED") return null;
  return { centerId: c.id, centerName: c.name, slug: c.slug, answers: parseFaqAnswers(c.faqAnswers) };
}

/** Token → mərkəz + xidmət sətirləri (qiymət formu üçün). */
export async function resolvePriceToken(token: string): Promise<PriceTarget | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const c = await prisma.centerProfile.findUnique({
    where: { priceToken: token },
    select: {
      id: true, name: true, slug: true, status: true,
      services: {
        select: { id: true, serviceId: true, price: true, service: { select: { name: true, category: true, featured: true, order: true } } },
        orderBy: { service: { order: "asc" } },
      },
    },
  });
  if (!c || c.status === "DEACTIVATED") return null;
  const rows = [...c.services]
    .sort((a, b) => Number(b.service.featured) - Number(a.service.featured))
    .map((s) => ({ centerServiceId: s.id, serviceName: s.service.name, category: s.service.category, price: s.price }));

  // Mərkəz göstərdiyimizdən ÇOX xidmət verə bilər — kataloqun qalanını "+" ilə
  // özü əlavə edib qiymət yazsın (istifadəçi istəyi, 2026-08-10).
  const have = new Set(c.services.map((s) => s.serviceId));
  const all = await prisma.service.findMany({
    where: { isActive: true },
    select: { id: true, name: true, category: true },
    orderBy: { order: "asc" },
  });
  const addable = all
    .filter((s) => !have.has(s.id))
    .map((s) => ({ serviceId: s.id, name: s.name, category: s.category }));

  return { centerId: c.id, centerName: c.name, slug: c.slug, rows, addable };
}
