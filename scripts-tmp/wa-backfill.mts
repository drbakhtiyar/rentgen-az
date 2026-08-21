/**
 * WhatsApp backfill (2026-08-21, istifadəçi istəyi): mobil nömrəsi olan amma
 * whatsapp sahəsi boş qalan mərkəzlərdə whatsapp = phone yazılır ki, saytda
 * WhatsApp düyməsi çıxsın. Nömrə normallaşdırılmış +994XX formatında olmalıdır.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }) });
const MOBILE = ["+99410","+99450","+99451","+99455","+99460","+99470","+99477","+99499"];

const DRY = process.argv.includes("--dry");
const centers = await prisma.centerProfile.findMany({
  where: {
    OR: MOBILE.map((p) => ({ phone: { startsWith: p } })),
    AND: [{ OR: [{ whatsapp: null }, { whatsapp: "" }] }],
  },
  select: { id: true, name: true, phone: true, status: true },

});
console.log("Mobil nömrəli, whatsapp-sız mərkəz:", centers.length);
for (const c of centers) {
  if (c.status === "DEACTIVATED") { console.log("· ötürüldü (deaktiv):", c.name); continue; }
  if (!DRY) await prisma.centerProfile.update({ where: { id: c.id }, data: { whatsapp: c.phone } });
  console.log(`${DRY ? "[dry]" : "✓"} ${c.name} (${c.status}) → ${c.phone}`);
}
await prisma.$disconnect();
