import "server-only";
import { prisma } from "./db";
import { SITE_URL } from "./env";
import { createOrder, getOrderStatus } from "./payriff";
import { creditWallet } from "./wallet";

/**
 * Create a Payment record + a Payriff hosted-checkout order.
 * Returns the payment page URL to redirect the user to (Apple Pay / card).
 */
export async function startPayment(input: {
  userId?: string | null;
  amountMinor: number;
  purpose: string;
  description: string;
  meta?: Record<string, unknown>;
}): Promise<{ ok: true; paymentUrl: string; paymentId: string } | { ok: false; error: string }> {
  if (input.amountMinor <= 0) return { ok: false, error: "Yanlış məbləğ." };

  const payment = await prisma.payment.create({
    data: {
      userId: input.userId ?? null,
      amount: Math.round(input.amountMinor),
      purpose: input.purpose,
      status: "PENDING",
      meta: (input.meta ?? {}) as object,
    },
    select: { id: true },
  });

  const order = await createOrder({
    amountMinor: input.amountMinor,
    description: input.description,
    callbackUrl: `${SITE_URL}/api/pay/callback?p=${payment.id}`,
    metadata: { paymentId: payment.id, purpose: input.purpose },
  });

  if (!order.ok) {
    await prisma.payment
      .update({ where: { id: payment.id }, data: { status: "FAILED" } })
      .catch(() => {});
    return { ok: false, error: order.error };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { payriffOrderId: order.orderId },
  });
  return { ok: true, paymentUrl: order.paymentUrl, paymentId: payment.id };
}

/**
 * Verify a payment straight from Payriff (never trust the callback body) and
 * settle it. Idempotent — safe to call from both the server callback and the
 * browser return. Returns the final paid state.
 */
export async function verifyAndSettlePayment(paymentId: string): Promise<{ paid: boolean }> {
  const payment = await prisma.payment
    .findUnique({ where: { id: paymentId }, select: { id: true, status: true, payriffOrderId: true, purpose: true, userId: true } })
    .catch(() => null);
  if (!payment) return { paid: false };
  if (payment.status === "PAID") return { paid: true };
  if (!payment.payriffOrderId) return { paid: false };

  const status = await getOrderStatus(payment.payriffOrderId);
  if (!status.ok) return { paid: false };

  if (status.paid) {
    await prisma.payment
      .update({ where: { id: payment.id }, data: { status: "PAID", paidAt: new Date() } })
      .catch(() => {});
    // Phase 2: activate what was purchased based on payment.purpose.
    await onPaymentSettled(payment.purpose, payment.userId, payment.id).catch(() => {});
    return { paid: true };
  }

  await prisma.payment
    .update({ where: { id: payment.id }, data: { status: "FAILED" } })
    .catch(() => {});
  return { paid: false };
}

/**
 * Hook fired once a payment is confirmed PAID. Phase 2 wires the business
 * model here (activate subscription / featured listing / etc. by purpose).
 */
async function onPaymentSettled(
  purpose: string,
  userId: string | null,
  paymentId: string,
): Promise<void> {
  // Wallet top-up: credit the paid amount to the user's balance. Plan purchases
  // are then paid from that balance (see billing actions).
  if (purpose === "wallet_topup" && userId) {
    const p = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { amount: true },
    });
    if (p) await creditWallet(userId, p.amount, "TOPUP", "Payriff top-up");
  }
}
