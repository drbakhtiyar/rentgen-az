/**
 * Köhnə bildiriş linklərinin backfill-i (2026-08-20): dərin-link (?p=telefon)
 * yalnız yeni bildirişlərə düşürdü — köhnələr «/hekim/pasiyentler» qalmışdı.
 * Body-dəki pasiyent adından həkimin referral-ları üzrə telefonu tapıb linki
 * yeniləyirik. Ad tapılmasa toxunmuruq.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 });
const prisma = new PrismaClient({ adapter });

async function main() {
  const notifs = await prisma.notification.findMany({
    where: { link: "/hekim/pasiyentler" },
  });
  console.log("köhnə linkli bildiriş:", notifs.length);
  let updated = 0, skipped = 0;

  for (const n of notifs) {
    // Body formatları:
    //   "<Ad> pasiyentin rentgen faylı yükləndi."
    //   "<Ad> — <Mərkəz>: müraciət <status>."
    const body = n.body ?? "";
    const name =
      body.match(/^(.+?) pasiyentin rentgen/)?.[1]?.trim() ??
      body.match(/^(.+?) — /)?.[1]?.trim();
    if (!name || name === "Pasiyent") { skipped++; continue; }

    // Bildirişin sahibi həkimdir → onun doctorProfile-inin referral-larında adı axtar
    const doctor = await prisma.doctorProfile.findFirst({ where: { userId: n.userId }, select: { id: true } });
    if (!doctor) { skipped++; continue; }
    const ref = await prisma.appointmentRequest.findFirst({
      where: { doctorId: doctor.id, name: { equals: name, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      select: { phone: true },
    });
    if (!ref?.phone) { skipped++; continue; }
    const p = ref.phone.replace(/\D/g, "").slice(-9);
    await prisma.notification.update({
      where: { id: n.id },
      data: { link: `/hekim/pasiyentler?p=${p}` },
    });
    updated++;
    console.log(`  ✓ ${name} → ?p=${p}`);
  }
  console.log(`yeniləndi: ${updated}, ötürüldü: ${skipped}`);
}

main().finally(() => prisma.$disconnect());
