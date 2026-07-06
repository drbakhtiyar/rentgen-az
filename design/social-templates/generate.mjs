// Generates the REN-28 social brand templates (SVG source + PNG previews).
// Run: node design/social-templates/generate.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = dirname(fileURLToPath(import.meta.url));

// ---- Brand tokens, copied verbatim from src/app/globals.css ----
const C = {
  ink950: "#050b1a",
  ink900: "#0a1124",
  ink800: "#0f1a35",
  ink700: "#16244a",
  brand400: "#4a9dff",
  brand500: "#1f7aff",
  brand600: "#0a5ff0",
  cyan400: "#2ad4e6",
  cyan500: "#11bdd4",
  surface: "#f6f9ff",
  surface2: "#eef3fb",
  gridLight: "rgba(31,122,255,0.07)",
  gridDark: "rgba(122,170,255,0.08)",
};
const FONT_DISPLAY = "Plus Jakarta Sans, Inter, sans-serif";
const FONT_SANS = "Inter, sans-serif";

// lucide-react "ScanLine" path data (viewBox 0 0 24 24), stroke-based icon
const SCANLINE_PATHS = [
  "M3 7V5a2 2 0 0 1 2-2h2",
  "M17 3h2a2 2 0 0 1 2 2v2",
  "M21 17v2a2 2 0 0 1-2 2h-2",
  "M7 21H5a2 2 0 0 1-2-2v-2",
  "M7 12h10",
];

function scanIcon(x, y, size, color, strokeWidth = 2) {
  const scale = size / 24;
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    ${SCANLINE_PATHS.map((d) => `<path d="${d}"/>`).join("\n    ")}
  </g>`;
}

function gridPattern(id, color, cell) {
  return `<pattern id="${id}" width="${cell}" height="${cell}" patternUnits="userSpaceOnUse">
    <path d="M ${cell} 0 L 0 0 0 ${cell}" fill="none" stroke="${color}" stroke-width="1"/>
  </pattern>`;
}

function glow(id, color) {
  return `<radialGradient id="${id}" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="${color}" stop-opacity="0.45"/>
    <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
  </radialGradient>`;
}

// Frozen "scan sweep" accent band — echoes .scanline::after keyframe motif
function scanlineBand(width, y, height, opacity = 0.5) {
  return `<rect x="0" y="${y}" width="${width}" height="${height}" fill="url(#scanBand)" opacity="${opacity}"/>`;
}

// Logo lockup. theme "dark" = for placement on ink-900 bg (footer treatment,
// translucent badge + white wordmark). theme "light" = for placement on white/
// surface bg (header treatment, solid ink-900 badge + ink-900 wordmark).
function logoLockup({ x, y, scale = 1, theme = "dark" }) {
  const badge = 72 * scale;
  const radius = 20 * scale;
  const iconSize = 40 * scale;
  const gap = 20 * scale;
  const fontSize = 40 * scale;
  const badgeFill = theme === "dark" ? "rgba(255,255,255,0.1)" : C.ink900;
  const iconColor = C.cyan400;
  const wordColor = theme === "dark" ? "#ffffff" : C.ink900;
  const azColor = theme === "dark" ? C.brand400 : C.brand600;
  const textX = x + badge + gap;
  const textY = y + badge / 2 + fontSize * 0.34;
  return `<g>
    <rect x="${x}" y="${y}" width="${badge}" height="${badge}" rx="${radius}" fill="${badgeFill}"/>
    ${scanIcon(x + (badge - iconSize) / 2, y + (badge - iconSize) / 2, iconSize, iconColor, 1.7 * scale)}
    <text x="${textX}" y="${textY}" font-family="${FONT_DISPLAY}" font-weight="700" font-size="${fontSize}" letter-spacing="-0.5">
      <tspan fill="${wordColor}">Rentgen</tspan><tspan fill="${azColor}">.az</tspan>
    </text>
  </g>`;
}

function pill(x, y, w, h, text, { bg, border, color, fontSize = 24 }) {
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${bg}" ${border ? `stroke="${border}" stroke-width="2"` : ""}/>
    <text x="${x + w / 2}" y="${y + h / 2 + fontSize * 0.35}" text-anchor="middle" font-family="${FONT_SANS}" font-weight="700" font-size="${fontSize}" letter-spacing="2" fill="${color}">${text}</text>
  </g>`;
}

function pageDots(count, current, cx, y) {
  const r = 7;
  const gap = 26;
  const startX = cx - ((count - 1) * gap) / 2;
  let out = "";
  for (let i = 0; i < count; i++) {
    const active = i === current;
    out += `<circle cx="${startX + i * gap}" cy="${y}" r="${active ? r + 2 : r}" fill="${active ? C.cyan500 : "rgba(10,17,36,0.16)"}"/>`;
  }
  return out;
}

function safeZoneGuide(width, storyHeight) {
  // Instagram Story unsafe zones: ~250px top (profile/close), ~250px bottom (reply bar)
  const zone = 250;
  return `<g id="safe-zone-guides" opacity="0.55">
    <rect x="0" y="0" width="${width}" height="${zone}" fill="none" stroke="${C.cyan400}" stroke-width="2" stroke-dasharray="10 10"/>
    <text x="32" y="${zone - 24}" font-family="${FONT_SANS}" font-size="20" fill="${C.cyan400}">Təhlükəsiz zona deyil (profil/başlıq UI-si)</text>
    <rect x="0" y="${storyHeight - zone}" width="${width}" height="${zone}" fill="none" stroke="${C.cyan400}" stroke-width="2" stroke-dasharray="10 10"/>
    <text x="32" y="${storyHeight - 24}" font-family="${FONT_SANS}" font-size="20" fill="${C.cyan400}">Təhlükəsiz zona deyil (cavab paneli)</text>
  </g>`;
}

function darkDefs() {
  return `
    ${gridPattern("gridDark", C.gridDark, 48)}
    ${glow("glowCyan", C.cyan400)}
    ${glow("glowBrand", C.brand500)}
    <linearGradient id="scanBand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.cyan400}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${C.cyan400}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${C.cyan400}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="headlineGradient" x1="0%" y1="0%" x2="100%" y2="30%">
      <stop offset="0%" stop-color="${C.brand600}"/>
      <stop offset="100%" stop-color="${C.cyan500}"/>
    </linearGradient>`;
}

function lightDefs() {
  return `
    ${gridPattern("gridLight", C.gridLight, 44)}
    ${glow("glowCyanLight", C.cyan400)}
    <linearGradient id="headlineGradientLight" x1="0%" y1="0%" x2="100%" y2="30%">
      <stop offset="0%" stop-color="${C.brand600}"/>
      <stop offset="100%" stop-color="${C.cyan500}"/>
    </linearGradient>`;
}

// ============================================================
// 1. CAROUSEL — Cover slide (1080x1080)
// ============================================================
function carouselCover() {
  const W = 1080, H = 1080;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>${darkDefs()}</defs>
  <rect width="${W}" height="${H}" fill="${C.ink900}"/>
  <rect width="${W}" height="${H}" fill="url(#gridDark)"/>
  <circle cx="${W - 60}" cy="60" r="360" fill="url(#glowCyan)"/>
  <circle cx="40" cy="${H - 40}" r="320" fill="url(#glowBrand)"/>
  ${scanlineBand(W, 300, 190, 0.35)}

  ${logoLockup({ x: 80, y: 80, scale: 0.72, theme: "dark" })}

  ${pill(80, 250, 340, 56, "MAARİFLƏNDİRİCİ", { bg: "rgba(42,212,230,0.12)", border: "rgba(42,212,230,0.35)", color: C.cyan400, fontSize: 22 })}

  <text x="80" y="470" font-family="${FONT_DISPLAY}" font-weight="800" font-size="76" fill="#ffffff" letter-spacing="-1">
    <tspan x="80" dy="0">[ Başlıq bura</tspan>
    <tspan x="80" dy="88">yazılacaq ]</tspan>
  </text>
  <text x="80" y="620" font-family="${FONT_SANS}" font-size="32" fill="rgba(255,255,255,0.68)">
    <tspan x="80" dy="0">[ Alt başlıq / bir cümləlik kontekst —</tspan>
    <tspan x="80" dy="44">SMM tərəfindən doldurulacaq ]</tspan>
  </text>

  <text x="80" y="${H - 76}" font-family="${FONT_SANS}" font-weight="700" font-size="28" fill="rgba(255,255,255,0.5)">1/5</text>
  <g>
    <text x="${W - 80}" y="${H - 76}" text-anchor="end" font-family="${FONT_SANS}" font-weight="700" font-size="24" letter-spacing="2" fill="${C.cyan400}">SÜRÜŞDÜR</text>
    <g transform="translate(${W - 44} ${H - 92})" stroke="${C.cyan400}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M0 8 L10 8 M5 3 L10 8 L5 13"/>
    </g>
  </g>
</svg>`;
}

// ============================================================
// 2. CAROUSEL — Body slide (1080x1080) — reusable for slides 2-4
// ============================================================
function carouselBody({ index = 2, total = 5 } = {}) {
  const W = 1080, H = 1080;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>${lightDefs()}</defs>
  <rect width="${W}" height="${H}" fill="${C.surface}"/>
  <rect width="${W}" height="${H}" fill="url(#gridLight)"/>
  <circle cx="${W + 40}" cy="${H + 20}" r="340" fill="url(#glowCyanLight)" opacity="0.5"/>

  ${pill(80, 80, 132, 56, `0${index}`, { bg: C.ink900, color: C.cyan400, fontSize: 24 })}

  <text x="80" y="270" font-family="${FONT_DISPLAY}" font-weight="800" font-size="56" fill="${C.ink900}" letter-spacing="-0.5">
    <tspan x="80" dy="0">[ Bu slaydın</tspan>
    <tspan x="80" dy="64">başlığı ]</tspan>
  </text>

  <text x="80" y="440" font-family="${FONT_SANS}" font-size="30" fill="#3a4a6b" line-height="1.6">
    <tspan x="80" dy="0">[ Bədən mətni — 3-5 qısa cümlə.</tspan>
    <tspan x="80" dy="46">Diaqnoz/nəticə vədi olan ifadələr</tspan>
    <tspan x="80" dy="46">işlətmə; sadəcə məlumatlandırıcı,</tspan>
    <tspan x="80" dy="46">maarifləndirici ton saxla. ]</tspan>
  </text>

  ${logoLockup({ x: W - 80 - 56, y: H - 80 - 56, scale: 0.44, theme: "light" })}
  ${pageDots(total, index - 1, W / 2, H - 76)}
  <text x="80" y="${H - 68}" font-family="${FONT_SANS}" font-weight="600" font-size="24" fill="rgba(10,17,36,0.4)">0${index}/0${total}</text>
</svg>`;
}

// ============================================================
// 3. CAROUSEL — CTA / closing slide (1080x1080)
// ============================================================
function carouselCta() {
  const W = 1080, H = 1080;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>${darkDefs()}</defs>
  <rect width="${W}" height="${H}" fill="${C.ink900}"/>
  <rect width="${W}" height="${H}" fill="url(#gridDark)"/>
  <circle cx="${W / 2}" cy="${H / 2 - 40}" r="440" fill="url(#glowCyan)" opacity="0.55"/>
  ${scanlineBand(W, H / 2 - 210, 170, 0.4)}

  ${logoLockup({ x: W / 2 - 220, y: 300, scale: 1.15, theme: "dark" })}

  <text x="${W / 2}" y="620" text-anchor="middle" font-family="${FONT_DISPLAY}" font-weight="800" font-size="54" fill="#ffffff" letter-spacing="-0.5">
    rentgen.az-da mərkəz tapın
  </text>
  <text x="${W / 2}" y="672" text-anchor="middle" font-family="${FONT_SANS}" font-size="28" fill="rgba(255,255,255,0.65)">
    [ Dəvət cümləsi — SMM tərəfindən doldurulacaq ]
  </text>

  <g>
    <rect x="${W / 2 - 190}" y="740" width="380" height="92" rx="46" fill="url(#headlineGradient)"/>
    <text x="${W / 2}" y="797" text-anchor="middle" font-family="${FONT_DISPLAY}" font-weight="700" font-size="32" fill="${C.ink900}">rentgen.az →</text>
  </g>

  <text x="80" y="${H - 76}" font-family="${FONT_SANS}" font-weight="700" font-size="28" fill="rgba(255,255,255,0.5)">5/5</text>
  <text x="${W - 80}" y="${H - 76}" text-anchor="end" font-family="${FONT_SANS}" font-size="26" fill="rgba(255,255,255,0.4)">@rentgen.az</text>
</svg>`;
}

// ============================================================
// 4. STORY (1080x1920) — single-message format
// ============================================================
function story() {
  const W = 1080, H = 1920;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>${darkDefs()}</defs>
  <rect width="${W}" height="${H}" fill="${C.ink900}"/>
  <rect width="${W}" height="${H}" fill="url(#gridDark)"/>
  <circle cx="${W / 2}" cy="420" r="480" fill="url(#glowCyan)" opacity="0.5"/>
  <circle cx="${W / 2}" cy="${H - 420}" r="420" fill="url(#glowBrand)" opacity="0.4"/>
  ${scanlineBand(W, 860, 200, 0.4)}

  ${logoLockup({ x: W / 2 - 155, y: 340, scale: 0.85, theme: "dark" })}

  ${pill(W / 2 - 190, 500, 380, 60, "XATIRLATMA", { bg: "rgba(42,212,230,0.12)", border: "rgba(42,212,230,0.35)", color: C.cyan400, fontSize: 24 })}

  <text x="${W / 2}" y="720" text-anchor="middle" font-family="${FONT_DISPLAY}" font-weight="800" font-size="72" fill="#ffffff" letter-spacing="-1">
    <tspan x="${W / 2}" dy="0">[ Qısa mesaj</tspan>
    <tspan x="${W / 2}" dy="82">başlığı ]</tspan>
  </text>
  <text x="${W / 2}" y="880" text-anchor="middle" font-family="${FONT_SANS}" font-size="32" fill="rgba(255,255,255,0.68)">
    <tspan x="${W / 2}" dy="0">[ Bir-iki cümləlik dəstəkləyici</tspan>
    <tspan x="${W / 2}" dy="44">mətn bura yazılacaq ]</tspan>
  </text>

  <g>
    <rect x="${W / 2 - 260}" y="1540" width="520" height="104" rx="52" fill="rgba(255,255,255,0.08)" stroke="${C.cyan400}" stroke-width="2"/>
    <text x="${W / 2}" y="1604" text-anchor="middle" font-family="${FONT_SANS}" font-weight="700" font-size="30" letter-spacing="1" fill="${C.cyan400}">[ Keçid / Sürüşdür yuxarı ]</text>
  </g>

  ${safeZoneGuide(W, H)}
</svg>`;
}

// ============================================================
// 5. QUOTE / TRUST CARD (1080x1080)
// ============================================================
function quoteCard() {
  const W = 1080, H = 1080;
  const cardX = 100, cardY = 100, cardW = W - 200, cardH = H - 200;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${lightDefs()}
    <linearGradient id="cardBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${C.brand600}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${C.cyan500}" stop-opacity="0.25"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${C.surface2}"/>
  <rect width="${W}" height="${H}" fill="url(#gridLight)"/>
  <circle cx="60" cy="60" r="260" fill="url(#glowCyanLight)" opacity="0.4"/>

  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="44" fill="#ffffff" stroke="url(#cardBorder)" stroke-width="2"/>

  ${pill(cardX + 64, cardY + 64, 130, 52, "SUAL", { bg: "rgba(17,189,212,0.1)", border: "rgba(17,189,212,0.3)", color: C.cyan500, fontSize: 22 })}
  <text x="${cardX + 64}" y="${cardY + 208}" font-family="${FONT_SANS}" font-weight="600" font-size="34" fill="#3a4a6b">
    <tspan x="${cardX + 64}" dy="0">[ Sual mətni bura yazılacaq —</tspan>
    <tspan x="${cardX + 64}" dy="46">pasiyentin real sorğusu ]</tspan>
  </text>

  <line x1="${cardX + 64}" y1="${cardY + 320}" x2="${cardX + cardW - 64}" y2="${cardY + 320}" stroke="${C.surface2}" stroke-width="3"/>

  ${pill(cardX + 64, cardY + 356, 150, 52, "CAVAB", { bg: C.ink900, color: C.cyan400, fontSize: 22 })}
  <text x="${cardX + 64}" y="${cardY + 500}" font-family="${FONT_DISPLAY}" font-weight="700" font-size="42" fill="${C.ink900}">
    <tspan x="${cardX + 64}" dy="0">[ Cavab mətni bura —</tspan>
    <tspan x="${cardX + 64}" dy="56">2-3 aydın, sakitləşdirici</tspan>
    <tspan x="${cardX + 64}" dy="56">cümlə. Diaqnoz/nəticə</tspan>
    <tspan x="${cardX + 64}" dy="56">vədi vermə. ]</tspan>
  </text>

  ${logoLockup({ x: cardX + 64, y: cardY + cardH - 64 - 56, scale: 0.44, theme: "light" })}
  <text x="${cardX + cardW - 64}" y="${cardY + cardH - 92}" text-anchor="end" font-family="${FONT_SANS}" font-size="22" fill="rgba(10,17,36,0.38)">Pasiyent məlumatlandırması</text>
</svg>`;
}

// ---- write files + render PNG previews ----
const targets = [
  ["carousel/01-cover.svg", carouselCover()],
  ["carousel/02-body.svg", carouselBody({ index: 2, total: 5 })],
  ["carousel/03-cta.svg", carouselCta()],
  ["story/01-story.svg", story()],
  ["quote-card/01-quote-card.svg", quoteCard()],
];

for (const [relPath, svg] of targets) {
  const full = join(ROOT, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, svg, "utf8");
}

await Promise.all(
  targets.map(async ([relPath]) => {
    const svgPath = join(ROOT, relPath);
    const pngPath = join(dirname(svgPath), "png", relPath.split("/").pop().replace(".svg", ".png"));
    mkdirSync(dirname(pngPath), { recursive: true });
    await sharp(svgPath).png().toFile(pngPath);
    console.log("rendered", pngPath);
  })
);

console.log("done");
