"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/rbac";

export type NotifResult = { ok: boolean; error?: string };

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
