import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }) });
const centers = await prisma.centerProfile.findMany({
  where: { name: { contains: "eferans", mode: "insensitive" } },
  select: { id: true, name: true, city: true, address: true, status: true, _count: { select: { services: true } } },
});
console.log(JSON.stringify(centers, null, 1));
const services = await prisma.service.findMany({ select: { slug: true, name: true }, orderBy: { name: "asc" } });
console.log("SERVICES", services.length);
for (const s of services) console.log(s.slug, "|", s.name);
await prisma.$disconnect();
