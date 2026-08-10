import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
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
- Kobudluğa nəzakətlə cavab ver, mübahisəyə girmə.

MENYU QAYDASI:
- Mövzu siyahısı təklif edəndə bəndləri HƏMİŞƏ NÖMRƏLƏ (1. 2. 3. …) və sonda yaz: "Sadəcə nömrəni yazın".
- İlk salamlama/istiqamətləndirmə menyusu standart olaraq belədir:
  1. Platformaya qeydiyyat
  2. Kartı doldurmaq (qiymət, foto, məlumat)
  3. Kabinetə giriş
  4. Pasiyent sorğuları
  5. Paketlər və digər suallar
- İstifadəçi cavab olaraq YALNIZ RƏQƏM yazsa (məs. "1" və ya "3"), bunu sənin ƏVVƏLKİ mesajındakı həmin nömrəli bəndin seçimi kimi qəbul et və birbaşa o mövzunu cavabla — "nə demək istəyirsiniz?" soruşma.

NÖMRƏ TANIMA (vacib!):
- Azərbaycanda MOBİL nömrələr bu prefikslərlə başlayır: 010, 050, 051, 055, 060, 070, 077, 099.
- ŞƏHƏR (stasionar) nömrələri isə 012 (Bakı), 018 (Sumqayıt), 022 (Gəncə), 02X/03X regional kodlarla başlayır — bunlara SMS GETMİR.
- Kimsə giriş/kabinet/OTP üçün nömrə yazanda ƏVVƏL prefiksinə bax: mobil deyilsə, QƏBUL ETMƏ — de ki: "Bu, şəhər nömrəsidir — SMS kodu şəhər nömrəsinə getmir. Zəhmət olmasa 050/055/070... ilə başlayan MOBİL nömrə yazın." Şəhər nömrəsini yalnız kartda ƏLAVƏ əlaqə nömrəsi kimi qeyd etmək olar — girişi açmaz.
- Nömrə/məlumat dəyişikliyini SƏN özün ETMİRSƏN və İCRA VƏDİ VERMƏ ("əlavə etdim", "1-2 saata hazır olacaq" demə) — düzgün cavab: "Qeyd etdim, komandaya ötürürəm — operator təsdiqləyib sizinlə əlaqə saxlayacaq."`;

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
  // Markdown → WhatsApp: **qalın** → *qalın*; başlıq işarələri silinir
  const answer = res.answer.replace(/\*\*(.+?)\*\*/g, "*$1*").replace(/^#+\s*/gm, "").trim();
  const escalate = /operator|əlaqə saxlanılacaq|оператор/i.test(answer);
  return { ok: true, answer, escalate };
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

/**
 * Bot sınaq səhifəsinin gizli tokeni — DB-siz, ADMIN_ACCESS_KEY-dən törədilir
 * (açar rotasiya olunsa link də dəyişir, bu qəsdəndir). Link: /bot-sinaq/<token>.
 */
export function botTestToken(): string {
  return createHash("sha256")
    .update(`bot-sinaq:${env.adminAccessKey}`)
    .digest("hex")
    .slice(0, 24);
}

export { HARD_RULES };
