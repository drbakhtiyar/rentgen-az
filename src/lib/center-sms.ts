import "server-only";
import { prisma } from "@/lib/db";
import { sendSms, type SmsKind, type SendSmsResult } from "@/lib/sms";

/**
 * CRM SMS credits. Center-serving SMSes (reminders, re-calls, invites,
 * campaigns) are paid from the center's smsBalance; the sender name stays
 * "rentgen.az" (extra branding for the platform). Platform SMSes (OTP, booking
 * notifications) do NOT touch the balance.
 */

export const NO_BALANCE_ERROR =
  "SMS balansınız bitib. CRM → SMS-lər bölməsindən paket sifariş edin.";

/** SMS packages offered to centers (qty → AZN). */
export const SMS_PACKAGES: { qty: number; price: number }[] = [
  { qty: 100, price: 5 },
  { qty: 500, price: 20 },
  { qty: 1000, price: 35 },
];

export type CenterSendResult = SendSmsResult | { ok: false; error: string; noBalance: true };

/**
 * Send an SMS on behalf of a center, charging 1 credit from its balance.
 * The decrement is atomic (guarded by smsBalance > 0), and the credit is
 * refunded if the provider send fails — so a failed SMS never costs anything.
 */
export async function sendCenterSms(
  centerId: string,
  to: string,
  message: string,
  kind: SmsKind,
): Promise<CenterSendResult> {
  const charged = await prisma.centerProfile.updateMany({
    where: { id: centerId, smsBalance: { gt: 0 } },
    data: { smsBalance: { decrement: 1 } },
  });
  if (charged.count === 0) {
    return { ok: false, error: NO_BALANCE_ERROR, noBalance: true };
  }
  const res = await sendSms(to, message, kind, centerId);
  if (!res.ok) {
    // Refund — the message did not go out.
    await prisma.centerProfile
      .update({ where: { id: centerId }, data: { smsBalance: { increment: 1 } } })
      .catch(() => {});
  }
  return res;
}

/** Add credits to a center (grant or paid purchase) with a ledger row. */
export async function creditCenterSms(
  centerId: string,
  amount: number,
  kind: "GRANT" | "PURCHASE",
  note?: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.centerProfile.update({
      where: { id: centerId },
      data: { smsBalance: { increment: amount } },
    }),
    prisma.centerSmsCredit.create({
      data: { centerId, amount, kind, note: note ?? null },
    }),
  ]);
}

/** Usage/balance summary for the CRM SMS page. */
export async function getCenterSmsStats(centerId: string) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [center, sentTotal, sentMonth, credits, orders, recent] = await Promise.all([
    prisma.centerProfile.findUnique({ where: { id: centerId }, select: { smsBalance: true } }),
    prisma.smsLog.count({ where: { centerId, ok: true } }),
    prisma.smsLog.count({ where: { centerId, ok: true, createdAt: { gte: monthStart } } }),
    prisma.centerSmsCredit.findMany({
      where: { centerId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.centerSmsOrder.findMany({
      where: { centerId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.smsLog.findMany({
      where: { centerId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, phone: true, kind: true, ok: true, createdAt: true },
    }),
  ]);
  return {
    balance: center?.smsBalance ?? 0,
    sentTotal,
    sentMonth,
    credits,
    orders,
    recent,
  };
}
