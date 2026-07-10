"use client";

import * as React from "react";
import { trackDoctorEventAction } from "@/app/actions/track";

/** Logs one "view" event per browser session for a doctor profile. */
export function TrackDoctorView({ doctorId }: { doctorId: string }) {
  React.useEffect(() => {
    const key = `rx-viewed-dr:${doctorId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* sessionStorage unavailable — still track */
    }
    void trackDoctorEventAction(doctorId);
  }, [doctorId]);

  return null;
}
