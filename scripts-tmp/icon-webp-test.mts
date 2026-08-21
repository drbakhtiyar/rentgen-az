import sharp from "sharp";
const BLOB = "https://e0laauvwfyekwbiy.public.blob.vercel-storage.com/service-icons";
const slug = process.argv[2] ?? "bazu-rentgeni";
const res = await fetch(`${BLOB}/${slug}.png`);
const buf = Buffer.from(await res.arrayBuffer());
const meta = await sharp(buf).metadata();
const out: string[] = [];
for (const size of [1024, 768]) {
  const b = await sharp(buf).resize(size, size, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer();
  out.push(`${size}:${(b.length/1024).toFixed(0)}KB`);
}
console.log(`${slug} png ${(buf.length/1048576).toFixed(2)}MB ${meta.width}x${meta.height} ${meta.channels}ch → ${out.join("  ")}`);
