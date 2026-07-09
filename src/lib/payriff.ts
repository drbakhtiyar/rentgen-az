import "server-only";
import { env } from "./env";

/**
 * Payriff Gateway API v3. Amounts are in AZN (decimal) on Payriff's side; we
 * keep money in minor units (qəpik, Int) and convert at the boundary.
 * Inert until PAYRIFF_SECRET is set (credentials come after registration).
 */

const BASE = env.payriff.base.replace(/\/$/, "");

export function payriffConfigured(): boolean {
  return Boolean(env.payriff.secret);
}

function toAzn(minor: number): number {
  return Math.round(minor) / 100;
}

type PayriffResponse<T> = {
  code?: string;
  message?: string;
  payload?: T;
};

/** Create a hosted-checkout order; returns the payment page URL. */
export async function createOrder(input: {
  amountMinor: number;
  description: string;
  callbackUrl: string;
  language?: "AZ" | "EN" | "RU";
  metadata?: Record<string, unknown>;
}): Promise<{ ok: true; orderId: string; paymentUrl: string } | { ok: false; error: string }> {
  if (!payriffConfigured()) return { ok: false, error: "Ödəniş sistemi konfiqurasiya olunmayıb." };
  try {
    const res = await fetch(`${BASE}/api/v3/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: env.payriff.secret },
      body: JSON.stringify({
        amount: toAzn(input.amountMinor),
        language: input.language ?? "AZ",
        currency: "AZN",
        description: input.description,
        callbackUrl: input.callbackUrl,
        cardSave: false,
        operation: "PURCHASE",
        metadata: input.metadata ?? {},
      }),
    });
    const data = (await res.json().catch(() => null)) as PayriffResponse<{
      orderId: string;
      paymentUrl: string;
    }> | null;
    if (data?.code === "00000" && data.payload?.paymentUrl && data.payload?.orderId) {
      return { ok: true, orderId: data.payload.orderId, paymentUrl: data.payload.paymentUrl };
    }
    return { ok: false, error: data?.message ?? "Ödəniş yaradıla bilmədi." };
  } catch {
    return { ok: false, error: "Payriff ilə əlaqə xətası." };
  }
}

/**
 * Authoritatively check an order's status straight from Payriff (used to verify
 * callbacks — never trust the callback body alone).
 */
export async function getOrderStatus(
  orderId: string,
): Promise<{ ok: boolean; paid: boolean; amountAzn?: number }> {
  if (!payriffConfigured()) return { ok: false, paid: false };
  try {
    const res = await fetch(`${BASE}/api/v3/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: env.payriff.secret },
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as PayriffResponse<{
      paymentStatus?: string;
      amount?: number;
    }> | null;
    if (data?.code === "00000") {
      return { ok: true, paid: data.payload?.paymentStatus === "PAID", amountAzn: data.payload?.amount };
    }
    return { ok: false, paid: false };
  } catch {
    return { ok: false, paid: false };
  }
}

/** Refund a paid order (full or partial). */
export async function refundOrder(
  orderId: string,
  amountMinor: number,
): Promise<{ ok: boolean; error?: string }> {
  if (!payriffConfigured()) return { ok: false, error: "Ödəniş sistemi konfiqurasiya olunmayıb." };
  try {
    const res = await fetch(`${BASE}/api/v3/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: env.payriff.secret },
      body: JSON.stringify({ orderId, amount: toAzn(amountMinor) }),
    });
    const data = (await res.json().catch(() => null)) as PayriffResponse<unknown> | null;
    return data?.code === "00000" ? { ok: true } : { ok: false, error: data?.message ?? "Refund xətası." };
  } catch {
    return { ok: false, error: "Payriff ilə əlaqə xətası." };
  }
}
