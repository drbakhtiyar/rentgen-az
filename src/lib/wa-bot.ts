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
- QISA yaz: WhatsApp mesajıdır — maksimum 2-4 cümlə (nömrəli menyu istisnadır). Formatlama (ulduz, başlıq) işlətmə.
- Yazan azərbaycanca yazırsa AZ, rusca yazırsa RU cavab ver.
- HEÇ VAXT uydurma: qiymət vəd etmə, endirim danışma, hesaba-özəl rəqəm (balans, ödəniş) demə.
- Tibbi məsləhət VERMƏ — sən yalnız platforma haqqında danışırsan.
- Pul/müqavilə/şikayət mövzusunda və ya əmin olmadığında: "Bu sualı operatorumuz cavablandıracaq, qısa zamanda sizinlə əlaqə saxlanılacaq" de.
- "Operator", "canlı insan", "zəng edin" istəyəndə eyni cavabı ver və mövzunu bağla.
- Kobudluğa nəzakətlə cavab ver, mübahisəyə girmə.
- TERMİNOLOGİYA: "kart" sözü yalnız saytdakı profil səhifəsi mənasında işlənir ("kartınız" = rentgen.az-dakı səhifəniz). Mərkəzin ÖZÜ haqqında soruşanda "mərkəziniz" / "klinikanız" de — "kartınız hansı şəhərdədir?" kimi ifadələr SƏHVDİR, düzü: "Klinikanız (mərkəziniz) hansı şəhərdədir və adı nədir?".

MENYU QAYDASI (pozulmaz!):
- Defislə ("-") və ya ulduzla siyahı yazmaq QADAĞANDIR. İstifadəçiyə seçim / variant / istiqamət təklif etdiyin HƏR yerdə bəndlər MÜTLƏQ nömrəli olmalıdır: 1. 2. 3. — və mesaj "Sadəcə nömrəni yazın." cümləsi ilə bitməlidir. Bu, ara-suallara da aiddir (məs. "Mərkəziniz var, yoxsa müayinə axtarırsınız?" tipli sual da nömrəli variantlarla verilməlidir).
- Salamlaşmaya və ya qeyri-müəyyən müraciətə ("salam", "məlumat almaq istəyirəm", "kömək lazımdır") cavabında MÜTLƏQ bu standart menyunu göstər:
  1. Platformaya qeydiyyat
  2. Kartı doldurmaq (qiymət, foto, məlumat)
  3. Kabinetə giriş
  4. Pasiyent sorğuları
  5. Paketlər və digər suallar
  Sadəcə nömrəni yazın.
- İstifadəçi cavab olaraq YALNIZ RƏQƏM yazsa (məs. "1" və ya "3"), bunu sənin ƏVVƏLKİ mesajındakı həmin nömrəli bəndin seçimi kimi qəbul et və birbaşa o mövzunu cavabla — "nə demək istəyirsiniz?" soruşma.

MƏLUMAT TOPLAMA (operatora ötürməzdən ƏVVƏL — pozulmaz!):
- Sən pedantlı, diqqətli qəbul işçisi kimi düşün: sorğunu emal etmək üçün NƏ LAZIMDIRSA, ONU SORUŞMADAN "qeyd etdim" DEMƏ.
- İstənilən dəyişiklik / problem müraciətində (nömrə dəyişməsi, məlumat düzəlişi, silinmə, giriş problemi) MÜTLƏQ bilməlisən:
  1. Hansı klinika/mərkəz? (adı + şəhəri)
  2. Dəyişiklikdirsə: köhnə dəyər nədir, yenisi nədir?
- Kontekstdə "YAZAN MƏRKƏZ" məlumatı VARSA (nömrədən tanınıb), adı yenidən soruşma — TƏSDİQLƏ: "Siz [ad] mərkəzini təmsil edirsiniz, düzdür?" Kontekst YOXDURSA, klinika adı + şəhəri soruşmadan irəli getmə.
- Yekun mesajda topladıqlarını TƏKRAR ET ki, yanlışlıq üzə çıxsın: "Qeyd etdim: [Klinika adı] ([şəhər]) — köhnə nömrə ..., yeni nömrə ... Operator təsdiqləyib əlaqə saxlayacaq."
- Natamam məlumatla operatora ötürmə — əskik hissəni soruş.

NÜMUNƏ DİALOQ (dəyişiklik müraciətində MƏHZ BELƏ davran — addım-addım, hər mesajda BİR sual):
İstifadəçi: "mərkəzin nömrəsi dəyişib, yenisini necə əlavə edim?"
Bot: "Kömək edim! Əvvəlcə klinikanızın adını və şəhərini yazın (məs: Bakı, ABC Klinika)."
İstifadəçi: "Bakı, ABC Klinika"
Bot: "Təşəkkürlər! İndi köhnə nömrəni və yeni MOBİL nömrəni yazın (yeni nömrə 050/055/070... ilə başlamalıdır — SMS kod yalnız mobilə gedir)."
İstifadəçi: "köhnə 0124997654, yeni 0504300000"
Bot: "Qeyd etdim: ABC Klinika (Bakı) — köhnə nömrə 0124997654, yeni nömrə 0504300000. Operatorumuz təsdiqləyib sizinlə əlaqə saxlayacaq."
⚠️ Bütün bu addımlar tamamlanmayıb DATA ƏLİNDƏ DEYİLSƏ, "qeyd etdim" / "operator əlaqə saxlayacaq" DEMƏK QADAĞANDIR — əvvəl soruş.

MƏRKƏZ ADI YALNIZ BAZADAN (pozulmaz!):
- Mərkəzin adını təsdiqləyəndə YALNIZ kontekstdəki "MƏRKƏZ AD AXTARIŞI" blokundakı adlardan istifadə et — adı OLDUĞU KİMİ, dəyişmədən yaz. İstifadəçinin yazdığı adı sistem adı kimi TƏQDİM ETMƏ, ad UYDURMA.
- İstifadəçi ad çəkib, amma "MƏRKƏZ AD AXTARIŞI" bloku YOXDURSA və ya uyğun deyilsə — dəyişiklik/giriş axınına DAVAM ETMƏ (sistemdə olmayan mərkəzin nömrəsini dəyişmək mənasızdır). Bunu de:
  "Bu adla mərkəz sistemimizdə tapılmadı. Nömrə dəyişikliyi üçün əvvəl mərkəzinizi tapmalıyıq:
  1. Adı bir az fərqli / tam yazın
  2. rentgen.az-da mərkəzinizin səhifəsini açıb LİNKİNİ bura göndərin
  3. Mərkəziniz saytda hələ yoxdursa — sizi yeni mərkəz kimi qeydə alaq (\"yeni\" yazın)
  Sadəcə nömrəni yazın."
- İstifadəçi rentgen.az/rentgen-merkezleri/... linki göndərsə, kontekstdəki axtarış nəticəsi həmin mərkəzi dəqiq göstərəcək — onunla davam et.

PAROL YOXDUR:
- Sistemdə parol ANLAYIŞI YOXDUR — giriş yalnız telefon + SMS kod ilədir. Heç vaxt "parolumu unutdum" bəndi təklif etmə, parol sıfırlama danışma. Parol soruşana de: "Bizdə parol yoxdur — kartdakı mobil nömrə + SMS kod ilə girirsiniz."

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

/** "smile bextiyar" ~ "Smile by Dr.Bakhtiyar" — diakritik + translit fold. */
function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/ə/g, "e").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ç/g, "c")
    .replace(/ö/g, "o").replace(/ü/g, "u").replace(/ğ/g, "g")
    // ingiliscə transliterasiyalar → AZ qarşılığı (Bakhtiyar→Baxtiyar, Shafa→Safa)
    .replace(/kh/g, "x").replace(/sh/g, "s").replace(/ch/g, "c").replace(/gh/g, "g");
}

/** Kiçik Levenshtein — yazı səhvinə dözümlü ad-uyğunluğu üçün. */
function lev(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return dp[a.length][b.length];
}

/** Token ad-sözlərindən birinə uyğundurmu (daxilolma və ya ≤tol məsafə). */
function tokenMatches(token: string, nameFold: string, nameWords: string[]): boolean {
  if (nameFold.includes(token)) return true;
  const tol = token.length >= 8 ? 2 : 1;
  return nameWords.some((w) => lev(w, token) <= tol);
}

// Ad OLMAYAN köməkçi sözlərin kökləri — prefiks yoxlaması ilə süzülür
// ("merkezin", "nomresini", "deyishmek" kimi hallanmış formaları da tutsun).
const LOOKUP_STOP_ROOTS = [
  "salam", "klinik", "merkez", "nomre", "yeni", "kohne", "baki", "sumqayit",
  "gence", "dis", "dental", "tibb", "istey", "deyis", "elave", "etmek", "edim",
  "edin", "eded", "olar", "gonder", "yazin", "yazmaq", "zeng", "qiymet",
  "xidmet", "sekil", "foto", "kabinet", "giris", "sistem", "sayt", "rentgen",
  "problem", "kod", "sms", "mobil", "necə", "nece", "lazim", "haqqinda",
  "bilm", "kömek", "komek", "hansi", "bura", "sizin", "bizim", "melumat",
  "almaq", "verin", "vermek", "tesekkur", "teshekkur", "sagol", "xeyr", "beli",
  "cavab", "sual", "amma", "ancaq", "sonra", "evvel", "zehmet", "olmasa",
];
const isStopword = (w: string) => LOOKUP_STOP_ROOTS.some((r) => w.startsWith(r));

/**
 * İstifadəçinin yazdığı (çox vaxt natamam/səhv) mərkəz adını BAZADA axtarır və
 * nəticəni botun kontekstinə verir — bot tam rəsmi adı təsdiqlədə bilsin,
 * yanlış mərkəzə dəyişiklik düşməsin (istifadəçi istəyi, 2026-08-11).
 */
async function nameLookupContext(texts: string[]): Promise<string> {
  // İstifadəçi mərkəz səhifəsinin LİNKİNİ göndəribsə — slug ilə DƏQİQ tanıma
  const slugMatch = texts.join(" ").match(/rentgen-merkezleri\/([a-z0-9-]+)/);
  if (slugMatch) {
    const c = await prisma.centerProfile
      .findUnique({ where: { slug: slugMatch[1] }, select: { name: true, city: true, status: true } })
      .catch(() => null);
    if (c) {
      return [
        "MƏRKƏZ AD AXTARIŞI (istifadəçinin göndərdiyi LİNKDƏN dəqiq tapıldı):",
        `1. "${c.name}"${c.city ? ` (${c.city})` : ""}${c.status === "PENDING" ? " — hələ təsdiq gözləyir" : ""}`,
        "QAYDA: bu, dəqiq uyğunluqdur — adı OLDUĞU KİMİ işlədib davam et.",
      ].join("\n");
    }
  }
  const tokens = [
    ...new Set(
      texts
        .join(" ")
        .split(/[^a-zA-Zəıöüçşğa-яА-Я]+/)
        .map((w) => fold(w))
        .filter((w) => w.length >= 3 && !isStopword(w)),
    ),
  ];
  if (!tokens.length) return "";

  const centers = await prisma.centerProfile
    .findMany({
      where: { status: { in: ["APPROVED", "PENDING"] } },
      select: { name: true, city: true, status: true },
    })
    .catch(() => []);

  const scored = centers
    .map((c) => {
      const f = fold(c.name);
      const words = f.split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
      const hits = tokens.filter((t) => tokenMatches(t, f, words)).length;
      return { c, hits };
    })
    .filter((x) => x.hits >= Math.min(2, tokens.length))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 3);
  if (!scored.length) {
    return [
      `MƏRKƏZ AD AXTARIŞI: bazada "${tokens.join(" ")}" sözlərinə uyğun mərkəz TAPILMADI.`,
      "QAYDA: istifadəçi bu sözlərlə MƏRKƏZ ADI nəzərdə tutursa (dəyişiklik/giriş/kart istəyir), axına DAVAM ETMƏ və bu cavabı ver:",
      '"Bu adla mərkəz sistemimizdə tapılmadı. Davam etmək üçün:',
      "1. Adı bir az fərqli / tam yazın",
      "2. rentgen.az-da mərkəzinizin səhifəsini açıb linkini bura göndərin",
      '3. Mərkəziniz saytda hələ yoxdursa — yeni mərkəz kimi qeydə alaq ("yeni" yazın)',
      'Sadəcə nömrəni yazın."',
      "(Sözlər adi söhbət sözləridirsə — mərkəz adı deyilsə — bu bloku nəzərə alma, suala normal cavab ver.)",
    ].join("\n");
  }

  return [
    "MƏRKƏZ AD AXTARIŞI (bazadan — istifadəçinin yazdığı ada ən uyğun mərkəzlər):",
    ...scored.map(
      (x, i) => `${i + 1}. "${x.c.name}"${x.c.city ? ` (${x.c.city})` : ""}${x.c.status === "PENDING" ? " — hələ təsdiq gözləyir" : ""}`,
    ),
    "QAYDA: istifadəçi mərkəz adı çəkibsə, TAM RƏSMİ adı bu siyahıdan təsdiqlə:",
    '- 1 uyğunluq → "Sistemdə tam adı belədir: \\"...\\" (şəhər). Sizin klinikanız budur? 1. Bəli 2. Xeyr — Sadəcə nömrəni yazın." de və təsdiq AL.',
    "- Bir neçə uyğunluq → nömrəli siyahı göstər, hansının olduğunu soruş.",
    "- Yekun qeyddə mərkəzin adını MƏHZ bazadakı tam formada yaz. Adı QISALTMA, DƏYİŞMƏ, tərcümə ETMƏ.",
    "Bu siyahı BOŞDURSA və ya uyğun deyilsə: \"bu adla mərkəz tapa bilmədim — adı bir az fərqli yazın\" de; istifadəçi israr etsə operatora ötür.",
  ].join("\n");
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
  const recentUser = history.filter((h) => h.role === "user").slice(-2).map((h) => h.content);
  const [knowledge, ctx, lookup] = await Promise.all([
    buildKnowledge(),
    centerContext(fromPhone),
    nameLookupContext([...recentUser, text]),
  ]);
  const system = [HARD_RULES, knowledge, ctx, lookup].filter(Boolean).join("\n\n---\n\n");
  const msgs: AiMsg[] = [...history.slice(-10), { role: "user", content: text.slice(0, 1500) }];
  const res = await askClaude(system, msgs, 600, "sonnet");
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
  const [knowledge, ctx, lookup] = await Promise.all([
    buildKnowledge(),
    simulatePhone ? centerContext(simulatePhone) : Promise.resolve(""),
    nameLookupContext([question]),
  ]);
  const system = [HARD_RULES, knowledge, ctx, lookup].filter(Boolean).join("\n\n---\n\n");
  const res = await askClaude(system, [{ role: "user", content: question.slice(0, 1500) }], 600, "sonnet");
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
