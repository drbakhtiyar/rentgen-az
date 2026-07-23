import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAppKey, nationalDigits } from "@/lib/app-api";
import { getAppCenterForPhone } from "@/lib/app-catalog";
import { notifyUser } from "@/lib/notifications";
import { centerLimits } from "@/lib/plans";
import type { RequestStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

// One-way transitions, same as the site's center panel.
const ALLOWED: Record<RequestStatus, RequestStatus[]> = {
  NEW: ["CONTACTED", "CANCELLED"],
  CONTACTED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};
const STATUSES: RequestStatus[] = ["NEW", "CONTACTED", "COMPLETED", "CANCELLED"];

/**
 * POST /api/app/center/status — a center advances one of its requests
 * (NEW → CONTACTED → COMPLETED, or → CANCELLED). Notifies the patient and the
 * referring doctor, like the site's status control. App-key protected.
 * Body: { phone, requestId, status }.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const gate = requireAppKey(req);
  if (gate) return gate;

  let body: { phone?: string; requestId?: string; status?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }
  const phone = body.phone?.trim() ?? "";
  const requestId = body.requestId?.trim() ?? "";
  const status = (body.status ?? "").toUpperCase() as RequestStatus;
  if (nationalDigits(phone).length < 7 || !requestId || !STATUSES.includes(status)) {
    return NextResponse.json({ ok: false, error: "phone, requestId, status tələb olunur" }, { status: 400 });
  }

  try {
    const center = await getAppCenterForPhone(phone);
    if (!center) return NextResponse.json({ ok: false, error: "mərkəz tapılmadı" }, { status: 404 });

    const request = await prisma.appointmentRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true, centerId: true, status: true, name: true,
        patient: { select: { userId: true } },
        doctor: { select: { userId: true } },
        doctorId: true,
      },
    });
    if (!request || request.centerId !== center.id) {
      return NextResponse.json({ ok: false, error: "müraciət tapılmadı" }, { status: 404 });
    }
    if (!ALLOWED[request.status].includes(status)) {
      return NextResponse.json({ ok: false, error: "bu status dəyişikliyi mümkün deyil" }, { status: 400 });
    }

    await prisma.appointmentRequest.update({
      where: { id: requestId },
      data: {
        status,
        ...(status === "CONTACTED" ? { patientUpdated: false } : {}),
        ...(status === "COMPLETED" ? { completedBy: "CENTER" } : {}),
      },
    });

    // Best-effort notifications (in-app), mirroring the site.
    const patientUserId = request.patient?.userId;
    if (patientUserId) {
      if (status === "CONTACTED") {
        notifyUser(patientUserId, "STATUS_UPDATE", "Mərkəz sizinlə əlaqə saxlayır", `${center.name} müraciətiniz üzrə sizinlə əlaqə saxlayır.`, "/kabinet").catch(() => {});
      } else if (status === "COMPLETED" && centerLimits("PLATINUM").reviews) {
        notifyUser(patientUserId, "REVIEW_INVITE", "Təcrübənizi qiymətləndirin", `${center.name} müayinəniz tamamlandı — rəy yazın.`, "/kabinet").catch(() => {});
      }
    }
    if (request.doctorId && request.doctor?.userId && status !== "NEW") {
      const label = status === "COMPLETED" ? "tamamlandı" : status === "CANCELLED" ? "ləğv edildi" : "mərkəzlə əlaqədədir";
      notifyUser(request.doctor.userId, "STATUS_UPDATE", "Göndərdiyiniz pasiyent üzrə yeniləmə", `${request.name || "Pasiyent"} — ${center.name}: müraciət ${label}.`, "/hekim/pasiyentler").catch(() => {});
    }

    return NextResponse.json({ ok: true, status });
  } catch (e) {
    console.error("[api/app/center/status]", e);
    return NextResponse.json({ ok: false, error: "dəyişdirilə bilmədi" }, { status: 502 });
  }
}
