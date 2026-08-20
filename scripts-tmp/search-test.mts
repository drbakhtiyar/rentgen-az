import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }) });
const foldAz = (s: string, eAsA = false) => s.toLowerCase().replace(/i̇/g,"i").replace(/ə/g, eAsA?"a":"e").replace(/[ıî]/g,"i").replace(/ö/g,"o").replace(/ü/g,"u").replace(/ç/g,"c").replace(/ş/g,"s").replace(/ğ/g,"g").replace(/q/g,"g").replace(/\s+/g," ").trim();
const foldQuery = (q: string) => foldAz(q).replace(/sh/g,"s").replace(/ch/g,"c").replace(/gh/g,"g").replace(/kh/g,"x");
for (const q of ["ayag rentgeni", "ayaq rentgeni", "el rentgeni", "bas kt"]) {
  const nq = foldQuery(q);
  const services = await prisma.service.findMany({ select: { id: true, name: true } });
  const hits = services.filter(sv => foldAz(sv.name).includes(nq) || foldAz(sv.name,true).includes(nq));
  console.log(q, "→", hits.map(h=>h.name));
}
await prisma.$disconnect();
