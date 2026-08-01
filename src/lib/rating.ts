/**
 * Weighted (Bayesian) rating scoring shared by the server (global sort +
 * pagination) and the client (centers explorer). Pulls low-vote scores toward
 * a prior mean so a 5.0 from 2 reviews ranks below a 4.8 from 50.
 */

export const PRIOR_MEAN = 4.2; // typical AZ clinic average
export const PRIOR_WEIGHT = 8; // "phantom" reviews held at the prior mean

/** Bayesian weighted rating. Unrated (count<=0) sorts last (-1). */
export function bayesian(avg: number, count: number): number {
  if (!count || count <= 0) return -1;
  return (avg * count + PRIOR_MEAN * PRIOR_WEIGHT) / (count + PRIOR_WEIGHT);
}

/**
 * "Yüksək reytinq" combined score — the platform's OWN reviews weigh more
 * (×1.5) than Google, blended and weighted by vote count. Unrated → -1.
 */
export function combinedRatingScore(
  own: { avg: number; count: number } | undefined,
  googleRating: number | null | undefined,
  googleReviewCount: number | null | undefined,
): number {
  const ownCount = (own?.count ?? 0) * 1.5;
  const gCount = googleReviewCount ?? 0;
  const total = ownCount + gCount;
  if (total <= 0) return -1;
  const sum = (own?.avg ?? 0) * ownCount + (googleRating ?? 0) * gCount;
  return (sum + PRIOR_MEAN * PRIOR_WEIGHT) / (total + PRIOR_WEIGHT);
}

/** Sort key type used across the centers listing. */
export type CenterSort = "recommended" | "rating" | "googleRating" | "price" | "distance";

export const CENTER_SORTS: CenterSort[] = [
  "recommended",
  "rating",
  "googleRating",
  "price",
  "distance",
];

export function parseSort(raw: string | undefined): CenterSort {
  return CENTER_SORTS.includes(raw as CenterSort) ? (raw as CenterSort) : "recommended";
}
