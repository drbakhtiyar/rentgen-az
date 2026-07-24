import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAppKey, nationalDigits, splitName } from "@/lib/app-api";
import { normalizePhone } from "@/lib/phone";
import { verifyOtp } from "@/lib/otp";
import { notifyNewAppointment } from "@/lib/notify";
import { notifyUser } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * Resolve a phone to a DoctorProfile id — the doctor themselves OR their active
 * assistant (who acts on the doctor's behalf). Exact +994 match, tolerant
 * last-9-digits fallback for +994/0 inconsistencies.
 */
async function findDoctorByPhone(phone: string) {
  const norm = normalizePhone(phone);
  if (norm) {
    const u = await prisma.user.findUnique({
      where: { phone: norm },
      select: {
        doctorProfile: { select: { id: true } },
        doctorAssistantOf: { select: { active: true, doctorId: true } },
      },
    });
    if (u?.doctorProfile) return u.doctorProfile.id;
    if (u?.doctorAssistantOf?.active) return u.doctorAssistantOf.doctorId;
  }
  const nat = nationalDigits(phone);
  if (nat.length >= 7) {
    const docs = await prisma.doctorProfile.findMany({
      select: { id: true, user: { select: { phone: true } } },
    });
    const direct = docs.find((d) => nationalDigits(d.user.phone) === nat)?.id;
    if (direct) return direct;
    // Active doctor-assistant by last-9-digits.
    const assistants = await prisma.user.findMany({
      where: { doctorAssistantOf: { active: true } },
      select: { phone: true, doctorAssistantOf: { select: { doctorId: true } } },
    });
    return assistants.find((a) => nationalDigits(a.phone) === nat)?.doctorAssistantOf?.doctorId ?? null;
  }
  return null;
}

// ------------------------------- POST (create) -----------------------------

type ReferralBody = {
  doctorPhone?: string;
  centerSlug?: string;
  serviceSlug?: string | null;
  serviceName?: string | null;
  patientName?: string;
  patientPhone?: string;
  /** OTP the patient received (confirms the phone is real) — required. */
  code?: string;
  note?: string | null;
  preferredDate?: string | null;
};

export async function POST(req: Request): Promise<NextResponse> {
  const gate = requireAppKey(req);
  if (gate) return gate;

  let body: ReferralBody;
  try {
    body = (await req.json()) as ReferralBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }

  const doctorPhone = body.doctorPhone?.trim() ?? "";
  const centerSlug = body.centerSlug?.trim() ?? "";
  const patientName = body.patientName?.trim() ?? "";
  const patientPhoneRaw = body.patientPhone?.trim() ?? "";
  if (!doctorPhone || !centerSlug || !patientName || !patientPhoneRaw) {
    return NextResponse.json(
      { ok: false, error: "doctorPhone, centerSlug, patientName, patientPhone tələb olunur" },
      { status: 400 },
    );
  }
  const patientPhone = normalizePhone(patientPhoneRaw);
  if (!patientPhone) return NextResponse.json({ ok: false, error: "pasiyent nömrəsi düzgün deyil" }, { status: 400 });

  // Confirm the patient's phone with the OTP they were sent (like the site).
  const code = body.code?.trim() ?? "";
  if (!code) return NextResponse.json({ ok: false, error: "təsdiq kodu tələb olunur" }, { status: 400 });

  try {
    const v = await verifyOtp(patientPhone, code);
    if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });

    const doctorId = await findDoctorByPhone(doctorPhone);
    if (!doctorId) return NextResponse.json({ ok: false, error: "həkim tapılmadı" }, { status: 404 });

    const center = await prisma.centerProfile.findFirst({
      where: { OR: [{ slug: centerSlug }, { id: centerSlug }] },
      select: { id: true, name: true, slug: true, userId: true },
    });
    if (!center) return NextResponse.json({ ok: false, error: "mərkəz tapılmadı" }, { status: 404 });

    // Service slug: verify it exists, else resolve from the name.
    let serviceSlug: string | null = null;
    if (body.serviceSlug) {
      const s = await prisma.service.findUnique({ where: { slug: body.serviceSlug }, select: { slug: true } });
      serviceSlug = s?.slug ?? null;
    }
    if (!serviceSlug && body.serviceName) {
      const s = await prisma.service.findFirst({ where: { name: body.serviceName }, select: { slug: true } });
      serviceSlug = s?.slug ?? null;
    }

    // Patient: reuse by phone, else create User(PATIENT) + PatientProfile.
    const { firstName, lastName } = splitName(patientName);
    let patientCreated = false;
    let user = await prisma.user.findUnique({ where: { phone: patientPhone }, include: { patientProfile: true } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone: patientPhone, role: "PATIENT", patientProfile: { create: { firstName, lastName } } },
        include: { patientProfile: true },
      });
      patientCreated = true;
    } else if (!user.patientProfile) {
      const pp = await prisma.patientProfile.create({ data: { userId: user.id, firstName, lastName } });
      user = { ...user, patientProfile: pp };
      patientCreated = true;
    }
    const patientId = user.patientProfile?.id ?? null;

    const note = body.note?.trim() || null;
    let preferredDate: Date | null = null;
    if (body.preferredDate) {
      const d = new Date(body.preferredDate);
      if (!Number.isNaN(d.getTime())) preferredDate = d;
    }

    const created = await prisma.appointmentRequest.create({
      data: {
        name: patientName,
        phone: patientPhone,
        centerId: center.id,
        doctorId,
        serviceSlug,
        note,
        preferredDate,
        status: "NEW",
        patientId,
      },
      select: { id: true },
    });

    // Best-effort: alert the center (in-app + email), like a site referral.
    notifyUser(center.userId, "NEW_REQUEST", "Yeni pasiyent göndərişi", `${patientName} yönləndirildi (mobil tətbiq).`, "/merkez/pasiyentler").catch(() => {});
    notifyNewAppointment({
      name: patientName,
      phone: patientPhone,
      centerName: center.name,
      centerSlug: center.slug,
      serviceSlug,
      note,
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      id: created.id,
      centerName: center.name,
      serviceSlug,
      linkedPatient: Boolean(patientId),
      patientCreated,
    });
  } catch (e) {
    console.error("[api/app/referrals POST]", e);
    return NextResponse.json({ ok: false, error: "yazıla bilmədi" }, { status: 502 });
  }
}

// -------------------------------- GET (list) -------------------------------

function sizeLabel(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

export async function GET(req: Request): Promise<NextResponse> {
  const gate = requireAppKey(req);
  if (gate) return gate;

  const url = new URL(req.url);
  const phone = url.searchParams.get("phone") ?? url.searchParams.get("doctorPhone") ?? "";
  if (nationalDigits(phone).length < 7) {
    return NextResponse.json({ ok: false, error: "phone tələb olunur" }, { status: 400 });
  }

  try {
    const doctorId = await findDoctorByPhone(phone);
    if (!doctorId) return NextResponse.json({ ok: true, requests: [] });

    const rows = await prisma.appointmentRequest.findMany({
      where: { doctorId },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: {
        id: true, name: true, phone: true, serviceSlug: true, note: true,
        preferredDate: true, status: true, createdAt: true,
        center: { select: { slug: true, name: true } },
        files: { where: { deletedAt: null }, select: { id: true, fileName: true, size: true } },
      },
    });

    const slugs = [...new Set(rows.map((r) => r.serviceSlug).filter((s): s is string => Boolean(s)))];
    const svc = slugs.length
      ? await prisma.service.findMany({ where: { slug: { in: slugs } }, select: { slug: true, name: true } })
      : [];
    const svcName = new Map(svc.map((s) => [s.slug, s.name]));

    const requests = rows.map((r) => ({
      id: r.id,
      patientName: r.name,
      patientPhone: r.phone,
      centerId: r.center?.slug ?? null,
      centerName: r.center?.name ?? null,
      serviceSlug: r.serviceSlug,
      serviceName: r.serviceSlug ? svcName.get(r.serviceSlug) ?? null : null,
      status: r.status,
      note: r.note,
      preferredDate: r.preferredDate ? r.preferredDate.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      files: r.files.map((f) => ({ id: f.id, name: f.fileName, sizeLabel: sizeLabel(f.size), url: null })),
    }));

    return NextResponse.json({ ok: true, requests });
  } catch (e) {
    console.error("[api/app/referrals GET]", e);
    return NextResponse.json({ ok: false, error: "oxuna bilmədi" }, { status: 502 });
  }
}
