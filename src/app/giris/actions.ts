"use server";

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { createOtp, verifyOtp as verifyOtpCode } from "@/lib/otp";
import { sendOtpSms } from "@/lib/sms";
import { redirect } from "next/navigation";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { dashboardPathForRole, getCurrentUser } from "@/lib/auth/rbac";
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

/** Switch the active role among the profiles this account already has. */
export async function switchRoleAction(role: "PATIENT" | "CENTER" | "DOCTOR") {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  let allowed = false;
  if (role === "PATIENT") {
    if (!user.patientProfile) {
      await prisma.patientProfile.create({ data: { userId: user.id } });
    }
    allowed = true;
  } else if (role === "CENTER") {
    allowed = !!user.centerProfile;
  } else if (role === "DOCTOR") {
    allowed = !!user.doctorProfile;
  }
  if (!allowed) redirect(dashboardPathForRole(user.role));

  await prisma.user.update({ where: { id: user.id }, data: { role } });
  await setSessionCookie({ userId: user.id, role, phone: user.phone });
  redirect(dashboardPathForRole(role));
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

    // One account per phone, but the SAME person can be patient, center and/or
    // doctor. The selected tab activates that role and creates its profile if missing.
    const selectedRole: Role =
      desiredRole === "CENTER"
        ? "CENTER"
        : desiredRole === "DOCTOR"
          ? "DOCTOR"
          : "PATIENT";

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          role: selectedRole,
          lastLoginAt: new Date(),
          ...(selectedRole === "PATIENT" ? { patientProfile: { create: {} } } : {}),
        },
        include,
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: selectedRole,
          lastLoginAt: new Date(),
          ...(selectedRole === "PATIENT" && !user.patientProfile
            ? { patientProfile: { create: {} } }
            : {}),
        },
        include,
      });
    }

    await setSessionCookie({ userId: user.id, role: selectedRole, phone: user.phone });

    // Where to send the user next (onboarding if the selected profile is missing)
    let redirectTo = dashboardPathForRole(selectedRole);
    if (selectedRole === "CENTER" && !user.centerProfile) {
      redirectTo = "/merkez/qeydiyyat";
    } else if (selectedRole === "DOCTOR" && !user.doctorProfile) {
      redirectTo = "/hekim/qeydiyyat";
    }

    return { ok: true, redirectTo };
  } catch (e) {
    console.error("[verifyOtp] user upsert failed:", e);
    return { ok: false, error: "Texniki xəta. Bir azdan yenidən cəhd edin." };
  }
}
