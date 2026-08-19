import "server-only";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { slugify } from "@/lib/utils";
import { formatHoursSummary, type WeeklyHours } from "@/lib/hours";
import { parseFaqAnswers } from "@/content/center-faq";
import {
  googleConfigured,
  resolveAndFetchRating,
  fetchRatingNear,
  resolveCoordsFromMapsUrl,
} from "@/lib/google-rating";
import { Prisma } from "@/generated/prisma/client";

/**
 * Best-effort: if the Google Places key is set and this center has no Place ID
 * yet, resolve one from its name + city and cache the current rating. A no-op
 * (zero cost/latency) while GOOGLE_PLACES_API_KEY is unset. Never throws.
 */
async function maybeEnrichGoogleRating(centerId: string): Promise<void> {
  if (!googleConfigured()) return;
  try {
    const c = await prisma.centerProfile.findUnique({
      where: { id: centerId },
      select: { googlePlaceId: true, name: true, city: true, lat: true, lng: true },
    });
    if (!c || c.googlePlaceId) return; // already connected → daily cron refreshes it
    const query = [c.name, c.city, "Azərbaycan"].filter(Boolean).join(" ").trim();
    if (!query) return;
    // With coordinates (e.g. resolved from the pasted Google link) we can pin the
    // exact place; otherwise fall back to a name + city text search.
    const r =
      c.lat != null && c.lng != null
        ? await fetchRatingNear(c.name, c.lat, c.lng)
        : await resolveAndFetchRating(query);
    if ("error" in r) return;
    await prisma.centerProfile.update({
      where: { id: centerId },
      data: {
        googlePlaceId: r.placeId,
        googleRating: r.rating,
        googleReviewCount: r.reviewCount,
        googleRatingAt: new Date(),
      },
    });
  } catch {
    /* rating is a nice-to-have — never block a save on it */
  }
}

export type CenterWriteInput = {
  name?: string;
  phone?: string;
  whatsapp?: string;
  landlinePhone?: string;
  address?: string;
  city?: string;
  district?: string;
  mapsUrl?: string;
  website?: string;
  instagram?: string;
  email?: string;
  adminPhone?: string;
  adminName?: string;
  superAdminPhone?: string;
  superAdminName?: string;
  hours?: WeeklyHours | null;
  equipment?: string;
  responsiblePerson?: string;
  description?: string;
  logoUrl?: string;
  licenseUrl?: string;
  bannerUrl?: string;
  images?: string[];
  lat?: number | null;
  lng?: number | null;
  faqAnswers?: Record<string, string> | null;
};

export type CenterWriteResult = {
  ok: boolean;
  error?: string;
  message?: string;
  id?: string;
  slug?: string;
};

/** Trim → cap length → null-if-empty. */
function s(v: unknown, max: number): string | null {
  const t = String(v ?? "").trim();
  return t ? t.slice(0, max) : null;
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "merkez";
  let slug = root;
  let i = 1;
  while (true) {
    const ex = await prisma.centerProfile.findUnique({ where: { slug } });
    if (!ex || ex.id === excludeId) return slug;
    i += 1;
    slug = `${root}-${i}`;
  }
}

function revalidateCenter(slug?: string, centerId?: string) {
  revalidatePath("/panel");
  revalidatePath("/admin/merkezler");
  if (centerId) {
    revalidatePath(`/panel/${centerId}`);
    revalidatePath(`/admin/merkezler/${centerId}`);
  }
  if (slug) revalidatePath(`/rentgen-merkezleri/${slug}`);
  revalidatePath("/rentgen-merkezleri");
}

/**
 * Loose create/update of a center. By design it NEVER rejects for missing
 * fields — the goal is bulk data-entry where we may know almost nothing about a
 * center yet. Only hard invariants are guarded (unique slug; one center per
 * owner phone). Used by admin + operator data-entry flows.
 *
 * @param centerId  null → create, otherwise update that center.
 */
export async function saveCenterLoose(
  centerId: string | null,
  input: CenterWriteInput,
): Promise<CenterWriteResult> {
  const week = (input.hours ?? null) as WeeklyHours | null;
  const phone = input.phone ? normalizePhone(input.phone) ?? input.phone.trim() : null;
  const whatsapp = input.whatsapp
    ? normalizePhone(input.whatsapp) ?? input.whatsapp.trim()
    : null;
  const landlinePhone = input.landlinePhone
    ? normalizePhone(input.landlinePhone) ?? input.landlinePhone.trim()
    : null;

  // Coordinates: use what was given, else auto-extract from the pasted Google
  // Maps link (short or full). This drives both the mini-map and the precise
  // rating lookup — so pasting a link is all the operator needs to do.
  let lat = typeof input.lat === "number" && Number.isFinite(input.lat) ? input.lat : null;
  let lng = typeof input.lng === "number" && Number.isFinite(input.lng) ? input.lng : null;
  if ((lat === null || lng === null) && input.mapsUrl) {
    const coords = await resolveCoordsFromMapsUrl(input.mapsUrl);
    if (coords) {
      lat = coords.lat;
      lng = coords.lng;
    }
  }

  const data = {
    name: s(input.name, 120) ?? "Adsız mərkəz",
    phone: phone ?? "",
    whatsapp,
    landlinePhone,
    address: s(input.address, 240),
    city: s(input.city, 80),
    district: s(input.district, 80),
    mapsUrl: s(input.mapsUrl, 500),
    website: s(input.website, 300),
    instagram: s(input.instagram, 300),
    email: s(input.email, 200),
    adminPhone: input.adminPhone ? normalizePhone(input.adminPhone) ?? s(input.adminPhone, 30) : null,
    adminName: s(input.adminName, 120),
    superAdminPhone: input.superAdminPhone ? normalizePhone(input.superAdminPhone) ?? s(input.superAdminPhone, 30) : null,
    superAdminName: s(input.superAdminName, 120),
    hours: week ? (week as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
    workingHours: formatHoursSummary(week) || null,
    equipment: s(input.equipment, 1000),
    responsiblePerson: s(input.responsiblePerson, 120),
    description: s(input.description, 2000),
    logoUrl: s(input.logoUrl, 500),
    licenseUrl: s(input.licenseUrl, 500),
    bannerUrl: s(input.bannerUrl, 500),
    images: (input.images ?? [])
      .filter((u) => typeof u === "string" && u.trim())
      .slice(0, 999),
    lat,
    lng,
    faqAnswers: (() => {
      const faq = parseFaqAnswers(input.faqAnswers);
      return Object.keys(faq).length ? (faq as Prisma.InputJsonValue) : Prisma.DbNull;
    })(),
  };

  try {
    // --- UPDATE (slug preserved for SEO/link stability) ---
    if (centerId) {
      const center = await prisma.centerProfile.update({
        where: { id: centerId },
        data,
        select: { slug: true },
      });
      await maybeEnrichGoogleRating(centerId);
      revalidateCenter(center.slug, centerId);
      return { ok: true, message: "Mərkəz məlumatları yeniləndi.", id: centerId, slug: center.slug };
    }

    // --- CREATE — a center needs an owner User(role CENTER). Attach to the
    // given phone if any (rejecting a duplicate owner), else mint a
    // placeholder owner so a data-only center can still be recorded. ---
    let userId: string;
    if (phone) {
      const existing = await prisma.user.findUnique({
        where: { phone },
        include: { centerProfile: true },
      });
      if (existing?.centerProfile) {
        return { ok: false, error: "Bu nömrə ilə artıq mərkəz mövcuddur." };
      }
      const user = existing
        ? await prisma.user.update({ where: { id: existing.id }, data: { role: "CENTER" } })
        : await prisma.user.create({ data: { phone, role: "CENTER" } });
      userId = user.id;
    } else {
      const user = await prisma.user.create({
        data: { phone: `placeholder:${randomUUID()}`, role: "CENTER" },
      });
      userId = user.id;
    }

    const slug = await uniqueSlug(data.name);
    const center = await prisma.centerProfile.create({
      data: { ...data, slug, userId, status: "PENDING", plan: "FREE" },
      select: { id: true, slug: true },
    });
    await maybeEnrichGoogleRating(center.id);
    revalidateCenter(center.slug);
    return {
      ok: true,
      message: "Mərkəz yaradıldı — təsdiqdən sonra saytda görünəcək.",
      id: center.id,
      slug: center.slug,
    };
  } catch (e) {
    console.error("[saveCenterLoose]", (e as Error).message);
    return { ok: false, error: "Texniki xəta. Yenidən cəhd edin." };
  }
}
