"use server";

import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/** Submit a "Məlumat düzgün deyil?" report from a center's public FAQ block.
 *  Stored for the admin panel. Name/email optional; message required. */
export async function submitContentReportAction(input: {
  centerId?: string;
  name?: string;
  email?: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  // Spam qorunması: eyni IP-dən saatda 5 bildiriş kifayətdir.
  const rl = await rateLimit("public:report", clientIp({ headers: await headers() }), 5, 3600);
  if (!rl.allowed) return { ok: false, error: "Çox sayda göndəriş. Bir azdan cəhd edin." };
  const message = (input.message ?? "").trim().slice(0, 2000);
  if (message.length < 3) {
    return { ok: false, error: "Zəhmət olmasa problemi qısaca yazın." };
  }
  try {
    await prisma.contentReport.create({
      data: {
        centerId: input.centerId || null,
        name: (input.name ?? "").trim().slice(0, 120) || null,
        email: (input.email ?? "").trim().slice(0, 160) || null,
        message,
      },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Texniki xəta. Yenidən cəhd edin." };
  }
}
