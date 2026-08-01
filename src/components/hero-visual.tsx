import { cn } from "@/lib/utils";
import { AZ_MAINLAND, AZ_NAKHCHIVAN, AZ_CITY_COORDS, cityCoords } from "@/lib/az-cities";

/**
 * Decorative Azerbaijan map hero visual. Real (simplified) border silhouette with
 * a glowing marker on every city where we have centers — driven by `activeCities`
 * (canonical city names from the DB). Purely decorative: NOT interactive.
 */

// ---- Projection (equirectangular with cos(lat) x-correction), fit to viewBox ----
const VW = 1000;
const VH = 1000;
const PAD = 76;
const ALL = [...AZ_MAINLAND, ...AZ_NAKHCHIVAN];
const lo: [number, number] = [Math.min(...ALL.map((p) => p[0])), Math.min(...ALL.map((p) => p[1]))];
const hi: [number, number] = [Math.max(...ALL.map((p) => p[0])), Math.max(...ALL.map((p) => p[1]))];
const KX = Math.cos(((lo[1] + hi[1]) / 2) * (Math.PI / 180));
const gW = (hi[0] - lo[0]) * KX;
const gH = hi[1] - lo[1];
const SC = Math.min((VW - 2 * PAD) / gW, (VH - 2 * PAD) / gH);
const OFFX = (VW - gW * SC) / 2;
const OFFY = (VH - gH * SC) / 2;
const px = (lng: number) => OFFX + (lng - lo[0]) * KX * SC;
const py = (lat: number) => OFFY + (hi[1] - lat) * SC;
const toPath = (ring: [number, number][]) =>
  ring.map(([a, b], i) => `${i ? "L" : "M"}${px(a).toFixed(1)} ${py(b).toFixed(1)}`).join(" ") + " Z";

const MAINLAND = toPath(AZ_MAINLAND);
const NAKHCHIVAN = toPath(AZ_NAKHCHIVAN);

// Which cities get a text label (if active). Bakı is the hub; its label sits left
// of the marker because it's on the eastern tip.
const LABELS = new Set(["Bakı", "Gəncə", "Naxçıvan", "Şəki", "Lənkəran", "Quba"]);
const HUB = "Bakı";
const LEFT = new Set(["Bakı"]);
const DEFAULT_CITIES = ["Bakı", "Gəncə", "Naxçıvan", "Şəki", "Lənkəran", "Quba", "Sumqayıt", "Şamaxı"];

export function HeroVisual({
  activeCities,
  className,
}: {
  activeCities?: string[];
  className?: string;
}) {
  // Resolve DB city names → coordinates, dedupe, keep only mappable ones.
  const src = activeCities && activeCities.length ? activeCities : DEFAULT_CITIES;
  const seen = new Set<string>();
  const markers: { name: string; x: number; y: number }[] = [];
  for (const raw of src) {
    const xy = cityCoords(raw) ?? AZ_CITY_COORDS[raw];
    if (!xy) continue;
    const key = `${xy[0]},${xy[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    markers.push({ name: raw.split(/[—–\-(]/)[0].trim(), x: px(xy[0]), y: py(xy[1]) });
  }

  return (
    <div
      className={cn(
        "relative aspect-square w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-ink-950",
        className,
      )}
    >
      <div className="absolute inset-0 bg-grid-dark opacity-40" />
      <div className="glow absolute left-1/4 top-1/3 h-56 w-56 opacity-40" />
      <div className="glow-cyan absolute bottom-8 right-6 h-48 w-48 opacity-40" />

      <span className="absolute left-5 top-4 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
        Azərbaycan
      </span>

      <svg viewBox="0 0 1000 1000" className="absolute inset-0 h-full w-full p-5" aria-hidden>
        <defs>
          <radialGradient id="land" cx="60%" cy="40%" r="72%">
            <stop offset="0%" stopColor="rgba(56,150,230,0.30)" />
            <stop offset="55%" stopColor="rgba(40,110,200,0.16)" />
            <stop offset="100%" stopColor="rgba(20,45,90,0.06)" />
          </radialGradient>
          <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5cc6ff" />
            <stop offset="100%" stopColor="#2ad4e6" />
          </linearGradient>
          <clipPath id="landClip">
            <path d={MAINLAND} />
          </clipPath>
        </defs>

        <path d={MAINLAND} fill="url(#land)" stroke="url(#edge)" strokeWidth="2.4" strokeLinejoin="round" />
        <path d={NAKHCHIVAN} fill="url(#land)" stroke="url(#edge)" strokeWidth="2.4" strokeLinejoin="round" />

        {/* Faint graticule clipped to the mainland for a subtle "data" texture */}
        <g clipPath="url(#landClip)" stroke="rgba(122,190,255,0.12)" strokeWidth="1">
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`v${i}`} x1={(i * VW) / 10} y1="0" x2={(i * VW) / 10} y2={VH} />
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={(i * VH) / 10} x2={VW} y2={(i * VH) / 10} />
          ))}
        </g>

        {markers.map((m) => {
          const hub = m.name === HUB;
          const label = LABELS.has(m.name);
          const r = hub ? 8 : label ? 6 : 4.5;
          const left = LEFT.has(m.name);
          return (
            <g key={m.name}>
              <circle cx={m.x} cy={m.y} r={r * 2.6} fill="rgba(42,212,230,0.12)">
                {hub && <animate attributeName="r" values={`${r * 2.2};${r * 3.4};${r * 2.2}`} dur="3.2s" repeatCount="indefinite" />}
              </circle>
              <circle cx={m.x} cy={m.y} r={r} fill="#2ad4e6" stroke="#eafcff" strokeWidth={hub ? 2 : 1.2}>
                {hub && <animate attributeName="opacity" values="1;0.7;1" dur="3.2s" repeatCount="indefinite" />}
              </circle>
              {label && (
                <text
                  x={left ? m.x - r - 6 : m.x + r + 6}
                  y={m.y + 4}
                  textAnchor={left ? "end" : "start"}
                  fill="rgba(220,240,255,0.92)"
                  fontSize="20"
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                >
                  {m.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
        <span className="text-[11px] font-medium text-cyan-300">Bütün Azərbaycan üzrə mərkəzlər</span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
          {markers.length} şəhər
        </span>
      </div>
    </div>
  );
}
