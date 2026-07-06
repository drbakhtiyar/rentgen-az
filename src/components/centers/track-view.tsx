"use client";

import * as React from "react";
import { trackCenterEventAction } from "@/app/actions/track";

/** Logs one "view" event per browser session for a center. */
export function TrackView({ centerId }: { centerId: string }) {
  React.useEffect(() => {
    const key = `rx-viewed:${centerId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* sessionStorage unavailable — still track */
    }
    void trackCenterEventAction(centerId, "view");
  }, [centerId]);

  return null;
}
