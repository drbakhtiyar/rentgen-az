"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/rbac";
import { unreadMessageCount } from "@/lib/chat";
import { getUserAdminContact } from "@/lib/admin-chat";

export type NotifResult = { ok: boolean; error?: string };

/**
 * Combined "needs attention" count for the panels' browser alerts (sound +
 * tab-title counter). Unread notifications — new requests, results, partner /
 * plan events — MINUS the deduped NEW_MESSAGE marker, PLUS the real unread
 * chat message count (partner + admin support). This way a new patient
 * request and every new chat message both bump the number, without the
 * message being double-counted. The client polls this every ~12s.
 */
export async function getAlertCountAction(): Promise<number> {
  const me = await getCurrentUser();
  if (!me) return 0;
  try {
    let total = await prisma.notification.count({
      where: { userId: me.id, read: false, type: { not: "NEW_MESSAGE" } },
    });
    if (me.role === "CENTER" && me.centerProfile) {
      total += await unreadMessageCount(me.id, "CENTER", me.centerProfile.id);
      total += (await getUserAdminContact(me.id)).unread;
    } else if (me.role === "DOCTOR" && me.doctorProfile) {
      total += await unreadMessageCount(me.id, "DOCTOR", me.doctorProfile.id);
      total += (await getUserAdminContact(me.id)).unread;
    }
    return total;
  } catch {
    return 0;
  }
}

/** Mark a single notification read (only the owner's). */
export async function markNotificationReadAction(id: string): Promise<NotifResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Giriş tələb olunur." };
  try {
    await prisma.notification.updateMany({
      where: { id, userId: me.id },
      data: { read: true },
    });
    revalidatePath("/merkez/bildirisler");
    revalidatePath("/hekim/bildirisler");
    return { ok: true };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

/** Mark all of the current user's notifications read. */
export async function markAllNotificationsReadAction(): Promise<NotifResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Giriş tələb olunur." };
  try {
    await prisma.notification.updateMany({
      where: { userId: me.id, read: false },
      data: { read: true },
    });
    revalidatePath("/merkez/bildirisler");
    revalidatePath("/hekim/bildirisler");
    return { ok: true };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}
