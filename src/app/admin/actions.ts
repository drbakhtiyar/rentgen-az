"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { normalizePhone } from "@/lib/phone";
import { slugify } from "@/lib/utils";
import {
  blogPostSchema,
  centerProfileSchema,
  doctorProfileSchema,
  serviceFormSchema,
} from "@/lib/validation";
import { withAutoFill } from "@/lib/services";
import { formatHoursSummary, type WeeklyHours } from "@/lib/hours";
import { smsPatientStatusChange } from "@/lib/notify";
import { sendSms } from "@/lib/sms";
import { notifyUser } from "@/lib/notifications";
import { sendAdminWelcome } from "@/lib/admin-chat";
import { Prisma, type Plan } from "@/generated/prisma/client";
import { ALL_PLANS } from "@/lib/plans";
import { creditWallet } from "@/lib/wallet";
import type {
  CenterStatus,
  ReferralStatus,
  RequestStatus,
} from "@/generated/prisma/enums";

export type AdminResult = { ok: boolean; error?: string; message?: string; id?: string };

async function logAction(
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  meta?: Prisma.InputJsonValue,
) {
  try {
    await prisma.adminActionLog.create({
      data: { adminId, action, targetType, targetId, meta },
    });
  } catch {
    /* logging is best-effort */
  }
}

/** Admin sends a free-form SMS to any phone number (support / follow-up). */
export async function adminSendSmsAction(input: {
  phone: string;
  message: string;
}): Promise<AdminResult> {
  const admin = await requireRole("ADMIN");
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: "Telefon nömrəsi düzgün deyil." };
  const message = input.message.trim();
  if (message.length < 2) return { ok: false, error: "Mesaj mətnini yazın." };
  if (message.length > 480) return { ok: false, error: "Mesaj çox uzundur (maks. 480 simvol)." };

  const res = await sendSms(phone, message, "other");
  if (!res.ok) return { ok: false, error: res.error ?? "SMS göndərilə bilmədi." };
  await logAction(admin.id, "sms:send", "Sms", phone);
  revalidatePath("/admin/sms");
  return { ok: true, message: "SMS göndərildi." };
}

/** Admin sends an in-app message (notification) to a center/doctor user. */
export async function sendAdminMessageAction(input: {
  userId: string;
  title: string;
  body: string;
  link?: string;
}): Promise<AdminResult> {
  const admin = await requireRole("ADMIN");
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 2) return { ok: false, error: "Başlıq yazın." };
  const target = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });
  if (!target) return { ok: false, error: "İstifadəçi tapılmadı." };
  await notifyUser(target.id, "ADMIN_MESSAGE", title, body || null, input.link || null);
  await logAction(admin.id, "notification:send", "User", target.id, { title });
  return { ok: true, message: "Mesaj göndərildi." };
}

export async function setCenterStatusAction(
  centerId: string,
  status: CenterStatus,
): Promise<AdminResult> {
  const admin = await requireRole("ADMIN");
  try {
    const center = await prisma.centerProfile.update({
      where: { id: centerId },
      data: { status },
      select: { userId: true },
    });
    await logAction(admin.id, `center:${status}`, "CenterProfile", centerId);
    if (status === "APPROVED") await sendAdminWelcome(center.userId, "CENTER");
    revalidatePath("/admin/merkezler");
    revalidatePath("/admin");
    return { ok: true, message: "Status yeniləndi." };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

export async function setDoctorStatusAction(
  doctorId: string,
  status: CenterStatus,
): Promise<AdminResult> {
  const admin = await requireRole("ADMIN");
  try {
    const doctor = await prisma.doctorProfile.update({
      where: { id: doctorId },
      data: { status },
      select: { userId: true },
    });
    await logAction(admin.id, `doctor:${status}`, "DoctorProfile", doctorId);
    if (status === "APPROVED") await sendAdminWelcome(doctor.userId, "DOCTOR");
    revalidatePath("/admin/hekimler");
    revalidatePath("/admin");
    return { ok: true, message: "Status yeniləndi." };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

// -------------------- Admin edit: center & doctor --------------------

export async function adminUpdateCenterAction(
  centerId: string,
  input: {
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
  },
): Promise<AdminResult> {
  const admin = await requireRole("ADMIN");
  const parsed = centerProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Yanlış məlumat" };
  }
  const d = parsed.data;
  const week = (d.hours ?? null) as WeeklyHours | null;
  try {
    // slug is intentionally left unchanged to preserve existing links/SEO.
    const center = await prisma.centerProfile.update({
      where: { id: centerId },
      data: {
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
        bannerUrl: d.bannerUrl || null,
        images: d.images ?? [],
        lat: d.lat ?? null,
        lng: d.lng ?? null,
      },
      select: { slug: true },
    });
    await logAction(admin.id, "center:edit", "CenterProfile", centerId);
    revalidatePath("/admin/merkezler");
    revalidatePath(`/admin/merkezler/${centerId}`);
    revalidatePath(`/rentgen-merkezleri/${center.slug}`);
    revalidatePath("/rentgen-merkezleri");
    return { ok: true, message: "Mərkəz məlumatları yeniləndi." };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

export async function adminUpdateDoctorAction(
  doctorId: string,
  input: {
    firstName: string;
    lastName: string;
    clinic?: string;
    specializations?: string[];
    portfolio?: string[];
    city?: string;
    photoUrl?: string;
    bannerUrl?: string;
    instagram?: string;
    website?: string;
    diplomaUrl?: string;
    certificateUrl?: string;
    residencyUrl?: string;
    internshipUrl?: string;
    specialtyUrl?: string;
  },
): Promise<AdminResult> {
  const admin = await requireRole("ADMIN");
  const parsed = doctorProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Yanlış məlumat" };
  }
  const d = parsed.data;
  try {
    await prisma.doctorProfile.update({
      where: { id: doctorId },
      data: {
        firstName: d.firstName,
        lastName: d.lastName,
        clinic: d.clinic || null,
        specializations: d.specializations ?? [],
        portfolio: d.portfolio ?? [],
        city: d.city || null,
        photoUrl: d.photoUrl || null,
        bannerUrl: d.bannerUrl || null,
        instagram: d.instagram || null,
        website: d.website || null,
        diplomaUrl: d.diplomaUrl || null,
        certificateUrl: d.certificateUrl || null,
        residencyUrl: d.residencyUrl || null,
        internshipUrl: d.internshipUrl || null,
        specialtyUrl: d.specialtyUrl || null,
      },
    });
    await logAction(admin.id, "doctor:edit", "DoctorProfile", doctorId);
    revalidatePath("/admin/hekimler");
    revalidatePath(`/admin/hekimler/${doctorId}`);
    return { ok: true, message: "Həkim məlumatları yeniləndi." };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

/** Approve a flagged review → clears the flag and makes it public. */
export async function approveReviewAction(reviewId: string): Promise<AdminResult> {
  const admin = await requireRole("ADMIN");
  try {
    const r = await prisma.review.update({
      where: { id: reviewId },
      data: { flagged: false, hidden: false },
      select: { center: { select: { slug: true } } },
    });
    await logAction(admin.id, "review:approve", "Review", reviewId);
    revalidatePath("/admin/reyler");
    if (r.center?.slug) revalidatePath(`/rentgen-merkezleri/${r.center.slug}`);
    return { ok: true, message: "Rəy təsdiqləndi." };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

/** Reject a flagged review → keeps it hidden and removes it from the queue. */
export async function rejectReviewAction(reviewId: string): Promise<AdminResult> {
  const admin = await requireRole("ADMIN");
  try {
    await prisma.review.update({
      where: { id: reviewId },
      data: { flagged: false, hidden: true },
    });
    await logAction(admin.id, "review:reject", "Review", reviewId);
    revalidatePath("/admin/reyler");
    return { ok: true, message: "Rəy gizli saxlanıldı." };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

export async function setReviewHiddenAction(
  reviewId: string,
  hidden: boolean,
): Promise<AdminResult> {
  const admin = await requireRole("ADMIN");
  try {
    await prisma.review.update({ where: { id: reviewId }, data: { hidden } });
    await logAction(admin.id, hidden ? "review:hide" : "review:show", "Review", reviewId);
    revalidatePath("/admin/reyler");
    revalidatePath("/rentgen-merkezleri");
    return { ok: true, message: hidden ? "Rəy gizlədildi." : "Rəy göstərildi." };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

export async function setUserBlockedAction(
  userId: string,
  blocked: boolean,
): Promise<AdminResult> {
  const admin = await requireRole("ADMIN");
  if (userId === admin.id) {
    return { ok: false, error: "Öz hesabınızı bloklaya bilməzsiniz." };
  }
  try {
    await prisma.user.update({ where: { id: userId }, data: { isBlocked: blocked } });
    await logAction(admin.id, blocked ? "user:block" : "user:unblock", "User", userId);
    revalidatePath("/admin/pasiyentler");
    revalidatePath("/admin/merkezler");
    return { ok: true, message: blocked ? "İstifadəçi bloklandı." : "Blok götürüldü." };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

export async function setReferralStatusAction(
  referralId: string,
  status: ReferralStatus,
): Promise<AdminResult> {
  const admin = await requireRole("ADMIN");
  try {
    await prisma.referral.update({ where: { id: referralId }, data: { status } });
    await logAction(admin.id, `referral:${status}`, "Referral", referralId);
    revalidatePath("/admin/gonderisler");
    return { ok: true };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

export async function setRequestStatusAdminAction(
  requestId: string,
  status: RequestStatus,
): Promise<AdminResult> {
  const admin = await requireRole("ADMIN");
  try {
    const req = await prisma.appointmentRequest.update({
      where: { id: requestId },
      data: { status },
      select: { phone: true, centerId: true, center: { select: { name: true } } },
    });
    await logAction(admin.id, `request:${status}`, "AppointmentRequest", requestId);
    await smsPatientStatusChange(
      req.phone,
      { status, centerName: req.center?.name ?? null },
      req.centerId,
    ).catch(() => {});
    revalidatePath("/admin/muracietler");
    return { ok: true };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

// ----------------------------- Blog -----------------------------

export async function saveBlogPostAction(input: {
  id?: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string;
  published?: boolean;
}): Promise<AdminResult> {
  const admin = await requireRole("ADMIN");
  const parsed = blogPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Yanlış məlumat" };
  }
  const d = parsed.data;
  const slug = slugify(d.slug || d.title);
  const tags = (d.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const published = Boolean(d.published);

  try {
    // ensure slug uniqueness (excluding self)
    const clash = await prisma.blogPost.findUnique({ where: { slug } });
    if (clash && clash.id !== input.id) {
      return { ok: false, error: "Bu slug artıq istifadə olunur." };
    }

    const data = {
      slug,
      title: d.title,
      excerpt: d.excerpt || null,
      content: d.content,
      coverImage: d.coverImage || null,
      metaTitle: d.metaTitle || null,
      metaDescription: d.metaDescription || null,
      tags,
      published,
      publishedAt: published ? new Date() : null,
    };

    let id = input.id;
    if (input.id) {
      const existing = await prisma.blogPost.findUnique({ where: { id: input.id } });
      await prisma.blogPost.update({
        where: { id: input.id },
        data: {
          ...data,
          // keep original publishedAt if it was already published
          publishedAt: published
            ? existing?.publishedAt ?? new Date()
            : null,
        },
      });
    } else {
      const created = await prisma.blogPost.create({ data });
      id = created.id;
    }

    await logAction(admin.id, input.id ? "blog:update" : "blog:create", "BlogPost", id);
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    if (id) revalidatePath(`/blog/${slug}`);
    return { ok: true, id, message: "Məqalə yadda saxlanıldı." };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

export async function deleteBlogPostAction(id: string): Promise<AdminResult> {
  const admin = await requireRole("ADMIN");
  try {
    await prisma.blogPost.delete({ where: { id } });
    await logAction(admin.id, "blog:delete", "BlogPost", id);
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    return { ok: true, message: "Məqalə silindi." };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

// Revalidate everywhere the service catalog is shown publicly.
function revalidateServiceCatalog(slug?: string) {
  revalidatePath("/admin/parametrler");
  revalidatePath("/");
  revalidatePath("/xidmetler");
  revalidatePath("/rentgen-merkezleri");
  revalidatePath("/elaqe");
  if (slug) revalidatePath(`/xidmetler/${slug}`);
}

async function uniqueServiceSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "xidmet";
  let slug = root;
  let i = 1;
  while (true) {
    const existing = await prisma.service.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    i += 1;
    slug = `${root}-${i}`;
  }
}

export async function saveServiceAction(input: {
  id?: string;
  name: string;
  shortName?: string;
  description?: string;
  iconUrl?: string;
  category?: string;
  order?: number;
  featured?: boolean;
}): Promise<AdminResult> {
  const admin = await requireRole("ADMIN");
  const parsed = serviceFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Yanlış məlumat" };
  }
  const f = withAutoFill(parsed.data);
  const data = {
    name: f.name,
    shortName: f.shortName,
    description: f.description,
    icon: f.icon,
    iconUrl: f.iconUrl,
    category: f.category,
    order: f.order,
    featured: f.featured,
  };

  try {
    let id = input.id;
    let slug: string;
    if (input.id) {
      // Preserve the existing slug so links / SEO stay stable.
      const existing = await prisma.service.findUnique({
        where: { id: input.id },
        select: { slug: true },
      });
      if (!existing) return { ok: false, error: "Xidmət tapılmadı." };
      slug = existing.slug;
      await prisma.service.update({ where: { id: input.id }, data });
    } else {
      slug = await uniqueServiceSlug(f.slug);
      const created = await prisma.service.create({
        data: { ...data, slug, isActive: true },
      });
      id = created.id;
    }
    await logAction(admin.id, input.id ? "service:update" : "service:create", "Service", id);
    revalidateServiceCatalog(slug);
    return { ok: true, id, message: "Xidmət yadda saxlanıldı." };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

export async function toggleServiceActiveAction(
  serviceId: string,
  isActive: boolean,
): Promise<AdminResult> {
  await requireRole("ADMIN");
  try {
    const svc = await prisma.service.update({
      where: { id: serviceId },
      data: { isActive },
      select: { slug: true },
    });
    revalidateServiceCatalog(svc.slug);
    return { ok: true };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

export async function toggleCityActiveAction(
  cityId: string,
  isActive: boolean,
): Promise<AdminResult> {
  await requireRole("ADMIN");
  try {
    await prisma.city.update({ where: { id: cityId }, data: { isActive } });
    revalidatePath("/admin/parametrler");
    return { ok: true };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

export async function saveSeoSettingAction(input: {
  path: string;
  title?: string;
  description?: string;
  ogImage?: string;
}): Promise<AdminResult> {
  await requireRole("ADMIN");
  const path = input.path.trim();
  if (!path.startsWith("/")) return { ok: false, error: "Path '/' ilə başlamalıdır." };
  try {
    await prisma.seoSetting.upsert({
      where: { path },
      create: {
        path,
        title: input.title || null,
        description: input.description || null,
        ogImage: input.ogImage || null,
      },
      update: {
        title: input.title || null,
        description: input.description || null,
        ogImage: input.ogImage || null,
      },
    });
    revalidatePath("/admin/parametrler");
    return { ok: true, message: "SEO parametri yadda saxlanıldı." };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

/** Admin: bir mərkəzin abunə paketini təyin edir (FREE/SILVER/GOLD/PLATINUM). */
export async function adminSetCenterPlanAction(centerId: string, formData: FormData) {
  await requireRole("ADMIN");
  const plan = String(formData.get("plan") ?? "");
  if (!ALL_PLANS.includes(plan as Plan)) return;
  await prisma.centerProfile.update({
    where: { id: centerId },
    data: { plan: plan as Plan },
  });
  revalidatePath(`/admin/merkezler/${centerId}`);
  revalidatePath("/admin/merkezler");
}

/** Admin: bir həkimin abunə paketini təyin edir. */
export async function adminSetDoctorPlanAction(doctorId: string, formData: FormData) {
  await requireRole("ADMIN");
  const plan = String(formData.get("plan") ?? "");
  if (!ALL_PLANS.includes(plan as Plan)) return;
  await prisma.doctorProfile.update({
    where: { id: doctorId },
    data: { plan: plan as Plan },
  });
  revalidatePath(`/admin/hekimler/${doctorId}`);
  revalidatePath("/admin/hekimler");
}

/** Admin: manually credits a user's wallet (₼) — for testing / manual top-up. */
export async function adminCreditWalletAction(userId: string, formData: FormData) {
  await requireRole("ADMIN");
  const manat = Number(formData.get("manat") ?? 0);
  if (!Number.isFinite(manat) || manat <= 0) return;
  await creditWallet(userId, Math.round(manat * 100), "ADMIN", "Admin balans artırma");
  revalidatePath("/admin/merkezler");
  revalidatePath("/admin/hekimler");
}

// ---------------------------------------------------------------------------
// CRM SMS sifarişləri (mərkəzlərə SMS krediti satışı)

/** Approve a center's SMS package order: mark PAID + credit the balance. */
export async function approveSmsOrderAction(orderId: string): Promise<AdminResult> {
  await requireRole("ADMIN");
  const order = await prisma.centerSmsOrder.findUnique({
    where: { id: orderId },
    select: { id: true, centerId: true, qty: true, price: true, status: true, center: { select: { userId: true, name: true } } },
  });
  if (!order) return { ok: false, error: "Sifariş tapılmadı." };
  if (order.status !== "PENDING") return { ok: false, error: "Sifariş artıq emal olunub." };

  await prisma.centerSmsOrder.update({
    where: { id: order.id },
    data: { status: "PAID", paidAt: new Date() },
  });
  const { creditCenterSms } = await import("@/lib/center-sms");
  await creditCenterSms(order.centerId, order.qty, "PURCHASE", `${order.qty} SMS paketi (${order.price} AZN)`);
  await notifyUser(
    order.center.userId,
    "STATUS_UPDATE",
    "SMS balansı yükləndi",
    `${order.qty} SMS balansınıza əlavə olundu. CRM → SMS-lər bölməsində görə bilərsiniz.`,
    "/crm/sms",
  ).catch(() => {});

  revalidatePath("/admin/sms");
  return { ok: true, message: "Sifariş təsdiqləndi, balans yükləndi." };
}

/** Cancel a pending SMS order. */
export async function cancelSmsOrderAction(orderId: string): Promise<AdminResult> {
  await requireRole("ADMIN");
  const order = await prisma.centerSmsOrder.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });
  if (!order) return { ok: false, error: "Sifariş tapılmadı." };
  if (order.status !== "PENDING") return { ok: false, error: "Sifariş artıq emal olunub." };
  await prisma.centerSmsOrder.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
  revalidatePath("/admin/sms");
  return { ok: true, message: "Sifariş ləğv edildi." };
}

/** Manually add SMS credits to a center (gift/adjustment). */
export async function grantCenterSmsAction(centerId: string, amount: number, note?: string): Promise<AdminResult> {
  await requireRole("ADMIN");
  const qty = Math.round(amount);
  if (!Number.isFinite(qty) || qty <= 0 || qty > 100000) {
    return { ok: false, error: "SMS sayı düzgün deyil." };
  }
  const center = await prisma.centerProfile.findUnique({ where: { id: centerId }, select: { id: true, userId: true } });
  if (!center) return { ok: false, error: "Mərkəz tapılmadı." };
  const { creditCenterSms } = await import("@/lib/center-sms");
  await creditCenterSms(centerId, qty, "GRANT", note || "Admin yükləməsi");
  await notifyUser(
    center.userId,
    "STATUS_UPDATE",
    "SMS balansı yükləndi",
    `${qty} SMS balansınıza əlavə olundu (hədiyyə).`,
    "/crm/sms",
  ).catch(() => {});
  revalidatePath("/admin/sms");
  return { ok: true, message: "Balans yükləndi." };
}
