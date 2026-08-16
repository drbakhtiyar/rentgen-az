/**
 * Bloq kateqoriyaları (2026-08-17) — analizler.az naxışı: bazada SLUG saxlanılır,
 * adlar burada (AZ+RU). Naməlum/boş dəyər sayta zərər vermir: yazı görünür,
 * sadəcə çipdə sayılmır. /blog yalnız yazısı OLAN kateqoriyaların çipini
 * göstərir; sayğaclar filtr seçiləndə də TAM dəstdən hesablanır.
 */

export type BlogCategory = { slug: string; az: string; ru: string };

export const BLOG_CATEGORIES: BlogCategory[] = [
  { slug: "rentgen", az: "Rentgen", ru: "Рентген" },
  { slug: "kt", az: "KT", ru: "КТ" },
  { slug: "mrt", az: "MRT", ru: "МРТ" },
  { slug: "usm", az: "USM", ru: "УЗИ" },
  { slug: "mammoqrafiya", az: "Mammoqrafiya", ru: "Маммография" },
  { slug: "dexa", az: "DEXA", ru: "Денситометрия" },
  { slug: "dental", az: "Dental", ru: "Дентальная" },
  { slug: "usaq", az: "Uşaqlar", ru: "Детям" },
  { slug: "umumi", az: "Ümumi", ru: "Общее" },
];

export function blogCategoryName(slug: string | null | undefined, locale: "az" | "ru"): string | null {
  if (!slug) return null;
  const c = BLOG_CATEGORIES.find((x) => x.slug === slug);
  return c ? (locale === "ru" ? c.ru : c.az) : null;
}
