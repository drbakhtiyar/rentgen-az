"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { centerLimits } from "@/lib/plans";

export async function regenerateApiKeyAction(): Promise<{
  ok: boolean;
  apiKey?: string;
  error?: string;
}> {
  const user = await requireRole("CENTER");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, plan: true },
  });
  if (!center) return { ok: false, error: "Mərkəz tapılmadı." };
  if (!centerLimits(center.plan).apiExport) {
    return { ok: false, error: "API girişi yalnız Platinum paketdə mövcuddur." };
  }
  const apiKey = `rx_${randomUUID().replace(/-/g, "")}`;
  await prisma.centerProfile.update({ where: { id: center.id }, data: { apiKey } });
  revalidatePath("/merkez/export");
  return { ok: true, apiKey };
}
