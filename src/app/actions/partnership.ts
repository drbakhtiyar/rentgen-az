"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { smsCenterPartnerRequest } from "@/lib/notify";

export type PartnershipResult = { ok: boolean; error?: string; message?: string };

/** Doctor → sends (or re-sends) a collaboration request to a center. */
export async function requestPartnershipAction(
  centerId: string,
): Promise<PartnershipResult> {
  const user = await requireRole("DOCTOR");
  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, firstName: true, lastName: true, status: true },
    });
    if (!doctor) return { ok: false, error: "Həkim profili tapılmadı." };
    if (doctor.status !== "APPROVED") {
      return { ok: false, error: "Profiliniz təsdiqlənməyib." };
    }
    const center = await prisma.centerProfile.findFirst({
      where: { id: centerId, status: "APPROVED" },
      select: { id: true, phone: true },
    });
    if (!center) return { ok: false, error: "Mərkəz tapılmadı." };

    const existing = await prisma.centerDoctor.findUnique({
      where: { centerId_doctorId: { centerId: center.id, doctorId: doctor.id } },
    });
    if (existing?.status === "ACCEPTED") {
      return { ok: false, error: "Artıq bu mərkəzlə əməkdaşsınız." };
    }
    if (existing?.status === "PENDING") {
      return { ok: false, error: "Sorğu artıq göndərilib, cavab gözlənilir." };
    }

    // New or previously rejected → (re)send as PENDING.
    await prisma.centerDoctor.upsert({
      where: { centerId_doctorId: { centerId: center.id, doctorId: doctor.id } },
      create: { centerId: center.id, doctorId: doctor.id, status: "PENDING" },
      update: { status: "PENDING" },
    });

    const doctorName =
      [doctor.firstName, doctor.lastName].filter(Boolean).join(" ") || "Həkim";
    if (center.phone) {
      await smsCenterPartnerRequest(center.phone, doctorName).catch(() => {});
    }

    revalidatePath("/hekim/merkezler");
    revalidatePath("/merkez/hekimler");
    return { ok: true, message: "Əməkdaşlıq sorğusu göndərildi." };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

/** Center → accepts or rejects a doctor's partnership request. */
export async function respondPartnershipAction(
  partnerId: string,
  accept: boolean,
): Promise<PartnershipResult> {
  const user = await requireRole("CENTER");
  try {
    const center = await prisma.centerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!center) return { ok: false, error: "Mərkəz tapılmadı." };

    const partner = await prisma.centerDoctor.findUnique({
      where: { id: partnerId },
      select: { id: true, centerId: true },
    });
    if (!partner || partner.centerId !== center.id) {
      return { ok: false, error: "Sorğu tapılmadı." };
    }

    await prisma.centerDoctor.update({
      where: { id: partnerId },
      data: { status: accept ? "ACCEPTED" : "REJECTED" },
    });

    revalidatePath("/merkez/hekimler");
    revalidatePath("/hekim/merkezler");
    revalidatePath("/hekim");
    return {
      ok: true,
      message: accept ? "Əməkdaşlıq qəbul edildi." : "Sorğu rədd edildi.",
    };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}
