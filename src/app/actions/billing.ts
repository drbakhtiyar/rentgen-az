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
} from "@/lib/plans";
import type { Plan } from "@/generated/prisma/client";

export type BillingResult = {
  ok: boolean;
  error?: string;
  message?: string;
  paymentUrl?: string;
};

const PURCHASABLE: Plan[] = ["SILVER", "GOLD", "PLATINUM"];

/** Buy/renew a plan by spending wallet balance. Center & doctor only. */
export async function purchasePlanFromWalletAction(plan: Plan): Promise<BillingResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Giriş tələb olunur." };
  if (!PURCHASABLE.includes(plan)) return { ok: false, error: "Yanlış paket." };

  let price: number;
  if (user.role === "CENTER") price = CENTER_PLAN_PRICE[plan];
  else if (user.role === "DOCTOR") price = DOCTOR_PLAN_PRICE[plan];
  else return { ok: false, error: "Yalnız mərkəz və həkim paket ala bilər." };

  const res = await debitWallet(user.id, price, "PLAN", `${PLAN_LABEL[plan]} paketi`);
  if (!res.ok) {
    return { ok: false, error: "Balans kifayət etmir. Əvvəlcə balansı artırın." };
  }

  const until = new Date(Date.now() + PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000);
  if (user.role === "CENTER") {
    await prisma.centerProfile.update({
      where: { userId: user.id },
      data: { plan, planUntil: until },
    });
    revalidatePath("/merkez");
    revalidatePath("/merkez/paket");
    revalidatePath("/rentgen-merkezleri");
  } else {
    await prisma.doctorProfile.update({
      where: { userId: user.id },
      data: { plan, planUntil: until },
    });
    revalidatePath("/hekim");
    revalidatePath("/hekim/paket");
    revalidatePath("/hekimler");
  }
  return { ok: true, message: `${PLAN_LABEL[plan]} paketi ${PLAN_DURATION_DAYS} günlük aktivləşdi.` };
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
