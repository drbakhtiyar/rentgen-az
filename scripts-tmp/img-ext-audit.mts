import { config } from "dotenv";
config(); config({ path: ".env.local", override: true });
import { list } from "@vercel/blob";
const token = process.env.BLOB_READ_WRITE_TOKEN!;
const SIG: [string, (b: Buffer) => boolean][] = [
  ["png",  b => b.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))],
  ["jpg",  b => b[0]===0xff && b[1]===0xd8 && b[2]===0xff],
  ["webp", b => b.subarray(0,4).toString()==="RIFF" && b.subarray(8,12).toString()==="WEBP"],
  ["gif",  b => b.subarray(0,3).toString()==="GIF"],
  ["avif", b => b.subarray(4,8).toString()==="ftyp"],
];
const prefixes = ["center-images/", "center-logos/", "centers/", "blog-covers/"];
const bad: string[] = [];
for (const prefix of prefixes) {
  let cursor: string | undefined;
  do {
    const r = await list({ prefix, cursor, limit: 1000, token });
    for (const b of r.blobs) {
      const ext = (b.pathname.split(".").pop() ?? "").toLowerCase();
      const known = ["png","jpg","jpeg","webp","gif","avif"];
      const res = await fetch(b.url, { headers: { Range: "bytes=0-31" } });
      const head = Buffer.from(await res.arrayBuffer());
      const real = SIG.find(([, f]) => f(head))?.[0] ?? "?";
      const declared = ext === "jpeg" ? "jpg" : ext;
      if (!known.includes(ext)) { bad.push(`${b.pathname}  → uzantı YOX, əsl: ${real}`); continue; }
      if (real !== "?" && real !== declared) bad.push(`${b.pathname}  → uzantı .${ext}, əsl: ${real}  (blob)`);
    }
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  console.log("yoxlandı:", prefix);
}
console.log(`\n=== uyğunsuz: ${bad.length}`);
for (const l of bad) console.log("  ", l);
