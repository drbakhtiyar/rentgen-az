"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { slugify } from "@/lib/utils";
import { requireRole } from "@/lib/auth/rbac";
import { getActingCenter } from "@/lib/auth/acting";
import { alertAdminSms } from "@/lib/sms";
import { centerProfileSchema } from "@/lib/validation";
import { formatHoursSummary, type WeeklyHours } from "@/lib/hours";
import {
  smsPatientStatusChange,
  smsPatientResultReady,
  smsDoctorResultReady,
} from "@/lib/notify";
import { Prisma } from "@/generated/prisma/client";
import type { RequestStatus } from "@/generated/prisma/enums";
import { centerLimits } from "@/lib/plans";
import { notifyUser } from "@/lib/notifications";

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
}): Promise<CenterActionResult> {
  const user = await requireRole("CENTER");
  const parsed = centerProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Yanlış məlumat" };
  }
  const d = parsed.data;
  // Radiology license is mandatory for centers.
  if (!d.licenseUrl) {
    return { ok: false, error: "Rentgenologiya üzrə lisenziyanı yükləmək məcburidir." };
  }
  const week = (d.hours ?? null) as WeeklyHours | null;

  try {
    const existing = await prisma.centerProfile.findUnique({
      where: { userId: user.id },
    });

    // Enforce the plan's photo limit (new centers default to FREE).
    const photoLimit = centerLimits(existing?.plan ?? "FREE").photoLimit;
    const images =
      photoLimit == null ? (d.images ?? []) : (d.images ?? []).slice(0, photoLimit);

    const data = {
      name: d.name,
      phone: normalizePhone(d.phone) ?? d.phone,
      whatsapp: d.whatsapp ? normalizePhone(d.whatsapp) ?? d.whatsapp : null,
      address: d.address || null,
      city: d.city,
      district: d.district || null,
      mapsUrl: d.mapsUrl || null,
      hours: week ? (week as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      workingHours: formatHoursSummary(week) || null,
      equipment: d.equipment || null,
      responsiblePerson: d.responsiblePerson || null,
      description: d.description || null,
      logoUrl: d.logoUrl || null,
      licenseUrl: d.licenseUrl || null,
      bannerUrl: centerLimits(existing?.plan ?? "FREE").banner ? d.bannerUrl || null : null,
      images,
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
      // Alert the admin by SMS that a new center awaits approval.
      await alertAdminSms(`Rentgen.az: yeni mərkəz təsdiq gözləyir — ${d.name}`);
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
  services: { serviceId: string; enabled: boolean; price?: number | null; priceTo?: number | null; durationMin?: number | null; note?: string }[],
): Promise<CenterActionResult> {
  const user = await requireRole("CENTER");
  try {
    const center = await prisma.centerProfile.findUnique({
      where: { userId: user.id },
    });
    if (!center) return { ok: false, error: "Əvvəlcə mərkəz profilini yaradın." };

    const enabled = services.filter((s) => s.enabled);

    // Price is mandatory and fixed (single value) for every offered service, so
    // /xidmetler always has a clear price to show.
    if (enabled.some((s) => s.price == null || !Number.isFinite(s.price) || s.price <= 0)) {
      return { ok: false, error: "Seçdiyiniz hər xidmət üçün qiymət (₼) daxil edin." };
    }

    await prisma.$transaction([
      prisma.centerService.deleteMany({ where: { centerId: center.id } }),
      ...(enabled.length
        ? [
            prisma.centerService.createMany({
              data: enabled.map((s) => ({
                centerId: center.id,
                serviceId: s.serviceId,
                price: s.price ?? null,
                priceTo: null, // fixed price only — ranges are no longer allowed
                durationMin: Math.min(240, Math.max(5, Math.round(s.durationMin ?? 30))),
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

/** Center replies to a review left on its own profile. */
export async function replyToReviewAction(
  reviewId: string,
  reply: string,
): Promise<CenterActionResult> {
  const user = await requireRole("CENTER");
  const text = reply.trim();
  if (text.length > 1000) {
    return { ok: false, error: "Cavab çox uzundur (maks. 1000 simvol)." };
  }
  try {
    const center = await prisma.centerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, slug: true },
    });
    if (!center) return { ok: false, error: "Mərkəz tapılmadı." };

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { centerId: true, patient: { select: { userId: true } } },
    });
    if (!review || review.centerId !== center.id) {
      return { ok: false, error: "Rəy tapılmadı." };
    }

    await prisma.review.update({
      where: { id: reviewId },
      data: {
        reply: text || null,
        repliedAt: text ? new Date() : null,
      },
    });
    // Notify the patient that the center replied.
    if (text) {
      await notifyUser(
        review.patient?.userId,
        "REVIEW_REPLY",
        "Mərkəz rəyinizə cavab verdi",
        "Rəyinizə mərkəz tərəfindən cavab yazıldı.",
        `/rentgen-merkezleri/${center.slug}`,
      );
    }
    revalidatePath("/merkez/reyler");
    revalidatePath(`/rentgen-merkezleri/${center.slug}`);
    return { ok: true, message: text ? "Cavab yadda saxlanıldı." : "Cavab silindi." };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

// One-way progression: which target statuses are allowed from a given status.
// COMPLETED/CANCELLED are terminal (no changes). This prevents back-and-forth
// status flipping (and the repeat SMS it caused).
const ALLOWED_NEXT: Record<RequestStatus, RequestStatus[]> = {
  NEW: ["CONTACTED", "COMPLETED", "CANCELLED"],
  CONTACTED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function updateRequestStatusAction(
  requestId: string,
  status: RequestStatus,
): Promise<CenterActionResult> {
  // Owner or an active assistant (assistants work the CRM day-to-day).
  const acting = await getActingCenter();
  try {
    const center = acting
      ? { id: acting.center.id, name: acting.center.name, slug: acting.center.slug, plan: acting.center.plan }
      : null;
    if (!center) return { ok: false, error: "Mərkəz tapılmadı." };

    const req = await prisma.appointmentRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        centerId: true,
        status: true,
        phone: true,
        name: true,
        doctorId: true,
        patient: { select: { userId: true } },
        doctor: { select: { userId: true } },
      },
    });
    if (!req || req.centerId !== center.id) {
      return { ok: false, error: "Müraciət tapılmadı." };
    }
    // Enforce one-way transitions; terminal states are locked.
    if (!ALLOWED_NEXT[req.status].includes(status)) {
      return { ok: false, error: "Bu status dəyişikliyi mümkün deyil." };
    }

    await prisma.appointmentRequest.update({
      where: { id: requestId },
      data: {
        status,
        // Re-contact clears the "patient updated" flag.
        ...(status === "CONTACTED" ? { patientUpdated: false } : {}),
        // Center confirming completion → verified review eligibility.
        ...(status === "COMPLETED" ? { completedBy: "CENTER" } : {}),
      },
    });

    const patientUserId = req.patient?.userId;
    // CONTACTED: in-app notification (no SMS — the center just called them).
    if (status === "CONTACTED") {
      await notifyUser(
        patientUserId,
        "STATUS_UPDATE",
        "Mərkəz sizinlə əlaqə saxlayır",
        `${center.name} müraciətiniz üzrə sizinlə əlaqə saxlayır.`,
        "/kabinet",
      );
    }
    // COMPLETED: invite the patient to leave a review (only if the plan accepts reviews).
    if (status === "COMPLETED" && centerLimits(center.plan).reviews) {
      await notifyUser(
        patientUserId,
        "REVIEW_INVITE",
        "Təcrübənizi qiymətləndirin",
        `${center.name} müayinəniz tamamlandı — rəy yazaraq digər pasiyentlərə kömək edin.`,
        "/kabinet",
      );
    }
    // CANCELLED: notify the patient by SMS.
    if (status === "CANCELLED") {
      await smsPatientStatusChange(req.phone, { status, centerName: center.name }, center.id).catch(
        () => {},
      );
    }
    // Notify the referring doctor when their referred patient advances.
    if (req.doctorId && req.doctor?.userId && status !== "NEW") {
      const label =
        status === "COMPLETED" ? "tamamlandı" : status === "CANCELLED" ? "ləğv edildi" : "mərkəzlə əlaqədədir";
      await notifyUser(
        req.doctor.userId,
        "STATUS_UPDATE",
        "Göndərdiyiniz pasiyent üzrə yeniləmə",
        `${req.name || "Pasiyent"} — ${center.name}: müraciət ${label}.`,
        "/hekim/pasiyentler",
      );
    }
    revalidatePath("/merkez");
    revalidatePath("/merkez/pasiyentler");
    revalidatePath("/hekim/pasiyentler");
    return { ok: true };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

function isValidUrl(v: string): boolean {
  return /^https?:\/\/.+/i.test(v);
}

/** Center saves/updates the rentgen result link for a completed request. */
export async function setRequestResultAction(
  requestId: string,
  resultUrl: string,
): Promise<CenterActionResult> {
  const user = await requireRole("CENTER");
  const url = resultUrl.trim();
  if (url && !isValidUrl(url)) {
    return { ok: false, error: "Düzgün link daxil edin (https://...)." };
  }
  try {
    const center = await prisma.centerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, name: true },
    });
    if (!center) return { ok: false, error: "Mərkəz tapılmadı." };

    const req = await prisma.appointmentRequest.findUnique({
      where: { id: requestId },
      select: { id: true, centerId: true, phone: true, name: true, doctorId: true, resultUrl: true },
    });
    if (!req || req.centerId !== center.id) {
      return { ok: false, error: "Müraciət tapılmadı." };
    }

    const firstTime = !req.resultUrl && !!url;
    await prisma.appointmentRequest.update({
      where: { id: requestId },
      data: {
        resultUrl: url || null,
        resultAddedAt: url ? new Date() : null,
      },
    });

    // Notify only when a link is first added.
    if (firstTime) {
      await smsPatientResultReady(req.phone, center.name, center.id).catch(() => {});
      // Notify the referring doctor only if they are a partner of this center.
      if (req.doctorId) {
        const partner = await prisma.centerDoctor.findUnique({
          where: { centerId_doctorId: { centerId: center.id, doctorId: req.doctorId } },
          select: { status: true },
        });
        if (partner?.status === "ACCEPTED") {
          const doc = await prisma.doctorProfile.findUnique({
            where: { id: req.doctorId },
            select: { user: { select: { phone: true } } },
          });
          if (doc?.user.phone) {
            await smsDoctorResultReady(doc.user.phone, req.name, center.id).catch(() => {});
          }
        }
      }
    }

    revalidatePath("/merkez");
    revalidatePath("/hekim");
    revalidatePath("/kabinet");
    return { ok: true, message: url ? "Nəticə linki yadda saxlanıldı." : "Link silindi." };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

/** Center assigns/changes the referring doctor for a request. */
export async function setRequestDoctorAction(
  requestId: string,
  doctorId: string,
): Promise<CenterActionResult> {
  const user = await requireRole("CENTER");
  try {
    const center = await prisma.centerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!center) return { ok: false, error: "Mərkəz tapılmadı." };

    const req = await prisma.appointmentRequest.findUnique({
      where: { id: requestId },
      select: { centerId: true },
    });
    if (!req || req.centerId !== center.id) {
      return { ok: false, error: "Müraciət tapılmadı." };
    }
    if (doctorId) {
      const doc = await prisma.doctorProfile.findFirst({
        where: { id: doctorId, status: "APPROVED" },
        select: { id: true },
      });
      if (!doc) return { ok: false, error: "Həkim tapılmadı." };
    }

    await prisma.appointmentRequest.update({
      where: { id: requestId },
      data: { doctorId: doctorId || null },
    });
    revalidatePath("/merkez");
    revalidatePath("/hekim");
    return { ok: true, message: "Yönləndirən həkim yeniləndi." };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

/** Center (Gold+) sends one in-app message to all its ACCEPTED partner doctors. */
export async function broadcastToPartnerDoctorsAction(
  message: string,
): Promise<CenterActionResult> {
  const user = await requireRole("CENTER");
  const text = message.trim();
  if (text.length < 2) return { ok: false, error: "Mesaj yazın." };
  if (text.length > 2000) return { ok: false, error: "Mesaj çox uzundur (maks. 2000 simvol)." };
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, name: true, plan: true },
  });
  if (!center) return { ok: false, error: "Mərkəz tapılmadı." };
  if (!centerLimits(center.plan).broadcast) {
    return { ok: false, error: "Toplu mesaj yalnız Gold və Platinum paketlərdə mövcuddur." };
  }
  const partners = await prisma.centerDoctor.findMany({
    where: { centerId: center.id, status: "ACCEPTED" },
    select: { doctor: { select: { userId: true } } },
  });
  let sent = 0;
  for (const p of partners) {
    if (p.doctor?.userId) {
      await notifyUser(p.doctor.userId, "CENTER_BROADCAST", `${center.name} bildirişi`, text, "/hekim/bildirisler");
      sent++;
    }
  }
  if (sent === 0) return { ok: false, error: "Təsdiqlənmiş partnyor həkim yoxdur." };
  return { ok: true, message: `Mesaj ${sent} partnyor həkimə göndərildi.` };
}
