/**
 * Helpers for the service catalog: auto-pick an icon and SEO-fill any fields
 * the admin leaves empty when creating/editing a service.
 */

import { slugify } from "./utils";

// Keyword → lucide icon name (must exist in ICON_REGISTRY in service-icon.tsx).
// Order matters: more specific keywords first.
const ICON_RULES: { kw: string[]; icon: string }[] = [
  { kw: ["panoramik", "opg", "ortopantomo"], icon: "PanelsTopLeft" },
  { kw: ["sefalometrik", "sefalo", "sefal"], icon: "Ruler" },
  { kw: ["cbct", "konus", "konus-şüalı"], icon: "ScanFace" },
  { kw: ["3d", "üçölçülü", "tomoqraf"], icon: "Box" },
  { kw: ["implant"], icon: "Layers" },
  { kw: ["ortodont"], icon: "AlignHorizontalDistributeCenter" },
  { kw: ["ağıl diş", "ağıl dişi", "20 yaş"], icon: "Bone" },
  { kw: ["sinus", "anatomi", "anatomiya"], icon: "Wind" },
  { kw: ["çənə", "sümük", "analiz"], icon: "Activity" },
  { kw: ["periapikal", "diş rentgen", "diş rentgeni"], icon: "ScanSearch" },
  { kw: ["kariyes", "iltihab"], icon: "ScanSearch" },
  { kw: ["beyin", "kəllə"], icon: "Brain" },
  { kw: ["biopsi", "mikroskop", "laborator"], icon: "Microscope" },
  { kw: ["ürək", "nəbz"], icon: "HeartPulse" },
  { kw: ["dental", "rentgen", "x-ray"], icon: "ScanLine" },
];

/** Pick the most fitting built-in icon for a service name. */
export function pickIconForName(name: string): string {
  const n = name.toLowerCase();
  for (const rule of ICON_RULES) {
    if (rule.kw.some((k) => n.includes(k))) return rule.icon;
  }
  return "ScanLine";
}

// Category inference from the name.
const CATEGORY_RULES: { kw: string[]; category: string }[] = [
  { kw: ["tomoqraf", "cbct", "3d", "konus", "üçölçülü"], category: "Tomoqrafiya" },
  { kw: ["analiz", "qiymətləndir", "ölçü", "laborator", "biopsi"], category: "Analiz" },
  { kw: ["rentgen", "opg", "panoramik", "sefalo", "periapikal", "x-ray"], category: "Rentgen" },
];

/** Infer a category from the name (fallback: "Digər"). */
export function autoCategory(name: string): string {
  const n = name.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.kw.some((k) => n.includes(k))) return rule.category;
  }
  return "Digər";
}

/** A short label for badges/cards. Trims a parenthetical, caps length. */
export function autoShortName(name: string): string {
  const base = name.replace(/\s*\(.*?\)\s*/g, " ").trim();
  return base.length > 24 ? name.trim() : base || name.trim();
}

/**
 * SEO-oriented short description for the catalog card / meta, generated from
 * the name when the admin doesn't provide one.
 */
export function autoDescription(name: string): string {
  const n = name.trim();
  return `Bakıda ${n.toLowerCase()} xidməti göstərən təsdiqlənmiş rentgen mərkəzləri. Qiymət, ünvan və əlaqə məlumatı bir platformada — Rentgen.az.`;
}

export type ServiceFormInput = {
  name: string;
  shortName?: string | null;
  description?: string | null;
  icon?: string | null;
  iconUrl?: string | null;
  category?: string | null;
  order?: number | null;
  featured?: boolean;
  isActive?: boolean;
};

/**
 * Fill in any empty fields with SEO-optimized auto-generated values.
 * Name is required; everything else is derived if blank.
 */
export function withAutoFill(input: ServiceFormInput) {
  const name = input.name.trim();
  const clean = (v?: string | null) => {
    const t = (v ?? "").trim();
    return t.length > 0 ? t : null;
  };
  return {
    name,
    slug: slugify(name),
    shortName: clean(input.shortName) ?? autoShortName(name),
    description: clean(input.description) ?? autoDescription(name),
    icon: clean(input.icon) ?? pickIconForName(name),
    iconUrl: clean(input.iconUrl),
    category: clean(input.category) ?? autoCategory(name),
    order: typeof input.order === "number" ? input.order : 0,
    featured: Boolean(input.featured),
    isActive: input.isActive ?? true,
  };
}
