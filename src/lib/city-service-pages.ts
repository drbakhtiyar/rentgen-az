import "server-only";
import { prisma } from "@/lib/db";
import { getCityPages, citySlug, type CityPage } from "@/lib/city-pages";

/**
 * Şəhər × xidmət səhifələri — `/rentgen-merkezleri/sheher/[city]/[service]`.
 *
 * NƏ ÜÇÜN: ən yüksək niyyətli sorğular məhz belədir — "Bakıda MRT",
 * "Gəncədə kompüter tomoqrafiya". Şəhər səhifəsi tək başına, xidmət səhifəsi
 * tək başına bu sorğunu tam tutmur.
 *
 * NİYƏ İNDİ MÜMKÜNDÜR: əvvəl hər mərkəz 89-luq şablon daşıyırdı, yəni hər
 * kombinasiya eyni mərkəz siyahısını verərdi — 23 şəhər × 112 xidmət = kütləvi
 * təkrar məzmun. 2026-08-02 təmizliyindən sonra xidmət siyahıları realdır
 * (MRT-ni 188 yox, 15 mərkəz iddia edir), ona görə kombinasiyalar bir-birindən
 * həqiqətən fərqlənir. Bax DECISIONS.
 *
 * QAYDA: səhifə YALNIZ həmin şəhərdə həmin xidməti verən ən azı
 * `MIN_CENTERS` mərkəz varsa yaradılır — yoxsa nazik məzmun olar.
 */

/** Bundan az mərkəzi olan kombinasiyaya səhifə açılmır. */
export const MIN_CENTERS = 3;

/**
 * Səhifə açılan xidmətlər — HAMISI üçün deyil, yalnız müstəqil axtarış niyyəti
 * olan "başlıq" müayinələr üçün.
 *
 * NİYƏ KURASİYA: bütün 112 xidmətə icazə versək 643 kombinasiya yaranır və
 * onların böyük hissəsi bir-birinin təkrarı olur — "Bakıda əl rentgeni" ilə
 * "Bakıda bilək rentgeni" demək olar eyni mərkəz siyahısını verir (hər ikisi
 * eyni aparatda edilir). Bu, 2026-08-02-də təmizlədiyimiz təkrar məzmun
 * problemini yeni formada geri gətirərdi.
 *
 * Buradakılar isə bir-birindən HƏQİQƏTƏN fərqli mərkəz dəstləri verir, çünki
 * modallıq iddiaları artıq sübuta əsaslanır (MRT-ni 188 yox, 15 mərkəz iddia
 * edir). `featured` bayrağı bu iş üçün yaramır — orada yalnız 7 dental xidmət var.
 */
export const HEADLINE_SERVICES = new Set([
  // Dental — yalnız diş klinikalarında var, ona görə dəst fərqlidir
  "panoramik-rentgen", "3d-tomoqrafiya", "dental-rentgen", "sefalometrik-rentgen",
  // MRT — sübutu olan ~15 mərkəz
  "bas-mrt", "bel-mrt", "boyun-mrt", "diz-mrt", "qarin-mrt",
  // KT — sübutu olan ~18 mərkəz
  "bas-kt", "agciyer-kt", "qarin-kt", "onurga-kt",
  // Digər ağır modallıqlar — az sayda mərkəz
  "reqemsal-mammoqrafiya", "sumuk-mineral-sixligi-olculmesi-dexa",
]);

/**
 * QƏSDƏN KƏNARDA: klassik rentgen proyeksiyaları (ağciyər, kəllə, bel onurğası,
 * çanaq) və USM növləri (qarın, tiroid, süd vəzi, doppler, hamiləlik).
 *
 * Bunların axtarış niyyəti var ("Bakıda qarın USM"), AMMA hazırda 51-lik bazada
 * demək olar hər mərkəzdə var — yəni Bakıda hər biri EYNİ 115 mərkəzi sadalayır
 * və nəticədə həm bir-birinin, həm də şəhər səhifəsinin təkrarına çevrilir.
 *
 * Mərkəzlər panelə girib öz siyahılarını dəqiqləşdirdikcə bu dəstlər
 * fərqlənəcək — həmin vaxt buraya köçürmək olar.
 */
export const DEFERRED_SERVICES = [
  "agciyer-rentgeni", "kelle-rentgeni", "bel-onurgasi-rentgeni", "canaq-rentgeni",
  "qarin-usm", "tiroid-usm", "sud-vezi-usm", "doppler-usm", "hamilelik-usm",
] as const;

export type CityServicePage = {
  city: CityPage;
  service: { slug: string; name: string; shortName: string | null; category: string | null };
  count: number;
};

type Row = { city: string; serviceSlug: string; serviceName: string; shortName: string | null; category: string | null; count: number };

/** Bütün keçərli şəhər×xidmət kombinasiyaları (mərkəz sayına görə azalan). */
async function fetchCombos(): Promise<Row[]> {
  const rows = await prisma.centerService.findMany({
    where: { center: { status: "APPROVED", city: { not: null } } },
    select: {
      center: { select: { city: true } },
      service: { select: { slug: true, name: true, shortName: true, category: true, isActive: true } },
    },
  });
  const map = new Map<string, Row>();
  for (const r of rows) {
    const city = r.center.city;
    if (!city || !r.service.isActive) continue;
    if (!HEADLINE_SERVICES.has(r.service.slug)) continue;
    const key = `${city}|${r.service.slug}`;
    const cur = map.get(key);
    if (cur) cur.count++;
    else
      map.set(key, {
        city,
        serviceSlug: r.service.slug,
        serviceName: r.service.name,
        shortName: r.service.shortName,
        category: r.service.category,
        count: 1,
      });
  }
  return [...map.values()].filter((r) => r.count >= MIN_CENTERS).sort((a, b) => b.count - a.count);
}

/** Şəhərin öz səhifəsi olmalıdır ki, alt səhifə də olsun. */
async function validCitySlugs(): Promise<Map<string, CityPage>> {
  return new Map((await getCityPages()).map((c) => [c.slug, c]));
}

export async function getCityServicePages(): Promise<CityServicePage[]> {
  try {
    const [combos, cities] = await Promise.all([fetchCombos(), validCitySlugs()]);
    const out: CityServicePage[] = [];
    for (const r of combos) {
      const city = cities.get(citySlug(r.city));
      if (!city) continue;
      out.push({
        city,
        service: { slug: r.serviceSlug, name: r.serviceName, shortName: r.shortName, category: r.category },
        count: r.count,
      });
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Konkret kombinasiya. DB xətası UDULMUR — səhifə `null`-da `notFound()`
 * çağırır və Next 404-ü keşləyir; bir anlıq nasazlıq mövcud səhifəni
 * müddət boyu 404-də saxlayardı (bax `city-pages.ts`-dəki eyni qeyd).
 */
export async function getCityServicePage(
  citySlugParam: string,
  serviceSlug: string,
): Promise<CityServicePage | null> {
  const [combos, cities] = await Promise.all([fetchCombos(), validCitySlugs()]);
  const city = cities.get(citySlugParam);
  if (!city) return null;
  const row = combos.find((r) => citySlug(r.city) === citySlugParam && r.serviceSlug === serviceSlug);
  if (!row) return null;
  return {
    city,
    service: { slug: row.serviceSlug, name: row.serviceName, shortName: row.shortName, category: row.category },
    count: row.count,
  };
}

/** Bir şəhər üçün ən populyar xidmətlər (şəhər səhifəsindəki keçidlər üçün). */
export async function getServicesForCity(cityName: string, take = 12): Promise<CityServicePage[]> {
  const all = await getCityServicePages();
  return all.filter((p) => p.city.name === cityName).slice(0, take);
}
