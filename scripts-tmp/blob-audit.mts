import { config } from "dotenv";
config();
config({ path: ".env.local", override: true });
import { list } from "@vercel/blob";
const prefixes = ["service-icons/", "center-images/", "blog-covers/", "centers/", "center-logos/"];
let grand = 0;
for (const prefix of prefixes) {
  let cursor: string | undefined;
  const items: { pathname: string; size: number }[] = [];
  do {
    const r = await list({ prefix, cursor, limit: 1000 });
    items.push(...r.blobs.map(b => ({ pathname: b.pathname, size: b.size })));
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  const total = items.reduce((a, b) => a + b.size, 0);
  grand += total;
  console.log(`\n== ${prefix}  ${items.length} fayl, ${(total/1048576).toFixed(1)} MB`);
  const big = items.filter(i => i.size > 400_000).sort((a,b) => b.size - a.size);
  console.log(`   >400KB: ${big.length} fayl`);
  for (const b of big.slice(0, 12)) console.log(`   ${(b.size/1048576).toFixed(2)} MB  ${b.pathname}`);
}
console.log(`\nCƏMİ: ${(grand/1048576).toFixed(1)} MB`);
