import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { prisma } from "@/lib/db";
import { getCityPages } from "@/lib/city-pages";
import { getCityServicePages } from "@/lib/city-service-pages";

export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

/**
 * Public page present in both languages → az at `path`, ru at `/ru<path>`.
 *
 * Google-un tövsiyəsi: HƏR dil versiyası sitemap-da ÖZ `<url>` bloku kimi
 * verilməli və hər blok bütün alternativləri (özü daxil) sadalamalıdır. Əvvəl
 * yalnız AZ `<loc>` yazılırdı, RU isə sadəcə `xhtml:link` kimi görünürdü —
 * yəni RU URL-ləri sitemap-da rəsmən yox idi. `x-default` də əlavə olundu
 * (layout-dakı hreflang ilə uyğun olsun deyə).
 */
function bilingual(
  path: string,
  opts: Omit<Entry, "url" | "alternates">,
): Entry[] {
  const az = `${SITE_URL}${path}`;
  const ru = `${SITE_URL}/ru${path}`;
  const languages = { az, ru, "x-default": az };
  return [
    { url: az, alternates: { languages }, ...opts },
    { url: ru, alternates: { languages }, ...opts },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPaths = [
    "",
    "/rentgen-merkezleri",
    "/xidmetler",
    "/hekimler",
    "/merkezler-ucun",
    "/merkez-kabineti",
    "/hekimler-ucun",
    "/paketler",
    "/blog",
    "/faq",
    "/elaqe",
    "/gizlilik-siyaseti",
    "/istifade-shertleri",
  ];

  const entries: MetadataRoute.Sitemap = staticPaths.flatMap((p) =>
    bilingual(p, {
      lastModified: now,
      changeFrequency: p === "" ? "daily" : "weekly",
      priority: p === "" ? 1 : 0.7,
    }),
  );

  // Service pages (active services from DB)
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
    for (const s of services) {
      entries.push(
        ...bilingual(`/xidmetler/${s.slug}`, {
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.8,
        }),
      );
    }
  } catch {
    /* DB unavailable — skip dynamic entries */
  }

  // City landing pages (only cities with enough centers — see city-pages.ts)
  try {
    const cities = await getCityPages();
    for (const c of cities) {
      entries.push(
        ...bilingual(`/rentgen-merkezleri/sheher/${c.slug}`, {
          lastModified: now,
          changeFrequency: "weekly",
          // Şəhər səhifələri kataloqun özündən sonra ən vacib giriş nöqtəsidir.
          priority: 0.8,
        }),
      );
    }
  } catch {
    /* DB unavailable — skip dynamic entries */
  }

  // City × service pages (curated headline services only — see city-service-pages.ts)
  try {
    for (const p of await getCityServicePages()) {
      entries.push(
        ...bilingual(`/rentgen-merkezleri/sheher/${p.city.slug}/${p.service.slug}`, {
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.75,
        }),
      );
    }
  } catch {
    /* DB unavailable — skip dynamic entries */
  }

  // Approved centers
  try {
    const centers = await prisma.centerProfile.findMany({
      where: { status: "APPROVED" },
      select: { slug: true, updatedAt: true },
    });
    for (const c of centers) {
      entries.push(
        ...bilingual(`/rentgen-merkezleri/${c.slug}`, {
          lastModified: c.updatedAt,
          changeFrequency: "weekly",
          priority: 0.7,
        }),
      );
    }
  } catch {
    /* DB unavailable — skip dynamic entries */
  }

  // Approved doctors
  try {
    const doctors = await prisma.doctorProfile.findMany({
      where: { status: "APPROVED" },
      select: { id: true, updatedAt: true },
    });
    for (const d of doctors) {
      entries.push(
        ...bilingual(`/hekimler/${d.id}`, {
          lastModified: d.updatedAt,
          changeFrequency: "monthly",
          priority: 0.6,
        }),
      );
    }
  } catch {
    /* DB unavailable — skip dynamic entries */
  }

  // Published blog posts — AZ and RU posts have DIFFERENT slugs (separate
  // content), so they are listed at their own locale URL without hreflang
  // pairing.
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true, locale: true },
    });
    for (const p of posts) {
      const prefix = p.locale === "ru" ? "/ru" : "";
      entries.push({
        url: `${SITE_URL}${prefix}/blog/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    /* DB unavailable — skip dynamic entries */
  }

  return entries;
}
