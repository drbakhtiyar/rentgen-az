import { config } from "dotenv";
config(); config({ path: ".env.local", override: true });
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const rows = await prisma.service.findMany({ select: { slug: true, iconUrl: true }, orderBy: { slug: "asc" } });
console.log("services:", rows.length);
const withUrl = rows.filter(r => r.iconUrl);
console.log("with iconUrl:", withUrl.length);
const hosts = new Map<string, number>();
for (const r of withUrl) {
  const m = /^https?:\/\/[^/]+\/(.+)$/.exec(r.iconUrl!);
  const key = m ? m[1].split("/")[0] : "(other)";
  hosts.set(key, (hosts.get(key) ?? 0) + 1);
}
console.log("prefixes:", Object.fromEntries(hosts));
console.log("ext breakdown:", Object.fromEntries(
  withUrl.reduce((m, r) => { const e = (r.iconUrl!.split("?")[0].split(".").pop() ?? "?").toLowerCase(); m.set(e, (m.get(e) ?? 0) + 1); return m; }, new Map<string, number>())
));
console.log("sample:", withUrl.slice(0, 3).map(r => r.iconUrl));
await prisma.$disconnect();
