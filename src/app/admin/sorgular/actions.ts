"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";

export async function markContactReadAction(id: string): Promise<void> {
  await requireRole("ADMIN");
  await prisma.contactMessage.update({ where: { id }, data: { read: true } });
}
