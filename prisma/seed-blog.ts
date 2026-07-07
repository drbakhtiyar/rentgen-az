import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { blogPosts } from "../src/content/blog-posts";

// Yalnız bloq yazılarını seed edir (xidmət/şəhər/admin-ə toxunmadan).
// Upsert slug üzrə aparılır; mövcud yazıların coverImage və publishedAt
// sahələri saxlanılır — yalnız yeni yazı əlavə olunur, mətn sahələri yenilənir.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding blog posts...");
  let created = 0;
  for (const p of blogPosts) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: p.slug },
      select: { id: true },
    });
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
    if (!existing) {
      created += 1;
      console.log(`  + ${p.slug}`);
    }
  }
  console.log(`✅ ${blogPosts.length} blog posts (${created} yeni).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
