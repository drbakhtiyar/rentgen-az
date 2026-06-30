"use server";

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { createOtp, verifyOtp as verifyOtpCode } from "@/lib/otp";
import { sendOtpSms } from "@/lib/sms";
import { redirect } from "next/navigation";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { dashboardPathForRole } from "@/lib/auth/rbac";
import { requestOtpSchema, verifyOtpSchema } from "@/lib/validation";
import type { Role } from "@/generated/prisma/enums";

export type ActionState = {
  ok: boolean;
  error?: string;
  /** dev-only: surfaced so testers can log in without a real SMS gateway */
  devCode?: string;
  redirectTo?: string;
};

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}

export async function requestOtpAction(input: {
  phone: string;
  role?: "PATIENT" | "CENTER" | "DOCTOR";
}): Promise<ActionState> {
  const parsed = requestOtpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Yanlış məlumat" };
  }
  const { phone } = parsed.data;

  try {
    const result = await createOtp(phone);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    const sms = await sendOtpSms(phone, result.code);
    if (!sms.ok) {
      return {
        ok: false,
        error: "SMS göndərilə bilmədi. Bir azdan yenidən cəhd edin.",
      };
    }

    return {
      ok: true,
      // In dev mode we expose the code to make local testing possible.
      devCode: env.smsProvider === "dev" ? result.code : undefined,
    };
  } catch (e) {
    console.error("[requestOtp] failed:", e);
    return {
      ok: false,
      error:
        "Server bazasına qoşulmaq mümkün olmadı. Konfiqurasiya yoxlanılır — bir azdan yenidən cəhd edin.",
    };
  }
}

export async function verifyOtpAction(input: {
  phone: string;
  code: string;
  role?: "PATIENT" | "CENTER" | "DOCTOR";
}): Promise<ActionState> {
  const parsed = verifyOtpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Yanlış məlumat" };
  }
  const { phone, code } = parsed.data;
  const desiredRole = parsed.data.role;

  let verify;
  try {
    verify = await verifyOtpCode(phone, code);
  } catch (e) {
    console.error("[verifyOtp] failed:", e);
    return {
      ok: false,
      error: "Server bazasına qoşulmaq mümkün olmadı. Bir azdan yenidən cəhd edin.",
    };
  }
  if (!verify.ok) {
    return { ok: false, error: verify.error };
  }

  try {
    const include = {
      centerProfile: true,
      patientProfile: true,
      doctorProfile: true,
    } as const;
    let user = await prisma.user.findUnique({ where: { phone }, include });

    if (user?.isBlocked) {
      return { ok: false, error: "Bu hesab bloklanıb. Adminlə əlaqə saxlayın." };
    }

    // Admin access is ONLY via the secret /admin-giris link — never the public
    // OTP form (otherwise dev-mode on-screen codes would expose the panel).
    if (user?.role === "ADMIN") {
      return {
        ok: false,
        error: "Bu hesaba bu formdan giriş mümkün deyil.",
      };
    }

    if (!user) {
      // New account — PATIENT, CENTER or DOCTOR via the public form.
      const role: Role =
        desiredRole === "CENTER"
          ? "CENTER"
          : desiredRole === "DOCTOR"
            ? "DOCTOR"
            : "PATIENT";
      user = await prisma.user.create({
        data: {
          phone,
          role,
          lastLoginAt: new Date(),
          // create a patient profile shell for patients
          ...(role === "PATIENT" ? { patientProfile: { create: {} } } : {}),
        },
        include,
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
        include,
      });
    }

    await setSessionCookie({ userId: user.id, role: user.role, phone: user.phone });

    // Where to send the user next
    let redirectTo = dashboardPathForRole(user.role);
    if (user.role === "CENTER" && !user.centerProfile) {
      redirectTo = "/merkez/qeydiyyat";
    } else if (user.role === "DOCTOR" && !user.doctorProfile) {
      redirectTo = "/hekim/qeydiyyat";
    }

    return { ok: true, redirectTo };
  } catch (e) {
    console.error("[verifyOtp] user upsert failed:", e);
    return { ok: false, error: "Texniki xəta. Bir azdan yenidən cəhd edin." };
  }
}
