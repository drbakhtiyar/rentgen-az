import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { SERVICE_ICON_URLS } from "../src/lib/service-icon-map";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }) });
const services = await prisma.service.findMany({ where: { isActive: true }, select: { slug: true, name: true } });
const missing = services.filter((s) => !SERVICE_ICON_URLS[s.slug]);
console.log("Aktiv xidmət:", services.length, "| ikonlu:", services.length - missing.length, "| ikonsuz:", missing.length);
for (const m of missing) console.log(" -", m.name, `(${m.slug})`);
await prisma.$disconnect();
