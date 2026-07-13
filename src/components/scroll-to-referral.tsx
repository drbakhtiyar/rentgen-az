"use client";

import * as React from "react";

/**
 * On mobile, the referral form lives at the bottom of the center page. When a
 * doctor arrives via the "send a patient" QR, scroll straight to it.
 */
export function ScrollToReferral() {
  React.useEffect(() => {
    // Only auto-scroll on small screens (desktop shows the form in the sidebar).
    if (window.innerWidth >= 1024) return;
    const el = document.getElementById("gonderis");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  return null;
}
