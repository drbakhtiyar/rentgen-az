"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { debitWallet } from "@/lib/wallet";
import { startPayment } from "@/lib/payments";
import { payriffConfigured } from "@/lib/payriff";
import {
  CENTER_PLAN_PRICE,
  DOCTOR_PLAN_PRICE,
  PLAN_DURATION_DAYS,
  PLAN_LABEL,
  MIN_MONTHS,
  MAX_MONTHS,
  priceForMonths,
} from "@/lib/plans";
import type { Plan } from "@/generated/prisma/client";

export type BillingResult = {
  ok: boolean;
  error?: string;
  message?: string;
  paymentUrl?: string;
};

const PURCHASABLE: Plan[] = ["SILVER", "GOLD", "PLATINUM"];

/** Buy/renew a plan for N months by spending wallet balance. Center & doctor only. */
export async function purchasePlanFromWalletAction(
  plan: Plan,
  months: number,
): Promise<BillingResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Giriş tələb olunur." };
  if (!PURCHASABLE.includes(plan)) return { ok: false, error: "Yanlış paket." };
  const m = Math.round(months);
  if (!Number.isFinite(m) || m < MIN_MONTHS || m > MAX_MONTHS) {
    return { ok: false, error: "Müddət 1–12 ay aralığında olmalıdır." };
  }

  const isCenter = user.role === "CENTER";
  const isDoctor = user.role === "DOCTOR";
  if (!isCenter && !isDoctor) return { ok: false, error: "Yalnız mərkəz və həkim paket ala bilər." };

  const base = isCenter ? CENTER_PLAN_PRICE[plan] : DOCTOR_PLAN_PRICE[plan];
  const price = priceForMonths(base, m);

  // Renew from the later of now / current expiry (early renewal adds time).
  const profile = isCenter
    ? await prisma.centerProfile.findUnique({ where: { userId: user.id }, select: { planUntil: true } })
    : await prisma.doctorProfile.findUnique({ where: { userId: user.id }, select: { planUntil: true } });
  const now = Date.now();
  const from = profile?.planUntil && profile.planUntil.getTime() > now ? profile.planUntil.getTime() : now;
  const until = new Date(from + m * PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const res = await debitWallet(user.id, price, "PLAN", `${PLAN_LABEL[plan]} paketi — ${m} ay`);
  if (!res.ok) {
    return { ok: false, error: "Balans kifayət etmir. Əvvəlcə balansı artırın." };
  }

  if (isCenter) {
    await prisma.centerProfile.update({ where: { userId: user.id }, data: { plan, planUntil: until } });
    revalidatePath("/merkez");
    revalidatePath("/merkez/paket");
    revalidatePath("/rentgen-merkezleri");
  } else {
    await prisma.doctorProfile.update({ where: { userId: user.id }, data: { plan, planUntil: until } });
    revalidatePath("/hekim");
    revalidatePath("/hekim/paket");
    revalidatePath("/hekimler");
  }
  return { ok: true, message: `${PLAN_LABEL[plan]} paketi ${m} ay aktivləşdi.` };
}

/** Start a Payriff top-up to add funds to the wallet. Amount in qəpik. */
export async function startWalletTopupAction(amountMinor: number): Promise<BillingResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Giriş tələb olunur." };
  if (user.role !== "CENTER" && user.role !== "DOCTOR") {
    return { ok: false, error: "İcazə yoxdur." };
  }
  const amount = Math.round(amountMinor);
  if (amount < 100) return { ok: false, error: "Minimum məbləğ 1 ₼." };
  if (!payriffConfigured()) {
    return { ok: false, error: "Ödəniş sistemi hələ aktiv deyil (Payriff konfiqurasiyası gözlənilir)." };
  }
  const res = await startPayment({
    userId: user.id,
    amountMinor: amount,
    purpose: "wallet_topup",
    description: "Balans artırma",
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, paymentUrl: res.paymentUrl };
}
