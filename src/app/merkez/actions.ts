"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { slugify } from "@/lib/utils";
import { requireRole } from "@/lib/auth/rbac";
import { centerProfileSchema } from "@/lib/validation";
import type { RequestStatus } from "@/generated/prisma/enums";

export type CenterActionResult = { ok: boolean; error?: string; message?: string };

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "merkez";
  let slug = root;
  let i = 1;
  // try until free
  while (true) {
    const existing = await prisma.centerProfile.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    i += 1;
    slug = `${root}-${i}`;
  }
}

export async function saveCenterProfileAction(input: {
  name: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  city: string;
  district?: string;
  mapsUrl?: string;
  workingHours?: string;
  equipment?: string;
  responsiblePerson?: string;
  description?: string;
  lat?: number | null;
  lng?: number | null;
}): Promise<CenterActionResult> {
  const user = await requireRole("CENTER");
  const parsed = centerProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Yanlış məlumat" };
  }
  const d = parsed.data;

  try {
    const existing = await prisma.centerProfile.findUnique({
      where: { userId: user.id },
    });

    const data = {
      name: d.name,
      phone: normalizePhone(d.phone) ?? d.phone,
      whatsapp: d.whatsapp ? normalizePhone(d.whatsapp) ?? d.whatsapp : null,
      address: d.address || null,
      city: d.city,
      district: d.district || null,
      mapsUrl: d.mapsUrl || null,
      workingHours: d.workingHours || null,
      equipment: d.equipment || null,
      responsiblePerson: d.responsiblePerson || null,
      description: d.description || null,
      lat: d.lat ?? null,
      lng: d.lng ?? null,
    };

    if (existing) {
      await prisma.centerProfile.update({
        where: { id: existing.id },
        data,
      });
    } else {
      const slug = await uniqueSlug(d.name);
      await prisma.centerProfile.create({
        data: {
          ...data,
          slug,
          userId: user.id,
          status: "PENDING",
        },
      });
    }

    revalidatePath("/merkez");
    revalidatePath("/merkez/profil");
    return {
      ok: true,
      message: existing
        ? "Profil yeniləndi."
        : "Profil yaradıldı. Admin təsdiqindən sonra saytda görünəcək.",
    };
  } catch {
    return { ok: false, error: "Texniki xəta. Yenidən cəhd edin." };
  }
}

export async function saveCenterServicesAction(
  services: { serviceId: string; enabled: boolean; price?: number | null; priceTo?: number | null; note?: string }[],
): Promise<CenterActionResult> {
  const user = await requireRole("CENTER");
  try {
    const center = await prisma.centerProfile.findUnique({
      where: { userId: user.id },
    });
    if (!center) return { ok: false, error: "Əvvəlcə mərkəz profilini yaradın." };

    const enabled = services.filter((s) => s.enabled);

    await prisma.$transaction([
      prisma.centerService.deleteMany({ where: { centerId: center.id } }),
      ...(enabled.length
        ? [
            prisma.centerService.createMany({
              data: enabled.map((s) => ({
                centerId: center.id,
                serviceId: s.serviceId,
                price: s.price ?? null,
                priceTo: s.priceTo ?? null,
                note: s.note || null,
              })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    revalidatePath("/merkez/xidmetler");
    revalidatePath("/merkez");
    return { ok: true, message: "Xidmətlər yadda saxlanıldı." };
  } catch {
    return { ok: false, error: "Texniki xəta. Yenidən cəhd edin." };
  }
}

export async function updateRequestStatusAction(
  requestId: string,
  status: RequestStatus,
): Promise<CenterActionResult> {
  const user = await requireRole("CENTER");
  try {
    const center = await prisma.centerProfile.findUnique({
      where: { userId: user.id },
    });
    if (!center) return { ok: false, error: "Mərkəz tapılmadı." };

    const req = await prisma.appointmentRequest.findUnique({
      where: { id: requestId },
    });
    if (!req || req.centerId !== center.id) {
      return { ok: false, error: "Müraciət tapılmadı." };
    }

    await prisma.appointmentRequest.update({
      where: { id: requestId },
      data: {
        status,
        // Center confirming completion → verified review eligibility.
        ...(status === "COMPLETED" ? { completedBy: "CENTER" } : {}),
      },
    });
    revalidatePath("/merkez");
    return { ok: true };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}
