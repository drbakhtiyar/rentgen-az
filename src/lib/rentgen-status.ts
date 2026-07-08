import "server-only";
import { prisma } from "./db";

/**
 * For a set of rentgen file IDs, return a per-file label telling the center
 * whether a doctor / patient has already downloaded it (from FileAuditLog).
 * Only downloads by DOCTOR/PATIENT count — the center's own downloads don't.
 */
export async function getFileDownloadLabels(
  fileIds: string[],
): Promise<Record<string, string>> {
  if (fileIds.length === 0) return {};
  const logs = await prisma.fileAuditLog.findMany({
    where: {
      action: "DOWNLOAD",
      fileId: { in: fileIds },
      role: { in: ["DOCTOR", "PATIENT"] },
    },
    select: { fileId: true, role: true },
  });

  const roles: Record<string, Set<string>> = {};
  for (const l of logs) {
    if (!l.fileId) continue;
    (roles[l.fileId] ??= new Set()).add(l.role ?? "");
  }

  const out: Record<string, string> = {};
  for (const [id, set] of Object.entries(roles)) {
    const doctor = set.has("DOCTOR");
    const patient = set.has("PATIENT");
    if (doctor && patient) out[id] = "Həkim və pasiyent endirib";
    else if (doctor) out[id] = "Həkim endirib";
    else if (patient) out[id] = "Pasiyent endirib";
  }
  return out;
}
