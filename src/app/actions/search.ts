"use server";

import { getApprovedCenters } from "@/lib/queries";

export type SmartSearchResult = {
  slug: string;
  name: string;
  city: string | null;
  district: string | null;
  services: string[]; // matched service names (fallback: top services)
};

/** Diacritic-insensitive normaliser so "Nərimanov" ~ "nerimanov", "Şüşə" ~ "suse". */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ə/g, "e")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9а-яё\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Classic Levenshtein edit distance (small strings only). */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

/** Does a query token loosely match a single word (substring / prefix / small typo)? */
function wordMatches(token: string, word: string): boolean {
  if (!word) return false;
  if (word.includes(token)) return true; // "panoram" ⊂ "panoramik"
  if (token.length >= 4 && token.includes(word)) return true; // over-typed
  if (token.length >= 4) {
    // Fuzzy: compare the token to the equal-length prefix of the word.
    // "panaram" vs "panoram" (from "panoramik") → distance 1 → match.
    const prefix = word.slice(0, token.length);
    const allowed = token.length >= 6 ? 2 : 1;
    if (levenshtein(token, prefix) <= allowed) return true;
  }
  return false;
}

const words = (s: string | null | undefined) =>
  normalize(s ?? "").split(" ").filter(Boolean);

/**
 * Free-text "smart" search over approved centers. Scores each center by how well
 * the query tokens match its name, district/city and offered service names, then
 * returns the 3 closest matches. Open-ended — any direction of keywords works.
 */
export async function smartSearch(query: string): Promise<SmartSearchResult[]> {
  const q = normalize(query);
  if (q.length < 2) return [];
  const tokens = q.split(" ").filter((t) => t.length >= 2);
  if (!tokens.length) return [];

  const centers = await getApprovedCenters({ take: 500 });

  const scored = centers
    .map((c) => {
      const nameW = words(c.name);
      const cityW = words(c.city);
      const districtW = words(c.district);
      const extraW = words([c.address, c.equipment, c.description].filter(Boolean).join(" "));
      const serviceFields = c.services.map((cs) => ({
        name: cs.service.name,
        words: words([cs.service.name, cs.service.shortName, cs.service.category].filter(Boolean).join(" ")),
      }));

      let score = 0;
      let tokensHit = 0;
      const matched = new Set<string>();

      for (const token of tokens) {
        let hit = false;
        for (const sf of serviceFields) {
          if (sf.words.some((w) => wordMatches(token, w))) {
            score += 5;
            matched.add(sf.name);
            hit = true;
          }
        }
        if (cityW.some((w) => wordMatches(token, w))) { score += 4; hit = true; }
        if (districtW.some((w) => wordMatches(token, w))) { score += 4; hit = true; }
        if (nameW.some((w) => wordMatches(token, w))) { score += 3; hit = true; }
        if (extraW.some((w) => wordMatches(token, w))) { score += 1; hit = true; }
        if (hit) tokensHit++;
      }

      // Reward centers that satisfy every token the user typed.
      if (tokensHit === tokens.length && tokens.length > 1) score += 5;

      return { center: c, score, matched };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.center.name.localeCompare(b.center.name))
    .slice(0, 3);

  return scored.map((s) => ({
    slug: s.center.slug,
    name: s.center.name,
    city: s.center.city,
    district: s.center.district,
    services: s.matched.size
      ? [...s.matched].slice(0, 3)
      : s.center.services.slice(0, 2).map((cs) => cs.service.name),
  }));
}
