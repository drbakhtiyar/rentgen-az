import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { readFileSync } from "fs";
import { createHash, randomUUID } from "crypto";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }) });
const name = "20260821230000_doctor_rich_profile";
const sql = readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8");
// QEYD (2026-08-21): əvvəlki filter startsWith("--") ilə İLK ifadəni
// (başında şərh blokları olan ALTER-i) atırdı → careerStartYear yaranmamışdı,
// canlıda getCurrentUser yıxılırdı. Şərh sətirləri əvvəlcə təmizlənməlidir.
for (const stmt of sql
  .split(";")
  .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
  .filter(Boolean))
  await prisma.$executeRawUnsafe(stmt);
await prisma.$executeRawUnsafe(
  `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
   VALUES ($1, $2, $3, now(), now(), 1) ON CONFLICT DO NOTHING`,
  randomUUID(), createHash("sha256").update(sql).digest("hex"), name,
);
console.log("migration applied");
await prisma.$disconnect();
