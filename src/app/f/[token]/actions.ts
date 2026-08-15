"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logTokenSave } from "@/lib/link-visit";
import { resolveFaqToken } from "@/lib/price-invite";
import { CENTER_FAQ_KEYS } from "@/content/center-faq";
import { headers } from "next/headers";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export type FaqSaveState = { ok: boolean; error?: string; saved?: number };

/**
 * Tokenli FAQ formu — girişsiz (/q qiymət formu ilə eyni token və eyni məntiq:
 * linki mərkəzin öz nömrəsinə biz göndəririk → token sahibliyi kimliyi sübut
 * edir). Yalnız HƏMİN mərkəzin faqAnswers-i yazılır; boş buraxılan sahə köhnə
 * cavabı SİLMİR (data itkisinə qarşı) — yalnız dolu sahələr üstünə yazılır.
 */
export async function saveFaqAction(input: {
  token: string;
  answers: Record<string, string>;
}): Promise<FaqSaveState> {
  // Yazma spamının qarşısı (2026-08-14 auditi)
  const rl = await rateLimit("token:save", clientIp({ headers: await headers() }), 30, 3600);
  if (!rl.allowed) return { ok: false, error: "Çox sayda cəhd. Bir azdan yenidən yoxlayın." };
  const target = await resolveFaqToken(input.token).catch(() => null);
  if (!target) return { ok: false, error: "Bu link artıq keçərli deyil." };

  const filled: Record<string, string> = {};
  for (const key of CENTER_FAQ_KEYS) {
    const v = input.answers[key];
    if (typeof v === "string" && v.trim()) filled[key] = v.trim().slice(0, 500);
  }
  if (!Object.keys(filled).length)
    return { ok: false, error: "Ən azı bir suala cavab yazın." };

  try {
    await prisma.centerProfile.update({
      where: { id: target.centerId },
      data: { faqAnswers: { ...target.answers, ...filled } },
    });
    // İz: mərkəz özü yazdı (adminId yoxdur).
    await prisma.adminActionLog
      .create({
        data: {
          action: "center:faq_self",
          targetType: "CenterProfile",
          targetId: target.centerId,
          meta: { via: "f-link", count: Object.keys(filled).length },
        },
      })
      .catch(() => null);
    await logTokenSave(target.centerId, "f");
    revalidatePath(`/rentgen-merkezleri/${target.slug}`);
    return { ok: true, saved: Object.keys(filled).length };
  } catch {
    return { ok: false, error: "Texniki xəta. Yenidən cəhd edin." };
  }
}
