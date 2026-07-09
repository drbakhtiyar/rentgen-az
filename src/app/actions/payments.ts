"use server";

import { requireRole } from "@/lib/auth/rbac";
import { startPayment } from "@/lib/payments";
import { payriffConfigured } from "@/lib/payriff";

export type PaymentStartResult =
  | { ok: true; paymentUrl: string }
  | { ok: false; error: string };

/**
 * Admin-only: create a test payment to verify the Payriff flow (sandbox) once
 * credentials are configured. Amount in qəpik (e.g. 1 = 0.01 AZN).
 */
export async function adminTestPaymentAction(amountMinor: number): Promise<PaymentStartResult> {
  const admin = await requireRole("ADMIN");
  if (!payriffConfigured()) {
    return { ok: false, error: "Payriff hələ konfiqurasiya olunmayıb (Secret Key lazımdır)." };
  }
  const res = await startPayment({
    userId: admin.id,
    amountMinor: Math.max(1, Math.round(amountMinor)),
    purpose: "test",
    description: "Test ödəniş",
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, paymentUrl: res.paymentUrl };
}
