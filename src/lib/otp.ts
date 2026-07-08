import "server-only";
import { createHash, randomInt } from "node:crypto";
import { prisma } from "./db";
import { env } from "./env";

export const OTP_TTL_MINUTES = 2;
export const OTP_LENGTH = 6;
export const MAX_VERIFY_ATTEMPTS = 5;

// Rate limits (per phone)
const MAX_PER_10_MIN = 3;
const RESEND_COOLDOWN_SECONDS = 120;
// Rate limit (per IP)
const MAX_PER_IP_PER_HOUR = 15;

function hashCode(phone: string, code: string): string {
  return createHash("sha256")
    .update(`${phone}:${code}:${env.otpSecret}`)
    .digest("hex");
}

export function generateCode(): string {
  // cryptographically strong 6-digit code, zero-padded
  return randomInt(0, 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, "0");
}

export type CreateOtpResult =
  | { ok: true; code: string; expiresAt: Date }
  | { ok: false; error: string; retryAfterSeconds?: number };

export async function createOtp(
  phone: string,
  ip?: string | null,
): Promise<CreateOtpResult> {
  const now = new Date();
  const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Cooldown: last OTP for this phone
  const last = await prisma.oTPCode.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });
  if (last) {
    const elapsed = (now.getTime() - last.createdAt.getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      return {
        ok: false,
        error: "Çox tez-tez sorğu göndərilir. Bir az gözləyin.",
        retryAfterSeconds: Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed),
      };
    }
  }

  // Per-phone window limit
  const recentForPhone = await prisma.oTPCode.count({
    where: { phone, createdAt: { gte: tenMinAgo } },
  });
  if (recentForPhone >= MAX_PER_10_MIN) {
    return {
      ok: false,
      error: "Bu nömrə üçün limit aşıldı. 10 dəqiqədən sonra yenidən cəhd edin.",
      retryAfterSeconds: 600,
    };
  }

  // Per-IP window limit
  if (ip) {
    const recentForIp = await prisma.oTPCode.count({
      where: { ip, createdAt: { gte: hourAgo } },
    });
    if (recentForIp >= MAX_PER_IP_PER_HOUR) {
      return {
        ok: false,
        error: "Çox sayda sorğu aşkarlandı. Bir saatdan sonra cəhd edin.",
        retryAfterSeconds: 3600,
      };
    }
  }

  const code = generateCode();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000);

  // Invalidate any previous unconsumed codes for this phone
  await prisma.oTPCode.updateMany({
    where: { phone, consumed: false },
    data: { consumed: true },
  });

  await prisma.oTPCode.create({
    data: {
      phone,
      codeHash: hashCode(phone, code),
      expiresAt,
      ip: ip ?? null,
    },
  });

  return { ok: true, code, expiresAt };
}

export type VerifyOtpResult =
  | { ok: true }
  | { ok: false; error: string };

export async function verifyOtp(
  phone: string,
  code: string,
): Promise<VerifyOtpResult> {
  const record = await prisma.oTPCode.findFirst({
    where: { phone, consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { ok: false, error: "Kod tapılmadı. Yenidən kod tələb edin." };
  }

  if (record.expiresAt < new Date()) {
    await prisma.oTPCode.update({
      where: { id: record.id },
      data: { consumed: true },
    });
    return { ok: false, error: "Kodun vaxtı bitib. Yeni kod tələb edin." };
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    await prisma.oTPCode.update({
      where: { id: record.id },
      data: { consumed: true },
    });
    return {
      ok: false,
      error: "Çox sayda yanlış cəhd. Yeni kod tələb edin.",
    };
  }

  const matches = record.codeHash === hashCode(phone, code);
  if (!matches) {
    await prisma.oTPCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    const left = MAX_VERIFY_ATTEMPTS - (record.attempts + 1);
    return {
      ok: false,
      error:
        left > 0
          ? `Kod yanlışdır. ${left} cəhd qalıb.`
          : "Kod yanlışdır. Yeni kod tələb edin.",
    };
  }

  await prisma.oTPCode.update({
    where: { id: record.id },
    data: { consumed: true },
  });
  return { ok: true };
}
