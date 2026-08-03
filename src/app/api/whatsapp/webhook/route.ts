import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { answerWaMessage } from "@/lib/wa-bot";
import { sendWaText, waConfigured } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Meta Cloud API webhook — WhatsApp botu.
 *
 * GET  → Meta-nın birdəfəlik doğrulaması (hub.verify_token).
 * POST → gələn mesajlar: imza yoxlanır → bot cavabı → geri göndərilir.
 *
 * Söhbət tarixçəsi yazan nömrənin mərkəz sahibinin AdminThread-inə güzgülənir —
 * admin panelin Söhbətlər bölməsində hər şeyi görür və lazım olsa müdaxilə edir
 * (bot mesajları 🤖 prefiksi ilə). ENV qurulana qədər webhook passivdir.
 */

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ ok: false }, { status: 403 });
}

function validSignature(raw: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return false;
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const got = header.slice(7);
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(got, "hex"));
  } catch {
    return false;
  }
}

/** Söhbəti mərkəz sahibinin AdminThread-inə güzgülə (görünürlük üçün). */
async function mirror(phone: string, inbound: string, outbound: string | null) {
  try {
    const digits = phone.replace(/\D/g, "").slice(-9);
    const center = await prisma.centerProfile.findFirst({
      where: { OR: [{ phone: { endsWith: digits } }, { whatsapp: { endsWith: digits } }] },
      select: { userId: true },
    });
    if (!center) return;
    const thread = await prisma.adminThread.upsert({
      where: { userId: center.userId },
      create: { userId: center.userId },
      update: { lastMessageAt: new Date() },
    });
    await prisma.adminMessage.create({
      data: { threadId: thread.id, fromAdmin: false, content: `📲 WhatsApp: ${inbound.slice(0, 1500)}` },
    });
    if (outbound) {
      await prisma.adminMessage.create({
        data: { threadId: thread.id, fromAdmin: true, content: `🤖 ${outbound.slice(0, 1500)}` },
      });
    }
  } catch {
    /* güzgü ən yaxşı halda işləyir */
  }
}

export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  // Meta 200-ü tez istəyir; emalı cavabdan əvvəl edirik amma qısa saxlanır.
  try {
    const body = JSON.parse(raw) as {
      entry?: { changes?: { value?: { messages?: { from: string; type: string; text?: { body: string } }[] } }[] }[];
    };
    const msgs =
      body.entry?.flatMap((e) => e.changes ?? []).flatMap((c) => c.value?.messages ?? []) ?? [];
    for (const m of msgs.slice(0, 3)) {
      if (m.type !== "text" || !m.text?.body) continue;
      if (!waConfigured()) continue;
      const res = await answerWaMessage(m.from, m.text.body);
      if (res.ok && res.answer) {
        await sendWaText(m.from, res.answer);
        await mirror(m.from, m.text.body, res.answer);
      } else {
        await mirror(m.from, m.text.body, null);
      }
    }
  } catch (e) {
    console.error("[whatsapp webhook]", (e as Error).message);
  }
  return NextResponse.json({ ok: true });
}
