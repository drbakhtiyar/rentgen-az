# SECURITY

rentgen.az təhlükəsizlik vəziyyəti və auditin nəticələri (ilk tam audit: 2026-08-14).

## Qurulmuş qorumalar

**CI (hər push/PR + həftəlik):** CodeQL (`security-extended`), Semgrep (OWASP Top 10 + Next.js + secrets), TruffleHog (bütün git tarixçəsi üzrə sirr axtarışı), OSV-Scanner (npm CVE), OpenSSF Scorecard. Nəticələr → GitHub **Security → Code scanning**. Dependabot həftəlik npm + Actions yeniləmələri açır.

**Şəbəkə/başlıqlar:** HSTS (1 il, subdomenlər daxil), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (kamera/mikrofon/ödəniş bağlı), `X-Powered-By` silinib. Token və panel yolları (`/q /f /m /panel /bot-sinaq /admin-giris`) `X-Robots-Tag: noindex`.

**Mühit ayrılığı:** Vercel preview deployları SSO ilə qorunur (2026-08-14-dən) — real data ictimai preview URL-də görünmür.

**Autentifikasiya:** telefon + OTP. OTP limitləri: nömrə başına 10 dəq/3 kod, IP başına saat/15 kod, yoxlamada 5 cəhd. Sessiya JWT + `sessionVersion` (blok/asistent silinməsində bütün tokenlər etibarsızlaşır). Admin girişi ayrıca 2FA ilə.

**Baza:** Supabase Data API (PostgREST) **söndürülüb** — `anon key` işlənmir, bütün giriş yalnız server tərəfdən Prisma ilədir. Bu səbəbdən RLS hücum səthi mövcud deyil.

**Ödəniş:** Payriff callback-in gövdəsinə **etibar edilmir** — ödəniş hər dəfə Payriff API-dən (`GET /orders/:id`) yoxlanır.

**Webhook:** WhatsApp `X-Hub-Signature-256` HMAC yoxlanışı (`timingSafeEqual`).

## Auditdə yoxlanılıb və təmiz çıxıb

- **Server action avtorizasiyası:** `"use server"` olan bütün fayllar yoxlandı — avtorizasiyası unudulmuş action tapılmadı (işarələnən 9 fayl legitimdir: giriş/OTP axınları, ictimai formalar, token/2FA ilə qorunanlar).
- **API route-lar:** id/slug ilə sorğu edən bütün route-larda qoruma var (`requireAppKey`, `requireRole`, `CRON_SECRET`, `apiKey`, imza).
- **Client bundle-da sirr yoxdur:** real açar dəyəri (`vercel_blob_rw_*`, `sk-proj-*`, Meta token, `postgres://`) tapılmadı.
- **Canlı endpoint yoxlaması:** `/api/app/*`, `/api/cron/*`, `/api/v1/requests`, `/api/merkez/export` → 401; `/admin`, `/panel` → 307 (girişə yönləndirmə).

## Düzəldilib

- **Admin 2FA kodu server loglarına yazılırdı** (Vercel loglarına çıxışı olan hər kəs 5 dəqiqəlik kodu görürdü) — log sətri silindi, kod yalnız e-poçtla gedir.

## Açıq risklər / növbəti addımlar

| Prioritet | Risk | Plan |
|---|---|---|
| Yüksək | **`x-app-key` statik açardır** və mobil tətbiqdən çıxarıla bilər. Açarla `/api/app/whoami` və `/api/app/support/messages` üzərindən **nömrə ilə PII və dəstək yazışmaları** əldə etmək olar. | Telefon sahibliyini sübut edən qısamüddətli token (OTP → JWT) modelinə keçmək; keçidə qədər bu endpointlərə nömrə/IP əsaslı sürət limiti. |
| Orta | **Girişsiz token formalarında (`/q /f /m`) sürət limiti yoxdur** — token təxmini praktiki deyil (128 bit), amma link ələ keçsə müddətsiz etibarlıdır. | Token üçün müddət/rotasiya + IP əsaslı limit. |
| Orta | **İctimai yazma endpointlərində limit yoxdur** (məlumat bildirişi, izləmə hadisələri, axtarış) — spam/zibil data riski. | IP əsaslı sadə limit (OTP-dəki naxışla). |
| Orta | **Staging bazası yoxdur** — dinamik test (ZAP/Nuclei) üçün şərtdir. | Sintetik datalı ayrıca Supabase layihəsi. |
| Aşağı | **CSP yoxdur.** | Nonce-lu siyasət ayrıca hazırlanmalı (yarımçıq CSP saytı sındıra bilər). |

## Test qaydası

Avtomatik hücum-simulyasiya alətləri (OWASP ZAP, Nuclei) **yalnız staging-də** işlədilir. Canlı sayta qarşı fuzzing QADAĞANDIR: `/q /f /m` formaları autentifikasiyasız **yazır**, webhook WhatsApp mesajı göndərə bilər — fuzzer real mərkəz kartlarını korlaya bilər.
