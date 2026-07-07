import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price?: number | null, priceTo?: number | null) {
  if (price == null) return "Qiymət üçün soruşun";
  if (priceTo != null && priceTo > price) return `${price}–${priceTo} ₼`;
  return `${price} ₼`;
}

const AZ_MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avqust",
  "sentyabr",
  "oktyabr",
  "noyabr",
  "dekabr",
];

export function formatDateAz(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Date + time in Azerbaijan timezone, e.g. "6 iyul 2026, 14:30". */
export function formatDateTimeAz(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const t = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Baku",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
  return `${formatDateAz(d)}, ${t}`;
}

export function slugify(input: string): string {
  const map: Record<string, string> = {
    ə: "e",
    ı: "i",
    ö: "o",
    ü: "u",
    ç: "c",
    ş: "s",
    ğ: "g",
    Ə: "e",
    İ: "i",
    I: "i",
    Ö: "o",
    Ü: "u",
    Ç: "c",
    Ş: "s",
    Ğ: "g",
  };
  return input
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Doctor's display name with a "Dr." prefix (avoids doubling if already present). */
export function doctorName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const full = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (!full) return "Həkim";
  return /^dr\.?\s/i.test(full) ? full : `Dr. ${full}`;
}

export function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n - 1).trimEnd() + "…" : str;
}
