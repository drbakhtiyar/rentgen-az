import "server-only";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { slugify } from "@/lib/utils";
import { formatHoursSummary, type WeeklyHours } from "@/lib/hours";
import { Prisma } from "@/generated/prisma/client";

export type CenterWriteInput = {
  name?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  district?: string;
  mapsUrl?: string;
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

  const data = {
    name: s(input.name, 120) ?? "Adsız mərkəz",
    phone: phone ?? "",
    whatsapp,
    address: s(input.address, 240),
    city: s(input.city, 80),
    district: s(input.district, 80),
    mapsUrl: s(input.mapsUrl, 500),
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
    lat: typeof input.lat === "number" && Number.isFinite(input.lat) ? input.lat : null,
    lng: typeof input.lng === "number" && Number.isFinite(input.lng) ? input.lng : null,
  };

  try {
    // --- UPDATE (slug preserved for SEO/link stability) ---
    if (centerId) {
      const center = await prisma.centerProfile.update({
        where: { id: centerId },
        data,
        select: { slug: true },
      });
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
