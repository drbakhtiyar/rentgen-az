import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteObject } from "@/lib/b2";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily cron: permanently purge rentgen files whose trash-retention window has
 * elapsed (deletedAt set, purgeAt in the past). Removes the object from B2 and
 * the DB row. Protected by CRON_SECRET (Vercel Cron sends it as a Bearer token).
 */
export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  // Sürət limiti sayğaclarının təmizliyi (2026-08-14): vaxtı keçmiş
  // pəncərələr saxlanmır — cədvəl kiçik qalır.
  const rateLimitPurged = await prisma.rateLimit
    .deleteMany({ where: { expiresAt: { lt: now } } })
    .then((r) => r.count)
    .catch(() => 0);

  const due = await prisma.rentgenFile.findMany({
    where: { deletedAt: { not: null }, purgeAt: { lte: now } },
    select: { id: true, key: true, fileName: true, requestId: true },
    take: 1000,
  });

  let purged = 0;
  for (const f of due) {
    try {
      await deleteObject(f.key);
    } catch {
      /* object may already be gone — still drop the row */
    }
    try {
      await prisma.rentgenFile.delete({ where: { id: f.id } });
      await prisma.fileAuditLog
        .create({
          data: {
            action: "DELETE",
            fileId: f.id,
            requestId: f.requestId,
            role: "CRON",
            fileName: f.fileName,
          },
        })
        .catch(() => {});
      purged++;
    } catch {
      /* skip and retry next run */
    }
  }

  return NextResponse.json({ ok: true, rateLimitPurged, purged, scanned: due.length });
}
