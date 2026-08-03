import "server-only";
import { prisma } from "@/lib/db";
import { askClaude, type AiMsg } from "@/lib/ai-assistant";

/**
 * WhatsApp botunun "beyni".
 *
 * Bilik bazası `BotSection` cədvəlindədir və admin `/admin/bot` səhifəsindən
 * redaktə edir — kod dəyişikliyi olmadan. Sistem promptu üç qatdan yığılır:
 *   1. SƏRT QAYDALAR (kodda — admin dəyişə bilməz; təhlükəsizlik bunlardadır)
 *   2. Aktiv BotSection-lar (sıra ilə) — platformanın izahı, üstünlüklər və s.
 *   3. Yazan mərkəzin ÖZ kart vəziyyəti (nömrə bazadan tanınır) — fərdi cavab
 */

/** Admin tərəfindən DƏYİŞDİRİLƏ BİLMƏYƏN qaydalar. */
const HARD_RULES = `Sən rentgen.az platformasının WhatsApp köməkçisisən. Sənə tibb mərkəzləri və klinikalar yazır.

DƏYİŞMƏZ QAYDALAR:
- Özünü təqdim et: rentgen.az-ın avtomatik köməkçisisən; istəyəndə operatora yönləndirə bilərsən.
- QISA yaz: WhatsApp mesajıdır — maksimum 2-4 cümlə. Formatlama (ulduz, başlıq) işlətmə.
- Yazan azərbaycanca yazırsa AZ, rusca yazırsa RU cavab ver.
- HEÇ VAXT uydurma: qiymət vəd etmə, endirim danışma, hesaba-özəl rəqəm (balans, ödəniş) demə.
- Tibbi məsləhət VERMƏ — sən yalnız platforma haqqında danışırsan.
- Pul/müqavilə/şikayət mövzusunda və ya əmin olmadığında: "Bu sualı operatorumuz cavablandıracaq, qısa zamanda sizinlə əlaqə saxlanılacaq" de.
- "Operator", "canlı insan", "zəng edin" istəyəndə eyni cavabı ver və mövzunu bağla.
- Kobudluğa nəzakətlə cavab ver, mübahisəyə girmə.`;

/** Aktiv bölmələrdən prompt yığ (admin /admin/bot-da redaktə edir). */
export async function buildKnowledge(): Promise<string> {
  const sections = await prisma.botSection
    .findMany({ where: { isActive: true }, orderBy: { order: "asc" }, select: { title: true, content: true } })
    .catch(() => []);
  return sections.map((s) => `## ${s.title}\n${s.content.trim()}`).join("\n\n");
}

/** Yazan mərkəzin kart vəziyyəti — fərdi kontekst. */
async function centerContext(phone: string): Promise<string> {
  const digits = phone.replace(/\D/g, "").slice(-9);
  if (digits.length !== 9) return "";
  const c = await prisma.centerProfile
    .findFirst({
      where: { OR: [{ phone: { endsWith: digits } }, { whatsapp: { endsWith: digits } }, { landlinePhone: { endsWith: digits } }] },
      select: {
        name: true, slug: true, status: true, plan: true, priceToken: true,
        images: true, logoUrl: true, hours: true,
        services: { select: { price: true } },
      },
    })
    .catch(() => null);
  if (!c) return "";
  const priced = c.services.filter((s) => s.price != null).length;
  const lines = [
    `YAZAN MƏRKƏZ (nömrəsinə görə tanındı): ${c.name}`,
    `- Status: ${c.status === "APPROVED" ? "təsdiqlənib, saytda canlıdır (https://rentgen.az/rentgen-merkezleri/" + c.slug + ")" : c.status === "PENDING" ? "hələ təsdiq gözləyir (tezliklə yayımlanacaq)" : "deaktiv"}`,
    `- Paket: ${c.plan}`,
    `- Xidmət sayı: ${c.services.length}, qiyməti yazılan: ${priced}`,
    `- Şəkil: ${c.images.length > 0 ? "var" : "yoxdur"}, loqo: ${c.logoUrl ? "var" : "yoxdur"}, iş saatı: ${c.hours ? "var" : "yoxdur"}`,
  ];
  if (c.priceToken && priced === 0) {
    lines.push(`- Qiymət linki (soruşsalar bunu ver): https://rentgen.az/q/${c.priceToken}`);
  }
  lines.push(`Cavablarında bu məlumatdan istifadə et — mərkəzə ÖZ vəziyyətini konkret de (məs. "kartınızda qiymət hələ yazılmayıb").`);
  return lines.join("\n");
}

/** WhatsApp mesajına cavab. `history` — əvvəlki dövrələr (varsa). */
export async function answerWaMessage(
  fromPhone: string,
  text: string,
  history: AiMsg[] = [],
): Promise<{ ok: boolean; answer?: string; escalate?: boolean }> {
  const [knowledge, ctx] = await Promise.all([buildKnowledge(), centerContext(fromPhone)]);
  const system = [HARD_RULES, knowledge, ctx].filter(Boolean).join("\n\n---\n\n");
  const msgs: AiMsg[] = [...history.slice(-10), { role: "user", content: text.slice(0, 1500) }];
  const res = await askClaude(system, msgs, 400);
  if (!res.ok || !res.answer) return { ok: false };
  const escalate = /operator|əlaqə saxlanılacaq|оператор/i.test(res.answer);
  return { ok: true, answer: res.answer, escalate };
}

/** Admin test qutusu üçün — konkret nömrə kontekstini də simulyasiya edə bilir. */
export async function testBotAnswer(
  question: string,
  simulatePhone?: string,
): Promise<{ ok: boolean; answer?: string; error?: string; systemChars?: number }> {
  const [knowledge, ctx] = await Promise.all([
    buildKnowledge(),
    simulatePhone ? centerContext(simulatePhone) : Promise.resolve(""),
  ]);
  const system = [HARD_RULES, knowledge, ctx].filter(Boolean).join("\n\n---\n\n");
  const res = await askClaude(system, [{ role: "user", content: question.slice(0, 1500) }], 400);
  return { ...res, systemChars: system.length };
}

export { HARD_RULES };
