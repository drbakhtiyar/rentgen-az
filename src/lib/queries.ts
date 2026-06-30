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
};

export async function getApprovedCenters(filters: CenterListFilters = {}) {
  const { q, city, service, take } = filters;
  return safe(async () => {
    const where: Prisma.CenterProfileWhereInput = { status: "APPROVED" };
    if (q) where.name = { contains: q, mode: "insensitive" };
    if (city) where.city = city;
    if (service) {
      where.services = { some: { service: { slug: service } } };
    }
    return prisma.centerProfile.findMany({
      where,
      include: { services: { include: { service: true } } },
      orderBy: [{ createdAt: "desc" }],
      take: take ?? 60,
    });
  }, []);
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
      const [patients, centers, approvedCenters, requests, referrals] =
        await Promise.all([
          prisma.user.count({ where: { role: "PATIENT" } }),
          prisma.centerProfile.count(),
          prisma.centerProfile.count({ where: { status: "APPROVED" } }),
          prisma.appointmentRequest.count(),
          prisma.referral.count(),
        ]);
      return { patients, centers, approvedCenters, requests, referrals };
    },
    { patients: 0, centers: 0, approvedCenters: 0, requests: 0, referrals: 0 },
  );
}

export type CenterWithServices = Awaited<
  ReturnType<typeof getApprovedCenters>
>[number];
