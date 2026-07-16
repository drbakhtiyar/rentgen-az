import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";

/** Require a logged-in CENTER and return its profile. Redirects otherwise. */
export async function requireCenter(returnTo: string) {
  const user = await requireRole("CENTER", returnTo);
  const center = await prisma.centerProfile.findUnique({ where: { userId: user.id } });
  if (!center) redirect("/merkez/qeydiyyat");
  return { user, center };
}
