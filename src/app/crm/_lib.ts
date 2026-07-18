import "server-only";
import { redirect } from "next/navigation";
import { getActingCenter } from "@/lib/auth/acting";
import { getCurrentUser } from "@/lib/auth/rbac";
import { env } from "@/lib/env";

/**
 * Require a session acting for a center (the owner OR an active assistant)
 * and return its profile. `isOwner` gates settings/billing surfaces.
 * Redirects to the CRM login otherwise.
 */
export async function requireCenter(returnTo: string) {
  const acting = await getActingCenter();
  if (!acting) {
    // Logged in but not center-linked (e.g. a DOCTOR assistant): sending them
    // to the CRM login would bounce straight back here — leave the CRM host.
    const me = await getCurrentUser();
    if (me) redirect(env.isProd ? "https://rentgen.az/" : "/");
    redirect(`/crm/giris?next=${encodeURIComponent(returnTo)}`);
  }
  return { userId: acting.userId, center: acting.center, isOwner: acting.isOwner };
}
