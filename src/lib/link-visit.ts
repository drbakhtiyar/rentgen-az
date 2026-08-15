import "server-only";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * Girişsiz kampaniya linklərinin (q/f/m) izlənməsi (2026-08-13, istifadəçi
 * istəyi): mərkəz linki AÇANDA və formanı YAZANDA həmin mərkəzin WhatsApp
 * söhbətinə sistem qeydi düşür — operator dəvətin taleyini cavab gözləmədən
 * görür (dəvət → 👀 açdı → ✅ yenilədi). Paralel olaraq AdminActionLog-a
 * yazılır (jurnal + statistika üçün).
 *
 * QAYDA: 👀/✅ qeydləri fromAdmin=true olsa da İNSAN CAVABI DEYİL — bot susma
 * məntiqi (webhook humanActive + admin-chat mutedUntil) onları istisna edir.
 */

const KIND_LABEL: Record<"q" | "f" | "m", string> = {
  q: "Qiymət formu",
  f: "FAQ formu",
  m: "Kart formu",
};

// WhatsApp/Telegram link-preview crawler-ləri "açılma" sayılmasın
const BOT_UA = /whatsapp|facebookexternalhit|telegrambot|linkedinbot|twitterbot|bot|crawler|spider|preview|curl|python/i;

/** Açılma qeydinin təkrarlanma pəncərəsi — eyni link 6 saatda bir dəfə qeyd olunur. */
const VISIT_DEDUP_MS = 6 * 3600_000;
/** Yazma qeydinin pəncərəsi — ardıcıl "Yadda saxla" kliklərində spam olmasın. */
const SAVE_DEDUP_MS = 3600_000;

async function threadNote(centerId: string, content: string): Promise<void> {
  const c = await prisma.centerProfile.findUnique({
    where: { id: centerId },
    select: { userId: true },
  });
  if (!c) return;
  const thread = await prisma.adminThread.upsert({
    where: { userId: c.userId },
    create: { userId: c.userId },
    update: { lastMessageAt: new Date() },
  });
  await prisma.adminMessage.create({
    // internal: yalnız admin/operator görür (2026-08-15)
    data: { threadId: thread.id, fromAdmin: true, content, internal: true },
  });
}

/** Token səhifəsi açılanda çağırılır — heç vaxt throw etmir. */
export async function logTokenVisit(centerId: string, kind: "q" | "f" | "m"): Promise<void> {
  try {
    const ua = (await headers()).get("user-agent") ?? "";
    if (BOT_UA.test(ua)) return;

    const action = `center:link_visit_${kind}`;
    const recent = await prisma.adminActionLog.findFirst({
      where: {
        action,
        targetId: centerId,
        createdAt: { gte: new Date(Date.now() - VISIT_DEDUP_MS) },
      },
      select: { id: true },
    });
    if (recent) return;

    await prisma.adminActionLog.create({
      data: { action, targetType: "CenterProfile", targetId: centerId },
    });
    await threadNote(centerId, `👀 Mərkəz "${KIND_LABEL[kind]}" linkini açdı.`);
  } catch {
    /* izləmə heç vaxt səhifəni yıxmır */
  }
}

/** Girişsiz forma yadda saxlananda çağırılır — heç vaxt throw etmir. */
export async function logTokenSave(centerId: string, kind: "q" | "f" | "m"): Promise<void> {
  try {
    const marker = `✅ Mərkəz "${KIND_LABEL[kind]}"`;
    const c = await prisma.centerProfile.findUnique({
      where: { id: centerId },
      select: { userId: true },
    });
    if (!c) return;
    const thread = await prisma.adminThread.findUnique({ where: { userId: c.userId } });
    if (thread) {
      const recent = await prisma.adminMessage.findFirst({
        where: {
          threadId: thread.id,
          content: { startsWith: marker },
          createdAt: { gte: new Date(Date.now() - SAVE_DEDUP_MS) },
        },
        select: { id: true },
      });
      if (recent) return;
    }
    await threadNote(centerId, `${marker} vasitəsilə məlumatlarını yenilədi.`);
  } catch {
    /* izləmə heç vaxt yazmanı yıxmır */
  }
}
