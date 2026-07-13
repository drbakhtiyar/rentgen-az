import "server-only";

/** Allowed chat attachment types (images + PDF). Matches /api/upload. */
export const CHAT_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export const CHAT_MAX_SIZE = 8 * 1024 * 1024; // 8 MB

/** Sanitize a user-supplied filename for use in a storage key. */
export function chatSafeName(name: string): string {
  return (name.split(/[\\/]/).pop() ?? "fayl")
    .replace(/[^\w.\-() ]+/g, "_")
    .slice(0, 180);
}

/** True if the stored reference is a legacy public URL (vs a private B2 key). */
export function isLegacyPublicUrl(ref: string): boolean {
  return /^https?:\/\//i.test(ref);
}
