import "server-only";
import { prisma } from "@/lib/db";
import { CITIES, EXAM_TYPES, DENTAL_SPECIALIZATIONS } from "@/lib/constants";
import { doctorName } from "@/lib/utils";
import { absoluteAssetUrl, nationalDigits } from "@/lib/app-api";
import { normalizePhone } from "@/lib/phone";

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
  /** Doctor photo (absolute URL) / center logo, for display in the app. */
  photoUrl?: string | null;
  clinic?: string | null;
  specializations?: string[];
  city?: string | null;
  /** Doctor's confirmed workplace center name (workplaceStatus = ACCEPTED). */
  workplace?: string | null;
  instagram?: string | null;
  website?: string | null;
};

const DOCTOR_ACCOUNT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  photoUrl: true,
  clinic: true,
  specializations: true,
  city: true,
  instagram: true,
  website: true,
  workplaceStatus: true,
  workplaceCenter: { select: { name: true } },
  user: { select: { phone: true } },
} as const;

type DoctorAccountRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  clinic: string | null;
  specializations: string[];
  city: string | null;
  instagram: string | null;
  website: string | null;
  workplaceStatus: string | null;
  workplaceCenter: { name: string } | null;
  user: { phone: string };
};

/** Build a doctor AppAccount from a selected row + their partner slugs. */
function doctorAccount(d: DoctorAccountRow, centerSlugs: string[]): AppAccount {
  return {
    phone: d.user.phone,
    role: "DOCTOR",
    name: doctorName(d.firstName, d.lastName) || null,
    centerSlug: null,
    assistantOf: null,
    centerSlugs,
    photoUrl: absoluteAssetUrl(d.photoUrl),
    clinic: d.clinic,
    specializations: d.specializations ?? [],
    city: d.city,
    workplace: d.workplaceStatus === "ACCEPTED" ? d.workplaceCenter?.name ?? null : null,
    instagram: d.instagram,
    website: d.website,
  };
}

/** Sign-in registry: doctors (with their ACCEPTED partner centers) + centers. */
export async function getAppAccounts(): Promise<AppAccount[]> {
  const [doctors, centers, partners] = await Promise.all([
    prisma.doctorProfile.findMany({
      where: { status: "APPROVED", user: { isBlocked: false } },
      select: DOCTOR_ACCOUNT_SELECT,
    }),
    prisma.centerProfile.findMany({
      where: { status: "APPROVED", user: { isBlocked: false } },
      select: { slug: true, name: true, logoUrl: true, user: { select: { phone: true } } },
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
    accounts.push(doctorAccount(d, partnersByDoctor.get(d.id) ?? []));
  }
  for (const c of centers) {
    if (!c.user.phone) continue;
    accounts.push({
      phone: c.user.phone,
      role: "CENTER",
      name: c.name,
      centerSlug: c.slug,
      assistantOf: null,
      photoUrl: absoluteAssetUrl(c.logoUrl),
    });
  }
  return accounts;
}

/**
 * Single account for one phone (login resolver) — so the app never has to
 * download the whole registry (which would leak every doctor/center phone).
 * Returns null when the phone isn't an approved doctor/center or a patient.
 */
export async function getAppAccountForPhone(phone: string): Promise<AppAccount | { role: "PATIENT"; phone: string; name: string | null } | null> {
  const norm = normalizePhone(phone);
  const nat = nationalDigits(phone);
  if (!norm && nat.length < 7) return null;

  // Exact match first; tolerant last-9-digits fallback for +994/0 differences.
  let user = norm
    ? await prisma.user.findUnique({
        where: { phone: norm },
        select: { id: true, phone: true, isBlocked: true, doctorProfile: { select: { id: true, status: true } }, centerProfile: { select: { id: true } }, patientProfile: { select: { firstName: true, lastName: true } } },
      })
    : null;
  if (!user) {
    const rows = await prisma.user.findMany({
      where: { role: { in: ["DOCTOR", "CENTER"] } },
      select: { id: true, phone: true, isBlocked: true, doctorProfile: { select: { id: true, status: true } }, centerProfile: { select: { id: true } }, patientProfile: { select: { firstName: true, lastName: true } } },
    });
    user = rows.find((u) => nationalDigits(u.phone) === nat) ?? null;
  }
  if (!user || user.isBlocked) return null;

  // Doctor
  if (user.doctorProfile && user.doctorProfile.status === "APPROVED") {
    const [d, partners] = await Promise.all([
      prisma.doctorProfile.findUnique({ where: { id: user.doctorProfile.id }, select: DOCTOR_ACCOUNT_SELECT }),
      prisma.centerDoctor.findMany({
        where: { doctorId: user.doctorProfile.id, status: "ACCEPTED", center: { status: "APPROVED" } },
        select: { center: { select: { slug: true } } },
      }),
    ]);
    if (!d) return null;
    const slugs = [...new Set(partners.map((p) => p.center.slug).filter((s): s is string => Boolean(s)))];
    return doctorAccount(d as DoctorAccountRow, slugs);
  }
  // Center
  if (user.centerProfile) {
    const c = await prisma.centerProfile.findUnique({
      where: { id: user.centerProfile.id },
      select: { slug: true, name: true, logoUrl: true, status: true },
    });
    if (!c || c.status !== "APPROVED") return null;
    return { phone: user.phone, role: "CENTER", name: c.name, centerSlug: c.slug, assistantOf: null, photoUrl: absoluteAssetUrl(c.logoUrl) };
  }
  // Patient (exists but no doctor/center profile)
  if (user.patientProfile) {
    const name = [user.patientProfile.firstName, user.patientProfile.lastName].filter(Boolean).join(" ") || null;
    return { role: "PATIENT", phone: user.phone, name };
  }
  return null;
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
