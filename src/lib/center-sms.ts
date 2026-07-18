import "server-only";
import { prisma } from "@/lib/db";
import { sendSms, type SmsKind, type SendSmsResult } from "@/lib/sms";
import { notifyUser } from "@/lib/notifications";

/**
 * CRM SMS credits. Center-serving SMSes (reminders, re-calls, invites,
 * campaigns) are paid from the center's smsBalance; the sender name stays
 * "rentgen.az" (extra branding for the platform). Platform SMSes (OTP, booking
 * notifications) do NOT touch the balance.
 */

export const NO_BALANCE_ERROR =
  "SMS balansınız bitib. CRM → SMS-lər bölməsindən paket alın.";

/** SMS packages offered to centers (qty → AZN). */
export const SMS_PACKAGES: { qty: number; price: number }[] = [
  { qty: 1000, price: 60 },
  { qty: 5000, price: 280 },
  { qty: 10000, price: 500 },
];

/** Kept for the platform: centers can't buy the provider pool below this. */
export const ADMIN_SMS_RESERVE = 1000;
/** A center gets a low-balance warning when it drops to this. */
export const CENTER_SMS_WARN_AT = 500;

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
  } else {
    // Low-balance warning exactly when the counter crosses the threshold
    // (single decrements → fires once). Platform-paid, never charged.
    warnIfLow(centerId).catch(() => {});
  }
  return res;
}

async function warnIfLow(centerId: string): Promise<void> {
  const c = await prisma.centerProfile.findUnique({
    where: { id: centerId },
    select: { smsBalance: true, phone: true, name: true, userId: true },
  });
  if (!c || c.smsBalance !== CENTER_SMS_WARN_AT) return;
  await sendSms(
    c.phone,
    `rentgen.az: SMS balansınız azalır — ${CENTER_SMS_WARN_AT} SMS qalıb. Fasiləsiz xatırlatma/kampaniya üçün CRM-də yeni paket alın.`,
    "other",
  ).catch(() => {});
  await notifyUser(
    c.userId,
    "STATUS_UPDATE",
    "SMS balansı azalır",
    `${CENTER_SMS_WARN_AT} SMS qalıb. CRM → SMS-lər bölməsindən yeni paket ala bilərsiniz.`,
    "/crm/sms",
  ).catch(() => {});
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
