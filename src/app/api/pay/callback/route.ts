import { NextRequest, NextResponse } from "next/server";
import { SITE_URL } from "@/lib/env";
import { verifyAndSettlePayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

/**
 * Payriff sends a server POST here after payment, then the browser is
 * redirected here (GET). Both verify the payment straight from Payriff
 * (verifyAndSettlePayment → GET /orders/:id) — the callback body is never
 * trusted. `p` = our Payment id.
 */

async function settle(paymentId: string | null): Promise<boolean> {
  if (!paymentId) return false;
  const res = await verifyAndSettlePayment(paymentId).catch(() => ({ paid: false }));
  return res.paid;
}

// Server-to-server callback.
export async function POST(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("p");
  const paid = await settle(paymentId);
  return NextResponse.json({ ok: paid });
}

// Browser return → verify + redirect to the result page.
export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("p");
  const paid = await settle(paymentId);
  return NextResponse.redirect(`${SITE_URL}/odenis/netice?ok=${paid ? "1" : "0"}`);
}
