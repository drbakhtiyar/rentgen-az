import "server-only";
import { prisma } from "./db";
import { centersManagedByPhone, getActingCenter, getActingDoctor } from "./auth/acting";
import type { CurrentUser } from "./auth/rbac";
import { pacsLabel, type PacsScope } from "./pacs";

/**
 * Same identity as rentgen.az → what this person may see in the PACS.
 *   ADMIN                → everything
 *   CENTER (owner/network admin) → all centers their phone manages
 *   ASSISTANT of a center → that center; of a doctor → that doctor
 *   DOCTOR               → studies labelled doctor-<doctorId>
 *   PATIENT              → studies labelled patient-<userId>
 *   OPERATOR / unknown   → null (no PACS access)
 */
export async function pacsScopeForUser(user: CurrentUser): Promise<PacsScope | null> {
  if (user.role === "ADMIN") return { role: "admin", name: "Admin", study: "*" };

  if (user.role === "DOCTOR" || user.role === "ASSISTANT") {
    const acting = await getActingDoctor();
    if (acting) {
      const d = acting.doctor;
      const name = [d.firstName, d.lastName].filter(Boolean).join(" ").trim();
      return { role: "doctor", name: name ? `Dr. ${name}` : "Həkim", labels: [pacsLabel.doctor(d.id)] };
    }
  }

  if (user.role === "CENTER" || user.role === "ASSISTANT") {
    if (user.role === "CENTER") {
      const managed = await centersManagedByPhone(user.phone);
      const own = user.centerProfile ? [user.centerProfile] : [];
      const all = [...own, ...managed.filter((c) => !own.some((o) => o.id === c.id))];
      if (all.length) {
        const acting = await getActingCenter().catch(() => null);
        const name = acting?.center.name ?? all[0].name;
        return { role: "center", name, labels: all.map((c) => pacsLabel.center(c.id)) };
      }
    } else {
      const acting = await getActingCenter();
      if (acting) return { role: "center", name: acting.center.name, labels: [pacsLabel.center(acting.center.id)] };
    }
  }

  if (user.role === "PATIENT") {
    const p = user.patientProfile ?? (await prisma.patientProfile.findUnique({ where: { userId: user.id } }));
    const name = [p?.firstName, p?.lastName].filter(Boolean).join(" ").trim();
    return { role: "patient", name: name || user.phone, labels: [pacsLabel.patient(user.id)] };
  }

  return null;
}
