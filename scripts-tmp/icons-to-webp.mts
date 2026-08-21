/**
 * service-icons/*.png → service-icons/*.webp (768px, q82).
 * Köhnə PNG-lərə TOXUNMUR — yalnız yanına .webp yükləyir. Kod xəritəsi
 * (src/lib/service-icon-map.ts) ayrıca .webp-ə keçirilir; nəsə səhv olsa
 * uzantını geri qaytarmaq kifayətdir.
 */
import { config } from "dotenv";
config(); config({ path: ".env.local", override: true });
import sharp from "sharp";
import { put, list } from "@vercel/blob";
import { SERVICE_ICON_URLS } from "../src/lib/service-icon-map";

const SIZE = 768;
const QUALITY = 82;
const token = process.env.BLOB_READ_WRITE_TOKEN!;

// Artıq yüklənmiş .webp-ləri atlamaq üçün mövcud siyahı
const existing = new Set<string>();
{
  let cursor: string | undefined;
  do {
    const r = await list({ prefix: "service-icons/", cursor, limit: 1000, token });
    for (const b of r.blobs) existing.add(b.pathname);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
}
console.log(`mövcud service-icons faylı: ${existing.size}`);

const entries = Object.entries(SERVICE_ICON_URLS);
let pngBytes = 0, webpBytes = 0, done = 0, skipped = 0;
const failures: string[] = [];

for (const [slug, url] of entries) {
  const target = `service-icons/${slug}.webp`;
  if (existing.has(target)) { skipped++; continue; }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const src = Buffer.from(await res.arrayBuffer());
    const out = await sharp(src)
      .resize(SIZE, SIZE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 5 })
      .toBuffer();
    await put(target, out, {
      access: "public",
      addRandomSuffix: false,
      contentType: "image/webp",
      cacheControlMaxAge: 31536000,
      token,
      allowOverwrite: true,
    });
    pngBytes += src.length; webpBytes += out.length; done++;
    console.log(`  ✓ ${slug.padEnd(40)} ${(src.length/1048576).toFixed(2)}MB → ${(out.length/1024).toFixed(0)}KB`);
  } catch (e) {
    failures.push(`${slug}: ${(e as Error).message}`);
    console.log(`  ✗ ${slug}: ${(e as Error).message}`);
  }
}

console.log(`\n=== ${done} çevrildi, ${skipped} atlandı, ${failures.length} xəta`);
if (done) console.log(`PNG ${(pngBytes/1048576).toFixed(1)}MB → WebP ${(webpBytes/1048576).toFixed(1)}MB  (${(pngBytes/webpBytes).toFixed(1)}× kiçik)`);
for (const f of failures) console.log("  !", f);
