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
- **Mobil API-də sürət limiti yox idi** (2026-08-14) — `RateLimit` cədvəli + paylaşılan limiter (`src/lib/rate-limit.ts`) quruldu, 10 endpointə tətbiq edildi:
  `accounts` saatda 3 (bütün nömrələri verən registr), `whoami` dəq/20 (nömrə enumerasiyası), `ai` dəq/15 (pullu resurs), `referrals/otp` dəq/5 (SMS xərci), `support/messages` dəq/60 və `chat/send`, `support/send`, `referrals`, `center/requests`, `summary`.
  Limiter fail-open işləyir (baza problemi istifadəçini bloklamır), sayğaclar gecə cronu ilə təmizlənir.
- **İctimai «Məlumat düzgün deyil?» formasında spam qorunması yox idi** — IP başına saatda 5 bildiriş limiti.
- **Girişsiz token linkləri müddətsiz idi** (2026-08-15) — `/q /f /m` linklərinə **45 günlük müddət** verildi (`CenterProfile.priceTokenAt`); müddət bitəndə növbəti dəvətdə avtomatik YENİ token verilir, köhnə link ölür. Əlavə: token səhifələrinin açılışına (IP/saat 60) və yazma əməliyyatına (IP/saat 30) limit — token təxmini cəhdləri yavaşladılır.
- **İzləmə/axtarış hadisələrində limit yox idi** — `track`/`search` üçün IP başına saatda 120 hadisə (normal ziyarətçi bu həddə çatmır).
- **`/api/app/accounts` istifadəsi ölçülür** — söndürməzdən əvvəl köhnə tətbiq versiyalarının çağırıb-çağırmadığını görmək üçün gündəlik jurnal qeydi (`api:accounts_used`).

## IDOR / biznes məntiqi auditi (2026-08-15, kod səviyyəsində)

Ən həssas axınlar bir-bir yoxlandı — **sahiblik yoxlaması hər yerdə var**:

- **Rentgen faylları** (`getDownloadUrlAction`): mərkəzli IDOR qapısı — ADMIN / öz mərkəzi (CENTER) / aktiv asistent / **ACCEPTED partnyorluğu olan** göndərən həkim / öz sorğusunun pasiyenti. Hər endirmə `FileAuditLog`-a yazılır. Presigned URL **5 dəqiqə** yaşayır (çoxhissəli yükləmə URL-ləri 6 saat — yalnız upload üçün).
- **Viewer** (`/viewer/[fileId]`): faylı göstərməzdən əvvəl həmin qapıdan keçir; icazə yoxdursa məlumat sızmır.
- **Mərkəz sorğuları**: status dəyişikliyi, nəticə yükləmə və digər əməliyyatların hər üçündə `req.centerId !== center.id` yoxlaması var; status keçidləri birtərəflidir (terminal statuslar kilidli).
- **Çat**: söhbətə giriş `conv.centerId`/`conv.doctorId` ilə istifadəçinin profil id-si tutuşdurularaq verilir.
- **Ödəniş**: paket qiyməti **serverdə** hesablanır (`CENTER_PLAN_PRICE` + müddət endirimi) — məbləğ client-dən qəbul edilmir; callback Payriff API-dən yoxlanır. Balans artırmada minimum 1 ₼, **maksimum 10 000 ₼** (2026-08-15 əlavəsi).
- **Admin əməliyyatları**: `src/app/admin/actions.ts` içində 27 rol yoxlaması.

**Nəticə: IDOR tapılmadı.**

## Açıq risklər / növbəti addımlar

| Prioritet | Risk | Plan |
|---|---|---|
| Yüksək | **`x-app-key` statik açardır** və mobil tətbiqdən çıxarıla bilər. Sürət limiti qoyuldu (kütləvi çıxarma dayandırıldı), amma **hədəfli sorğu hələ də mümkündür**: açarı olan şəxs konkret nömrənin hesab məlumatını və dəstək yazışmasını görə bilər. | Telefon sahibliyini sübut edən qısamüddətli token (OTP → JWT) modelinə keçid. **Mobil tətbiqin yenilənməsi ilə koordinasiya tələb edir** — Worker/app tərəfi hazır olanda. |
| Yüksək | **`/api/app/accounts`** bütün həkim/mərkəz nömrələrini bir sorğuda verir. Saatda 3 limit + istifadə ölçüsü qoyulub. | **Bir ay sonra jurnala bax** (`api:accounts_used`): çağırış yoxdursa endpoint 410 ilə söndürülür. |
| Orta | **Staging bazası yoxdur** — IDOR/biznes məntiqi testlərini canlı datanı zibilləmədən aparmaq üçün lazımdır. | Supabase-də yeni layihə **$10/ay** (təşkilat Pro planındadır) — istifadəçi qərarı gözlənilir. Pulsuz alternativ: Neon/Railway free-tier Postgres. |
| Aşağı | **ZAP/Nuclei dinamik skan** — bizim stack-də (Vercel managed, Prisma parametrləşdirilmiş sorğular, React escape) gözlənilən dəyər azdır. | Staging hazır olandan sonra bir dəfəlik yekun yoxlama kimi. **Canlı sayta əsla yönəldilmir.** |
| Aşağı | **CSP yoxdur.** | Nonce-lu siyasət ayrıca hazırlanmalı (yarımçıq CSP saytı sındıra bilər). |

## Test qaydası

Avtomatik hücum-simulyasiya alətləri (OWASP ZAP, Nuclei) **yalnız staging-də** işlədilir. Canlı sayta qarşı fuzzing QADAĞANDIR: `/q /f /m` formaları autentifikasiyasız **yazır**, webhook WhatsApp mesajı göndərə bilər — fuzzer real mərkəz kartlarını korlaya bilər.
