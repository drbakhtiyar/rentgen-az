"use client";

import * as React from "react";

/* Paket qiyməti ekrana girəndə 0-dan yuxarı "sayır" (2026-08-13, paketlər
 * redizaynı). prefers-reduced-motion-da animasiyasız birbaşa göstərilir.
 * tabular-nums ilə rəqəm dəyişərkən en sıçramır. */
export function AnimatedPrice({ value, className }: { value: number; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [shown, setShown] = React.useState(0);
  const started = React.useRef(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        io.disconnect();
        const DUR = 900;
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / DUR);
          const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
          setShown(Math.round(value * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {shown}
    </span>
  );
}
