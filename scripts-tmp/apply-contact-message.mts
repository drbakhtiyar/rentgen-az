import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { readFileSync } from "fs";
import { createHash, randomUUID } from "crypto";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }) });
const name = "20260822010000_contact_message";
const sql = readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8");
for (const stmt of sql.split(";").map((s) => s.replace(/^\s*--.*$/gm, "").trim()).filter(Boolean))
  await prisma.$executeRawUnsafe(stmt);
await prisma.$executeRawUnsafe(
  `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
   VALUES ($1, $2, $3, now(), now(), 1) ON CONFLICT DO NOTHING`,
  randomUUID(), createHash("sha256").update(sql).digest("hex"), name,
);
// Yoxlama
const r = await prisma.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_name='ContactMessage'`);
console.log("sütunlar:", (r as {column_name:string}[]).map(x=>x.column_name).join(","));
await prisma.$disconnect();
