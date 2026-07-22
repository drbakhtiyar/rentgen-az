"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/auth/rbac";
import { getActingCenter } from "@/lib/auth/acting";
import { notifyUser } from "@/lib/notifications";
import { centerLimits, trashRetentionDays, effectiveExtraTb } from "@/lib/plans";
import type { Plan } from "@/generated/prisma/client";
import {
  b2Configured,
  presignUpload,
  presignDownload,
  deleteObject,
  createMultipart,
  completeMultipart,
  abortMultipart,
  MULTIPART_PART_SIZE,
} from "@/lib/b2";

export type FileResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

// Allowed upload types + size cap (Phase 1). Rentgen files are non-executable
// (images / PDF / ZIP-of-DICOM). CBCT series should be uploaded as a single ZIP.
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-compressed",
  "multipart/x-zip",
  // RAR archives (CBCT/tomography series are often shipped as .rar). Browsers
  // report the type inconsistently, so accept every common variant.
  "application/vnd.rar",
  "application/x-rar-compressed",
  "application/x-rar",
  "application/dicom",
  "application/xml", // rentgen aparatının hesabat/metadata XML-i
  "text/xml",
  "text/plain", // .txt hesabat
  "application/octet-stream", // .dcm / raw DICOM / naməlum
]);
const MAX_SIZE = 2_000_000_000; // ~2 GB (fits Int)
const GB = 1024 ** 3;

/** True if adding `addBytes` would exceed the center's plan storage quota
 * (base plan quota + active +1TB overage blocks). */
async function wouldExceedQuota(centerId: string, plan: Plan, addBytes: number): Promise<boolean> {
  const c = await prisma.centerProfile.findUnique({
    where: { id: centerId },
    select: { extraStorageTb: true, extraStorageUntil: true },
  });
  const extraGb = effectiveExtraTb(c?.extraStorageTb ?? 0, c?.extraStorageUntil) * 1024;
  const limitBytes = (centerLimits(plan).storageGb + extraGb) * GB;
  const agg = await prisma.rentgenFile.aggregate({
    _sum: { size: true },
    where: { request: { centerId }, deletedAt: null },
  });
  const used = agg._sum.size ?? 0;
  return used + addBytes > limitBytes;
}

const QUOTA_ERROR =
  "Storage limitiniz doldu. Paketi yüksəldin və ya köhnə faylları silin.";

function safeName(name: string): string {
  return (name.split(/[\\/]/).pop() ?? "fayl")
    .replace(/[^\w.\-() ]+/g, "_")
    .slice(0, 180);
}

async function audit(
  action: "UPLOAD" | "DOWNLOAD" | "DELETE",
  data: { fileId?: string; requestId?: string; userId?: string; role?: string; fileName?: string },
) {
  try {
    await prisma.fileAuditLog.create({ data: { action, ...data } });
  } catch {
    /* best-effort */
  }
}

/**
 * Notify the patient + referring partner doctor that a result was uploaded.
 * Only fires on the FIRST file of a request (avoids per-file spam).
 */
async function notifyResultUploaded(requestId: string): Promise<void> {
  try {
    const count = await prisma.rentgenFile.count({ where: { requestId } });
    if (count > 1) return; // already notified on the first file
    const r = await prisma.appointmentRequest.findUnique({
      where: { id: requestId },
      select: {
        name: true,
        centerId: true,
        doctorId: true,
        patient: { select: { userId: true } },
        doctor: { select: { userId: true } },
      },
    });
    if (!r) return;
    // Patient
    await notifyUser(
      r.patient?.userId,
      "RESULT_READY",
      "Rentgeniniz hazırdır",
      "Mərkəz rentgen faylınızı sistemə yüklədi.",
      "/kabinet",
    );
    // Referring doctor — only if an accepted partner of the center.
    if (r.doctorId && r.centerId && r.doctor?.userId) {
      const partner = await prisma.centerDoctor.findUnique({
        where: { centerId_doctorId: { centerId: r.centerId, doctorId: r.doctorId } },
        select: { status: true },
      });
      if (partner?.status === "ACCEPTED") {
        await notifyUser(
          r.doctor.userId,
          "RESULT_READY",
          "Pasiyentin rentgeni hazırdır",
          `${r.name} pasiyentin rentgen faylı yükləndi.`,
          "/hekim/pasiyentler",
        );
      }
    }
  } catch {
    /* best-effort */
  }
}

/**
 * Step 1 (center): get a presigned PUT URL to upload a rentgen file directly
 * to B2. Only the center that owns the request may upload.
 */
export async function requestUploadUrlAction(input: {
  requestId: string;
  fileName: string;
  contentType: string;
  size: number;
}): Promise<FileResult<{ url: string; key: string }>> {
  // Owner or an active assistant (assistants upload scans day-to-day).
  const acting = await getActingCenter();
  if (!acting) return { ok: false, error: "Mərkəz tapılmadı." };
  const user = { id: acting.userId };
  if (!b2Configured()) return { ok: false, error: "Fayl saxlama konfiqurasiya olunmayıb." };

  if (!ALLOWED_TYPES.has(input.contentType)) {
    return { ok: false, error: "Bu fayl tipi qəbul edilmir (JPG, PNG, PDF, ZIP, DICOM)." };
  }
  if (!Number.isFinite(input.size) || input.size <= 0 || input.size > MAX_SIZE) {
    return { ok: false, error: "Fayl ölçüsü 2 GB-dan çox olmamalıdır." };
  }

  const center = { id: acting.center.id, plan: acting.center.plan };

  const req = await prisma.appointmentRequest.findUnique({
    where: { id: input.requestId },
    select: { id: true, centerId: true },
  });
  if (!req || req.centerId !== center.id) {
    return { ok: false, error: "Müraciət tapılmadı." };
  }

  if (await wouldExceedQuota(center.id, center.plan, input.size)) {
    return { ok: false, error: QUOTA_ERROR };
  }

  const key = `rentgen/${req.id}/${randomUUID()}-${safeName(input.fileName)}`;
  try {
    const url = await presignUpload(key, input.contentType);
    return { ok: true, url, key };
  } catch {
    return { ok: false, error: "Yükləmə linki yaradıla bilmədi." };
  }
}

/**
 * Multipart step 1 (center): begin a resumable upload for a large file.
 * Returns presigned PUT URLs for every part.
 */
export async function startMultipartUploadAction(input: {
  requestId: string;
  fileName: string;
  contentType: string;
  size: number;
}): Promise<FileResult<{ key: string; uploadId: string; partSize: number; urls: string[] }>> {
  // Owner or an active assistant (assistants upload scans day-to-day).
  const acting = await getActingCenter();
  if (!acting) return { ok: false, error: "Mərkəz tapılmadı." };
  const user = { id: acting.userId };
  if (!b2Configured()) return { ok: false, error: "Fayl saxlama konfiqurasiya olunmayıb." };
  if (!ALLOWED_TYPES.has(input.contentType)) {
    return { ok: false, error: "Bu fayl tipi qəbul edilmir (JPG, PNG, PDF, ZIP, DICOM)." };
  }
  if (!Number.isFinite(input.size) || input.size <= 0 || input.size > MAX_SIZE) {
    return { ok: false, error: "Fayl ölçüsü 2 GB-dan çox olmamalıdır." };
  }

  const center = { id: acting.center.id, plan: acting.center.plan };
  const req = await prisma.appointmentRequest.findUnique({
    where: { id: input.requestId },
    select: { id: true, centerId: true },
  });
  if (!req || req.centerId !== center.id) return { ok: false, error: "Müraciət tapılmadı." };

  if (await wouldExceedQuota(center.id, center.plan, input.size)) {
    return { ok: false, error: QUOTA_ERROR };
  }

  const key = `rentgen/${req.id}/${randomUUID()}-${safeName(input.fileName)}`;
  const partCount = Math.max(1, Math.ceil(input.size / MULTIPART_PART_SIZE));
  try {
    const { uploadId, urls } = await createMultipart(key, input.contentType, partCount);
    return { ok: true, key, uploadId, partSize: MULTIPART_PART_SIZE, urls };
  } catch {
    return { ok: false, error: "Yükləmə başladıla bilmədi." };
  }
}

/** Multipart step 2 (center): finish the upload and record metadata. */
export async function completeMultipartUploadAction(input: {
  requestId: string;
  key: string;
  uploadId: string;
  parts: { PartNumber: number; ETag: string }[];
  fileName: string;
  size: number;
  contentType: string;
}): Promise<FileResult<{ fileId: string }>> {
  // Owner or an active assistant (assistants upload scans day-to-day).
  const acting = await getActingCenter();
  if (!acting) return { ok: false, error: "Mərkəz tapılmadı." };
  const user = { id: acting.userId };
  const center = { id: acting.center.id, plan: acting.center.plan };
  const req = await prisma.appointmentRequest.findUnique({
    where: { id: input.requestId },
    select: { id: true, centerId: true },
  });
  if (!req || req.centerId !== center.id) return { ok: false, error: "Müraciət tapılmadı." };
  if (!input.key.startsWith(`rentgen/${req.id}/`)) {
    return { ok: false, error: "Yanlış fayl açarı." };
  }

  try {
    await completeMultipart(input.key, input.uploadId, input.parts);
    const file = await prisma.rentgenFile.create({
      data: {
        requestId: req.id,
        key: input.key,
        fileName: safeName(input.fileName),
        size: Math.min(Math.round(input.size), MAX_SIZE),
        contentType: input.contentType,
        uploadedById: user.id,
      },
      select: { id: true, fileName: true },
    });
    await audit("UPLOAD", {
      fileId: file.id,
      requestId: req.id,
      userId: user.id,
      role: "CENTER",
      fileName: file.fileName,
    });
    await notifyResultUploaded(req.id);
    revalidatePath("/merkez");
    revalidatePath("/merkez/pasiyentler");
    return { ok: true, fileId: file.id };
  } catch {
    return { ok: false, error: "Yükləmə tamamlana bilmədi." };
  }
}

/** Cancel a stalled/failed multipart upload (best-effort cleanup). */
export async function abortMultipartUploadAction(input: {
  key: string;
  uploadId: string;
}): Promise<FileResult> {
  await requireRole("CENTER");
  try {
    await abortMultipart(input.key, input.uploadId);
  } catch {
    /* best-effort */
  }
  return { ok: true };
}

/**
 * Step 2 (center): after the browser has PUT the file to B2, record its
 * metadata. Verifies the key belongs to this request (prevents spoofing).
 */
export async function confirmUploadAction(input: {
  requestId: string;
  key: string;
  fileName: string;
  size: number;
  contentType: string;
}): Promise<FileResult<{ fileId: string }>> {
  // Owner or an active assistant (assistants upload scans day-to-day).
  const acting = await getActingCenter();
  if (!acting) return { ok: false, error: "Mərkəz tapılmadı." };
  const user = { id: acting.userId };
  const center = { id: acting.center.id, plan: acting.center.plan };

  const req = await prisma.appointmentRequest.findUnique({
    where: { id: input.requestId },
    select: { id: true, centerId: true },
  });
  if (!req || req.centerId !== center.id) {
    return { ok: false, error: "Müraciət tapılmadı." };
  }
  if (!input.key.startsWith(`rentgen/${req.id}/`)) {
    return { ok: false, error: "Yanlış fayl açarı." };
  }

  try {
    const file = await prisma.rentgenFile.create({
      data: {
        requestId: req.id,
        key: input.key,
        fileName: safeName(input.fileName),
        size: Math.min(Math.round(input.size), MAX_SIZE),
        contentType: input.contentType,
        uploadedById: user.id,
      },
      select: { id: true, fileName: true },
    });
    await audit("UPLOAD", {
      fileId: file.id,
      requestId: req.id,
      userId: user.id,
      role: "CENTER",
      fileName: file.fileName,
    });
    await notifyResultUploaded(req.id);
    revalidatePath("/merkez");
    revalidatePath("/merkez/pasiyentler");
    return { ok: true, fileId: file.id };
  } catch {
    return { ok: false, error: "Fayl qeydə alına bilmədi." };
  }
}

/**
 * Return a short-lived presigned download URL if the caller is authorized for
 * this file: the owning center, the patient, an accepted partner referring
 * doctor, or an admin. This is the IDOR gate — never trust the client's ID.
 */
export async function getDownloadUrlAction(
  fileId: string,
): Promise<FileResult<{ url: string }>> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Giriş tələb olunur." };

  const file = await prisma.rentgenFile.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      key: true,
      fileName: true,
      deletedAt: true,
      request: { select: { id: true, centerId: true, doctorId: true, patientId: true } },
    },
  });
  if (!file) return { ok: false, error: "Fayl tapılmadı." };
  // Trashed files are visible only to the owning center / admin (for restore).
  if (file.deletedAt && me.role !== "CENTER" && me.role !== "ADMIN") {
    return { ok: false, error: "Fayl tapılmadı." };
  }
  const r = file.request;

  let allowed = false;
  const role = me.role;
  if (me.role === "ADMIN") {
    allowed = true;
  } else if (me.role === "CENTER" && me.centerProfile) {
    allowed = r.centerId === me.centerProfile.id;
  } else if (me.role === "ASSISTANT") {
    // An active assistant may open their own center's files, or (for doctor
    // assistants) the referring doctor's files under the same partnership gate.
    const link = await prisma.centerAssistant.findUnique({
      where: { userId: me.id },
      select: { centerId: true, active: true },
    });
    if (link) {
      allowed = link.active && r.centerId === link.centerId;
    } else {
      const dlink = await prisma.doctorAssistant.findUnique({
        where: { userId: me.id },
        select: { doctorId: true, active: true },
      });
      if (dlink?.active && r.doctorId === dlink.doctorId && r.centerId) {
        const partner = await prisma.centerDoctor.findUnique({
          where: { centerId_doctorId: { centerId: r.centerId, doctorId: dlink.doctorId } },
          select: { status: true },
        });
        allowed = partner?.status === "ACCEPTED";
      }
    }
  } else if (me.role === "PATIENT" && me.patientProfile) {
    allowed = r.patientId === me.patientProfile.id;
  } else if (me.role === "DOCTOR" && me.doctorProfile) {
    // Referring doctor AND an accepted partnership with the center (same gate
    // that governs the result link elsewhere).
    if (r.doctorId === me.doctorProfile.id && r.centerId) {
      const partner = await prisma.centerDoctor.findUnique({
        where: {
          centerId_doctorId: { centerId: r.centerId, doctorId: me.doctorProfile.id },
        },
        select: { status: true },
      });
      allowed = partner?.status === "ACCEPTED";
    }
  }

  if (!allowed) return { ok: false, error: "Bu fayla girişiniz yoxdur." };

  try {
    const url = await presignDownload(file.key, file.fileName);
    await audit("DOWNLOAD", {
      fileId: file.id,
      requestId: r.id,
      userId: me.id,
      role,
      fileName: file.fileName,
    });
    return { ok: true, url };
  } catch {
    return { ok: false, error: "Endirmə linki yaradıla bilmədi." };
  }
}

/**
 * Center deletes one of its own request's files.
 *
 * Depending on the center's plan this is either a permanent delete (Free /
 * Silver — no trash) or a soft-delete into the trash bin (Gold: 30 days,
 * Platinum: 90 days), after which a cron purges it from B2. Soft-deleted files
 * stop counting toward the storage quota immediately.
 */
export async function deleteFileAction(
  fileId: string,
): Promise<FileResult<{ trashed: boolean; retentionDays: number }>> {
  // Deleting files is owner-only. Assistants upload and view day-to-day, but
  // removing a scan (even to the recoverable trash) stays with the owner.
  const acting = await getActingCenter();
  if (!acting) return { ok: false, error: "Mərkəz tapılmadı." };
  if (!acting.isOwner) {
    return { ok: false, error: "Faylı yalnız mərkəz sahibi silə bilər." };
  }
  const user = { id: acting.userId };
  const center = { id: acting.center.id, plan: acting.center.plan };

  const file = await prisma.rentgenFile.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      key: true,
      fileName: true,
      deletedAt: true,
      request: { select: { id: true, centerId: true } },
    },
  });
  if (!file || file.request.centerId !== center.id || file.deletedAt) {
    return { ok: false, error: "Fayl tapılmadı." };
  }

  const retentionDays = trashRetentionDays(center.plan);

  if (retentionDays > 0) {
    // Soft-delete: move to the trash bin; cron purges after `purgeAt`.
    const now = new Date();
    const purgeAt = new Date(now.getTime() + retentionDays * 86_400_000);
    await prisma.rentgenFile.update({
      where: { id: file.id },
      data: { deletedAt: now, deletedById: user.id, purgeAt },
    });
    await audit("DELETE", {
      fileId: file.id,
      requestId: file.request.id,
      userId: user.id,
      role: "CENTER",
      fileName: file.fileName,
    });
    revalidatePath("/merkez");
    revalidatePath("/merkez/pasiyentler");
    revalidatePath("/merkez/zibil-qutusu");
    return { ok: true, trashed: true, retentionDays };
  }

  // No trash on this plan → permanent delete from B2 + DB.
  try {
    await deleteObject(file.key);
  } catch {
    /* if the object is already gone, still remove the row */
  }
  await prisma.rentgenFile.delete({ where: { id: file.id } });
  await audit("DELETE", {
    fileId: file.id,
    requestId: file.request.id,
    userId: user.id,
    role: "CENTER",
    fileName: file.fileName,
  });
  revalidatePath("/merkez");
  revalidatePath("/merkez/pasiyentler");
  return { ok: true, trashed: false, retentionDays: 0 };
}

/** Restore a soft-deleted file from the trash back to active (quota re-checked). */
export async function restoreFileAction(fileId: string): Promise<FileResult> {
  const user = await requireRole("CENTER");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, plan: true },
  });
  if (!center) return { ok: false, error: "Mərkəz tapılmadı." };

  const file = await prisma.rentgenFile.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      size: true,
      deletedAt: true,
      request: { select: { id: true, centerId: true } },
    },
  });
  if (!file || file.request.centerId !== center.id || !file.deletedAt) {
    return { ok: false, error: "Fayl tapılmadı." };
  }

  // Restoring adds the bytes back — make sure it still fits the quota.
  if (await wouldExceedQuota(center.id, center.plan, file.size)) {
    return { ok: false, error: QUOTA_ERROR };
  }

  await prisma.rentgenFile.update({
    where: { id: file.id },
    data: { deletedAt: null, deletedById: null, purgeAt: null },
  });
  revalidatePath("/merkez");
  revalidatePath("/merkez/pasiyentler");
  revalidatePath("/merkez/zibil-qutusu");
  return { ok: true };
}

/** Permanently remove a single trashed file (from B2 + DB) before its purge date. */
export async function purgeFileAction(fileId: string): Promise<FileResult> {
  const user = await requireRole("CENTER");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!center) return { ok: false, error: "Mərkəz tapılmadı." };

  const file = await prisma.rentgenFile.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      key: true,
      fileName: true,
      deletedAt: true,
      request: { select: { id: true, centerId: true } },
    },
  });
  if (!file || file.request.centerId !== center.id || !file.deletedAt) {
    return { ok: false, error: "Fayl tapılmadı." };
  }

  try {
    await deleteObject(file.key);
  } catch {
    /* already gone — still drop the row */
  }
  await prisma.rentgenFile.delete({ where: { id: file.id } });
  await audit("DELETE", {
    fileId: file.id,
    requestId: file.request.id,
    userId: user.id,
    role: "CENTER",
    fileName: file.fileName,
  });
  revalidatePath("/merkez/zibil-qutusu");
  return { ok: true };
}

/** Empty the whole trash bin — permanently delete every trashed file. */
export async function emptyTrashAction(): Promise<FileResult<{ removed: number }>> {
  const user = await requireRole("CENTER");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!center) return { ok: false, error: "Mərkəz tapılmadı." };

  const files = await prisma.rentgenFile.findMany({
    where: { deletedAt: { not: null }, request: { centerId: center.id } },
    select: { id: true, key: true, fileName: true, requestId: true },
  });

  let removed = 0;
  for (const f of files) {
    try {
      await deleteObject(f.key);
    } catch {
      /* best-effort */
    }
    try {
      await prisma.rentgenFile.delete({ where: { id: f.id } });
      await audit("DELETE", {
        fileId: f.id,
        requestId: f.requestId,
        userId: user.id,
        role: "CENTER",
        fileName: f.fileName,
      });
      removed++;
    } catch {
      /* skip */
    }
  }
  revalidatePath("/merkez/zibil-qutusu");
  return { ok: true, removed };
}
