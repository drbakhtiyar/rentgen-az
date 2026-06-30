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

export function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n - 1).trimEnd() + "…" : str;
}
