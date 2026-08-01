import "server-only";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

/**
 * Şəhər lendinq səhifələri — `/rentgen-merkezleri/sheher/[slug]`.
 *
 * NƏ ÜÇÜN: Azərbaycanda ən çox axtarılan sorğular şəhər + modallıqdır
 * ("Bakıda MRT", "Sumqayıtda rentgen"). Kataloqda şəhər filtri yalnız `?city=`
 * query-dir və kanonik query-ni atır (bax `app/layout.tsx`) — yəni filtrlənmiş
 * görünüşün SEO dəyəri SIFIRDIR. Bu səhifələr həmin boşluğu doldurur.
 *
 * QAYDA: yalnız `MIN_CENTERS`-dən çox mərkəzi olan şəhər üçün səhifə yaradılır —
 * 1-2 mərkəzli şəhər səhifəsi "nazik məzmun" olardı və faydadan çox zərər verərdi.
 *
 * ÖN ŞƏRT: `CenterProfile.city` yalnız şəhər adını saxlayır (rayon `district`-də) —
 * 2026-08-02 normallaşdırması. Bax DECISIONS.
 */

/** Bundan az mərkəzi olan şəhərə ayrıca səhifə açılmır (nazik məzmun). */
export const MIN_CENTERS = 3;

export type CityPage = {
  name: string;
  slug: string;
  count: number;
};

/** Şəhər adından URL parçası. "Bakı" → "baki" */
export function citySlug(name: string): string {
  return slugify(name);
}

/**
 * Səhifəsi olan şəhərlər — mərkəz sayına görə azalan.
 * DB xətasını UDMUR: çağıran tərəf nəyin baş verdiyini bilməlidir
 * (bax `getCityPages` vs `getCityBySlug` fərqi aşağıda).
 */
async function fetchCityPages(): Promise<CityPage[]> {
  const rows = await prisma.centerProfile.groupBy({
    by: ["city"],
    where: { status: "APPROVED", city: { not: null } },
    _count: { _all: true },
  });
  return rows
    .filter((r): r is typeof r & { city: string } => !!r.city && r._count._all >= MIN_CENTERS)
    .map((r) => ({ name: r.city, slug: citySlug(r.city), count: r._count._all }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "az"));
}

/**
 * Naviqasiya siyahıları üçün (kataloq altındakı şəhər çipləri, sitemap).
 * Burada DB xətası zərərsizdir — sadəcə blok göstərilmir.
 */
export async function getCityPages(): Promise<CityPage[]> {
  try {
    return await fetchCityPages();
  } catch {
    return [];
  }
}

/**
 * Slug → şəhər. Səhifəsi olmayan şəhər üçün `null`.
 *
 * ⚠️ DB xətası burada UDULMUR və `null`-a çevrilmir. Səbəb: səhifə `null`-da
 * `notFound()` çağırır, Next isə 404-ü ISR keşinə yazır — yəni bir anlıq DB
 * problemi mövcud şəhər səhifəsini `revalidate` müddəti boyu 404-də saxlayardı.
 * (Məhz bu, /sheher/baki səhifəsində baş verdi.) Xəta atılsın → 500 qayıtsın →
 * keşlənməsin və növbəti sorğuda düzəlsin.
 */
export async function getCityBySlug(slug: string): Promise<CityPage | null> {
  const pages = await fetchCityPages();
  return pages.find((c) => c.slug === slug) ?? null;
}

export type CityStats = {
  count: number;
  districts: string[];
  topServices: { slug: string; name: string; count: number }[];
  withGoogleRating: number;
  avgGoogleRating: number | null;
  openAllWeek: number;
};

/** Şəhərin giriş mətnini qidalandıran real rəqəmlər. */
export async function getCityStats(city: string): Promise<CityStats> {
  const centers = await prisma.centerProfile
    .findMany({
      where: { status: "APPROVED", city },
      select: {
        district: true,
        hours: true,
        googleRating: true,
        services: { select: { service: { select: { slug: true, name: true } } } },
      },
    })
    .catch(() => []);

  const districts = [...new Set(centers.map((c) => c.district).filter((d): d is string => !!d))].sort(
    (a, b) => a.localeCompare(b, "az"),
  );

  const svc = new Map<string, { slug: string; name: string; count: number }>();
  for (const c of centers) {
    for (const s of c.services) {
      const cur = svc.get(s.service.slug);
      if (cur) cur.count++;
      else svc.set(s.service.slug, { slug: s.service.slug, name: s.service.name, count: 1 });
    }
  }

  const rated = centers.filter((c) => c.googleRating != null);
  const avg = rated.length
    ? Math.round((rated.reduce((a, c) => a + (c.googleRating ?? 0), 0) / rated.length) * 10) / 10
    : null;

  const openAllWeek = centers.filter((c) => {
    const h = c.hours as Record<string, unknown> | null;
    if (!h) return false;
    return ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].every((k) => !!h[k]);
  }).length;

  return {
    count: centers.length,
    districts,
    topServices: [...svc.values()].sort((a, b) => b.count - a.count).slice(0, 8),
    withGoogleRating: rated.length,
    avgGoogleRating: avg,
    openAllWeek,
  };
}

/**
 * Şəhərə xas giriş mətni — hər səhifədə FƏRQLİ olsun deyə şəhərin öz
 * rəqəmlərindən qurulur (mərkəz sayı, rayonlar, həftəsonu işləyənlər, orta
 * Google reytinqi). Şablon cümlə təkrarlamırıq — bax DECISIONS (təkrar məzmun).
 */
export function cityIntro(city: string, s: CityStats, locale: "az" | "ru"): string[] {
  const p: string[] = [];
  if (locale === "ru") {
    p.push(
      `В каталоге rentgen.az собрано ${s.count} проверенных диагностических центров города ${city}. ` +
        `Для каждого указаны адрес, режим работы, контакты и перечень исследований.`,
    );
    if (s.districts.length >= 2) {
      p.push(`Центры расположены в районах: ${s.districts.join(", ")}.`);
    }
    if (s.openAllWeek > 0) {
      p.push(`${s.openAllWeek} из них работают все семь дней недели.`);
    }
    if (s.avgGoogleRating != null && s.withGoogleRating >= 3) {
      p.push(
        `Средняя оценка центров ${city} на Google — ${s.avgGoogleRating} из 5 (по ${s.withGoogleRating} центрам).`,
      );
    }
    return p;
  }
  p.push(
    `Rentgen.az kataloqunda ${city} şəhərində ${s.count} diaqnostika mərkəzi toplanıb. ` +
      `Hər biri üçün ünvan, iş qrafiki, əlaqə nömrəsi və aparılan müayinələrin siyahısı göstərilib.`,
  );
  if (s.districts.length >= 2) {
    p.push(`Mərkəzlər ${s.districts.join(", ")} rayonlarında yerləşir.`);
  }
  if (s.openAllWeek > 0) {
    p.push(`Onlardan ${s.openAllWeek}-i həftənin bütün günləri işləyir.`);
  }
  if (s.avgGoogleRating != null && s.withGoogleRating >= 3) {
    p.push(
      `${city} mərkəzlərinin Google-dakı orta reytinqi ${s.avgGoogleRating}/5-dir (${s.withGoogleRating} mərkəz üzrə).`,
    );
  }
  return p;
}
