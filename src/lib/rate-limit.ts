import "server-only";

import { prisma } from "@/lib/db";

/**
 * Sadə paylaşılan sürət limiti (2026-08-14 təhlükəsizlik auditi).
 *
 * Vercel serverless-də yaddaşdaxili sayğac işləmir (hər instansiya ayrıdır),
 * ona görə sayğac bazadadır. Hər sorğuya CƏMİ 1 baza əməliyyatı düşür:
 * `(bucket)` üzrə upsert — yeni pəncərədə sətir yaranır, mövcudda artırılır.
 * Köhnə sətirləri gecə cronu silir (`/api/cron/purge-trash`).
 *
 * QAYDA: limit AŞILANDA da sorğu heç vaxt "partlamır" — baza əlçatmazdırsa
 * `allowed: true` qaytarılır (fail-open). Məqsəd sui-istifadəni yavaşlatmaqdır,
 * əsl avtorizasiya deyil; auth həmişə ayrıca yoxlanır.
 */

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSec: number };

/** Sorğudan ziyarətçi IP-si (Vercel `x-forwarded-for` zəncirinin ilk ünvanı). */
export function clientIp(req: Request | { headers: Headers }): string {
  const h = "headers" in req ? req.headers : new Headers();
  const fwd = h.get("x-forwarded-for") ?? "";
  const first = fwd.split(",")[0]?.trim();
  return first || h.get("x-real-ip") || "unknown";
}

/**
 * @param key     endpoint adı, məs. "app:whoami"
 * @param subject kimlik — adətən IP (və ya `ip:phone`)
 * @param limit   pəncərədə icazə verilən maksimum sorğu
 * @param windowSec pəncərə uzunluğu (saniyə)
 */
export async function rateLimit(
  key: string,
  subject: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowId = Math.floor(now / (windowSec * 1000));
  const bucket = `${key}:${subject}:${windowId}`;
  const expiresAt = new Date((windowId + 1) * windowSec * 1000);
  try {
    const row = await prisma.rateLimit.upsert({
      where: { bucket },
      create: { bucket, count: 1, expiresAt },
      update: { count: { increment: 1 } },
      select: { count: true },
    });
    const remaining = Math.max(0, limit - row.count);
    return {
      allowed: row.count <= limit,
      remaining,
      retryAfterSec: Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)),
    };
  } catch {
    // Baza problemi istifadəçini bloklamamalıdır
    return { allowed: true, remaining: limit, retryAfterSec: 0 };
  }
}

/** 429 cavabı üçün standart gövdə + başlıq. */
export function tooManyRequests(retryAfterSec: number): Response {
  return new Response(
    JSON.stringify({ ok: false, error: "Çox sayda sorğu. Bir azdan yenidən cəhd edin." }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(retryAfterSec),
        "cache-control": "no-store",
      },
    },
  );
}
