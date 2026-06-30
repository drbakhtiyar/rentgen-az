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
