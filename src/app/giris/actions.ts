"use server";

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";
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
  role?: "PATIENT" | "CENTER";
}): Promise<ActionState> {
  const parsed = requestOtpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Yanlış məlumat" };
  }
  const { phone } = parsed.data;

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
}

export async function verifyOtpAction(input: {
  phone: string;
  code: string;
  role?: "PATIENT" | "CENTER";
}): Promise<ActionState> {
  const parsed = verifyOtpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Yanlış məlumat" };
  }
  const { phone, code } = parsed.data;
  const desiredRole = parsed.data.role;

  const verify = await verifyOtpCode(phone, code);
  if (!verify.ok) {
    return { ok: false, error: verify.error };
  }

  const adminPhone = normalizePhone(env.adminPhone);
  const isAdmin = adminPhone && adminPhone === phone;

  let user = await prisma.user.findUnique({
    where: { phone },
    include: { centerProfile: true, patientProfile: true },
  });

  if (user?.isBlocked) {
    return { ok: false, error: "Bu hesab bloklanıb. Adminlə əlaqə saxlayın." };
  }

  if (!user) {
    // New account
    const role: Role = isAdmin ? "ADMIN" : desiredRole === "CENTER" ? "CENTER" : "PATIENT";
    user = await prisma.user.create({
      data: {
        phone,
        role,
        lastLoginAt: new Date(),
        // create a patient profile shell for patients
        ...(role === "PATIENT"
          ? { patientProfile: { create: {} } }
          : {}),
      },
      include: { centerProfile: true, patientProfile: true },
    });
  } else {
    // Existing account — promote to admin if configured, never silently demote.
    const data: { lastLoginAt: Date; role?: Role } = { lastLoginAt: new Date() };
    if (isAdmin && user.role !== "ADMIN") data.role = "ADMIN";
    user = await prisma.user.update({
      where: { id: user.id },
      data,
      include: { centerProfile: true, patientProfile: true },
    });
  }

  await setSessionCookie({ userId: user.id, role: user.role, phone: user.phone });

  // Where to send the user next
  let redirectTo = dashboardPathForRole(user.role);
  // A center user with no profile yet → onboarding
  if (user.role === "CENTER" && !user.centerProfile) {
    redirectTo = "/merkez/qeydiyyat";
  }

  return { ok: true, redirectTo };
}
