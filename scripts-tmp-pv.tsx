import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync } from "node:fs";
import { HeroVisual } from "./src/components/hero-visual.js";
const cities = ["Şamaxı","Qəbələ","Bakı","Gəncə","Xaçmaz","Naxçıvan","Sumqayıt","Göyçay","Quba","Tovuz","Masallı","Şirvan","Ağcabədi","Mingəçevir","Şəki","Lənkəran","Zaqatala","Salyan","Yevlax","Bərdə","Abşeron","Xankəndi","Qusar","İsmayıllı"];
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{background:#050b18;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.relative{position:relative}.aspect-square{aspect-ratio:1}.w-full{width:100%}.max-w-lg{max-width:32rem}.overflow-hidden{overflow:hidden}.rounded-3xl{border-radius:1.5rem}.border{border:1px solid}.border-white\\/10{border-color:rgba(255,255,255,.1)}.bg-ink-950{background:#050b18}.absolute{position:absolute}.inset-0{inset:0}.h-full{height:100%}.p-2{padding:.5rem}.bottom-4{bottom:1rem}.left-4{left:1rem}.right-4{right:1rem}.flex{display:flex}.items-center{align-items:center}.justify-between{justify-content:space-between}.rounded-xl{border-radius:.75rem}.bg-white\\/5{background:rgba(255,255,255,.05)}.px-3{padding-left:.75rem;padding-right:.75rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}
.bg-grid-dark{background-image:linear-gradient(rgba(120,170,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(120,170,255,.06) 1px,transparent 1px);background-size:32px 32px}
.glow,.glow-cyan{position:absolute;border-radius:50%;filter:blur(30px)}
.text-cyan-300{color:#67e8f9}.text-slate-300{color:#cbd5e1}
span{font-size:11px}
</style></head><body><div style="width:530px">${renderToStaticMarkup(React.createElement(HeroVisual, { activeCities: cities }))}</div></body></html>`;
writeFileSync("/private/tmp/claude-501/-Users-drbakhtiyar/afa109b0-1a17-4e8b-8f65-a04c88aa010d/scratchpad/hero-preview.html", html);
console.log("ok");
