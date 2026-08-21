import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 1 }) });
await prisma.$executeRawUnsafe(`ALTER TABLE "DoctorProfile" ADD COLUMN IF NOT EXISTS "careerStartYear" INTEGER`);
const r = await prisma.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_name='DoctorProfile' AND column_name='careerStartYear'`);
console.log("indi:", JSON.stringify(r));
await prisma.$disconnect();
