"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";

/** Şəbəkə super admini siyahıdan mərkəz seçir (2026-08-19). Cookie yalnız
 *  icazəli siyahıdan dəyər ala bilər — kənar id 403 kimi rədd olunur. */
export async function pickNetworkCenterAction(centerId: string): Promise<void> {
  const me = await requireRole("CENTER");
  const allowed = await prisma.centerProfile.findFirst({
    where: {
      id: centerId,
      OR: [{ user: { phone: me.phone } }, { adminPhone: me.phone }, { superAdminPhone: me.phone }],
    },
    select: { id: true },
  });
  if (!allowed) redirect("/merkez/secim");
  (await cookies()).set("rx_center", centerId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  redirect("/merkez");
}
