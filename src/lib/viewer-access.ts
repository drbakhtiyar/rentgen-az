import "server-only";
import { getCurrentUser } from "@/lib/auth/rbac";

/**
 * Pre-launch gate for the in-browser tomography (DICOM/CBCT) viewer.
 *
 * The "Bax" (view) button and the /viewer/[fileId] page are limited to
 * Dr. Bakhtiyar's own account for testing; everyone else sees only the
 * download button. Widen this allow-list (or make it return `true`) to
 * launch the viewer for all users.
 */
const VIEWER_ALLOWED_USER_IDS = new Set<string>([
  "cmr3k68yu000104jobcjn50hr", // Dr. Bəxtiyar Əliyev
]);

export async function viewerEnabled(): Promise<boolean> {
  const me = await getCurrentUser();
  return !!me && VIEWER_ALLOWED_USER_IDS.has(me.id);
}
