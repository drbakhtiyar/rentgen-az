// Fills the REN-28 SVG templates with the REN-26 approved 2-week calendar copy
// (weeks 1-2, 2026-07-13 -> 2026-07-26). Same visual system/brand tokens as
// generate.mjs — no redesign, just real content in place of placeholder text.
// Run: node design/social-templates/generate-content.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "content");

// ---- Brand tokens, copied verbatim from generate.mjs / src/app/globals.css ----
const C = {
  ink900: "#0a1124",
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

const SCANLINE_PATHS = [
  "M3 7V5a2 2 0 0 1 2-2h2",
  "M17 3h2a2 2 0 0 1 2 2v2",
  "M21 17v2a2 2 0 0 1-2 2h-2",
  "M7 21H5a2 2 0 0 1-2-2v-2",
  "M7 12h10",
];

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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

function scanlineBand(width, y, height, opacity = 0.5) {
  return `<rect x="0" y="${y}" width="${width}" height="${height}" fill="url(#scanBand)" opacity="${opacity}"/>`;
}

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

function pill(x, y, h, text, { bg, border, color, fontSize = 24, padX = 32 }) {
  const w = text.length * fontSize * 0.62 + padX * 2;
  return { w, svg: `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${bg}" ${border ? `stroke="${border}" stroke-width="2"` : ""}/>
    <text x="${x + w / 2}" y="${y + h / 2 + fontSize * 0.35}" text-anchor="middle" font-family="${FONT_SANS}" font-weight="700" font-size="${fontSize}" letter-spacing="2" fill="${color}">${esc(text)}</text>
  </g>` };
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

// ---- text wrapping (approximate char-width heuristic, tuned against the
// existing placeholder line lengths in generate.mjs) ----
function wrapByWords(text, maxCharsPerLine) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    if (trial.length > maxCharsPerLine && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = trial;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function fitText(text, boxWidth, sizes, { bold = false } = {}) {
  const charW = bold ? 0.6 : 0.53;
  let best = null;
  for (const fontSize of sizes) {
    const maxChars = Math.max(6, Math.floor(boxWidth / (fontSize * charW)));
    const lines = wrapByWords(text, maxChars);
    best = { fontSize, lines };
    if (lines.length <= (sizes.indexOf(fontSize) === sizes.length - 1 ? 99 : 2)) break;
  }
  return best;
}

function tspans(x, lines, lineHeight) {
  return lines.map((line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${esc(line)}</tspan>`).join("\n");
}

// ============================================================
// CAROUSEL — Cover slide (1080x1080)
// ============================================================
function carouselCover({ eyebrow, title, subtitle, pageLabel = "1/5" }) {
  const W = 1080, H = 1080;
  const eyebrowPill = pill(80, 250, 56, eyebrow, { bg: "rgba(42,212,230,0.12)", border: "rgba(42,212,230,0.35)", color: C.cyan400, fontSize: 22 });

  const { fontSize: titleFs, lines: titleLines } = fitText(title, 920, [76, 64, 56, 48], { bold: true });
  const titleLh = titleFs * 1.16;
  const titleStartY = 390 + titleFs * 0.62;
  const titleBlockH = (titleLines.length - 1) * titleLh;

  const { fontSize: subFs, lines: subLines } = fitText(subtitle, 920, [32, 28], { bold: false });
  const subLh = subFs * 1.38;
  const subStartY = titleStartY + titleBlockH + titleFs * 0.95;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>${darkDefs()}</defs>
  <rect width="${W}" height="${H}" fill="${C.ink900}"/>
  <rect width="${W}" height="${H}" fill="url(#gridDark)"/>
  <circle cx="${W - 60}" cy="60" r="360" fill="url(#glowCyan)"/>
  <circle cx="40" cy="${H - 40}" r="320" fill="url(#glowBrand)"/>
  ${scanlineBand(W, 300, 190, 0.35)}

  ${logoLockup({ x: 80, y: 80, scale: 0.72, theme: "dark" })}

  ${eyebrowPill.svg}

  <text x="80" y="${titleStartY}" font-family="${FONT_DISPLAY}" font-weight="800" font-size="${titleFs}" fill="#ffffff" letter-spacing="-1">
    ${tspans(80, titleLines, titleLh)}
  </text>
  <text x="80" y="${subStartY}" font-family="${FONT_SANS}" font-size="${subFs}" fill="rgba(255,255,255,0.68)">
    ${tspans(80, subLines, subLh)}
  </text>

  <text x="80" y="${H - 76}" font-family="${FONT_SANS}" font-weight="700" font-size="28" fill="rgba(255,255,255,0.5)">${esc(pageLabel)}</text>
  <g>
    <text x="${W - 80}" y="${H - 76}" text-anchor="end" font-family="${FONT_SANS}" font-weight="700" font-size="24" letter-spacing="2" fill="${C.cyan400}">SÜRÜŞDÜR</text>
    <g transform="translate(${W - 44} ${H - 92})" stroke="${C.cyan400}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M0 8 L10 8 M5 3 L10 8 L5 13"/>
    </g>
  </g>
</svg>`;
}

// ============================================================
// CAROUSEL — Body slide (1080x1080)
// ============================================================
function carouselBody({ index, total, heading, body }) {
  const W = 1080, H = 1080;
  const { fontSize: hFs, lines: hLines } = fitText(heading, 920, [56, 48, 42], { bold: true });
  const hLh = hFs * 1.14;
  const hStartY = 190 + hFs * 0.62;
  const hBlockH = (hLines.length - 1) * hLh;

  const { fontSize: bFs, lines: bLines } = fitText(body, 920, [30, 27, 24]);
  const bLh = bFs * 1.5;
  const bStartY = hStartY + hBlockH + hFs * 1.1;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>${lightDefs()}</defs>
  <rect width="${W}" height="${H}" fill="${C.surface}"/>
  <rect width="${W}" height="${H}" fill="url(#gridLight)"/>
  <circle cx="${W + 40}" cy="${H + 20}" r="340" fill="url(#glowCyanLight)" opacity="0.5"/>

  ${pill(80, 80, 56, `0${index}`, { bg: C.ink900, color: C.cyan400, fontSize: 24, padX: 26 }).svg}

  <text x="80" y="${hStartY}" font-family="${FONT_DISPLAY}" font-weight="800" font-size="${hFs}" fill="${C.ink900}" letter-spacing="-0.5">
    ${tspans(80, hLines, hLh)}
  </text>

  <text x="80" y="${bStartY}" font-family="${FONT_SANS}" font-size="${bFs}" fill="#3a4a6b">
    ${tspans(80, bLines, bLh)}
  </text>

  ${logoLockup({ x: W - 80 - 56, y: H - 80 - 56, scale: 0.44, theme: "light" })}
  ${pageDots(total, index - 1, W / 2, H - 76)}
  <text x="80" y="${H - 68}" font-family="${FONT_SANS}" font-weight="600" font-size="24" fill="rgba(10,17,36,0.4)">0${index}/0${total}</text>
</svg>`;
}

// ============================================================
// CAROUSEL / REEL closing card (1080x1080)
// ============================================================
function closingCard({ subtitle, buttonLabel = "rentgen.az →", pageLabel = "5/5", handle = "@rentgen.az" }) {
  const W = 1080, H = 1080;
  const { fontSize: subFs, lines: subLines } = fitText(subtitle, 820, [28, 25, 22]);
  const subLh = subFs * 1.35;

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
  <text x="${W / 2}" y="672" text-anchor="middle" font-family="${FONT_SANS}" font-size="${subFs}" fill="rgba(255,255,255,0.65)">
    ${subLines.map((l, i) => `<tspan x="${W / 2}" dy="${i === 0 ? 0 : subLh}">${esc(l)}</tspan>`).join("\n")}
  </text>

  <g>
    <rect x="${W / 2 - 190}" y="740" width="380" height="92" rx="46" fill="url(#headlineGradient)"/>
    <text x="${W / 2}" y="797" text-anchor="middle" font-family="${FONT_DISPLAY}" font-weight="700" font-size="28" fill="${C.ink900}">${esc(buttonLabel)}</text>
  </g>

  <text x="80" y="${H - 76}" font-family="${FONT_SANS}" font-weight="700" font-size="28" fill="rgba(255,255,255,0.5)">${esc(pageLabel)}</text>
  <text x="${W - 80}" y="${H - 76}" text-anchor="end" font-family="${FONT_SANS}" font-size="26" fill="rgba(255,255,255,0.4)">${esc(handle)}</text>
</svg>`;
}

// ============================================================
// STORY (1080x1920) — safe-zone-guides hidden (not rendered) before export
// ============================================================
function story({ pill: pillText, headline, subtext, buttonLabel }) {
  const W = 1080, H = 1920;
  const pillEl = pill(0, 500, 60, pillText, { bg: "rgba(42,212,230,0.12)", border: "rgba(42,212,230,0.35)", color: C.cyan400, fontSize: 24, padX: 32 });
  const pillX = W / 2 - pillEl.w / 2;

  const { fontSize: hFs, lines: hLines } = fitText(headline, 900, [72, 60, 52], { bold: true });
  const hLh = hFs * 1.14;
  const hStartY = 660 + hFs * 0.62;
  const hBlockH = (hLines.length - 1) * hLh;

  const { fontSize: sFs, lines: sLines } = fitText(subtext, 860, [32, 28, 25]);
  const sLh = sFs * 1.38;
  const sStartY = hStartY + hBlockH + hFs * 0.85;

  const btnW = Math.min(760, Math.max(420, buttonLabel.length * 20 + 120));

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>${darkDefs()}</defs>
  <rect width="${W}" height="${H}" fill="${C.ink900}"/>
  <rect width="${W}" height="${H}" fill="url(#gridDark)"/>
  <circle cx="${W / 2}" cy="420" r="480" fill="url(#glowCyan)" opacity="0.5"/>
  <circle cx="${W / 2}" cy="${H - 420}" r="420" fill="url(#glowBrand)" opacity="0.4"/>
  ${scanlineBand(W, 860, 200, 0.4)}

  ${logoLockup({ x: W / 2 - 155, y: 340, scale: 0.85, theme: "dark" })}

  <g transform="translate(${pillX} 0)">${pillEl.svg}</g>

  <text x="${W / 2}" y="${hStartY}" text-anchor="middle" font-family="${FONT_DISPLAY}" font-weight="800" font-size="${hFs}" fill="#ffffff" letter-spacing="-1">
    ${hLines.map((l, i) => `<tspan x="${W / 2}" dy="${i === 0 ? 0 : hLh}">${esc(l)}</tspan>`).join("\n")}
  </text>
  <text x="${W / 2}" y="${sStartY}" text-anchor="middle" font-family="${FONT_SANS}" font-size="${sFs}" fill="rgba(255,255,255,0.68)">
    ${sLines.map((l, i) => `<tspan x="${W / 2}" dy="${i === 0 ? 0 : sLh}">${esc(l)}</tspan>`).join("\n")}
  </text>

  <g>
    <rect x="${W / 2 - btnW / 2}" y="1540" width="${btnW}" height="104" rx="52" fill="rgba(255,255,255,0.08)" stroke="${C.cyan400}" stroke-width="2"/>
    <text x="${W / 2}" y="1604" text-anchor="middle" font-family="${FONT_SANS}" font-weight="700" font-size="26" letter-spacing="0.5" fill="${C.cyan400}">${esc(buttonLabel)}</text>
  </g>
</svg>`;
}

// ---- content data, sourced from REN-26 "calendar" doc rev.2 (approved) ----
// Editorial notes on judgment calls made while fitting copy into the fixed
// 5-slide layout are in the REN-35 issue comment, not repeated here.

const carousels = [
  {
    slug: "carousel-01-13-07-cbct-nedir",
    eyebrow: "MAARİFLƏNDİRİCİ",
    title: "CBCT nədir və nə üçün lazımdır?",
    subtitle: "rentgen.az-da 3D tomoqrafiya göstərən mərkəzləri tapın",
    ctaSubtitle: "rentgen.az-da 3D tomoqrafiya göstərən mərkəzləri tapın",
    body: [
      { heading: "Nə deməkdir?", text: "CBCT — konus-şüalı kompüter tomoqrafiya — diş və çənə strukturlarını üç ölçüdə göstərir. Adi rentgendən fərqli olaraq, həkimə strukturları müxtəlif müstəvilərdə qiymətləndirmək imkanı verir." },
      { heading: "Nə vaxt istifadə olunur?", text: "Bu üsul çox vaxt implant planlaması, mürəkkəb çəkilişlər və çənə anatomiyasının analizi zamanı tətbiq olunur." },
      { heading: "Harada tapmaq olar?", text: "Bakıda CBCT/3D tomoqrafiya göstərən mərkəzləri rentgen.az-da tapın — bio-dakı linkdən keçin." },
    ],
  },
  {
    slug: "carousel-02-15-07-panoramik-rentgen-nedir",
    eyebrow: "MAARİFLƏNDİRİCİ",
    title: "Panoramik rentgen — bütün ağız boşluğunun tək görüntüsü",
    subtitle: "Panoramik rentgen mərkəzlərini rentgen.az-da müqayisə edin",
    ctaSubtitle: "Panoramik rentgen mərkəzlərini tapın",
    body: [
      { heading: "Nə deməkdir?", text: "Panoramik rentgen bir çəkilişdə üst və alt çənəni, dişləri və ətraf strukturları tək görüntüdə göstərir. Ümumi qiymətləndirmə, ortodontik planlama və mütəmadi müayinələr üçün geniş istifadə olunur." },
      { heading: "Çəkiliş necə keçir?", text: "Çəkiliş bir neçə saniyə davam edir və xüsusi hazırlıq tələb etmir." },
      { heading: "Harada tapmaq olar?", text: "Bakıda panoramik rentgen xidməti göstərən mərkəzləri rentgen.az-da müqayisə edin." },
    ],
  },
  {
    slug: "carousel-03-20-07-dental-rentgen-tehlukelidirmi",
    eyebrow: "PASİYENT GÜVƏNİ",
    title: "Dental rentgen təhlükəlidirmi? Faktlarla baxaq",
    subtitle: "Mərkəz seçin, sualınızı əvvəlcədən aydınlaşdırın",
    ctaSubtitle: "Mərkəz seçin, sualınızı əvvəlcədən aydınlaşdırın",
    body: [
      { heading: "Doza haqqında fakt", text: "Dental rentgen zamanı istifadə olunan doza çox aşağıdır və müasir aparatlar bunu daha da azaldıb. Rentgen yalnız klinik ehtiyac olduqda, həkimin qərarı ilə çəkilir." },
      { heading: "Sualınız var?", text: "Narahatlığınız varsa, çəkilişdən əvvəl mərkəzdən doza və prosedur haqqında sual verə bilərsiniz — bu tamamilə normaldır." },
      { heading: "Harada tapmaq olar?", text: "rentgen.az-da seçdiyiniz mərkəzin xidmətləri haqqında ətraflı məlumat var." },
    ],
  },
  {
    slug: "carousel-04-22-07-implantdan-evvel-3d-tomoqrafiya",
    eyebrow: "MAARİFLƏNDİRİCİ",
    title: "İmplantdan əvvəl niyə 3D tomoqrafiya lazımdır?",
    subtitle: "3D tomoqrafiya mərkəzlərini rentgen.az-da tapın",
    ctaSubtitle: "3D tomoqrafiya mərkəzlərini tapın",
    body: [
      { heading: "Niyə lazımdır?", text: "İmplant planlamasında sümük həcmi, sinir kanallarının yeri və çənə anatomiyası dəqiq qiymətləndirilməlidir. 3D tomoqrafiya (CBCT) bunu üç ölçüdə göstərməyə imkan verir." },
      { heading: "Nə üçün faydalıdır?", text: "Bu, həkimin planlama prosesini asanlaşdırır və əməliyyatdan əvvəl daha ətraflı məlumat verir." },
      { heading: "Harada tapmaq olar?", text: "İmplant öncəsi 3D tomoqrafiya göstərən mərkəzləri rentgen.az-da tapın." },
    ],
  },
  {
    slug: "carousel-05-19-07-usaqlarda-dental-rentgen-fb",
    eyebrow: "AİLƏ ÜÇÜN",
    title: "Uşaqlarda dental rentgen nə zaman çəkilir?",
    subtitle: "Bloqu oxuyun və mərkəz tapın",
    ctaSubtitle: "Bloqu oxuyun və mərkəz tapın",
    body: [
      { heading: "Nə vaxt lazım olur?", text: "Valideynlər tez-tez soruşur: uşaqlarda dental rentgen nə vaxt lazım olur? Qərar həkim tərəfindən uşağın diş inkişafına, şikayətlərinə və klinik müayinəyə əsasən verilir — hər uşaq üçün ayrıca qiymətləndirilir." },
      { heading: "Ətraflı bloqda", text: "Bloqumuzda bu mövzunu ətraflı izah etdik: hansı hallarda həkim rentgen tövsiyə edə bilər, çəkiliş zamanı uşaq üçün nələr gözlənilir." },
      { heading: "Harada tapmaq olar?", text: "Övladınız üçün diş həkiminə müraciət edəndə rentgen lazım olarsa, rentgen.az-da uyğun mərkəzi tapa bilərsiniz." },
    ],
  },
];

const reels = [
  {
    slug: "reel-01-17-07-platform-demo-cta",
    subtitle: "Bio-dakı linkdən indi cəhd edin.",
    buttonLabel: "İndi mərkəz axtarın →",
  },
  {
    slug: "reel-02-24-07-agil-disi-rentgeni-cta",
    subtitle: "rentgen.az-da bu xidməti göstərən mərkəzləri tapın.",
    buttonLabel: "Mərkəz tapın →",
  },
];

const stories = [
  {
    slug: "story-01-14-07-doza-fakt-teaser",
    pill: "FAKT",
    headline: "Bilirdinizmi?",
    subtext: "Müasir dental rentgen aparatları aşağı doza rejimində işləyir.",
    buttonLabel: "Daha çox bil →",
  },
  {
    slug: "story-02-16-07-sorgu",
    pill: "SORĞU",
    headline: "Dental rentgen nə vaxta bir dəfə çəkilməlidir?",
    subtext: "İldə bir dəfə? Həkim desə? Dəqiq cavab üçün həkiminizlə məsləhətləşin.",
    buttonLabel: "IG sorğu stikeri buraya əlavə olunur",
  },
  {
    slug: "story-03-18-07-cta-merkez",
    pill: "DƏVƏT",
    headline: "Mərkəz axtarırsınız?",
    subtext: "rentgen.az-da bir neçə kliklə tapın.",
    buttonLabel: "Mərkəzi tap →",
  },
  {
    slug: "story-04-21-07-panoramik-recap",
    pill: "FAKT",
    headline: "Bilirdinizmi?",
    subtext: "Panoramik rentgen tək çəkilişdə bütün ağız boşluğunu göstərir.",
    buttonLabel: "Ətraflı bax →",
  },
  {
    slug: "story-05-23-07-qa-sual",
    pill: "SUAL-CAVAB",
    headline: "Sualınız var?",
    subtext: "Dental rentgen haqqında sualınız var? Bizə yazın 👇",
    buttonLabel: "IG sual stikeri buraya əlavə olunur",
  },
  {
    slug: "story-06-25-07-cbct-recap",
    pill: "FAKT",
    headline: "Bilirdinizmi?",
    subtext: "CBCT diş və çənə strukturlarını üç ölçüdə göstərir.",
    buttonLabel: "Ətraflı bax →",
  },
];

// ---- build + render ----
const targets = [];

for (const c of carousels) {
  const dir = `content/${c.slug}`;
  targets.push([`${dir}/01-cover.svg`, carouselCover({ eyebrow: c.eyebrow, title: c.title, subtitle: c.subtitle })]);
  c.body.forEach((slide, i) => {
    targets.push([`${dir}/0${i + 2}-body.svg`, carouselBody({ index: i + 2, total: 5, heading: slide.heading, body: slide.text })]);
  });
  targets.push([`${dir}/05-cta.svg`, closingCard({ subtitle: c.ctaSubtitle })]);
}

for (const r of reels) {
  targets.push([`content/${r.slug}/closing-card.svg`, closingCard({ subtitle: r.subtitle, buttonLabel: r.buttonLabel, pageLabel: "", handle: "@rentgen.az" })]);
}

for (const s of stories) {
  targets.push([`content/${s.slug}/story.svg`, story({ pill: s.pill, headline: s.headline, subtext: s.subtext, buttonLabel: s.buttonLabel })]);
}

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
  })
);

console.log(`done — ${targets.length} SVGs (+PNG previews) written under ${OUT}`);
