import "server-only";
import { prisma } from "@/lib/db";
import { serviceNameRu } from "@/content/services-ru";

/**
 * Yazıda keçən xidmətlər (2026-08-17, analizler.az «yazıda keçən analizlər»
 * naxışı): yazının mətnində adı (və ya qısa adı) keçən AKTİV xidmətlər tapılır —
 * yan paneldəki CTA birbaşa onlara aparır. Heç nə bazaya yazılmır, hər render
 * mətndən çıxarılır (yazı redaktə olunanda avtomatik yenilənir).
 */

export type MentionedService = { slug: string; name: string };

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/i̇/g, "i")
    .replace(/\s+/g, " ");

export async function findMentionedServices(
  content: string,
  title: string,
  locale: "az" | "ru",
  max = 4,
): Promise<MentionedService[]> {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: { slug: true, name: true, shortName: true },
    });
    const hay = norm(`${title}\n${content}`);
    const found: { svc: MentionedService; pos: number; len: number }[] = [];
    for (const s of services) {
      const displayName = locale === "ru" ? serviceNameRu(s.name) : s.name;
      // Uyğunluq hər iki dildə yoxlanılır — RU yazıda AZ termin də keçə bilər
      const candidates = [s.name, s.shortName, locale === "ru" ? serviceNameRu(s.name) : null]
        .filter((x): x is string => !!x && x.length >= 6)
        .map(norm);
      for (const c of candidates) {
        const pos = hay.indexOf(c);
        if (pos >= 0) {
          found.push({ svc: { slug: s.slug, name: displayName }, pos, len: c.length });
          break;
        }
      }
    }
    // Daha spesifik (uzun) ad üstün; sonra mətndə tez keçən
    found.sort((a, b) => b.len - a.len || a.pos - b.pos);
    const seen = new Set<string>();
    const out: MentionedService[] = [];
    for (const f of found) {
      if (seen.has(f.svc.slug)) continue;
      seen.add(f.svc.slug);
      out.push(f.svc);
      if (out.length >= max) break;
    }
    return out;
  } catch {
    return [];
  }
}
