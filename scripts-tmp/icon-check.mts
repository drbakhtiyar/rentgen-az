import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }) });
const withIcon = await prisma.service.findMany({ where: { iconUrl: { not: null } }, select: { slug: true, iconUrl: true }, take: 5 });
console.log(withIcon);
const noIcon = await prisma.service.findMany({ where: { iconUrl: null }, select: { slug: true, name: true } });
console.log("ICONSUZ:", noIcon.length);
for (const s of noIcon) console.log(" -", s.name);
await prisma.$disconnect();
