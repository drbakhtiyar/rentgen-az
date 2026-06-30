"use server";

import { cookies } from "next/headers";
import { verifyOtp } from "@/lib/otp";
import {
  verifyAdminChallengeToken,
  ADMIN_CHALLENGE_COOKIE,
} from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";
import { resolveAdminUser, ADMIN_2FA_KEY } from "@/lib/auth/admin";

export type Admin2faState = { ok: boolean; error?: string; redirectTo?: string };

export async function verifyAdmin2faAction(input: {
  code: string;
}): Promise<Admin2faState> {
  const code = (input.code ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: "Kod 6 rəqəmdən ibarət olmalıdır" };
  }

  const store = await cookies();
  const challenge = store.get(ADMIN_CHALLENGE_COOKIE)?.value;
  if (!challenge || !(await verifyAdminChallengeToken(challenge))) {
    return { ok: false, error: "Sessiya bitib. Admin linkini yenidən açın." };
  }

  let verify;
  try {
    verify = await verifyOtp(ADMIN_2FA_KEY, code);
  } catch {
    return { ok: false, error: "Texniki xəta. Yenidən cəhd edin." };
  }
  if (!verify.ok) {
    return { ok: false, error: verify.error };
  }

  try {
    const user = await resolveAdminUser();
    await setSessionCookie({ userId: user.id, role: "ADMIN", phone: user.phone });
    store.delete(ADMIN_CHALLENGE_COOKIE);
    return { ok: true, redirectTo: "/admin" };
  } catch {
    return { ok: false, error: "Texniki xəta. Yenidən cəhd edin." };
  }
}
