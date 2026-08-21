import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { readFileSync } from "fs";
import { createHash, randomUUID } from "crypto";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }) });
const name = "20260821230000_doctor_rich_profile";
const sql = readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8");
for (const stmt of sql.split(";").map((s) => s.trim()).filter((s) => s && !s.startsWith("--")))
  await prisma.$executeRawUnsafe(stmt);
await prisma.$executeRawUnsafe(
  `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
   VALUES ($1, $2, $3, now(), now(), 1) ON CONFLICT DO NOTHING`,
  randomUUID(), createHash("sha256").update(sql).digest("hex"), name,
);
console.log("migration applied");
await prisma.$disconnect();
