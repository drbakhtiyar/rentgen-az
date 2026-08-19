import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createOtp, verifyOtp } from "@/lib/otp";
import { sendOtpSms } from "@/lib/sms";
import { normalizePhone } from "@/lib/phone";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { centersManagedByPhone } from "@/lib/auth/acting";
import { pacsConfigured, mintPacsToken, pacsLabel, type PacsScope } from "@/lib/pacs";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * PACS-ın ÖZ giriş axını (pacs.rentgen.az/login səhifəsi bura fetch edir).
 * Eyni nömrələr, eyni OTP — amma yalnız HƏKİM və MƏRKƏZ girə bilər
 * (istifadəçi qərarı 2026-08-20). Uğurlu təsdiqdə qısamüddətli imzalı
 * PACS tokeni qaytarılır → səhifə pacs.rentgen.az/open?t=… -ə keçir.
 * CORS: yalnız pacs.rentgen.az origin-i.
 */

const ALLOWED_ORIGIN = env.pacs.url; // https://pacs.rentgen.az

function cors(res: NextResponse): NextResponse {
  res.headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "content-type");
  res.headers.set("Vary", "Origin");
  return res;
}
const json = (body: unknown, status = 200) => cors(NextResponse.json(body, { status }));

export function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }));
}

/** Nömrəyə görə PACS səlahiyyəti — yalnız həkim/mərkəz (assistentlər daxil deyil). */
async function scopeForPhone(
  phone: string,
): Promise<Extract<PacsScope, { labels: string[] }> | null> {
  const user = await prisma.user.findUnique({
    where: { phone },
    include: { doctorProfile: true, centerProfile: true },
  });
  if (!user || user.isBlocked) return null;

  if (user.role === "DOCTOR" && user.doctorProfile) {
    const d = user.doctorProfile;
    const name = [d.firstName, d.lastName].filter(Boolean).join(" ").trim();
    return { role: "doctor", name: name ? `Dr. ${name}` : "Həkim", labels: [pacsLabel.doctor(d.id)] };
  }

  // Mərkəz: öz profili və/və ya nömrəsinin idarə etdiyi mərkəzlər (şəbəkə admini)
  const managed = await centersManagedByPhone(phone);
  const own = user.centerProfile ? [user.centerProfile] : [];
  const all = [...own, ...managed.filter((c) => !own.some((o) => o.id === c.id))];
  if ((user.role === "CENTER" || all.length > 0) && all.length > 0) {
    return { role: "center", name: all[0].name, labels: all.map((c) => pacsLabel.center(c.id)) };
  }

  return null;
}

export async function POST(req: NextRequest) {
  if (!pacsConfigured()) return json({ ok: false, error: "PACS konfiqurasiya olunmayıb" }, 503);
  let body: { op?: string; phone?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Yanlış sorğu" }, 400);
  }
  const phone = normalizePhone(body.phone ?? "");
  if (!phone) return json({ ok: false, error: "Nömrə düzgün deyil" }, 400);

  if (body.op === "send") {
    const rl = await rateLimit("pacs:otp", clientIp(req), 5, 60);
    if (!rl.allowed) return json({ ok: false, error: "Çox sayda sorğu. Bir azdan yenidən cəhd edin." }, 429);
    // Nömrə uyğun deyilsə SMS xərcləməyək — amma mövcudluğu sızdırmamaq üçün
    // mesaj neytral qalır.
    const scope = await scopeForPhone(phone);
    if (!scope) {
      return json({ ok: false, error: "Bu nömrə ilə həkim və ya mərkəz hesabı tapılmadı" }, 403);
    }
    const r = await createOtp(phone, clientIp(req));
    if (!r.ok) return json({ ok: false, error: r.error, retryAfterSeconds: r.retryAfterSeconds }, 429);
    const sms = await sendOtpSms(phone, r.code);
    if (!sms.ok) return json({ ok: false, error: "SMS göndərilə bilmədi" }, 502);
    return json({ ok: true, devCode: env.smsProvider === "dev" ? r.code : undefined });
  }

  if (body.op === "verify") {
    const rl = await rateLimit("pacs:verify", clientIp(req), 10, 60);
    if (!rl.allowed) return json({ ok: false, error: "Çox sayda sorğu. Bir azdan yenidən cəhd edin." }, 429);
    const code = (body.code ?? "").trim();
    if (!/^\d{4,8}$/.test(code)) return json({ ok: false, error: "Kod düzgün deyil" }, 400);
    const v = await verifyOtp(phone, code);
    if (!v.ok) return json({ ok: false, error: v.error }, 401);
    const scope = await scopeForPhone(phone);
    if (!scope) return json({ ok: false, error: "Bu nömrə ilə həkim və ya mərkəz hesabı tapılmadı" }, 403);
    const user = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
    await prisma.adminActionLog
      .create({
        data: {
          adminId: user?.id,
          action: "pacs:login",
          targetType: "PacsScope",
          targetId: scope.labels.join(","),
          meta: { role: scope.role, ua: req.headers.get("user-agent")?.slice(0, 200) ?? null },
        },
      })
      .catch(() => null);
    const token = mintPacsToken({
      sub: user?.id ?? phone,
      role: scope.role,
      name: scope.name,
      labels: scope.labels,
      dest: "/",
      ttlSec: 120,
    });
    return json({ ok: true, openUrl: `${env.pacs.url}/open?t=${token}` });
  }

  return json({ ok: false, error: "Naməlum əməliyyat" }, 400);
}
