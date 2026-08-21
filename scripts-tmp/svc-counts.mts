import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }) });
const total = await prisma.service.count();
const active = await prisma.service.count({ where: { isActive: true } });
const inactive = await prisma.service.findMany({ where: { isActive: false }, select: { name: true, slug: true } });
console.log({ total, active });
console.log("Deaktiv:", inactive);
await prisma.$disconnect();
