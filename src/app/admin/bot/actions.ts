"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { testBotAnswer } from "@/lib/wa-bot";

export type BotActionResult = { ok: boolean; error?: string; id?: string };

/** Bölmə yarat/yenilə. `id` boş → yeni. */
export async function saveBotSectionAction(input: {
  id?: string;
  title: string;
  content: string;
  order: number;
  isActive: boolean;
}): Promise<BotActionResult> {
  await requireRole("ADMIN");
  const title = input.title.trim().slice(0, 120);
  const content = input.content.trim().slice(0, 8000);
  if (!title || !content) return { ok: false, error: "Başlıq və mətn boş ola bilməz." };
  const order = Number.isFinite(input.order) ? Math.round(input.order) : 0;
  try {
    const row = input.id
      ? await prisma.botSection.update({
          where: { id: input.id },
          data: { title, content, order, isActive: input.isActive },
        })
      : await prisma.botSection.create({ data: { title, content, order, isActive: input.isActive } });
    revalidatePath("/admin/bot");
    return { ok: true, id: row.id };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

export async function deleteBotSectionAction(id: string): Promise<BotActionResult> {
  await requireRole("ADMIN");
  try {
    await prisma.botSection.delete({ where: { id } });
    revalidatePath("/admin/bot");
    return { ok: true };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

/** Test qutusu — cari bilik bazası ilə botun cavabını göstərir. */
export async function testBotAction(input: {
  question: string;
  simulatePhone?: string;
}): Promise<{ ok: boolean; answer?: string; error?: string; systemChars?: number }> {
  await requireRole("ADMIN");
  if (!input.question.trim()) return { ok: false, error: "Sual yazın." };
  return testBotAnswer(input.question.trim(), input.simulatePhone?.trim() || undefined);
}
