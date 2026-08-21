import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }) });
const s = await prisma.service.findMany({ where: { slug: { in: ["ayaq-rentgeni","irriqoskopiya","dos-qefesi-rentgenoskopiyasi"] } }, select: { slug: true, category: true, order: true, icon: true } });
console.log(s);
const cats = await prisma.service.groupBy({ by: ["category"], _count: true });
console.log(cats);
await prisma.$disconnect();
