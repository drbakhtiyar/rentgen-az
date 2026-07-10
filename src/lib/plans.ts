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

// ------------------------------ Centers ------------------------------

export type CenterPlanLimits = {
  photoLimit: number | null; // null = limitsiz
  storageGb: number;
  featured: boolean; // "Tövsiyə olunan" nişanı + axtarışda önə çıxma
  banner: boolean;
  fullAnalytics: boolean;
  apiExport: boolean;
  prioritySupport: boolean;
};

export const CENTER_PLAN_LIMITS: Record<Plan, CenterPlanLimits> = {
  FREE: { photoLimit: 5, storageGb: 50, featured: false, banner: false, fullAnalytics: false, apiExport: false, prioritySupport: false },
  SILVER: { photoLimit: 15, storageGb: 250, featured: false, banner: false, fullAnalytics: true, apiExport: false, prioritySupport: false },
  GOLD: { photoLimit: 40, storageGb: 1024, featured: true, banner: false, fullAnalytics: true, apiExport: false, prioritySupport: true },
  PLATINUM: { photoLimit: null, storageGb: 3072, featured: true, banner: true, fullAnalytics: true, apiExport: true, prioritySupport: true },
};

// ------------------------------ Doctors ------------------------------

export type DoctorPlanLimits = {
  storageGb: number;
  portfolio: boolean;
  profileStats: boolean;
  topPlacement: boolean;
  branding: boolean;
  prioritySupport: boolean;
};

export const DOCTOR_PLAN_LIMITS: Record<Plan, DoctorPlanLimits> = {
  FREE: { storageGb: 20, portfolio: false, profileStats: false, topPlacement: false, branding: false, prioritySupport: false },
  SILVER: { storageGb: 100, portfolio: true, profileStats: true, topPlacement: false, branding: false, prioritySupport: false },
  GOLD: { storageGb: 500, portfolio: true, profileStats: true, topPlacement: true, branding: true, prioritySupport: true },
  PLATINUM: { storageGb: 1024, portfolio: true, profileStats: true, topPlacement: true, branding: true, prioritySupport: true },
};

export const centerLimits = (plan: Plan): CenterPlanLimits => CENTER_PLAN_LIMITS[plan];
export const doctorLimits = (plan: Plan): DoctorPlanLimits => DOCTOR_PLAN_LIMITS[plan];

/** Is this center plan eligible for the featured badge / boosted placement? */
export const isCenterFeatured = (plan: Plan): boolean => CENTER_PLAN_LIMITS[plan].featured;
