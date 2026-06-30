import { cn } from "@/lib/utils";

/** Abstract "3D dental scan" visual built from SVG + CSS (no external assets). */
export function HeroVisual({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "scanline relative aspect-square w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-ink-950",
        className,
      )}
    >
      <div className="absolute inset-0 bg-grid-dark opacity-60" />
      <div className="glow absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 opacity-70" />
      <div className="glow-cyan absolute bottom-0 right-0 h-48 w-48 opacity-60" />

      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full animate-floaty"
        aria-hidden
      >
        <defs>
          <linearGradient id="jaw" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#84c1ff" />
            <stop offset="100%" stopColor="#2ad4e6" />
          </linearGradient>
          <radialGradient id="ring" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(42,212,230,0.25)" />
          </radialGradient>
        </defs>

        {/* concentric scan rings */}
        {[150, 120, 90].map((r) => (
          <circle
            key={r}
            cx="200"
            cy="210"
            r={r}
            fill="none"
            stroke="rgba(122,170,255,0.18)"
            strokeWidth="1"
            strokeDasharray="3 6"
          />
        ))}

        {/* stylised dental arch */}
        <path
          d="M110 170 Q200 110 290 170 Q300 250 200 300 Q100 250 110 170 Z"
          fill="none"
          stroke="url(#jaw)"
          strokeWidth="2.5"
          opacity="0.9"
        />

        {/* teeth nodes along the arch */}
        {Array.from({ length: 12 }).map((_, i) => {
          const t = i / 11;
          const angle = Math.PI * (0.15 + t * 0.7);
          const cx = 200 - Math.cos(angle) * 95;
          const cy = 200 - Math.sin(angle) * 70 + 20;
          return (
            <g key={i}>
              <rect
                x={cx - 6}
                y={cy - 9}
                width="12"
                height="18"
                rx="4"
                fill="url(#jaw)"
                opacity={0.55 + (i % 3) * 0.15}
              />
            </g>
          );
        })}

        <circle cx="200" cy="210" r="160" fill="url(#ring)" />
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
