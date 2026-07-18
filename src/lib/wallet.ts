import "server-only";
import { prisma } from "./db";

export type LedgerType = "TOPUP" | "PLAN" | "STORAGE" | "SMS" | "REFUND" | "ADMIN";

/** Ensure a wallet row exists for the user; returns it. */
export async function getOrCreateWallet(userId: string) {
  const existing = await prisma.wallet.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.wallet.create({ data: { userId } });
}

export async function getBalance(userId: string): Promise<number> {
  const w = await prisma.wallet.findUnique({ where: { userId }, select: { balance: true } });
  return w?.balance ?? 0;
}

/** Add funds (top-up / admin / refund). Amount in qəpik (> 0). */
export async function creditWallet(
  userId: string,
  amountMinor: number,
  type: LedgerType,
  note?: string,
): Promise<void> {
  const amount = Math.round(amountMinor);
  if (amount <= 0) return;
  const wallet = await getOrCreateWallet(userId);
  await prisma.$transaction([
    prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amount } } }),
    prisma.walletLedger.create({ data: { walletId: wallet.id, amount, type, note: note ?? null } }),
  ]);
}

/**
 * Spend from the wallet (plan purchase). Amount in qəpik (> 0).
 * Returns false if the balance is insufficient (no change made).
 */
export async function debitWallet(
  userId: string,
  amountMinor: number,
  type: LedgerType,
  note?: string,
): Promise<{ ok: boolean; balance: number }> {
  const amount = Math.round(amountMinor);
  const wallet = await getOrCreateWallet(userId);
  if (amount <= 0) return { ok: true, balance: wallet.balance };
  if (wallet.balance < amount) return { ok: false, balance: wallet.balance };
  const [updated] = await prisma.$transaction([
    prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: amount } } }),
    prisma.walletLedger.create({ data: { walletId: wallet.id, amount: -amount, type, note: note ?? null } }),
  ]);
  return { ok: true, balance: updated.balance };
}
