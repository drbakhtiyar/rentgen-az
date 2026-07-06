/**
 * Lightweight auto-moderation for review comments. Flags text containing
 * profanity / clearly unethical language so it goes to admin approval instead
 * of showing publicly right away. Curated, extensible — admins still moderate.
 */

// Normalize Azerbaijani letters + common leet substitutions to catch variants.
function normalize(text: string): string {
  const map: Record<string, string> = {
    ə: "e", ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
    "@": "a", "0": "o", "1": "i", "3": "e", "4": "a", $: "s",
  };
  return text
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-zа-я\s]/gi, " ");
}

// Profanity roots (normalized form). Matched as substrings of tokens so that
// suffixes/inflections are caught. Kept intentionally short + high-signal.
const BAD_ROOTS = [
  // Azerbaijani
  "sik", "sig", "amcik", "amciq", "pox", "got ver", "gotver", "yarrag",
  "yaraq", "qehbe", "kahba", "orospu", "oruspu", "pezeveng", "pezeveng",
  "dalyarag", "anan", "anavi", "bacini", "bacivi", "ferc", "goydum",
  "gicdillag", "gicdillaq", "kelbeti",
  // Russian
  "hui", "hyi", "pizd", "ebat", "eban", "blyad", "blyat", "suka", "muda",
  "pidor", "pidr", "gandon", "zaeb", "poshel ty",
  // English (light)
  "fuck", "shit", "bitch", "asshole",
];

/** True if the text likely contains profanity / unethical language. */
export function isFlagged(text: string | null | undefined): boolean {
  if (!text) return false;
  const norm = normalize(text);
  const tokens = norm.split(/\s+/).filter(Boolean);
  return BAD_ROOTS.some((root) => {
    if (root.includes(" ")) return norm.includes(root);
    return tokens.some((tok) => tok.includes(root));
  });
}
