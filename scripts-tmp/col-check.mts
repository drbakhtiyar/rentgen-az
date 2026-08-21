import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 1 }) });
const r = await prisma.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_name='DoctorProfile' AND column_name IN ('careerStartYear','education','courses','workHistory','expertise')`);
console.log(JSON.stringify(r));
await prisma.$disconnect();
