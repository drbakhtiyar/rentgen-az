import { cn } from "@/lib/utils";

/**
 * Decorative Azerbaijan map hero visual. A stylized silhouette (mainland +
 * Nakhchivan exclave) with glowing markers on every city where we have centers.
 * Purely decorative — NOT interactive, no links, no navigation.
 *
 * Border vertices & city coordinates are real [lng, lat] pairs, projected with a
 * single linear projection so markers line up with the silhouette.
 */

const LNG0 = 44.6;
const LNG1 = 50.5;
const LAT0 = 38.3;
const LAT1 = 42.0;
const W = 1000;
const H = 820;
const px = (lng: number) => ((lng - LNG0) / (LNG1 - LNG0)) * W;
const py = (lat: number) => ((LAT1 - lat) / (LAT1 - LAT0)) * H;

// Simplified mainland outline (clockwise from NW Georgia border).
const MAINLAND: [number, number][] = [
  [45.9, 41.6], [46.9, 41.78], [48.0, 41.45], [48.4, 41.6], [48.9, 41.6],
  [49.1, 41.3], [49.5, 40.85], [49.9, 40.55], [50.4, 40.45], [50.1, 40.28],
  [49.55, 40.05], [49.2, 39.55], [49.05, 39.1], [48.95, 38.85], [48.85, 38.4],
  [48.3, 38.6], [48.0, 39.3], [47.3, 39.2], [46.6, 39.15], [46.3, 39.55],
  [46.0, 39.75], [45.7, 40.2], [45.55, 40.7], [45.5, 41.1], [45.5, 41.4],
];
// Nakhchivan exclave.
const NAKHCHIVAN: [number, number][] = [
  [45.15, 39.75], [45.6, 39.55], [46.05, 39.25], [45.65, 38.9], [45.05, 39.15], [44.8, 39.65],
];

const toPath = (pts: [number, number][]) =>
  pts.map(([lng, lat], i) => `${i ? "L" : "M"}${px(lng).toFixed(1)} ${py(lat).toFixed(1)}`).join(" ") + " Z";

// Cities where we have centers. `major` ones get a text label.
const CITIES: { name: string; lng: number; lat: number; major?: boolean; hub?: boolean; left?: boolean }[] = [
  { name: "Bakı", lng: 49.87, lat: 40.41, major: true, hub: true, left: true },
  { name: "Sumqayıt", lng: 49.67, lat: 40.59 },
  { name: "Gəncə", lng: 46.36, lat: 40.68, major: true },
  { name: "Mingəçevir", lng: 47.05, lat: 40.77 },
  { name: "Şəki", lng: 47.17, lat: 41.19, major: true },
  { name: "Lənkəran", lng: 48.85, lat: 38.75, major: true },
  { name: "Naxçıvan", lng: 45.41, lat: 39.21, major: true },
  { name: "Şirvan", lng: 48.92, lat: 39.93 },
  { name: "Yevlax", lng: 47.15, lat: 40.62 },
  { name: "Quba", lng: 48.51, lat: 41.36, major: true },
  { name: "Şamaxı", lng: 48.64, lat: 40.63 },
  { name: "Bərdə", lng: 47.13, lat: 40.37 },
  { name: "Salyan", lng: 48.98, lat: 39.6 },
  { name: "Xaçmaz", lng: 48.81, lat: 41.46 },
  { name: "Ağdaş", lng: 47.47, lat: 40.65 },
  { name: "Masallı", lng: 48.66, lat: 39.03 },
  { name: "Zaqatala", lng: 46.64, lat: 41.63 },
  { name: "Göyçay", lng: 47.74, lat: 40.65 },
  { name: "İmişli", lng: 48.06, lat: 39.87 },
  { name: "Ağcabədi", lng: 47.46, lat: 40.05 },
];

export function HeroVisual({ className }: { className?: string }) {
  const mainland = toPath(MAINLAND);
  const nakhchivan = toPath(NAKHCHIVAN);

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

      <svg viewBox="0 0 1000 820" className="absolute inset-0 h-full w-full p-6" aria-hidden>
        <defs>
          <radialGradient id="land" cx="62%" cy="42%" r="70%">
            <stop offset="0%" stopColor="rgba(56,150,230,0.30)" />
            <stop offset="55%" stopColor="rgba(40,110,200,0.16)" />
            <stop offset="100%" stopColor="rgba(20,45,90,0.06)" />
          </radialGradient>
          <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5cc6ff" />
            <stop offset="100%" stopColor="#2ad4e6" />
          </linearGradient>
          <clipPath id="landClip">
            <path d={mainland} />
          </clipPath>
        </defs>

        {/* Landmass fills */}
        <path d={mainland} fill="url(#land)" stroke="url(#edge)" strokeWidth="2.2" strokeLinejoin="round" />
        <path d={nakhchivan} fill="url(#land)" stroke="url(#edge)" strokeWidth="2.2" strokeLinejoin="round" />

        {/* Faint graticule clipped to the mainland for a "data" texture */}
        <g clipPath="url(#landClip)" stroke="rgba(122,190,255,0.14)" strokeWidth="1">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <line key={`v${i}`} x1={(i * W) / 10} y1="0" x2={(i * W) / 10} y2={H} />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <line key={`h${i}`} x1="0" y1={(i * H) / 8} x2={W} y2={(i * H) / 8} />
          ))}
        </g>

        {/* City markers */}
        {CITIES.map((c) => {
          const x = px(c.lng);
          const y = py(c.lat);
          const r = c.hub ? 8 : c.major ? 6 : 4.5;
          return (
            <g key={c.name}>
              <circle cx={x} cy={y} r={r * 2.6} fill="rgba(42,212,230,0.12)">
                {c.hub && (
                  <animate attributeName="r" values={`${r * 2.2};${r * 3.4};${r * 2.2}`} dur="3.2s" repeatCount="indefinite" />
                )}
              </circle>
              <circle cx={x} cy={y} r={r} fill="#2ad4e6" stroke="#eafcff" strokeWidth={c.hub ? 2 : 1.2}>
                {c.hub && <animate attributeName="opacity" values="1;0.7;1" dur="3.2s" repeatCount="indefinite" />}
              </circle>
              {c.major && (
                <text
                  x={c.left ? x - r - 6 : x + r + 6}
                  y={y + 4}
                  textAnchor={c.left ? "end" : "start"}
                  fill="rgba(220,240,255,0.92)"
                  fontSize="20"
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                >
                  {c.name}
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
          {CITIES.length} şəhər
        </span>
      </div>
    </div>
  );
}
