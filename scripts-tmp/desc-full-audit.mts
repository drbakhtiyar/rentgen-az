import { config } from "dotenv";
config(); config({ path: ".env.local", override: true });
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const rows = await prisma.service.findMany({ where: { isActive: true }, select: { slug: true, name: true, description: true } });

const A = "Bakıda bu müayinəni göstərən təsdiqlənmiş mərkəzlər";
const B = /^Bakıda .+ xidməti göstərən təsdiqlənmiş rentgen mərkəzləri/i;

const cls = (d: string | null) => {
  if (!d || !d.trim()) return "BOŞ";
  if (d.includes(A)) return "ŞABLON-A";
  if (B.test(d.trim())) return "ŞABLON-B";
  return "ÖZ MƏTNİ";
};
const buckets: Record<string, string[]> = {};
for (const r of rows) (buckets[cls(r.description)] ??= []).push(r.name);
for (const k of ["ŞABLON-A", "ŞABLON-B", "BOŞ", "ÖZ MƏTNİ"])
  console.log(`${k.padEnd(10)} ${String(buckets[k]?.length ?? 0).padStart(3)}`);
console.log(`${"CƏMİ".padEnd(10)} ${String(rows.length).padStart(3)}`);
console.log(`\n→ dəyişdirilməli: ${(buckets["ŞABLON-A"]?.length ?? 0) + (buckets["ŞABLON-B"]?.length ?? 0) + (buckets["BOŞ"]?.length ?? 0)}`);
console.log(`→ toxunulmayacaq (öz mətni): ${buckets["ÖZ MƏTNİ"]?.length ?? 0}`);
console.log("\nÖZ MƏTNİ olanlar (saxlanılacaq):");
for (const n of buckets["ÖZ MƏTNİ"] ?? []) console.log("  ·", n);
await prisma.$disconnect();
