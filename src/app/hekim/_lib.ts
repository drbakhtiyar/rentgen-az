import "server-only";
import { redirect } from "next/navigation";
import { getActingDoctor } from "@/lib/auth/acting";
import { getCurrentUser } from "@/lib/auth/rbac";
import { doctorNav } from "@/components/dashboard/role-navs";

/**
 * Require a session acting for a doctor (the doctor OR their active assistant)
 * and return the profile. `isOwner` gates profile/billing surfaces.
 */
export async function requireDoctor(returnTo: string) {
  const acting = await getActingDoctor();
  if (!acting) {
    const me = await getCurrentUser();
    // A doctor without a profile finishes registration first; any other
    // logged-in non-doctor session (e.g. a center assistant) leaves the panel.
    if (me?.role === "DOCTOR") redirect("/hekim/qeydiyyat");
    if (me) redirect("/");
    redirect(`/giris?next=${encodeURIComponent(returnTo)}`);
  }
  return { userId: acting.userId, doctor: acting.doctor, isOwner: acting.isOwner };
}

/** Assistants don't see the owner-only sections in the sidebar. */
export function doctorNavFor(isOwner: boolean) {
  return isOwner ? doctorNav : doctorNav.filter((i) => i.href !== "/hekim/profil" && i.href !== "/hekim/paket");
}
