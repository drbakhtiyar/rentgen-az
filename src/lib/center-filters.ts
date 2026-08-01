import { Prisma } from "@/generated/prisma/client";
import type { CenterStatus } from "@/generated/prisma/enums";

/** Data-completeness quick-filter keys shared by the admin & operator center lists. */
export type HasKey = "phone" | "photo" | "rating" | "hours";

export const HAS_FILTERS: { key: HasKey; label: string }[] = [
  { key: "phone", label: "📞 Telefonlu" },
  { key: "photo", label: "🖼 Şəkilli" },
  { key: "rating", label: "⭐ Reytinqli" },
  { key: "hours", label: "🕐 Saatlı" },
];

export const HAS_WHERE: Record<HasKey, Prisma.CenterProfileWhereInput> = {
  phone: { phone: { not: "" } },
  photo: { images: { isEmpty: false } },
  rating: { googleRating: { not: null } },
  hours: { NOT: { hours: { equals: Prisma.DbNull } } },
};

/** Data-completeness score 0–5 — surfaces the richest listings first. */
export function completeness(c: {
  phone: string;
  images: string[];
  googleRating: number | null;
  hours: unknown;
  workingHours: string | null;
  address: string | null;
}): number {
  let s = 0;
  if (c.phone && c.phone.trim() !== "") s++;
  if (c.images && c.images.length > 0) s++;
  if (c.googleRating != null) s++;
  if (c.hours != null || (c.workingHours && c.workingHours.trim() !== "")) s++;
  if (c.address && c.address.trim() !== "") s++;
  return s;
}

/** Parse the comma-separated `has` query param into valid HasKeys. */
export function parseHas(raw: string | undefined): HasKey[] {
  return (raw ?? "")
    .split(",")
    .filter((k): k is HasKey => HAS_FILTERS.some((f) => f.key === k));
}

/** Status + free-text search where-clause (shared). */
export function baseWhere(
  status: CenterStatus | undefined,
  q: string | undefined,
): Prisma.CenterProfileWhereInput {
  const where: Prisma.CenterProfileWhereInput = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { city: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}
