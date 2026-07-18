import "server-only";
import { redirect } from "next/navigation";
import { getActingCenter } from "@/lib/auth/acting";

/**
 * Require a session acting for a center (the owner OR an active assistant)
 * and return its profile. `isOwner` gates settings/billing surfaces.
 * Redirects to the CRM login otherwise.
 */
export async function requireCenter(returnTo: string) {
  const acting = await getActingCenter();
  if (!acting) redirect(`/crm/giris?next=${encodeURIComponent(returnTo)}`);
  return { userId: acting.userId, center: acting.center, isOwner: acting.isOwner };
}
