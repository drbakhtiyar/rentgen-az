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

export type WantedRole = "DOCTOR" | "CENTER" | "PATIENT";

/**
 * Resolve the `User.id` for a phone number (any role), tolerant of
 * +994/0/national formats. Used to attach a push token to the signed-in user.
 * Returns null when no user matches or the user is blocked.
 */
export async function resolveUserIdByPhone(phone: string): Promise<string | null> {
  const norm = normalizePhone(phone);
  const nat = nationalDigits(phone);
  if (norm) {
    const u = await prisma.user.findUnique({
      where: { phone: norm },
      select: { id: true, isBlocked: true },
    });
    if (u) return u.isBlocked ? null : u.id;
  }
  if (nat.length < 7) return null;
  // Tolerant fallback by last-9-digits.
  const rows = await prisma.user.findMany({
    where: { phone: { endsWith: nat }, isBlocked: false },
    select: { id: true, phone: true },
  });
  const u = rows.find((r) => nationalDigits(r.phone) === nat);
  return u?.id ?? null;
}

/** Resolve the APPROVED center owned by (or assisted from) `phone`. */
export async function getAppCenterForPhone(
  phone: string,
): Promise<{ id: string; name: string; slug: string | null; userId: string } | null> {
  const norm = normalizePhone(phone);
  const nat = nationalDigits(phone);
  const select = { id: true, name: true, slug: true, status: true, userId: true } as const;

  if (norm) {
    const u = await prisma.user.findUnique({
      where: { phone: norm },
      select: { centerProfile: { select }, assistantOf: { select: { active: true, center: { select } } } },
    });
    const c = u?.centerProfile ?? (u?.assistantOf?.active ? u.assistantOf.center : null);
    if (c && c.status === "APPROVED") return { id: c.id, name: c.name, slug: c.slug, userId: c.userId };
  }
  // Tolerant fallback by last-9-digits.
  const rows = await prisma.centerProfile.findMany({
    where: { status: "APPROVED" },
    select: { id: true, name: true, slug: true, userId: true, user: { select: { phone: true } } },
  });
  const c = rows.find((r) => nationalDigits(r.user.phone) === nat);
  return c ? { id: c.id, name: c.name, slug: c.slug, userId: c.userId } : null;
}

/**
 * Single account for one phone (login resolver) — so the app never has to
 * download the whole registry (which would leak every doctor/center phone).
 *
 * `role` mirrors the site's login tab: when given, only that role is returned
 * (a number that is both a doctor and a center resolves to the requested one,
 * not a fixed priority). Without it, priority is doctor → center → patient.
 * Returns null when the phone isn't an approved account for the wanted role.
 */
export async function getAppAccountForPhone(
  phone: string,
  role?: WantedRole,
): Promise<AppAccount | { role: "PATIENT"; phone: string; name: string | null } | null> {
  const norm = normalizePhone(phone);
  const nat = nationalDigits(phone);
  if (!norm && nat.length < 7) return null;

  // Exact match first; tolerant last-9-digits fallback for +994/0 differences.
  let user = norm
    ? await prisma.user.findUnique({
        where: { phone: norm },
        select: { id: true, phone: true, isBlocked: true, doctorProfile: { select: { id: true, status: true } }, centerProfile: { select: { id: true } }, patientProfile: { select: { firstName: true, lastName: true } }, doctorAssistantOf: { select: { active: true, doctorId: true } }, assistantOf: { select: { active: true, centerId: true } } },
      })
    : null;
  if (!user) {
    const rows = await prisma.user.findMany({
      where: { role: { in: ["DOCTOR", "CENTER", "ASSISTANT"] } },
      select: { id: true, phone: true, isBlocked: true, doctorProfile: { select: { id: true, status: true } }, centerProfile: { select: { id: true } }, patientProfile: { select: { firstName: true, lastName: true } }, doctorAssistantOf: { select: { active: true, doctorId: true } }, assistantOf: { select: { active: true, centerId: true } } },
    });
    user = rows.find((u) => nationalDigits(u.phone) === nat) ?? null;
  }
  if (!user || user.isBlocked) return null;

  const wantDoctor = !role || role === "DOCTOR";
  const wantCenter = !role || role === "CENTER";
  const wantPatient = !role || role === "PATIENT";

  // Doctor
  if (wantDoctor && user.doctorProfile && user.doctorProfile.status === "APPROVED") {
    const [d, partners] = await Promise.all([
      prisma.doctorProfile.findUnique({ where: { id: user.doctorProfile.id }, select: DOCTOR_ACCOUNT_SELECT }),
      prisma.centerDoctor.findMany({
        where: { doctorId: user.doctorProfile.id, status: "ACCEPTED", center: { status: "APPROVED" } },
        select: { center: { select: { slug: true } } },
      }),
    ]);
    if (d) {
      const slugs = [...new Set(partners.map((p) => p.center.slug).filter((s): s is string => Boolean(s)))];
      return doctorAccount(d as DoctorAccountRow, slugs);
    }
    if (role === "DOCTOR") return null;
  }
  // Doctor-assistant → sign in as the doctor they assist (acts on their behalf,
  // like the site). Keeps the assistant's own phone; flags assistantOf.
  if (wantDoctor && user.doctorAssistantOf?.active) {
    const doctorId = user.doctorAssistantOf.doctorId;
    const [d, partners] = await Promise.all([
      prisma.doctorProfile.findUnique({ where: { id: doctorId }, select: { ...DOCTOR_ACCOUNT_SELECT, status: true } }),
      prisma.centerDoctor.findMany({
        where: { doctorId, status: "ACCEPTED", center: { status: "APPROVED" } },
        select: { center: { select: { slug: true } } },
      }),
    ]);
    if (d && d.status === "APPROVED") {
      const slugs = [...new Set(partners.map((p) => p.center.slug).filter((s): s is string => Boolean(s)))];
      const acc = doctorAccount(d as DoctorAccountRow, slugs);
      return { ...acc, phone: user.phone, assistantOf: acc.name };
    }
    if (role === "DOCTOR") return null;
  }
  // Center
  if (wantCenter && user.centerProfile) {
    const c = await prisma.centerProfile.findUnique({
      where: { id: user.centerProfile.id },
      select: { slug: true, name: true, logoUrl: true, status: true },
    });
    if (c && c.status === "APPROVED") {
      return { phone: user.phone, role: "CENTER", name: c.name, centerSlug: c.slug, assistantOf: null, photoUrl: absoluteAssetUrl(c.logoUrl) };
    }
    if (role === "CENTER") return null;
  }
  // Center-assistant → sign in as the center they assist.
  if (wantCenter && user.assistantOf?.active) {
    const c = await prisma.centerProfile.findUnique({
      where: { id: user.assistantOf.centerId },
      select: { slug: true, name: true, logoUrl: true, status: true },
    });
    if (c && c.status === "APPROVED") {
      return { phone: user.phone, role: "CENTER", name: c.name, centerSlug: c.slug, assistantOf: c.name, photoUrl: absoluteAssetUrl(c.logoUrl) };
    }
    if (role === "CENTER") return null;
  }
  // Patient (exists but no doctor/center profile)
  if (wantPatient && user.patientProfile) {
    const name = [user.patientProfile.firstName, user.patientProfile.lastName].filter(Boolean).join(" ") || null;
    return { role: "PATIENT", phone: user.phone, name };
  }
  return null;
}

/**
 * Full catalog: services, cities, centers, prices and ratings.
 *
 * Deliberately does NOT embed the accounts registry: login now goes through
 * `whoami` (single account), and the app renders centers from `centers[]`
 * below. Shipping every doctor/center phone here is both dead weight and a
 * leak vector — the Worker serves `/catalog` to the app without a key and may
 * cache it publicly, which would re-expose the registry (cf. the f753fd2 CDN
 * bypass). The gated `/api/app/accounts` endpoint still exists for the rare
 * caller that genuinely needs the full list.
 */
export async function getAppCatalog(): Promise<Record<string, unknown>> {
  const [services, centers, reviews] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: { slug: true, name: true, shortName: true, description: true, icon: true, category: true, order: true, featured: true },
    }),
    prisma.centerProfile.findMany({
      where: { status: "APPROVED" },
      select: {
        id: true, slug: true, name: true, city: true, district: true, address: true,
        phone: true, workingHours: true, hours: true, lat: true, lng: true,
        description: true, equipment: true,
        responsiblePerson: true, logoUrl: true, images: true,
        googleRating: true, googleReviewCount: true,
        services: { select: { price: true, priceTo: true, service: { select: { slug: true, name: true } } } },
      },
    }),
    prisma.review.findMany({ where: { hidden: false }, select: { centerId: true, rating: true } }),
  ]);

  const ratingAgg = new Map<string, { sum: number; count: number }>();
  for (const r of reviews) {
    const agg = ratingAgg.get(r.centerId) ?? { sum: 0, count: 0 };
    agg.sum += r.rating;
    agg.count += 1;
    ratingAgg.set(r.centerId, agg);
  }

  // The site lists all ~112 services for SEO, but the app only needs the ones
  // a center actually offers — a much shorter, relevant list.
  const offeredSlugs = new Set<string>();
  for (const c of centers) for (const cs of c.services) offeredSlugs.add(cs.service.slug);
  const offeredServices = services.filter((s) => offeredSlugs.has(s.slug));
  const categories = [...new Set(offeredServices.map((s) => s.category).filter(Boolean))];

  return {
    version: 2,
    updatedAt: new Date().toISOString().slice(0, 10),
    categories,
    services: offeredServices,
    cities: CITIES.map((c) => c.name),
    examTypes: EXAM_TYPES,
    specializations: DENTAL_SPECIALIZATIONS,
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
        // Structured weekly hours for "open now" filtering: { mon:{open,close}|null, … } ("HH:mm", Asia/Baku).
        hours: c.hours ?? null,
        // Coordinates for the map (nullable — many centers have none; geocode the address as fallback).
        lat: c.lat ?? null,
        lng: c.lng ?? null,
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
