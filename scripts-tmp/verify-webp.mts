import { SERVICE_ICON_URLS } from "../src/lib/service-icon-map";
const entries = Object.entries(SERVICE_ICON_URLS);
let ok = 0; const bad: string[] = [];
for (const [slug, url] of entries) {
  const r = await fetch(url, { method: "HEAD" });
  const ct = r.headers.get("content-type");
  if (r.ok && ct === "image/webp") ok++;
  else bad.push(`${slug}: HTTP ${r.status} ${ct}`);
}
console.log(`OK: ${ok}/${entries.length}`);
for (const b of bad) console.log("  ✗", b);
