import "server-only";
import { prisma } from "@/lib/db";
import { CITIES, EXAM_TYPES, DENTAL_SPECIALIZATIONS } from "@/lib/constants";
import { doctorName } from "@/lib/utils";
import { absoluteAssetUrl } from "@/lib/app-api";

/**
 * Server-side data builders for the mobile app (/api/app/*). These replace the
 * Rork Worker's direct database access: the site owns the (pooled) DB
 * connection and business rules, the Worker just forwards the JSON.
 * Shapes match exactly what the iOS app already decodes.
 */

export type AppAccount = {
  phone: string;
  role: "DOCTOR" | "CENTER";
  name: string | null;
  centerSlug: string | null;
  assistantOf: string | null;
  centerSlugs?: string[];
};

/** Sign-in registry: doctors (with their ACCEPTED partner centers) + centers. */
export async function getAppAccounts(): Promise<AppAccount[]> {
  const [doctors, centers, partners] = await Promise.all([
    prisma.doctorProfile.findMany({
      where: { status: "APPROVED", user: { isBlocked: false } },
      select: { id: true, firstName: true, lastName: true, user: { select: { phone: true } } },
    }),
    prisma.centerProfile.findMany({
      where: { status: "APPROVED", user: { isBlocked: false } },
      select: { slug: true, name: true, user: { select: { phone: true } } },
    }),
    prisma.centerDoctor.findMany({
      where: { status: "ACCEPTED", center: { status: "APPROVED" } },
      select: { doctorId: true, center: { select: { slug: true } } },
    }),
  ]);

  const partnersByDoctor = new Map<string, string[]>();
  for (const p of partners) {
    if (!p.center.slug) continue;
    const list = partnersByDoctor.get(p.doctorId) ?? [];
    if (!list.includes(p.center.slug)) list.push(p.center.slug);
    partnersByDoctor.set(p.doctorId, list);
  }

  const accounts: AppAccount[] = [];
  for (const d of doctors) {
    if (!d.user.phone) continue;
    accounts.push({
      phone: d.user.phone,
      role: "DOCTOR",
      name: doctorName(d.firstName, d.lastName) || null,
      centerSlug: null,
      assistantOf: null,
      centerSlugs: partnersByDoctor.get(d.id) ?? [],
    });
  }
  for (const c of centers) {
    if (!c.user.phone) continue;
    accounts.push({ phone: c.user.phone, role: "CENTER", name: c.name, centerSlug: c.slug, assistantOf: null });
  }
  return accounts;
}

/** Full catalog: services, cities, centers, prices, ratings and accounts. */
export async function getAppCatalog(): Promise<Record<string, unknown>> {
  const [services, centers, reviews, accounts] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: { slug: true, name: true, shortName: true, description: true, icon: true, category: true, order: true, featured: true },
    }),
    prisma.centerProfile.findMany({
      where: { status: "APPROVED" },
      select: {
        id: true, slug: true, name: true, city: true, district: true, address: true,
        phone: true, workingHours: true, description: true, equipment: true,
        responsiblePerson: true, logoUrl: true, images: true,
        googleRating: true, googleReviewCount: true,
        services: { select: { price: true, priceTo: true, service: { select: { slug: true, name: true } } } },
      },
    }),
    prisma.review.findMany({ where: { hidden: false }, select: { centerId: true, rating: true } }),
    getAppAccounts(),
  ]);

  const ratingAgg = new Map<string, { sum: number; count: number }>();
  for (const r of reviews) {
    const agg = ratingAgg.get(r.centerId) ?? { sum: 0, count: 0 };
    agg.sum += r.rating;
    agg.count += 1;
    ratingAgg.set(r.centerId, agg);
  }

  const categories = [...new Set(services.map((s) => s.category).filter(Boolean))];

  return {
    version: 2,
    updatedAt: new Date().toISOString().slice(0, 10),
    categories,
    services,
    cities: CITIES.map((c) => c.name),
    examTypes: EXAM_TYPES,
    specializations: DENTAL_SPECIALIZATIONS,
    accounts,
    centers: centers.map((c) => {
      const agg = ratingAgg.get(c.id);
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        city: c.city,
        district: c.district,
        address: c.address,
        phone: c.phone,
        workingHours: c.workingHours,
        about: c.description,
        equipment: c.equipment,
        responsiblePerson: c.responsiblePerson,
        logoUrl: absoluteAssetUrl(c.logoUrl),
        imageUrl: absoluteAssetUrl(c.images?.[0] ?? null),
        rating: agg && agg.count > 0 ? Math.round((agg.sum / agg.count) * 10) / 10 : c.googleRating ?? 0,
        reviewCount: agg && agg.count > 0 ? agg.count : c.googleReviewCount ?? 0,
        services: c.services.map((s) => ({
          slug: s.service.slug,
          name: s.service.name,
          price: s.price,
          priceTo: s.priceTo,
        })),
      };
    }),
  };
}
