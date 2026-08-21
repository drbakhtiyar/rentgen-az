import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { serviceNameRu } from "../src/content/services-ru";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }) });
const services = await prisma.service.findMany({ where: { isActive: true }, select: { name: true, slug: true } });
const missing = services.filter((s) => serviceNameRu(s.name) === s.name);
console.log("RU tərcüməsi düşməyən:", missing.length);
for (const m of missing) console.log(" -", m.name);
await prisma.$disconnect();
