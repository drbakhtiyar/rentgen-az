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
        // Paid tiers (Gold/Platinum) rank first — enum order FREE<SILVER<GOLD<PLATINUM.
        orderBy: [{ plan: "desc" }, { createdAt: "desc" }],
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

export type PaymentFilters = {
  status?: string;
  purpose?: string;
  q?: string; // ad / telefon axtarışı
  from?: Date;
  to?: Date;
};

function paymentWhere(f: PaymentFilters): Prisma.PaymentWhereInput {
  const where: Prisma.PaymentWhereInput = {};
  if (f.status) where.status = f.status;
  if (f.purpose) where.purpose = f.purpose;
  if (f.from || f.to) where.createdAt = { ...(f.from ? { gte: f.from } : {}), ...(f.to ? { lte: f.to } : {}) };
  if (f.q) {
    where.user = {
      OR: [
        { phone: { contains: f.q, mode: "insensitive" } },
        { centerProfile: { name: { contains: f.q, mode: "insensitive" } } },
        { doctorProfile: { firstName: { contains: f.q, mode: "insensitive" } } },
        { doctorProfile: { lastName: { contains: f.q, mode: "insensitive" } } },
      ],
    };
  }
  return where;
}

export type AdminPayment = Prisma.PaymentGetPayload<{
  include: {
    user: {
      select: {
        phone: true;
        role: true;
        centerProfile: { select: { name: true } };
        doctorProfile: { select: { firstName: true; lastName: true } };
      };
    };
  };
}>;

/** Admin: payments (Payriff orders) with filters. */
export async function getAdminPayments(filters: PaymentFilters = {}, take = 200) {
  return safe<AdminPayment[]>(
    () =>
      prisma.payment.findMany({
        where: paymentWhere(filters),
        orderBy: { createdAt: "desc" },
        take,
        include: {
          user: {
            select: {
              phone: true,
              role: true,
              centerProfile: { select: { name: true } },
              doctorProfile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
    [],
  );
}

/** Admin: payment totals for the summary cards. */
export async function getPaymentSummary() {
  return safe(
    async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const [paidAgg, monthAgg, pending, failed] = await Promise.all([
        prisma.payment.aggregate({ _sum: { amount: true }, _count: true, where: { status: "PAID" } }),
        prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", paidAt: { gte: monthStart } } }),
        prisma.payment.count({ where: { status: "PENDING" } }),
        prisma.payment.count({ where: { status: "FAILED" } }),
      ]);
      return {
        totalPaid: paidAgg._sum.amount ?? 0,
        paidCount: paidAgg._count,
        monthPaid: monthAgg._sum.amount ?? 0,
        pending,
        failed,
      };
    },
    { totalPaid: 0, paidCount: 0, monthPaid: 0, pending: 0, failed: 0 },
  );
}

/** A user's wallet balance movements (most recent first). */
export async function getWalletHistory(userId: string, take = 50) {
  return safe(async () => {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!wallet) return [];
    return prisma.walletLedger.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take,
    });
  }, [] as Awaited<ReturnType<typeof prisma.walletLedger.findMany>>);
}

/** Total bytes a center currently stores in B2 (sum of its rentgen files). */
export async function getCenterStorageUsage(centerId: string): Promise<number> {
  return safe(async () => {
    const agg = await prisma.rentgenFile.aggregate({
      _sum: { size: true },
      where: { request: { centerId } },
    });
    return agg._sum.size ?? 0;
  }, 0);
}

/** How many appointment requests each service has — usage popularity. */
export async function getServiceRequestCounts(): Promise<Record<string, number>> {
  return safe(async () => {
    const rows = await prisma.appointmentRequest.groupBy({
      by: ["serviceSlug"],
      where: { serviceSlug: { not: null } },
      _count: { serviceSlug: true },
    });
    const out: Record<string, number> = {};
    for (const r of rows) if (r.serviceSlug) out[r.serviceSlug] = r._count.serviceSlug;
    return out;
  }, {} as Record<string, number>);
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

/** Center analytics counts (views / calls / whatsapp) over the last N days. */
export async function getCenterEventStats(centerId: string, days = 30) {
  return safe(
    async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const rows = await prisma.centerEvent.groupBy({
        by: ["type"],
        where: { centerId, createdAt: { gte: since } },
        _count: { type: true },
      });
      const by: Record<string, number> = {};
      for (const r of rows) by[r.type] = r._count.type;
      return { views: by.view ?? 0, calls: by.call ?? 0, whatsapp: by.whatsapp ?? 0 };
    },
    { views: 0, calls: 0, whatsapp: 0 },
  );
}

/** Doctor dashboard stats: profile views (N days), referrals sent, partner centers. */
export async function getDoctorStats(doctorId: string, days = 30) {
  return safe(
    async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const [views, referralsSent, partnerCenters] = await Promise.all([
        prisma.doctorEvent.count({ where: { doctorId, type: "view", createdAt: { gte: since } } }),
        prisma.appointmentRequest.count({ where: { doctorId } }),
        prisma.centerDoctor.count({ where: { doctorId, status: "ACCEPTED" } }),
      ]);
      return { views, referralsSent, partnerCenters };
    },
    { views: 0, referralsSent: 0, partnerCenters: 0 },
  );
}

/** Center full analytics (Gold+): per-service request breakdown + referral count. */
export async function getCenterFullStats(centerId: string, days = 30) {
  return safe(
    async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const [byService, referralsReceived, requests30d, services] = await Promise.all([
        prisma.appointmentRequest.groupBy({
          by: ["serviceSlug"],
          where: { centerId, serviceSlug: { not: null } },
          _count: { serviceSlug: true },
        }),
        prisma.appointmentRequest.count({ where: { centerId, doctorId: { not: null } } }),
        prisma.appointmentRequest.count({ where: { centerId, createdAt: { gte: since } } }),
        prisma.service.findMany({ select: { slug: true, name: true } }),
      ]);
      const nameBySlug = new Map(services.map((s) => [s.slug, s.name]));
      const perService = byService
        .map((r) => ({ slug: r.serviceSlug as string, name: nameBySlug.get(r.serviceSlug as string) ?? r.serviceSlug as string, count: r._count.serviceSlug }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
      return { perService, referralsReceived, requests30d };
    },
    { perService: [] as { slug: string; name: string; count: number }[], referralsReceived: 0, requests30d: 0 },
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
            select: {
              centerId: true,
              comment: true,
              scoreService: true,
              scoreStaff: true,
              scoreClean: true,
              scoreWait: true,
              scorePrice: true,
            },
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
      review: {
        comment: string | null;
        scoreService: number | null;
        scoreStaff: number | null;
        scoreClean: number | null;
        scoreWait: number | null;
        scorePrice: number | null;
      } | null;
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
        // Paid tiers (Gold/Platinum) rank first, then alphabetical.
        orderBy: [{ plan: "desc" }, { firstName: "asc" }],
      }),
    [],
  );
}

/** A single approved doctor by id (null if missing or not approved). */
export async function getApprovedDoctorById(id: string) {
  return safe(
    () =>
      prisma.doctorProfile.findFirst({
        where: { id, status: "APPROVED" },
        include: { workplaceCenter: { select: { slug: true, name: true, status: true } } },
      }),
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
