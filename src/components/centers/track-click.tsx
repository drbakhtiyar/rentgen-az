"use client";

import * as React from "react";
import { trackCenterEventAction, type CenterEventType } from "@/app/actions/track";

/** Server komponentindəki linki izləmək üçün yüngül sarğı: daxilindəki
 *  istənilən klik verilmiş hadisəni BİR DƏFƏ qeydə alır (best-effort). */
export function TrackClick({
  centerId,
  type,
  children,
}: {
  centerId: string;
  type: CenterEventType;
  children: React.ReactNode;
}) {
  const fired = React.useRef(false);
  return (
    <span
      className="contents"
      onClickCapture={() => {
        if (fired.current) return;
        fired.current = true;
        void trackCenterEventAction(centerId, type);
      }}
    >
      {children}
    </span>
  );
}
