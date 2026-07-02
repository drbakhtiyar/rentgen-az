/**
 * Bloq yazıları üçün AI cover şəkilləri generasiya edir.
 *
 * Axın: Postgres-dən cover-i olmayan dərc edilmiş yazıları götürür →
 * OpenAI Images API ilə şəkil yaradır → Vercel Blob-a yükləyir →
 * BlogPost.coverImage sahəsini yeniləyir.
 *
 * Env:
 *   DATABASE_URL          Postgres bağlantısı (tələb olunur)
 *   OPENAI_API_KEY        OpenAI açarı; boşdursa Supabase Vault-dan
 *                         (vault.decrypted_secrets, adı "openai_api_key") oxunur
 *   BLOB_READ_WRITE_TOKEN Vercel Blob tokeni (tələb olunur)
 *   IMAGE_MODEL           default "gpt-image-2"; tapılmasa gpt-image-1-ə düşür
 *   IMAGE_QUALITY         low | medium | high (default: medium)
 *   LIMIT                 ən yeni N yazı; 0 = hamısı (default: 0)
 *   OVERWRITE             "true" → mövcud cover-ləri də yenidən yaradır
 *   DRY_RUN               "true" → şəkil yaratmadan nə ediləcəyini göstərir
 */
import pg from "pg";
import { put } from "@vercel/blob";

const {
  DATABASE_URL,
  BLOB_READ_WRITE_TOKEN,
  IMAGE_MODEL = "gpt-image-2",
  IMAGE_QUALITY = "medium",
  LIMIT = "0",
  OVERWRITE = "false",
  DRY_RUN = "false",
} = process.env;

if (!DATABASE_URL) fail("DATABASE_URL boşdur");
if (!BLOB_READ_WRITE_TOKEN) fail("BLOB_READ_WRITE_TOKEN boşdur");

const overwrite = OVERWRITE === "true";
const dryRun = DRY_RUN === "true";
const limit = Math.max(0, parseInt(LIMIT, 10) || 0);

function fail(msg) {
  console.error(`XƏTA: ${msg}`);
  process.exit(1);
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

try {
  const where = overwrite
    ? `published = true`
    : `published = true AND ("coverImage" IS NULL OR "coverImage" = '')`;
  const { rows: posts } = await client.query(
    `SELECT id, slug, title, excerpt, tags
       FROM "BlogPost"
      WHERE ${where}
      ORDER BY "publishedAt" DESC NULLS LAST
      ${limit > 0 ? `LIMIT ${limit}` : ""}`,
  );
  console.log(`${posts.length} yazı üçün cover generasiya ediləcək.`);
  if (posts.length === 0) {
    const { rows } = await client.query(
      `SELECT count(*)::int AS total FROM "BlogPost" WHERE published = true`,
    );
    console.log(
      `Qeyd: bazada cəmi ${rows[0].total} dərc edilmiş yazı var` +
        (rows[0].total === 0 ? " — baza seed edilməyib?" : " — hamısının cover-i mövcuddur."),
    );
  }

  const openaiKey = posts.length > 0 && !dryRun ? await resolveOpenAiKey() : null;

  let ok = 0;
  const failures = [];
  for (const post of posts) {
    console.log(`\n→ ${post.slug}`);
    if (dryRun) {
      console.log(`  [dry-run] prompt: ${buildPrompt(post).slice(0, 140)}…`);
      continue;
    }
    try {
      const image = await generateImage(openaiKey, buildPrompt(post));
      const blob = await put(`blog-covers/${post.slug}.webp`, image.buffer, {
        access: "public",
        token: BLOB_READ_WRITE_TOKEN,
        contentType: image.contentType,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      await client.query(
        `UPDATE "BlogPost" SET "coverImage" = $1, "updatedAt" = now() WHERE id = $2`,
        [blob.url, post.id],
      );
      ok += 1;
      console.log(`  ✓ ${blob.url} (model: ${image.model})`);
    } catch (err) {
      failures.push(post.slug);
      console.error(`  ✗ ${post.slug}: ${err.message}`);
    }
  }

  console.log(`\nNəticə: ${ok} uğurlu, ${failures.length} uğursuz.`);
  if (failures.length > 0) {
    console.error(`Uğursuz: ${failures.join(", ")}`);
    process.exit(1);
  }
} finally {
  await client.end();
}

/** OPENAI_API_KEY env-də yoxdursa Supabase Vault-dan oxu. */
async function resolveOpenAiKey() {
  if (process.env.OPENAI_API_KEY) {
    console.log("OpenAI açarı env-dən götürüldü.");
    return process.env.OPENAI_API_KEY;
  }
  try {
    const { rows } = await client.query(
      `SELECT name, decrypted_secret
         FROM vault.decrypted_secrets
        WHERE lower(name) LIKE '%openai%'
        ORDER BY created_at DESC
        LIMIT 1`,
    );
    if (rows.length > 0 && rows[0].decrypted_secret) {
      console.log(`OpenAI açarı Supabase Vault-dan götürüldü (ad: ${rows[0].name}).`);
      return rows[0].decrypted_secret.trim();
    }
    await diagnoseMissingKey();
    fail(
      "Supabase Vault-da openai açarı tapılmadı. Vault-a 'openai_api_key' adlı secret əlavə edin, " +
        "yaxud GitHub repo secret kimi OPENAI_API_KEY təyin edin.",
    );
  } catch (err) {
    if (err.code === "42P01" || /vault/.test(err.message)) {
      fail(
        `Supabase Vault oxuna bilmədi (${err.message}). Açar Vault-da deyilsə (məs. Edge Functions ` +
          "secrets bölməsindədirsə), oradan SQL ilə oxumaq mümkün deyil — GitHub repo secret kimi " +
          "OPENAI_API_KEY əlavə edin.",
      );
    }
    throw err;
  }
}

/** Açar tapılmayanda harada ola biləcəyini araşdırır (dəyərləri çap etmir). */
async function diagnoseMissingKey() {
  console.log("\nDiaqnostika — açar bazanın harasındadır?");
  const probes = [
    ["Vault-dakı bütün secret adları", `SELECT name FROM vault.secrets ORDER BY created_at DESC LIMIT 20`],
    [
      "Adında 'secret/setting/config' olan cədvəllər",
      `SELECT table_schema || '.' || table_name AS t FROM information_schema.tables
        WHERE table_name ~* 'secret|setting|config|env' AND table_schema NOT IN ('pg_catalog','information_schema')`,
    ],
    [
      "Adında 'openai/api_key' olan sütunlar",
      `SELECT table_schema || '.' || table_name || '.' || column_name AS c FROM information_schema.columns
        WHERE column_name ~* 'openai|api_key' AND table_schema NOT IN ('pg_catalog','information_schema')`,
    ],
  ];
  for (const [label, sql] of probes) {
    try {
      const { rows } = await client.query(sql);
      console.log(`  ${label}: ${rows.length ? rows.map((r) => Object.values(r)[0]).join(", ") : "(boş)"}`);
    } catch (err) {
      console.log(`  ${label}: sorğu alınmadı (${err.message})`);
    }
  }
  console.log(
    "Qeyd: açar Supabase-də Edge Functions → Secrets bölməsinə əlavə olunubsa, SQL ilə oxumaq mümkün deyil.\n",
  );
}

function buildPrompt(post) {
  const topic = [post.title, post.excerpt].filter(Boolean).join(" — ");
  return (
    `Editorial cover illustration for a dental radiology blog article. Topic: "${topic}". ` +
    `Style: clean, modern flat vector illustration with soft gradients; calm professional medical ` +
    `palette of deep navy blue, cyan and white; subtle abstract X-ray / radiology motifs (panoramic ` +
    `dental X-ray shapes, tooth silhouettes, scan lines, soft glow); minimal, uncluttered composition ` +
    `with generous negative space; premium healthcare aesthetic. Absolutely no text, no letters, no ` +
    `words, no numbers, no logos, no watermarks anywhere in the image.`
  );
}

/** İstənilən modeli sınayır, tapılmasa fallback siyahısına keçir. */
async function generateImage(apiKey, prompt) {
  const models = [...new Set([IMAGE_MODEL, "gpt-image-2", "gpt-image-1"])];
  let lastErr;
  for (const model of models) {
    try {
      const buffer = await requestImage(apiKey, model, prompt);
      return { buffer, model, contentType: "image/webp" };
    } catch (err) {
      lastErr = err;
      if (err.status === 400 || err.status === 403 || err.status === 404) {
        console.log(`  model "${model}" alınmadı (${err.status}) — növbəti sınanır…`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

async function requestImage(apiKey, model, prompt) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: "1536x1024",
      quality: IMAGE_QUALITY,
      output_format: "webp",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`OpenAI ${res.status}: ${body.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI cavabında b64_json yoxdur");
  return Buffer.from(b64, "base64");
}
