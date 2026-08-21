import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const rows = await prisma.blogPost.findMany({
  select: { slug: true, locale: true, category: true, published: true, coverImage: true, title: true },
  orderBy: { publishedAt: "desc" },
});
console.log("total:", rows.length);
const byLocale: Record<string, number> = {};
for (const r of rows) byLocale[r.locale] = (byLocale[r.locale] ?? 0) + 1;
console.log("by locale:", byLocale);
console.log("no cover:", rows.filter(r => !r.coverImage).length, "| no category:", rows.filter(r => !r.category).length);
for (const r of rows) console.log(` ${r.locale}  ${r.published ? "✓" : "·"}  ${(r.category ?? "-").padEnd(14)} ${r.slug}`);
await prisma.$disconnect();
