"use server";

/**
 * Əlaqə formasının OTP-təsdiqli axını (2026-08-22) — analizler.az naxışının
 * rentgen portu: sorğu YALNIZ kod təsdiqindən sonra bazaya yazılır ki,
 * uydurma nömrələrlə spam gəlməsin. Kod saytın qalan OTP axınları ilə eyni
 * infrastrukturdan gedir (createOtp/verifyOtp + Lsim SMS).
 */
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/phone";
import { createOtp, verifyOtp } from "@/lib/otp";
import { sendOtpSms } from "@/lib/sms";
import { env } from "@/lib/env";

export type ContactInput = {
  name: string;
  phone: string;
  subject: string;
  message?: string;
};

export type RequestResult =
  | { ok: true; phone: string; devCode?: string }
  | { ok: false; error: string };
export type ConfirmResult = { ok: true } | { ok: false; error: string };

type Valid = { name: string; phone: string; subject: string; message: string };

function validate(input: ContactInput): Valid | { error: string } {
  const name = (input.name ?? "").trim();
  const subject = (input.subject ?? "").trim();
  const message = (input.message ?? "").trim();
  const phone = normalizePhone((input.phone ?? "").trim());
  if (name.length < 2) return { error: "Adınızı yazın." };
  if (!phone) return { error: "Telefon nömrəsi düzgün deyil." };
  if (!subject) return { error: "Mövzunu seçin." };
  return { name, phone, subject, message };
}

export async function requestContactOtp(input: ContactInput): Promise<RequestResult> {
  const v = validate(input);
  if ("error" in v) return { ok: false, error: v.error };

  const ip = clientIp({ headers: await headers() });
  const rl = await rateLimit("contact:otp", ip, 8, 3600);
  if (!rl.allowed) {
    return { ok: false, error: "Çox sayda sorğu göndərildi. Bir saatdan sonra cəhd edin." };
  }

  const otp = await createOtp(v.phone, ip);
  if (!otp.ok) return { ok: false, error: otp.error };

  const sms = await sendOtpSms(v.phone, otp.code);
  if (!sms.ok) {
    return { ok: false, error: "SMS göndərilə bilmədi. Bir az sonra yenidən cəhd edin." };
  }
  return {
    ok: true,
    phone: v.phone,
    devCode: env.smsProvider === "dev" ? otp.code : undefined,
  };
}

export async function confirmContactOtp(
  input: ContactInput & { code: string },
): Promise<ConfirmResult> {
  const v = validate(input);
  if ("error" in v) return { ok: false, error: v.error };

  const code = (input.code ?? "").replace(/\D/g, "");
  if (code.length !== 6) return { ok: false, error: "6 rəqəmli kodu daxil edin." };

  const res = await verifyOtp(v.phone, code);
  if (!res.ok) return { ok: false, error: res.error };

  await prisma.contactMessage.create({
    data: {
      name: v.name.slice(0, 120),
      phone: v.phone,
      subject: v.subject.slice(0, 120),
      message: (v.message || v.subject).slice(0, 4000),
    },
  });
  return { ok: true };
}
