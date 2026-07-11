"use server";

import { getActiveServices } from "@/lib/queries";

export type SymptomSuggestion = { slug: string; name: string };

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ə/g, "e").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ç/g, "c")
    .replace(/ğ/g, "g").replace(/ö/g, "o").replace(/ü/g, "u")
    .replace(/[^a-z0-9а-яё\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Symptom / complaint keywords → service hint keywords (matched against service name/category).
const RULES: { triggers: string[]; hints: string[] }[] = [
  { triggers: ["implant", "имплант", "dis eksik", "dis catmir", "protez"], hints: ["3d", "tomoqrafiya", "cbct", "klkt", "implant"] },
  { triggers: ["breket", "ortodont", "egri dis", "sira", "прикус", "брекет"], hints: ["sefalometrik", "ortodont", "panoramik"] },
  { triggers: ["cene", "gicgah", "oynaq", "eklem", "челюст"], hints: ["3d", "tomoqrafiya", "cbct", "panoramik"] },
  { triggers: ["20 yas", "agil disi", "gomulu", "batmis", "зуб мудрости", "ретиниров"], hints: ["panoramik", "3d", "tomoqrafiya"] },
  { triggers: ["agri", "curuk", "kanal", "боль", "кариес", "endodont", "kist", "sist", "iltihab"], hints: ["periapikal", "dis rentgeni", "panoramik", "rentgen"] },
  { triggers: ["umumi", "muayine", "baxis", "profilaktik", "осмотр"], hints: ["panoramik", "ortopantomo"] },
];

/**
 * Rule-based symptom -> service suggester. Returns up to 3 services matching the
 * complaint keywords (falls back to direct name match on the query tokens).
 */
export async function suggestServicesForSymptom(query: string): Promise<SymptomSuggestion[]> {
  const q = normalize(query);
  if (q.length < 2) return [];

  const hints = new Set<string>();
  for (const rule of RULES) {
    if (rule.triggers.some((tr) => q.includes(tr))) rule.hints.forEach((h) => hints.add(h));
  }
  // Fallback: use the query's own tokens as hints.
  if (hints.size === 0) q.split(" ").filter((w) => w.length >= 3).forEach((w) => hints.add(w));

  const services = await getActiveServices();
  const scored = services
    .map((s) => {
      const hay = normalize([s.name, s.shortName, s.category].filter(Boolean).join(" "));
      let score = 0;
      for (const h of hints) if (hay.includes(h)) score += 1;
      return { s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored.map((x) => ({ slug: x.s.slug, name: x.s.shortName ?? x.s.name }));
}
