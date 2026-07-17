import type { Plan } from "@/generated/prisma/client";

/** Ranking for search priority (higher shows first). */
export const PLAN_RANK: Record<Plan, number> = {
  FREE: 0,
  SILVER: 1,
  GOLD: 2,
  PLATINUM: 3,
};

export const PLAN_LABEL: Record<Plan, string> = {
  FREE: "Free",
  SILVER: "Silver",
  GOLD: "Gold",
  PLATINUM: "Platinum",
};

export const ALL_PLANS: Plan[] = ["FREE", "SILVER", "GOLD", "PLATINUM"];

/** Aylıq qiymət (qəpik). AZN × 100. */
export const CENTER_PLAN_PRICE: Record<Plan, number> = {
  FREE: 0,
  SILVER: 3900,
  GOLD: 9900,
  PLATINUM: 19800,
};

export const DOCTOR_PLAN_PRICE: Record<Plan, number> = {
  FREE: 0,
  SILVER: 1900,
  GOLD: 4900,
  PLATINUM: 9900,
};

/** Storage 10% qalanda xəbərdarlıq həddi (istifadə faizi). */
export const STORAGE_WARN_PCT = 90;

/** Platinum-da limitdən artıq hər 1 TB üçün əlavə haqq (qəpik). */
export const OVERAGE_PER_TB_MINOR = 2900;

/** Bir abunə ayının gün sayı. */
export const PLAN_DURATION_DAYS = 30;

/** İcazə verilən ödəniş müddəti (ay): min 1, max 12. */
export const MIN_MONTHS = 1;
export const MAX_MONTHS = 12;

/** Uzun müddətli ödənişdə endirim faizi (SaaS praktikası). */
export function monthsDiscountPct(months: number): number {
  if (months >= 12) return 20;
  if (months >= 6) return 10;
  if (months >= 3) return 5;
  return 0;
}

/** N ay üçün ümumi qiymət (qəpik), endirim tətbiq olunmuş. */
export function priceForMonths(baseMonthlyMinor: number, months: number): number {
  const m = Math.max(MIN_MONTHS, Math.min(MAX_MONTHS, Math.round(months)));
  const pct = monthsDiscountPct(m);
  return Math.round((baseMonthlyMinor * m * (100 - pct)) / 100);
}

/** Manatla göstərmək üçün: qəpik → "29 ₼". */
export const formatManat = (minor: number): string =>
  `${(minor / 100).toFixed(minor % 100 === 0 ? 0 : 2)} ₼`;

// ------------------------------ Centers ------------------------------

export type CenterPlanLimits = {
  photoLimit: number | null; // null = limitsiz
  storageGb: number;
  featured: boolean; // "Tövsiyə olunan" nişanı + axtarışda önə çıxma
  banner: boolean;
  basicAnalytics: boolean; // baxış/zəng/WhatsApp (Silver+)
  fullAnalytics: boolean; // xidmət üzrə bölgü + rəy/referral stat (Gold+)
  apiExport: boolean;
  prioritySupport: boolean;
  reviews: boolean; // rəy/reytinq qəbulu + göstərmə (Gold+)
  monthlyRequests: number | null; // aylıq pasiyent müraciəti limiti (null = limitsiz)
  receivesReferrals: boolean; // həkimlərdən pasiyent yönləndirməsi qəbulu (Gold+)
  broadcast: boolean; // əməkdaşlıq həkimlərinə toplu mesaj (Gold+)
  storageOverage: boolean; // limitdən artıq storage alına bilər (Platinum)
};

export const CENTER_PLAN_LIMITS: Record<Plan, CenterPlanLimits> = {
  FREE: { photoLimit: 5, storageGb: 30, featured: false, banner: false, basicAnalytics: false, fullAnalytics: false, apiExport: false, prioritySupport: false, reviews: false, monthlyRequests: 5, receivesReferrals: false, broadcast: false, storageOverage: false },
  SILVER: { photoLimit: 15, storageGb: 150, featured: false, banner: false, basicAnalytics: true, fullAnalytics: false, apiExport: false, prioritySupport: false, reviews: false, monthlyRequests: null, receivesReferrals: false, broadcast: false, storageOverage: false },
  GOLD: { photoLimit: 40, storageGb: 1024, featured: true, banner: false, basicAnalytics: true, fullAnalytics: true, apiExport: false, prioritySupport: true, reviews: true, monthlyRequests: null, receivesReferrals: true, broadcast: true, storageOverage: false },
  PLATINUM: { photoLimit: null, storageGb: 3072, featured: true, banner: true, basicAnalytics: true, fullAnalytics: true, apiExport: true, prioritySupport: true, reviews: true, monthlyRequests: null, receivesReferrals: true, broadcast: true, storageOverage: true },
};

// ------------------------------ Doctors ------------------------------

export type DoctorPlanLimits = {
  storageGb: number;
  portfolio: boolean;
  profileStats: boolean;
  topPlacement: boolean;
  branding: boolean;
  banner: boolean; // Platinum "tam brendinq" — profil banneri + vurğulanmış kart
  prioritySupport: boolean;
};

export const DOCTOR_PLAN_LIMITS: Record<Plan, DoctorPlanLimits> = {
  FREE: { storageGb: 20, portfolio: false, profileStats: false, topPlacement: false, branding: false, banner: false, prioritySupport: false },
  SILVER: { storageGb: 100, portfolio: true, profileStats: true, topPlacement: false, branding: false, banner: false, prioritySupport: false },
  GOLD: { storageGb: 500, portfolio: true, profileStats: true, topPlacement: true, branding: true, banner: false, prioritySupport: true },
  PLATINUM: { storageGb: 1024, portfolio: true, profileStats: true, topPlacement: true, branding: true, banner: true, prioritySupport: true },
};

/**
 * Effective +1TB overage blocks: only while `until` is in the future.
 * (Each purchased block lasts 30 days from purchase.)
 */
export function effectiveExtraTb(tb: number, until: Date | null | undefined): number {
  return until && until.getTime() > Date.now() ? Math.max(0, tb) : 0;
}

/**
 * Silinən rentgen faylının zibil qutusunda qalma müddəti (gün).
 * 0 = zibil qutusu yoxdur, fayl dərhal həmişəlik silinir.
 */
export const CENTER_TRASH_RETENTION_DAYS: Record<Plan, number> = {
  FREE: 0,
  SILVER: 0,
  GOLD: 30,
  PLATINUM: 90,
};

export const trashRetentionDays = (plan: Plan): number =>
  CENTER_TRASH_RETENTION_DAYS[plan];

export const centerLimits = (plan: Plan): CenterPlanLimits => CENTER_PLAN_LIMITS[plan];
export const doctorLimits = (plan: Plan): DoctorPlanLimits => DOCTOR_PLAN_LIMITS[plan];

/** Is this center plan eligible for the featured badge / boosted placement? */
export const isCenterFeatured = (plan: Plan): boolean => CENTER_PLAN_LIMITS[plan].featured;
