import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }) });
const rows = await prisma.service.findMany({ where: { name: { contains: "yaq", mode: "insensitive" } }, select: { name: true, slug: true, _count: { select: { centerServices: true } } } });
console.log(JSON.stringify(rows, null, 1));
await prisma.$disconnect();
