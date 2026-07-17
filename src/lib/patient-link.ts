import "server-only";
import { prisma } from "@/lib/db";

/**
 * Link a patient's past "guest" appointments (added by a center by hand or
 * booked before they registered) to their patient profile, keyed by phone.
 * Called when a patient registers/logs in or books — so a manually-added
 * patient becomes "in system" (files, full features) once they join.
 * Returns how many appointments were adopted.
 */
export async function adoptGuestAppointments(
  phone: string,
  patientProfileId: string,
): Promise<number> {
  const res = await prisma.appointmentRequest.updateMany({
    where: { phone, patientId: null },
    data: { patientId: patientProfileId },
  });
  return res.count;
}
