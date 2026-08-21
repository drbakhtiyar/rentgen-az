/**
 * Xidmət səhifələri üçün dolğun SEO kontenti generasiyası (2026-08-21,
 * istifadəçi prioriteti): generik şablon mətnləri səthi idi — hər xidmət üçün
 * xidmətə-xas, tibbi cəhətdən dəqiq AZ+RU mətn Claude API ilə yazılır.
 * Nəticə: src/content/services-generated.json (slug → {az, ru}).
 * Resume dəstəyi: mövcud slug-lar ötürülür — skripti təkrar işə salmaq təhlükəsizdir.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { readFileSync, writeFileSync, existsSync } from "fs";

const OUT = "src/content/services-generated.json";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }) });
const API_KEY = process.env.ANTHROPIC_API_KEY!;
if (!API_KEY) throw new Error("ANTHROPIC_API_KEY yoxdur");

type SC = {
  metaTitle: string; metaDescription: string; keywords: string[];
  intro: string; sections: { heading: string; body: string }[];
  benefits: string[]; whenNeeded: string[];
  faq: { question: string; answer: string }[];
};

const store: Record<string, { az: SC; ru: SC }> = existsSync(OUT)
  ? JSON.parse(readFileSync(OUT, "utf8"))
  : {};

const SYSTEM = `Sən Azərbaycanda tibbi görüntüləmə marketpleysi rentgen.az üçün tibbi məzmun redaktorusan. Verilən müayinə/xidmət üçün pasiyentə yönəlik, tibbi cəhətdən DƏQİQ, dolğun və son dərəcə aydın mətn yazırsan.

QAYDALAR:
- Yalnız etibarlı, ümumi qəbul olunmuş tibbi bilik; UYDURMA fakt, rəqəm, doza, qiymət YAZMA. Şüalanma barədə keyfiyyət xarakterli düzgün ifadələr ("aşağı doza", "şüalanma yoxdur" — yalnız doğru olduqda).
- Sadə, savadlı Azərbaycan dili (rusca variantda təbii rus dili). Tibbi terminlər ilk dəfə mötərizədə izah olunur.
- Qiymət bölməsində konkret rəqəm yazma — səhifədə real qiymətlər dinamik göstərilir.
- "benefits" xidmətin/müayinənin özünün üstünlükləridir (platformanın yox!).
- FAQ cavabları konkret və faydalı olsun; şüalanma/təhlükəsizlik, hazırlıq, müddət, nəticələrin alınması kimi real suallar.
- JSON-dan kənar heç nə yazma.

Cavab YALNIZ bu JSON strukturu (hər iki dil):
{"az": {"metaTitle": "...(<60 simvol, sonda ' | Rentgen.az')", "metaDescription": "...(140-160 simvol)", "keywords": ["5-7 açar söz"], "intro": "...(2-3 cümlə, xidmətin mahiyyəti)", "sections": [{"heading": "<Ad> nədir?", "body": "...(3-5 cümlə, dolğun izah: nə göstərir, hansı üsulla işləyir)"}, {"heading": "Müayinə necə aparılır?", "body": "...(3-5 cümlə: proses addım-addım, nə qədər çəkir, ağrılı olub-olmaması)"}, {"heading": "Hansı hallarda təyin olunur?", "body": "...(3-4 cümlə: klinik göstərişlər, hansı xəstəlik/vəziyyətləri aşkarlayır)"}, {"heading": "Bakıda <ad> qiyməti", "body": "...(2-3 cümlə: qiymətin nədən asılı olduğu + Rentgen.az-da müqayisə imkanı)"}], "benefits": ["4 bənd — müayinənin özünün üstünlükləri"], "whenNeeded": ["4-5 bənd — konkret göstərişlər"], "faq": [{"question": "...", "answer": "...(2-3 cümlə)"}, {"question": "...", "answer": "..."}, {"question": "...", "answer": "..."}, {"question": "...", "answer": "..."}]}, "ru": {...eyni struktur rusca, başlıqlar: "Что такое <название>?", "Как проходит исследование?", "Когда назначается?", "Цена <название> в Баку"}}`;

async function gen(name: string, nameRu: string, category: string | null): Promise<{ az: SC; ru: SC } | null> {
  const user = `Xidmət: ${name}\nRusca adı: ${nameRu}\nKateqoriya: ${category ?? "—"}\n\nBu xidmət üçün tam JSON kontenti yaz.`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-opus-5",
          max_tokens: 6000,
          system: SYSTEM,
          messages: [{ role: "user", content: user }],
        }),
      });
      if (!res.ok) { console.error("API", res.status, await res.text().catch(() => "")); continue; }
      const data = (await res.json()) as { content?: { type: string; text?: string }[]; usage?: unknown };
      const text = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text).join("");
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) continue;
      const obj = JSON.parse(m[0]);
      if (obj?.az?.sections?.length >= 3 && obj?.ru?.sections?.length >= 3 && obj.az.faq?.length >= 3) return obj;
    } catch (e) {
      console.error("cəhd", attempt, (e as Error).message);
    }
  }
  return null;
}

// RU adları üçün services-ru xəritəsi
import { serviceNameRu } from "../src/content/services-ru";

const services = await prisma.service.findMany({
  where: { isActive: true },
  select: { slug: true, name: true, category: true },
  orderBy: { name: "asc" },
});
console.log("Aktiv xidmət:", services.length, "| hazır:", Object.keys(store).length);

const queue = services.filter((s) => !store[s.slug]);
let done = 0;
const CONCURRENCY = 5;
async function worker() {
  while (queue.length) {
    const s = queue.shift()!;
    const out = await gen(s.name, serviceNameRu(s.name), s.category);
    if (out) {
      store[s.slug] = out;
      writeFileSync(OUT, JSON.stringify(store, null, 1));
      done++;
      console.log(`✓ ${Object.keys(store).length}/${services.length} ${s.name}`);
    } else {
      console.error("✗ ALINMADI:", s.slug);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log("BİTDİ. Cəmi:", Object.keys(store).length);
await prisma.$disconnect();
