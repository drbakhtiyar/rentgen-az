import { cn } from "@/lib/utils";

/**
 * Animated CBCT "4-panel viewer" hero visual — axial / 3D / coronal / sagittal
 * scan quadrants with CT crosshairs and a sweeping scan beam. Pure SVG + SMIL,
 * no external assets.
 */
export function HeroVisual({ className }: { className?: string }) {
  // Axial dental arch (horseshoe) tooth positions.
  const arch = Array.from({ length: 12 }).map((_, i) => {
    const t = i / 11;
    const a = Math.PI * (1.14 + t * 0.72);
    return { x: 100 + Math.cos(a) * 56, y: 104 - Math.sin(a) * 46, i };
  });

  return (
    <div
      className={cn(
        "relative aspect-square w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-ink-950",
        className,
      )}
    >
      <div className="absolute inset-0 bg-grid-dark opacity-50" />
      <div className="glow absolute left-1/3 top-1/4 h-56 w-56 opacity-50" />
      <div className="glow-cyan absolute bottom-4 right-4 h-48 w-48 opacity-50" />

      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="tooth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a9d4ff" />
            <stop offset="100%" stopColor="#2ad4e6" />
          </linearGradient>
          <radialGradient id="vol" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="rgba(169,212,255,0.9)" />
            <stop offset="60%" stopColor="rgba(56,140,220,0.35)" />
            <stop offset="100%" stopColor="rgba(20,40,80,0)" />
          </radialGradient>
          <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(42,212,230,0)" />
            <stop offset="50%" stopColor="rgba(42,212,230,0.55)" />
            <stop offset="100%" stopColor="rgba(42,212,230,0)" />
          </linearGradient>
        </defs>

        {/* ---- 4 quadrant panels ---- */}
        {[
          [8, 8],
          [208, 8],
          [8, 208],
          [208, 208],
        ].map(([x, y], idx) => (
          <rect
            key={idx}
            x={x}
            y={y}
            width="184"
            height="184"
            rx="14"
            fill="rgba(120,170,255,0.03)"
            stroke="rgba(122,170,255,0.14)"
            strokeWidth="1"
          />
        ))}

        {/* panel labels */}
        {[
          ["AXIAL", 20, 26],
          ["3D", 220, 26],
          ["CORONAL", 20, 226],
          ["SAGITTAL", 220, 226],
        ].map(([label, x, y]) => (
          <text key={label as string} x={x as number} y={y as number} fill="rgba(148,190,255,0.6)" fontSize="9" fontFamily="monospace" letterSpacing="1">
            {label}
          </text>
        ))}

        {/* CT crosshair reticles (green vertical + red horizontal), per panel */}
        {[
          [100, 105],
          [300, 105],
          [100, 305],
          [300, 305],
        ].map(([cx, cy], i) => (
          <g key={i} opacity="0.35">
            <line x1={cx} y1={cy - 82} x2={cx} y2={cy + 82} stroke="#34d399" strokeWidth="0.8" />
            <line x1={cx - 82} y1={cy} x2={cx + 82} y2={cy} stroke="#fb7185" strokeWidth="0.8" />
          </g>
        ))}

        {/* ---- AXIAL: dental arch (horseshoe) ---- */}
        <g>
          <circle cx="100" cy="105" r="72" fill="none" stroke="rgba(122,170,255,0.12)" strokeWidth="1" />
          <circle cx="100" cy="105" r="52" fill="none" stroke="rgba(122,170,255,0.14)" strokeWidth="1" strokeDasharray="3 6">
            <animateTransform attributeName="transform" type="rotate" from="0 100 105" to="360 100 105" dur="18s" repeatCount="indefinite" />
          </circle>
          <path d="M46 120 Q100 176 154 120" fill="none" stroke="url(#tooth)" strokeWidth="2" opacity="0.85" />
          {arch.map((p) => (
            <rect key={p.i} x={p.x - 4} y={p.y - 6} width="8" height="12" rx="3" fill="url(#tooth)">
              <animate attributeName="opacity" values="0.35;0.95;0.35" dur="2.6s" begin={`${p.i * 0.12}s`} repeatCount="indefinite" />
            </rect>
          ))}
        </g>

        {/* ---- 3D: volumetric jaw ---- */}
        <g>
          <g>
            <animateTransform attributeName="transform" type="rotate" values="-4 300 110; 4 300 110; -4 300 110" dur="6s" repeatCount="indefinite" />
            <ellipse cx="300" cy="96" rx="66" ry="58" fill="url(#vol)" />
            {/* upper teeth arc */}
            <path d="M256 118 Q300 96 344 118" fill="none" stroke="#cfe6ff" strokeWidth="2" opacity="0.85" />
            {Array.from({ length: 9 }).map((_, i) => {
              const t = i / 8;
              const a = Math.PI * (1.18 + t * 0.64);
              const x = 300 + Math.cos(a) * 42;
              const yy = 118 - Math.sin(a) * 22;
              return <rect key={i} x={x - 3.2} y={yy - 5} width="6.4" height="16" rx="2.6" fill="#eaf4ff" opacity={0.85 - t * 0.1} />;
            })}
            {/* lower jaw hint */}
            <path d="M262 150 Q300 172 338 150" fill="none" stroke="rgba(207,230,255,0.5)" strokeWidth="2" />
          </g>
        </g>

        {/* ---- CORONAL: symmetric roots + sinus ---- */}
        <g stroke="url(#tooth)" fill="none" strokeWidth="2" opacity="0.8">
          <path d="M62 268 Q100 250 138 268" opacity="0.5" />
          <path d="M70 300 Q76 250 82 300" opacity="0.5" />
          <path d="M118 300 Q124 250 130 300" opacity="0.5" />
          {/* two teeth with roots */}
          <path d="M76 300 l-3 40 M92 300 l3 40 M76 300 h16 v-8 h-16 z" />
          <path d="M108 300 l-3 40 M124 300 l3 40 M108 300 h16 v-8 h-16 z" />
        </g>

        {/* ---- SAGITTAL: teeth profile row ---- */}
        <g fill="url(#tooth)" opacity="0.85">
          {Array.from({ length: 6 }).map((_, i) => {
            const x = 244 + i * 20;
            const y = 300 + Math.sin(i * 0.7) * 4;
            return (
              <path key={i} d={`M${x} ${y} h13 v-16 q-6 -5 -13 0 z m2 0 l-3 32 m9 -32 l3 32`} stroke="#0b1020" strokeWidth="0.5" />
            );
          })}
        </g>

        {/* ---- sweeping scan beam ---- */}
        <rect x="8" width="384" height="26" fill="url(#beam)">
          <animate attributeName="y" values="8;366;8" dur="4.5s" repeatCount="indefinite" />
        </rect>
      </svg>

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
        <span className="text-[11px] font-medium text-cyan-300">CBCT · 3D scan</span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
          Aşağı doza rejimi
        </span>
      </div>
    </div>
  );
}
