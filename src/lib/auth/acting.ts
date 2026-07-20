import "server-only";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getCurrentUser } from "./rbac";
import type { CenterProfile, DoctorProfile } from "@/generated/prisma/client";

export type ActingCenter = {
  userId: string;
  center: CenterProfile;
  /** true = the center owner; false = an assistant acting for the center. */
  isOwner: boolean;
};

/**
 * The center the current session acts for: the owner's own center (CENTER
 * role) or the linked center of an active assistant (ASSISTANT role).
 * Assistants do the day-to-day CRM work; settings/billing stay owner-only
 * (callers decide via `isOwner`). Returns null for anyone else.
 */
export async function getActingCenter(): Promise<ActingCenter | null> {
  const me = await getCurrentUser();
  if (!me) return null;
  if (me.role === "CENTER") {
    const center = await prisma.centerProfile.findUnique({ where: { userId: me.id } });
    return center ? { userId: me.id, center, isOwner: true } : null;
  }
  if (me.role === "ASSISTANT") {
    const link = await prisma.centerAssistant.findUnique({
      where: { userId: me.id },
      include: { center: true },
    });
    if (!link || !link.active) return null;
    return { userId: me.id, center: link.center, isOwner: false };
  }
  return null;
}

/**
 * Where the account button / post-login should send an ASSISTANT, plus their
 * display name. dashboardPathForRole can't resolve this (it only sees the role,
 * not whether they assist a doctor or a center). Returns null for a deactivated
 * or unlinked assistant.
 */
export async function assistantAccount(
  userId: string,
): Promise<{ dashboard: string; name: string } | null> {
  const [d, c] = await Promise.all([
    prisma.doctorAssistant.findUnique({
      where: { userId },
      select: { active: true, firstName: true, lastName: true },
    }),
    prisma.centerAssistant.findUnique({
      where: { userId },
      select: { active: true, firstName: true, lastName: true },
    }),
  ]);
  if (d?.active) return { dashboard: "/hekim", name: `${d.firstName} ${d.lastName}`.trim() };
  if (c?.active) {
    return {
      dashboard: env.isProd ? "https://crm.rentgen.az/teqvim" : "/crm/teqvim",
      name: `${c.firstName} ${c.lastName}`.trim(),
    };
  }
  return null;
}

export type ActingDoctor = {
  userId: string;
  doctor: DoctorProfile;
  /** true = the doctor themself; false = an assistant acting for the doctor. */
  isOwner: boolean;
};

/**
 * The doctor the current session acts for: the doctor's own profile (DOCTOR
 * role) or the linked doctor of an active assistant (ASSISTANT role).
 * Assistants handle day-to-day work; profile editing and billing stay
 * owner-only (callers decide via `isOwner`). Returns null for anyone else.
 */
export async function getActingDoctor(): Promise<ActingDoctor | null> {
  const me = await getCurrentUser();
  if (!me) return null;
  if (me.role === "DOCTOR") {
    const doctor = me.doctorProfile ?? (await prisma.doctorProfile.findUnique({ where: { userId: me.id } }));
    return doctor ? { userId: me.id, doctor, isOwner: true } : null;
  }
  if (me.role === "ASSISTANT") {
    const link = await prisma.doctorAssistant.findUnique({
      where: { userId: me.id },
      include: { doctor: true },
    });
    if (!link || !link.active) return null;
    return { userId: me.id, doctor: link.doctor, isOwner: false };
  }
  return null;
}
