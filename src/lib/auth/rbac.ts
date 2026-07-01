import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionFromCookies } from "./session";
import type { Role } from "@/generated/prisma/enums";

/**
 * Loads the current user (with profiles) from the session cookie.
 * Memoized per request via React `cache`.
 */
export const getCurrentUser = cache(async () => {
  const session = await getSessionFromCookies();
  if (!session) return null;

  // Retry a couple of times: the (free-tier) database can briefly refuse
  // connections. This runs in the shared layout, so an unhandled error would
  // 500 every page — degrade gracefully to "logged out" instead.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { patientProfile: true, centerProfile: true, doctorProfile: true },
      });
      if (!user || user.isBlocked) return null;
      return user;
    } catch (e) {
      if (attempt === 2) {
        console.error("[getCurrentUser] DB unavailable:", (e as Error).message);
        return null;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  return null;
});

export type CurrentUser = NonNullable<
  Awaited<ReturnType<typeof getCurrentUser>>
>;

/** Redirects to login if not authenticated. */
export async function requireUser(returnTo?: string) {
  const user = await getCurrentUser();
  if (!user) {
    const qs = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
    redirect(`/giris${qs}`);
  }
  return user;
}

/** Redirects to login (or home) if the user doesn't have the required role. */
export async function requireRole(role: Role | Role[], returnTo?: string) {
  const user = await requireUser(returnTo);
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) {
    redirect("/");
  }
  return user;
}

export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "CENTER":
      return "/merkez";
    case "DOCTOR":
      return "/hekim";
    case "PATIENT":
    default:
      return "/kabinet";
  }
}
