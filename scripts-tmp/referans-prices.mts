/**
 * Referans şəbəkəsi Bakı filialları — rentgen qiymətləri idxalı (2026-08-21).
 * Mənbə: ~/Downloads/Rentgen-Nəsimi.xlsx (53 sətir, Nəsimi filialının siyahısı;
 * istifadəçi: «bakıda yerləşən, həmçinin Sea Breeze-də olan Referanslarda»).
 * Hər xidmət üzrə bir neçə variant (proyeksiyalar) olduqda min–max aralığı yazılır.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }) });

// Bakı şəhərində yerləşən Referans mərkəzləri (Abşeron/region filialları DAXİL DEYİL)
const CENTER_NAMES = [
  "Referans Mərdəkan Hospital",
  "Referans Hayat Hospital",
  "Referans Klinik Laboratoriya Mərkəzi",
  "Referans Nəsimi Filialı",
  "Referans Əhmədli Filialı",
  "Referans Bayıl Filialı",
  "Referans Yasamal Filialı",
  "Referans Sea Breeze Hospital",
  // 2026-08-21 istifadəçi əlavəsi: Abşeron filialları da eyni qiymətlərlə
  "Referans Masazır Filialı",
  "Referans Xırdalan Tibb Mərkəzi",
];

// xlsx sətri → xidmət slug xəritəsi (variantlar eyni sluga yığılır)
const ROWS: [string, number][] = [
  ["dos-qefesi-rentgeni", 30], ["dos-qefesi-rentgeni", 14],
  ["ayaq-rentgeni", 60], ["ayaq-rentgeni", 30], ["ayaq-rentgeni", 45],
  ["bel-onurgasi-rentgeni", 40], ["bel-onurgasi-rentgeni", 40], ["bel-onurgasi-rentgeni", 50],
  ["bilek-rentgeni", 40], ["bilek-rentgeni", 30],
  ["baldir-rentgeni", 45],
  ["dos-qefesi-rentgenoskopiyasi", 25],
  ["agciyer-rentgeni", 40],
  ["tam-onurga-rentgeni", 60], ["tam-onurga-rentgeni", 50],
  ["boyun-onurgasi-rentgeni", 25], ["boyun-onurgasi-rentgeni", 25], ["boyun-onurgasi-rentgeni", 40],
  ["daban-rentgeni", 35],
  ["topuq-rentgeni", 30], ["topuq-rentgeni", 45],
  ["canaq-rentgeni", 40],
  ["quyruq-sumuyu-koksiks-rentgeni", 30],
  ["bud-rentgeni", 40], ["bud-rentgeni", 50],
  ["diaqnostik-mammoqrafiya", 100],
  ["dos-onurgasi-rentgeni", 45], ["dos-onurgasi-rentgeni", 30],
  ["sternum-dos-sumuyu-rentgeni", 40],
  ["ciyin-rentgeni", 35], ["ciyin-rentgeni", 45],
  ["mede-bagirsaq-kontrast-muayinesi", 60], ["mede-bagirsaq-kontrast-muayinesi", 50],
  ["korpucuk-sumuyu-rentgeni", 30],
  ["burun-sumukleri-rentgeni", 30],
  ["paranazal-sinuslarin-rentgeni", 40],
  ["omba-oynagi-rentgeni", 50], ["omba-oynagi-rentgeni", 40], ["omba-oynagi-rentgeni", 40],
  ["kelle-rentgeni", 40], ["kelle-rentgeni", 30], ["kelle-rentgeni", 30],
  ["ayaq-barmaqlari-rentgeni", 30],
  ["barmaq-rentgeni", 35],
  ["irriqoskopiya", 40],
  ["dirsek-rentgeni", 40],
  ["said-sumukleri-rentgeni", 40],
  ["el-rentgeni", 35],
  ["diz-rentgeni", 45],
  ["bazu-rentgeni", 45],
  // yeni xidmətlər (aşağıda yaradılır)
  ["unvanda-rentgen-xidmeti", 110],
  ["qarin-boslugu-rentgeni", 40],
];
// QEYD: REN-266 «Rentgen xidməti (saatlıq)» (100₼) pasiyent-yönlü xidmət
// deyil (B2B/əməliyyatxana) — kataloqa salınmadı.

// Yeni xidmətlər
const NEW_SERVICES = [
  { slug: "unvanda-rentgen-xidmeti", name: "Ünvanda rentgen xidməti", category: "Floroskopiya", order: 915, icon: "House" },
  { slug: "qarin-boslugu-rentgeni", name: "Qarın boşluğu rentgeni", category: "Sinə", order: 415, icon: "Scan" },
];

async function main() {
  // 1) Yeni xidmətlər (varsa toxunma)
  for (const ns of NEW_SERVICES) {
    const ex = await prisma.service.findUnique({ where: { slug: ns.slug } });
    if (!ex) {
      await prisma.service.create({ data: ns });
      console.log("✚ yeni xidmət:", ns.name);
    } else console.log("· xidmət mövcuddur:", ns.slug);
  }

  // 2) slug → {min,max}
  const range = new Map<string, { min: number; max: number }>();
  for (const [slug, p] of ROWS) {
    const r = range.get(slug);
    if (!r) range.set(slug, { min: p, max: p });
    else { r.min = Math.min(r.min, p); r.max = Math.max(r.max, p); }
  }

  const services = await prisma.service.findMany({
    where: { slug: { in: [...range.keys()] } }, select: { id: true, slug: true },
  });
  const bySlug = new Map(services.map((s) => [s.slug, s.id]));
  const missing = [...range.keys()].filter((s) => !bySlug.has(s));
  if (missing.length) { console.error("TAPILMAYAN SLUG:", missing); process.exit(1); }

  // 3) Mərkəzlər
  const centers = await prisma.centerProfile.findMany({
    where: { name: { in: CENTER_NAMES } }, select: { id: true, name: true },
  });
  if (centers.length !== CENTER_NAMES.length) {
    console.error("Mərkəz sayı uyğun gəlmir:", centers.map((c) => c.name));
    process.exit(1);
  }

  // 4) Upsert
  let created = 0, updated = 0;
  for (const c of centers) {
    for (const [slug, r] of range) {
      const serviceId = bySlug.get(slug)!;
      const data = { price: r.min, priceTo: r.max > r.min ? r.max : null };
      const ex = await prisma.centerService.findUnique({
        where: { centerId_serviceId: { centerId: c.id, serviceId } },
      });
      if (ex) { await prisma.centerService.update({ where: { id: ex.id }, data }); updated++; }
      else { await prisma.centerService.create({ data: { centerId: c.id, serviceId, ...data } }); created++; }
    }
    console.log("✓", c.name);
  }
  console.log(`Xidmət aktivləşdirildi (yeni): ${created}, qiymət yeniləndi: ${updated}`);
  console.log("Xidmət sayı:", range.size, "| aralıqlar:");
  for (const [s, r] of range) console.log(`  ${s}: ${r.min}${r.max > r.min ? "–" + r.max : ""} ₼`);
}
main().finally(() => prisma.$disconnect());
