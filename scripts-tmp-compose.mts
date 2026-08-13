import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

const S = process.env.SCRATCH!;
const W = 1536, H = 1024;

/** Sol mətn paneli + kəsik-əyri sağ foto — rentgen.az bloq örtük şablonu. */
async function makeCover(opts: {
  badge: string; line1: string; line2: string; subtitle: string; tagline: string; out: string;
}) {
  // Sağ foto: əyri sol kənarlı panel (x≈640-dan sağa)
  const photo = await sharp(`${S}/covers-gen/photo-agciyer.png`)
    .resize(980, H, { fit: "cover", position: "attention" })
    .toBuffer();

  const logoPng = readFileSync("public/mark.png");
  const logo = await sharp(logoPng).resize(110, 110, { fit: "inside" }).toBuffer();

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fbfcfe"/>
      <stop offset="1" stop-color="#eef3fa"/>
    </linearGradient>
    <clipPath id="photoClip">
      <path d="M740,-2 C 600,300 600,724 740,1026 L ${W + 2},1026 L ${W + 2},-2 Z"/>
    </clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <!-- alt sol dekorativ blob -->
  <circle cx="60" cy="1060" r="200" fill="#dbe7f7" opacity="0.7"/>
  <circle cx="-40" cy="1000" r="120" fill="#c9dcf5" opacity="0.5"/>
  <image href="data:image/png;base64,${photo.toString("base64")}" x="580" y="0" width="980" height="${H}" clip-path="url(#photoClip)" preserveAspectRatio="xMidYMid slice"/>
  <!-- loqo -->
  <image href="data:image/png;base64,${logo.toString("base64")}" x="84" y="62" width="96" height="96"/>
  <text x="200" y="118" font-family="Manrope" font-weight="800" font-size="52" fill="#12275e">rentgen<tspan fill="#2f7cf6">.az</tspan></text>
  <text x="202" y="156" font-family="Manrope" font-weight="600" font-size="17.5" letter-spacing="3.5" fill="#5b6b8c">${opts.tagline}</text>
  <!-- BLOG pill -->
  <rect x="84" y="270" rx="34" ry="34" width="188" height="68" fill="#2f7cf6"/>
  <text x="178" y="316" font-family="Manrope" font-weight="800" font-size="30" letter-spacing="2" fill="#ffffff" text-anchor="middle">${opts.badge}</text>
  <!-- Başlıq -->
  <text x="84" y="470" font-family="Manrope" font-weight="800" font-size="64" fill="#12275e">${opts.line1}</text>
  <text x="84" y="566" font-family="Manrope" font-weight="800" font-size="64" fill="#2f7cf6">${opts.line2}</text>
  <!-- ayırıcı -->
  <rect x="84" y="622" width="420" height="5" rx="2.5" fill="#2f7cf6" opacity="0.85"/>
  <!-- alt yazı -->
  <text x="84" y="708" font-family="Manrope" font-weight="600" font-size="44" fill="#243b6b">${opts.subtitle}</text>
</svg>`;

  const png = await sharp(Buffer.from(svg), { density: 96 }).png().toBuffer();
  const webp = await sharp(png).webp({ quality: 90 }).toBuffer();
  writeFileSync(`${S}/covers-gen/${opts.out}`, webp);
  console.log(opts.out, "ok");
}

await makeCover({
  badge: "BLOG",
  line1: "Ağciyər rentgeni",
  line2: "nə göstərir?",
  subtitle: "Nə vaxt KT lazımdır?",
  tagline: "DƏQİQ GÖRÜNTÜ, DƏQİQ DİAQNOZ",
  out: "agciyer-az.webp",
});
await makeCover({
  badge: "БЛОГ",
  line1: "Что показывает",
  line2: "рентген лёгких?",
  subtitle: "И когда нужна КТ?",
  tagline: "DƏQİQ GÖRÜNTÜ, DƏQİQ DİAQNOZ",
  out: "agciyer-ru.webp",
});
