import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const rows = await prisma.blogPost.findMany({
  select: { slug: true, locale: true, category: true, title: true, publishedAt: true },
  orderBy: [{ category: "asc" }, { publishedAt: "asc" }],
});
for (const loc of ["az", "ru"]) {
  console.log(`\n===== ${loc.toUpperCase()} =====`);
  for (const r of rows.filter(x => x.locale === loc))
    console.log(`${(r.category ?? "-").padEnd(13)} ${r.slug.padEnd(46)} ${r.title}`);
}
await prisma.$disconnect();
