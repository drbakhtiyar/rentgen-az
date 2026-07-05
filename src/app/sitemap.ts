import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { prisma } from "@/lib/db";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPaths = [
    "",
    "/rentgen-merkezleri",
    "/xidmetler",
    "/hekimler",
    "/hekimler-ucun",
    "/merkezler-ucun",
    "/blog",
    "/faq",
    "/elaqe",
    "/gizlilik-siyaseti",
    "/istifade-shertleri",
  ];

  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? "daily" : "weekly",
    priority: p === "" ? 1 : 0.7,
  }));

  // Service pages (active services from DB)
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
    for (const s of services) {
      entries.push({
        url: `${SITE_URL}/xidmetler/${s.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
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
      entries.push({
        url: `${SITE_URL}/rentgen-merkezleri/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
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
      entries.push({
        url: `${SITE_URL}/hekimler/${d.id}`,
        lastModified: d.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    /* DB unavailable — skip dynamic entries */
  }

  // Published blog posts
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });
    for (const p of posts) {
      entries.push({
        url: `${SITE_URL}/blog/${p.slug}`,
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
