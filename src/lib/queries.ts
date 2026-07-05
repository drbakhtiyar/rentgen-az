import "server-only";
import { prisma } from "./db";
import type { Prisma } from "@/generated/prisma/client";

/** Wraps a DB call so the UI degrades gracefully (e.g. before the DB is set up). */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[queries] DB error, returning fallback:", (e as Error).message);
    }
    return fallback;
  }
}

export type CenterListFilters = {
  q?: string;
  city?: string;
  service?: string; // service slug
  take?: number;
  skip?: number;
};

function centerWhere(filters: CenterListFilters): Prisma.CenterProfileWhereInput {
  const { q, city, service } = filters;
  const where: Prisma.CenterProfileWhereInput = { status: "APPROVED" };
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (city) where.city = city;
  if (service) where.services = { some: { service: { slug: service } } };
  return where;
}

export async function getApprovedCenters(filters: CenterListFilters = {}) {
  return safe(
    () =>
      prisma.centerProfile.findMany({
        where: centerWhere(filters),
        include: { services: { include: { service: true } } },
        orderBy: [{ createdAt: "desc" }],
        take: filters.take ?? 60,
        skip: filters.skip ?? 0,
      }),
    [],
  );
}

export async function countApprovedCenters(filters: CenterListFilters = {}) {
  return safe(() => prisma.centerProfile.count({ where: centerWhere(filters) }), 0);
}

export async function getFeaturedCenters(take = 6) {
  return getApprovedCenters({ take });
}

export async function getCenterBySlug(slug: string) {
  return safe(
    () =>
      prisma.centerProfile.findFirst({
        where: { slug, status: "APPROVED" },
        include: { services: { include: { service: true } } },
      }),
    null,
  );
}

export async function getCentersForService(serviceSlug: string, take = 12) {
  return getApprovedCenters({ service: serviceSlug, take });
}

export async function countApprovedCentersByService() {
  return safe(async () => {
    const rows = await prisma.centerService.groupBy({
      by: ["serviceId"],
      where: { center: { status: "APPROVED" } },
      _count: { serviceId: true },
    });
    const services = await prisma.service.findMany();
    const bySlug: Record<string, number> = {};
    for (const r of rows) {
      const svc = services.find((s) => s.id === r.serviceId);
      if (svc) bySlug[svc.slug] = r._count.serviceId;
    }
    return bySlug;
  }, {} as Record<string, number>);
}

export type CatalogService = Prisma.ServiceGetPayload<object>;

/** All active services, ordered — the single source of truth for the catalog. */
export async function getActiveServices() {
  return safe(
    () =>
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      }),
    [] as CatalogService[],
  );
}

/** A single active service by slug (null if missing or deactivated). */
export async function getServiceBySlug(slug: string) {
  return safe(
    () => prisma.service.findFirst({ where: { slug, isActive: true } }),
    null,
  );
}

export type CenterRating = { avg: number; count: number };

/** Average rating + count per center (visible reviews only). */
export async function getRatingsForCenters(
  centerIds: string[],
): Promise<Record<string, CenterRating>> {
  if (centerIds.length === 0) return {};
  return safe(async () => {
    const rows = await prisma.review.groupBy({
      by: ["centerId"],
      where: { centerId: { in: centerIds }, hidden: false },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const map: Record<string, CenterRating> = {};
    for (const r of rows) {
      map[r.centerId] = {
        avg: Math.round((r._avg.rating ?? 0) * 10) / 10,
        count: r._count.rating,
      };
    }
    return map;
  }, {});
}

export async function getCenterReviews(centerId: string) {
  return safe(
    () =>
      prisma.review.findMany({
        where: { centerId, hidden: false },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { patient: { select: { firstName: true, lastName: true } } },
      }),
    [],
  );
}

/** For a patient: centers they can review (a COMPLETED request) + any existing review. */
export async function getReviewableCentersForPatient(patientId: string) {
  return safe(
    async () => {
      const completed = await prisma.appointmentRequest.findMany({
        where: { patientId, status: "COMPLETED", centerId: { not: null } },
        select: { centerId: true, center: { select: { name: true, slug: true } } },
      });
      const seen = new Map<string, { id: string; name: string; slug: string }>();
      for (const c of completed) {
        if (c.centerId && c.center && !seen.has(c.centerId)) {
          seen.set(c.centerId, { id: c.centerId, name: c.center.name, slug: c.center.slug });
        }
      }
      const ids = [...seen.keys()];
      const reviews = ids.length
        ? await prisma.review.findMany({
            where: { patientId, centerId: { in: ids } },
            select: { centerId: true, rating: true, comment: true },
          })
        : [];
      const reviewedBy = new Map(reviews.map((r) => [r.centerId, r]));
      return [...seen.values()].map((c) => ({
        ...c,
        review: reviewedBy.get(c.id) ?? null,
      }));
    },
    [] as {
      id: string;
      name: string;
      slug: string;
      review: { rating: number; comment: string | null } | null;
    }[],
  );
}

export async function getPublishedPosts(take?: number) {
  return safe(
    () =>
      prisma.blogPost.findMany({
        where: { published: true },
        orderBy: { publishedAt: "desc" },
        take,
      }),
    [],
  );
}

export async function getPostBySlug(slug: string) {
  return safe(
    () => prisma.blogPost.findFirst({ where: { slug, published: true } }),
    null,
  );
}

export async function getApprovedDoctors() {
  return safe(
    () =>
      prisma.doctorProfile.findMany({
        where: { status: "APPROVED" },
        orderBy: [{ firstName: "asc" }],
      }),
    [],
  );
}

export async function getActiveCities() {
  return safe(
    () =>
      prisma.city.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      }),
    [],
  );
}

export async function getPlatformStats() {
  return safe(
    async () => {
      const [patients, centers, approvedCenters, doctors, requests, referrals, cityRows] =
        await Promise.all([
          prisma.patientProfile.count(),
          prisma.centerProfile.count(),
          prisma.centerProfile.count({ where: { status: "APPROVED" } }),
          prisma.doctorProfile.count(),
          prisma.appointmentRequest.count(),
          prisma.referral.count(),
          prisma.centerProfile.findMany({
            where: { status: "APPROVED", city: { not: null } },
            distinct: ["city"],
            select: { city: true },
          }),
        ]);
      return {
        patients,
        centers,
        approvedCenters,
        doctors,
        requests,
        referrals,
        cities: cityRows.length,
      };
    },
    { patients: 0, centers: 0, approvedCenters: 0, doctors: 0, requests: 0, referrals: 0, cities: 0 },
  );
}

/** Distinct cities that already have an approved center (for the search dropdown). */
export async function getCitiesWithCenters(): Promise<string[]> {
  return safe(async () => {
    const rows = await prisma.centerProfile.findMany({
      where: { status: "APPROVED", city: { not: null } },
      distinct: ["city"],
      select: { city: true },
      orderBy: { city: "asc" },
    });
    return rows.map((r) => r.city).filter((c): c is string => Boolean(c));
  }, []);
}

export type CenterWithServices = Awaited<
  ReturnType<typeof getApprovedCenters>
>[number];
