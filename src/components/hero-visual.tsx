import { cn } from "@/lib/utils";
import { AZ_MAINLAND, AZ_NAKHCHIVAN, AZ_CITY_COORDS, cityCoords, canonCity, CITY_RU } from "@/lib/az-cities";
import { AZ_RAYONS, AZ_OUTLINE } from "@/lib/az-rayons";

/**
 * Decorative Azerbaijan map hero visual — two variants:
 *
 *  "rayons" (cari): rayon-səviyyəli xəritə — mərkəzimiz OLAN rayonlar rəngli
 *   yanır (choropleth), üstündə dəqiq xarici kontur. İstifadəçi konsepti,
 *   2026-08-04.
 *  "dots": köhnə görünüş — sadə siluet + şəhər nöqtələri. İstifadəçi xahişi
 *   ilə SAXLANILIB — geri qayıtmaq üçün aşağıda VARIANT-ı "dots" et.
 *
 * 2026-08-16-dan İNTERAKTİV: hər şəhər etiketi həmin şəhərin
 * mərkəzlər siyahısına aparır (?city= filtri).
 */
const VARIANT: "rayons" | "dots" = "rayons";

// ---- Projection (equirectangular with cos(lat) x-correction), fit to viewBox ----
const VW = 1000;
const VH = 1000;
const PAD = 10; // 76→34→10 — istifadəçi xahişi ilə iki dəfə ~10% böyüdüldü
const ALL_V1 = [...AZ_MAINLAND, ...AZ_NAKHCHIVAN];
const ALL =
  VARIANT === "rayons" ? AZ_RAYONS.flatMap((r) => r.rings.flat()) : ALL_V1;
const lo: [number, number] = [Math.min(...ALL.map((p) => p[0])), Math.min(...ALL.map((p) => p[1]))];
const hi: [number, number] = [Math.max(...ALL.map((p) => p[0])), Math.max(...ALL.map((p) => p[1]))];
const KX = Math.cos(((lo[1] + hi[1]) / 2) * (Math.PI / 180));
const gW = (hi[0] - lo[0]) * KX;
const gH = hi[1] - lo[1];
const SC = Math.min((VW - 2 * PAD) / gW, (VH - 2 * PAD) / gH);
const OFFX = (VW - gW * SC) / 2;
const OFFY = (VH - gH * SC) / 2 - 26; // xəritə yuxarı sürüşdürülüb (cənub ucu alt zolağa yaxınlaşmasın)
const px = (lng: number) => OFFX + (lng - lo[0]) * KX * SC;
const py = (lat: number) => OFFY + (hi[1] - lat) * SC;
const toPath = (ring: [number, number][]) =>
  ring.map(([a, b], i) => `${i ? "L" : "M"}${px(a).toFixed(1)} ${py(b).toFixed(1)}`).join(" ") + " Z";

// v1 (dots) yolları
const MAINLAND = toPath(AZ_MAINLAND);
const NAKHCHIVAN = toPath(AZ_NAKHCHIVAN);
// v2 (rayons) yolları — modul səviyyəsində bir dəfə hesablanır
const RAYON_PATHS = AZ_RAYONS.map((r) => ({
  az: r.az,
  d: r.rings.map(toPath).join(" "),
}));
const OUTLINE_PATHS = AZ_OUTLINE.map(toPath);

// 2026-08-16 (istifadəçi istəyi): BÜTÜN şəhərlər etiket alır, hamısı
// kliklənəbilir (/rentgen-merkezleri?city=X — universal filtr, 404 vermir),
// markerlərdə növbəli nəbz animasiyası. Bakı hub olaraq qalır.
const HUB = "Bakı";
const LEFT = new Set(["Bakı", "Qusar", "Salyan", "Qəbələə", "Abşeron", "Tovuz", "Naxçıvan"]);
// Ayrı-ayrı etiketlərə şaquli sürüşmə (sıx zonalarda toqquşmanı açmaq üçün)
const LABEL_DY: Record<string, number> = {
  Qusar: -16,
  Xaçmaz: 10,
  Abşeron: 20,
  Sumqayıt: -12,
  Yevlax: 16,
  Göyçay: 14,
  Qəbələ: -14,
  İsmayıllı: -10,
  Bərdə: -8,
  Salyan: 12,
  Masallı: -6,
};
const DEFAULT_CITIES = ["Bakı", "Gəncə", "Naxçıvan", "Şəki", "Lənkəran", "Quba", "Sumqayıt", "Şamaxı"];

export function HeroVisual({
  activeCities,
  className,
  locale = "az",
}: {
  activeCities?: string[];
  className?: string;
  locale?: "az" | "ru";
}) {
  const ru = locale === "ru";
  const src = activeCities && activeCities.length ? activeCities : DEFAULT_CITIES;

  // Rəngli rayonlar: bazadakı şəhər adı rayon adı ilə üst-üstə düşür.
  const covered = new Set(src.map((c) => canonCity(c)));
  const coveredCount = new Set(
    RAYON_PATHS.filter((r) => covered.has(r.az)).map((r) => r.az),
  ).size;

  // Markerlər (hər iki variantda etiketlər üçün; "dots"-da hamısı nöqtə alır)
  const seen = new Set<string>();
  const markers: { name: string; x: number; y: number }[] = [];
  for (const raw of src) {
    const xy = cityCoords(raw) ?? AZ_CITY_COORDS[raw];
    if (!xy) continue;
    const key = `${xy[0]},${xy[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    markers.push({ name: canonCity(raw), x: px(xy[0]), y: py(xy[1]) });
  }
  const labelMarkers = markers;

  return (
    <div
      className={cn(
        "relative aspect-square w-full max-w-lg overflow-hidden rounded-3xl bg-iris-shadow ring-1 ring-iris-border",
        className,
      )}
    >
      <div className="absolute inset-0 bg-grid-dark opacity-25" />
      <div className="absolute left-1/4 top-1/3 h-56 w-56 rounded-full bg-iris-glow/45 blur-[56px]" />
      <div className="absolute bottom-8 right-6 h-48 w-48 rounded-full bg-clinical/15 blur-[56px]" />

      <svg viewBox="0 0 1000 1000" className="absolute inset-0 h-full w-full p-2" role="img" aria-label="Azərbaycan xəritəsi — şəhərə klik edin">
        <defs>
          <radialGradient id="land" cx="60%" cy="40%" r="72%">
            <stop offset="0%" stopColor="rgba(56,150,230,0.30)" />
            <stop offset="55%" stopColor="rgba(40,110,200,0.16)" />
            <stop offset="100%" stopColor="rgba(20,45,90,0.06)" />
          </radialGradient>
          <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00b1ff" />
            <stop offset="100%" stopColor="#2ee9ff" />
          </linearGradient>
          <linearGradient id="rayonOn" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(0,177,255,0.5)" />
            <stop offset="100%" stopColor="rgba(46,233,255,0.32)" />
          </linearGradient>
          <clipPath id="landClip">
            <path d={VARIANT === "rayons" ? OUTLINE_PATHS.join(" ") : MAINLAND} />
          </clipPath>
          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {VARIANT === "rayons" ? (
          <>
            {/* Bütün rayonlar — tünd baza */}
            <g stroke="rgba(177,166,246,0.28)" strokeWidth="1">
              {RAYON_PATHS.map((r, i) => (
                <path
                  key={i}
                  d={r.d}
                  fill={covered.has(r.az) ? "url(#rayonOn)" : "rgba(83,80,204,0.22)"}
                  strokeLinejoin="round"
                />
              ))}
            </g>
            {/* Örtülü rayonların parıltısı */}
            <g filter="url(#softGlow)" opacity="0.5">
              {RAYON_PATHS.filter((r) => covered.has(r.az)).map((r, i) => (
                <path key={i} d={r.d} fill="none" stroke="#00b1ff" strokeWidth="1.6" strokeLinejoin="round" />
              ))}
            </g>
            {/* Xarici dəqiq kontur */}
            {OUTLINE_PATHS.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="url(#edge)" strokeWidth="2.4" strokeDasharray="12 9" strokeLinecap="round" strokeLinejoin="round">
                {/* sərhəd xətti yavaş axır */}
                <animate attributeName="stroke-dashoffset" values="0;-42" dur="4s" repeatCount="indefinite" />
              </path>
            ))}
            {/* Yalnız əsas şəhər etiketləri + Bakı pulsu */}
            {labelMarkers.map((m, i) => {
              const hub = m.name === HUB;
              const left = LEFT.has(m.name);
              const r = hub ? 7 : 4.5;
              return (
                <a
                  key={m.name}
                  href={`${ru ? "/ru" : ""}/rentgen-merkezleri?city=${encodeURIComponent(m.name)}`}
                  className="map-city"
                  aria-label={ru ? `Центры: ${CITY_RU[m.name] ?? m.name}` : `${m.name} mərkəzləri`}
                >
                  {/* hər markerdə növbəli mint nəbzi (hub daha güclü) */}
                  <circle cx={m.x} cy={m.y} r={r * 2.4} fill={hub ? "rgba(0,255,170,0.12)" : "rgba(0,255,170,0.07)"}>
                    <animate attributeName="r" values={`${r * 1.8};${r * 3};${r * 1.8}`} dur="3.2s" begin={`${(i % 8) * 0.4}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;0.25;0.9" dur="3.2s" begin={`${(i % 8) * 0.4}s`} repeatCount="indefinite" />
                  </circle>
                  <circle cx={m.x} cy={m.y} r={r} fill="#00ffaa" stroke="#16165c" strokeWidth={hub ? 2 : 1.1} />
                  <text
                    x={left ? m.x - r - 7 : m.x + r + 7}
                    y={m.y + 4 + (LABEL_DY[m.name] ?? 0)}
                    textAnchor={left ? "end" : "start"}
                    fill="rgba(244,244,246,0.95)"
                    fontSize={hub ? 22 : 18}
                    fontWeight="600"
                    fontFamily="var(--font-manrope), system-ui, sans-serif"
                    paintOrder="stroke"
                    stroke="rgba(22,22,92,0.85)"
                    strokeWidth="4"
                  >
                    {ru ? (CITY_RU[m.name] ?? m.name) : m.name}
                  </text>
                </a>
              );
            })}
          </>
        ) : (
          <>
            <path d={MAINLAND} fill="url(#land)" stroke="url(#edge)" strokeWidth="2.4" strokeLinejoin="round" />
            <path d={NAKHCHIVAN} fill="url(#land)" stroke="url(#edge)" strokeWidth="2.4" strokeLinejoin="round" />
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
              const label = true;
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
          </>
        )}
      </svg>

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl bg-iris-canvas/70 px-3.5 py-2 ring-1 ring-iris-border backdrop-blur-sm">
        <span className="text-[11px] font-medium text-clinical">{ru ? "Центры по всему Азербайджану" : "Bütün Azərbaycan üzrə mərkəzlər"}</span>
        <span className="flex items-center gap-1.5 text-[11px] text-pearl/70">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint-vital" />
          {VARIANT === "rayons" ? `${coveredCount} ${ru ? "районов" : "rayon"}` : `${markers.length} ${ru ? "городов" : "şəhər"}`}
        </span>
      </div>
    </div>
  );
}
