import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { SERVICES, CITIES } from "../src/lib/constants";
import { blogPosts } from "../src/content/blog-posts";
import { normalizePhone } from "../src/lib/phone";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ---- Services ----
  for (const s of SERVICES) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      create: {
        slug: s.slug,
        name: s.name,
        shortName: s.shortName,
        description: s.description,
        icon: s.icon,
        category: s.category,
        order: s.order,
        isActive: true,
      },
      update: {
        name: s.name,
        shortName: s.shortName,
        description: s.description,
        icon: s.icon,
        category: s.category,
        order: s.order,
      },
    });
  }
  console.log(`✓ ${SERVICES.length} services`);

  // ---- Cities ----
  for (const c of CITIES) {
    await prisma.city.upsert({
      where: { slug: c.slug },
      create: { name: c.name, slug: c.slug, order: c.order, isActive: true },
      update: { name: c.name, order: c.order },
    });
  }
  console.log(`✓ ${CITIES.length} cities`);

  // ---- Blog posts ----
  for (const p of blogPosts) {
    await prisma.blogPost.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        content: p.content,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        tags: p.tags,
        published: true,
        publishedAt: new Date(),
      },
      update: {
        title: p.title,
        excerpt: p.excerpt,
        content: p.content,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        tags: p.tags,
        published: true,
      },
    });
  }
  console.log(`✓ ${blogPosts.length} blog posts`);

  // ---- Admin user ----
  const adminPhone = normalizePhone(process.env.ADMIN_PHONE || "+994500000000");
  if (adminPhone) {
    await prisma.user.upsert({
      where: { phone: adminPhone },
      create: { phone: adminPhone, role: "ADMIN" },
      update: { role: "ADMIN" },
    });
    console.log(`✓ admin user (${adminPhone})`);
  }

  // ---- Demo centers ----
  const services = await prisma.service.findMany();
  const svc = (slug: string) => services.find((s) => s.slug === slug);

  const demoCenters = [
    {
      slug: "baki-dental-imaging-center",
      name: "Baku Dental Imaging Center",
      phone: "+994501112233",
      whatsapp: "+994501112233",
      city: "Bakı — Nəsimi",
      address: "Nəsimi rayonu, 28 May küç. 12",
      workingHours: "B.e–Şənbə 09:00–19:00",
      responsiblePerson: "Dr. Elçin Məmmədov",
      equipment: "CBCT (3D), panoramik və sefalometrik aparat",
      description:
        "Müasir CBCT və panoramik görüntüləmə avadanlığı ilə təchiz olunmuş diaqnostika mərkəzi. Nəticələr rəqəmsal formada təqdim olunur.",
      services: [
        { slug: "3d-tomoqrafiya", price: 60, priceTo: 90 },
        { slug: "cbct", price: 60, priceTo: 90 },
        { slug: "panoramik-rentgen", price: 20 },
        { slug: "sefalometrik-rentgen", price: 20 },
        { slug: "implant-tomoqrafiya", price: 70 },
      ],
    },
    {
      slug: "yasamal-rentgen-merkezi",
      name: "Yasamal Rentgen Mərkəzi",
      phone: "+994552223344",
      whatsapp: "+994552223344",
      city: "Bakı — Yasamal",
      address: "Yasamal rayonu, Şərifzadə küç. 45",
      workingHours: "B.e–Cümə 09:00–18:00",
      responsiblePerson: "Dr. Günel Əliyeva",
      equipment: "Panoramik və dental rentgen aparatı",
      description:
        "Dental və panoramik rentgen xidmətləri üzrə ixtisaslaşmış mərkəz.",
      services: [
        { slug: "dental-rentgen", price: 10 },
        { slug: "dis-rentgeni", price: 10 },
        { slug: "panoramik-rentgen", price: 18 },
        { slug: "agil-disi-rentgeni", price: 15 },
      ],
    },
    {
      slug: "nerimanov-3d-diagnostika",
      name: "Nərimanov 3D Diaqnostika",
      phone: "+994703334455",
      whatsapp: "+994703334455",
      city: "Bakı — Nərimanov",
      address: "Nərimanov rayonu, Atatürk pr. 88",
      workingHours: "Hər gün 09:00–20:00",
      responsiblePerson: "Dr. Rəşad Hüseynov",
      equipment: "Yeni nəsil CBCT aparatı, aşağı doza rejimi",
      description:
        "İmplant və ortodontik planlama üçün 3D tomoqrafiya üzrə ixtisaslaşmış mərkəz.",
      services: [
        { slug: "3d-tomoqrafiya", price: 65 },
        { slug: "cbct", price: 65 },
        { slug: "implant-tomoqrafiya", price: 75 },
        { slug: "ortodontiya-rentgeni", price: 25 },
        { slug: "cene-sumuyu-analizi", price: 70 },
        { slug: "sinus-cene-anatomiyasi", price: 75 },
      ],
    },
  ];

  for (const [i, dc] of demoCenters.entries()) {
    const phone = normalizePhone(dc.phone)!;
    const user = await prisma.user.upsert({
      where: { phone },
      create: { phone, role: "CENTER" },
      update: { role: "CENTER" },
    });

    const center = await prisma.centerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        slug: dc.slug,
        name: dc.name,
        phone,
        whatsapp: normalizePhone(dc.whatsapp),
        city: dc.city,
        address: dc.address,
        workingHours: dc.workingHours,
        responsiblePerson: dc.responsiblePerson,
        equipment: dc.equipment,
        description: dc.description,
        status: "APPROVED",
      },
      update: { status: "APPROVED", name: dc.name, city: dc.city },
    });

    // reset services for idempotency
    await prisma.centerService.deleteMany({ where: { centerId: center.id } });
    await prisma.centerService.createMany({
      data: dc.services
        .filter((s) => svc(s.slug))
        .map((s) => ({
          centerId: center.id,
          serviceId: svc(s.slug)!.id,
          price: s.price ?? null,
          priceTo: "priceTo" in s ? (s.priceTo ?? null) : null,
        })),
      skipDuplicates: true,
    });
    console.log(`✓ demo center ${i + 1}: ${dc.name}`);
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
