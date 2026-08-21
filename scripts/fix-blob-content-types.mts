/**
 * Blob-da uzantısı ilə əsl formatı uyğun gəlməyən şəkillərin Content-Type-ını
 * düzəldir. Fayl adları və URL-lər DƏYİŞMİR (eyni pathname-ə overwrite) —
 * bazadakı istinadlar toxunulmaz qalır. Baytlar da eynidir; yalnız metadata.
 */
import { config } from "dotenv";
config(); config({ path: ".env.local", override: true });
import { list, put } from "@vercel/blob";
const token = process.env.BLOB_READ_WRITE_TOKEN!;
const DRY = process.argv.includes("--dry");

const sniff = (b: Buffer): string | null => {
  if (b.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) return "image/png";
  if (b[0]===0xff && b[1]===0xd8 && b[2]===0xff) return "image/jpeg";
  if (b.subarray(0,4).toString()==="RIFF" && b.subarray(8,12).toString()==="WEBP") return "image/webp";
  if (b.subarray(0,3).toString()==="GIF") return "image/gif";
  if (b.subarray(0,5).toString().trim().startsWith("<svg") || b.subarray(0,5).toString().includes("<?xml")) return "image/svg+xml";
  if (b.subarray(0,4).toString()==="%PDF") return "application/pdf";
  return null;
};

let fixed = 0, ok = 0;
for (const prefix of ["center-images/", "center-logos/", "centers/", "blog-covers/"]) {
  let cursor: string | undefined;
  do {
    const r = await list({ prefix, cursor, limit: 1000, token });
    for (const b of r.blobs) {
      const res = await fetch(b.url);
      if (!res.ok) { console.log(`  ! ${b.pathname} HTTP ${res.status}`); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      const real = sniff(buf);
      const served = (res.headers.get("content-type") ?? "").split(";")[0];
      if (!real || real === served) { ok++; continue; }
      console.log(`  ${DRY ? "·" : "✓"} ${b.pathname}\n      serve: ${served || "(yox)"} → əsl: ${real}`);
      if (!DRY) {
        await put(b.pathname, buf, {
          access: "public", addRandomSuffix: false, contentType: real,
          cacheControlMaxAge: 31536000, allowOverwrite: true, token,
        });
      }
      fixed++;
    }
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
}
console.log(`\n${DRY ? "[DRY] " : ""}düzəldilən: ${fixed} | onsuz da doğru: ${ok}`);
