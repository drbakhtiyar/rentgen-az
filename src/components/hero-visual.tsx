import { cn } from "@/lib/utils";

/**
 * CBCT reconstruction console — an abstract dental cone-beam CT viewer built
 * from SVG + CSS only (no external assets). Inspired by a real CBCT axial slice:
 * a horseshoe dental arch of tooth cross-sections under a rotating
 * reconstruction sweep, with crosshair reticle and medical readouts.
 */
export function HeroVisual({ className }: { className?: string }) {
  // Tooth cross-sections laid out along a mandibular (U-shaped) arch.
  const teeth = Array.from({ length: 16 }).map((_, i) => {
    const t = (i / 15) * 2 - 1; // -1 → 1 across the arch
    const cx = 200 + t * 118;
    const cy = 296 - t * t * 138; // parabola: rounded base at the bottom
    const angle = (Math.atan2(2 * t * 138, 118) * 180) / Math.PI; // face outward
    const size = 0.85 + (1 - Math.abs(t)) * 0.5; // front teeth a touch larger
    return { cx, cy, angle, size, i };
  });

  return (
    <div
      className={cn(
        "scanline relative aspect-square w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-ink-950",
        className,
      )}
    >
      <div className="absolute inset-0 bg-grid-dark opacity-60" />
      <div className="glow absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 opacity-60" />
      <div className="glow-cyan absolute bottom-0 right-0 h-48 w-48 opacity-60" />

      {/* ---- circular axial scan window ---- */}
      <div className="absolute left-1/2 top-1/2 aspect-square w-[74%] -translate-x-1/2 -translate-y-1/2">
        <div className="relative h-full w-full overflow-hidden rounded-full border border-cyan-400/20 bg-[radial-gradient(circle_at_50%_45%,rgba(16,42,66,0.9),rgba(6,14,26,0.95))] shadow-[inset_0_0_60px_rgba(42,212,230,0.12)]">
          {/* rotating reconstruction sweep */}
          <div className="ct-sweep absolute inset-0" />

          {/* arch + rings + crosshairs */}
          <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <linearGradient id="enamel" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#bfe3ff" />
                <stop offset="100%" stopColor="#2ad4e6" />
              </linearGradient>
            </defs>

            {/* concentric reconstruction rings */}
            {[186, 150, 112, 74].map((r) => (
              <circle
                key={r}
                cx="200"
                cy="205"
                r={r}
                fill="none"
                stroke="rgba(122,170,255,0.16)"
                strokeWidth="1"
                strokeDasharray="2 7"
              />
            ))}

            {/* crosshair lines — cyan H, brand V (echoes the CBCT reference reticle) */}
            <line x1="14" y1="205" x2="386" y2="205" stroke="rgba(42,212,230,0.28)" strokeWidth="1" />
            <line x1="200" y1="19" x2="200" y2="391" stroke="rgba(122,170,255,0.28)" strokeWidth="1" />

            {/* dental arch guide */}
            <path
              d="M96 150 Q200 300 304 150"
              fill="none"
              stroke="rgba(132,193,255,0.35)"
              strokeWidth="1.5"
              strokeDasharray="4 5"
            />

            {/* tooth cross-sections: bright dentin ring + dark pulp core */}
            {teeth.map(({ cx, cy, angle, size, i }) => (
              <g
                key={i}
                transform={`translate(${cx} ${cy}) rotate(${angle}) scale(${size})`}
                className="ct-glimmer"
                style={{ animationDelay: `${(i % 8) * 0.18}s` }}
              >
                <rect
                  x={-6}
                  y={-8}
                  width={12}
                  height={16}
                  rx={5}
                  fill="rgba(9,20,34,0.6)"
                  stroke="url(#enamel)"
                  strokeWidth={1.6}
                />
                <circle cx={0} cy={0} r={2.1} fill="rgba(42,212,230,0.55)" />
              </g>
            ))}

            {/* rotating tick reticle */}
            <g className="ct-reticle" style={{ transformOrigin: "200px 205px" }}>
              {Array.from({ length: 48 }).map((_, i) => {
                const a = (i / 48) * Math.PI * 2;
                const r1 = i % 4 === 0 ? 176 : 182;
                const r2 = 188;
                return (
                  <line
                    key={i}
                    x1={200 + Math.cos(a) * r1}
                    y1={205 + Math.sin(a) * r1}
                    x2={200 + Math.cos(a) * r2}
                    y2={205 + Math.sin(a) * r2}
                    stroke="rgba(122,170,255,0.4)"
                    strokeWidth={i % 4 === 0 ? 1.4 : 0.8}
                  />
                );
              })}
            </g>

            {/* counter-rotating inner guide ring */}
            <g className="ct-reticle-rev" style={{ transformOrigin: "200px 205px" }}>
              <circle
                cx="200"
                cy="205"
                r="52"
                fill="none"
                stroke="rgba(42,212,230,0.35)"
                strokeWidth="1"
                strokeDasharray="30 14"
              />
            </g>

            {/* center focus crosshair */}
            <g className="ct-blink">
              <circle cx="200" cy="205" r="5" fill="none" stroke="#2ad4e6" strokeWidth="1.4" />
              <line x1="200" y1="192" x2="200" y2="200" stroke="#2ad4e6" strokeWidth="1.4" />
              <line x1="200" y1="210" x2="200" y2="218" stroke="#2ad4e6" strokeWidth="1.4" />
              <line x1="187" y1="205" x2="195" y2="205" stroke="#2ad4e6" strokeWidth="1.4" />
              <line x1="205" y1="205" x2="213" y2="205" stroke="#2ad4e6" strokeWidth="1.4" />
            </g>
          </svg>
        </div>
      </div>

      {/* ---- HUD corner readouts ---- */}
      <div className="pointer-events-none absolute left-4 top-4 font-mono text-[10px] uppercase tracking-wider text-cyan-300/80">
        <div className="flex items-center gap-1.5">
          <span className="ct-blink h-1.5 w-1.5 rounded-full bg-cyan-400" />
          Axial · Mandibula
        </div>
      </div>
      <div className="pointer-events-none absolute right-4 top-4 text-right font-mono text-[10px] tracking-wider text-slate-400/80">
        <div>FOV 8×8 cm</div>
        <div className="text-cyan-300/70">0.2 mm voxel</div>
      </div>

      {/* ---- bottom status strip ---- */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
        <span className="text-[11px] font-medium text-cyan-300">CBCT · 3D rekonstruksiya</span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
          Aşağı doza rejimi
        </span>
      </div>
    </div>
  );
}
