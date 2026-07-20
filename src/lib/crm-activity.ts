import "server-only";
import { prisma } from "@/lib/db";
import { getActingCenter } from "@/lib/auth/acting";

export type CrmAction = "create" | "update" | "reschedule" | "delete" | "status" | "recall" | "invite";

/**
 * Record who (the owner or which assistant) performed a CRM mutation.
 * Best-effort — never throws, so it can't break the action it logs.
 */
export async function logCrmActivity(input: {
  action: CrmAction;
  detail?: string | null;
  requestId?: string | null;
}): Promise<void> {
  try {
    const acting = await getActingCenter();
    if (!acting) return;
    let actorName = "";
    if (!acting.isOwner) {
      const a = await prisma.centerAssistant.findUnique({
        where: { userId: acting.userId },
        select: { firstName: true, lastName: true },
      });
      actorName = a ? `${a.firstName} ${a.lastName}`.trim() : "Asistent";
    }
    await prisma.crmActivity.create({
      data: {
        centerId: acting.center.id,
        actorUserId: acting.userId,
        actorName,
        isAssistant: !acting.isOwner,
        action: input.action,
        detail: input.detail ?? null,
        requestId: input.requestId ?? null,
      },
    });
  } catch {
    // logging must not break the underlying action
  }
}

export type ActivityRow = {
  id: string;
  actorName: string;
  isAssistant: boolean;
  action: string;
  detail: string | null;
  createdAt: Date;
};

/** Recent CRM activity for a center (newest first). */
export async function getRecentActivity(centerId: string, limit = 100): Promise<ActivityRow[]> {
  return prisma.crmActivity.findMany({
    where: { centerId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, actorName: true, isAssistant: true, action: true, detail: true, createdAt: true },
  });
}
