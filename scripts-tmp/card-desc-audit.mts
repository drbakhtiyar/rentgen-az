import { config } from "dotenv";
config(); config({ path: ".env.local", override: true });
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { readFileSync, writeFileSync } from "node:fs";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const gen = JSON.parse(readFileSync("src/content/services-generated.json", "utf8"));

const rows = await prisma.service.findMany({
  where: { isActive: true },
  select: { slug: true, name: true, shortName: true, description: true, category: true },
  orderBy: [{ category: "asc" }, { name: "asc" }],
});

const BOILER = "Bakıda bu müayinəni göstərən təsdiqlənmiş mərkəzlər";
const firstSentence = (t: string) => {
  const m = /^([\s\S]+?[.!?])(\s|$)/.exec(t.trim());
  return (m ? m[1] : t.trim()).replace(/\s+/g, " ");
};

const out = rows.map(r => {
  const intro: string | undefined = gen[r.slug]?.az?.intro;
  return {
    slug: r.slug,
    name: r.name,
    category: r.category ?? "-",
    boiler: !!r.description && r.description.includes(BOILER),
    current: r.description ?? "",
    proposed: intro ? firstSentence(intro) : null,
  };
});

const boiler = out.filter(o => o.boiler);
console.log(`aktiv xidmət: ${rows.length}`);
console.log(`şablon təsvirli: ${boiler.length}`);
console.log(`onlardan intro mətni olan: ${boiler.filter(b => b.proposed).length}`);
console.log(`intro-suz (əl ilə yazılmalı): ${boiler.filter(b => !b.proposed).length}`);
const byCat: Record<string, number> = {};
for (const b of boiler) byCat[b.category] = (byCat[b.category] ?? 0) + 1;
console.log("kateqoriya üzrə:", JSON.stringify(byCat, null, 0));
writeFileSync("/tmp/card-desc.json", JSON.stringify(boiler, null, 2));
console.log("→ /tmp/card-desc.json");
await prisma.$disconnect();
