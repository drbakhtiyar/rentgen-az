"use client";

import * as React from "react";
import { trackSearchEventAction } from "@/app/actions/track";

/**
 * Logs one search event per unique query/filter combination per browser session
 * (so refreshing the results page doesn't double-count). Rendered only when a
 * search filter is actually active.
 */
export function TrackSearch({
  query,
  city,
  service,
  results,
}: {
  query?: string;
  city?: string;
  service?: string;
  results: number;
}) {
  React.useEffect(() => {
    const key = `rx-search:${query ?? ""}|${city ?? ""}|${service ?? ""}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* sessionStorage unavailable — still track */
    }
    void trackSearchEventAction({ query, city, service, results });
  }, [query, city, service, results]);

  return null;
}
