# Rentgen.az — Dental rentgen & 3D tomoqrafiya platforması

Azərbaycanda (xüsusilə Bakıda) dental rentgen, panoramik rentgen, sefalometrik
rentgen və 3D dental tomoqrafiya (CBCT) xidmətləri üçün axtarış, qeydiyyat və
idarəetmə platforması.

Üç istifadəçi rolu: **Pasiyent**, **Rentgen mərkəzi**, **Admin**. Giriş parolsuz —
telefon nömrəsi + OTP (birdəfəlik kod).

## Texnologiyalar

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (premium, glassmorphism, radiology UI)
- **Prisma 7** + **PostgreSQL** (pg driver adapter)
- **OTP auth** — `jose` JWT (httpOnly cookie), DB-əsaslı rate-limit
- **Zod** validation, **lucide-react** ikonlar, **marked** (blog markdown)
- **Vercel** deploy-ready (Analytics + Speed Insights daxil)

## Tələblər

- Node.js 20+ (tövsiyə: 22/24)
- PostgreSQL bazası (Supabase / Neon / Vercel Postgres / lokal)

## Quraşdırma (lokal)

```bash
# 1. Asılılıqlar
npm install            # postinstall avtomatik `prisma generate` işlədir

# 2. Mühit dəyişənləri
cp .env.example .env   # və dəyərləri doldurun (aşağıya bax)

# 3. Verilənlər bazası sxemini tətbiq edin
npm run db:migrate     # mövcud migrasiyaları tətbiq edir (prisma migrate deploy)
# və ya inkişaf üçün:  npm run db:migrate:dev

# 4. Başlanğıc məlumatları (xidmətlər, şəhərlər, blog, demo mərkəzlər, admin)
npm run db:seed

# 5. İşə salın
npm run dev            # http://localhost:3000
```

## Mühit dəyişənləri (.env)

| Dəyişən | Təsvir | Məcburi |
|---|---|---|
| `DATABASE_URL` | Pooled Postgres bağlantısı (runtime). Supabase: port **6543**, `?pgbouncer=true` | ✅ |
| `DIRECT_URL` | Direct bağlantı (migrasiyalar). Supabase: port **5432** | ✅ |
| `AUTH_SECRET` | Sessiya JWT açarı (uzun təsadüfi sətir) | ✅ |
| `OTP_SECRET` | OTP kodlarının hash-lənməsi üçün əlavə açar | ✅ |
| `NEXT_PUBLIC_SITE_URL` | Saytın tam URL-i (canonical/sitemap/OG üçün) | ✅ |
| `SMS_PROVIDER` | `dev` \| `twilio` \| `generic` | ✅ |
| `ADMIN_PHONE` | İlk girişdə ADMIN roluna yüksəldilən nömrə | ✅ |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | `SMS_PROVIDER=twilio` üçün | ⛔ |
| `SMS_GENERIC_URL` / `SMS_GENERIC_TOKEN` / `SMS_GENERIC_SENDER` | İstənilən HTTP SMS gateway (məs. AZ provayder) üçün | ⛔ |

Təsadüfi açar yaratmaq: `openssl rand -base64 48`

### SMS / OTP provayderi

Layihə pluggable SMS adapteri ilə gəlir (`src/lib/sms.ts`):

- **`dev`** (default): real SMS göndərmir, OTP kodu server konsoluna yazır və giriş
  ekranında göstərilir. Lokal test üçün idealdır.
- **`twilio`**: Twilio REST API ilə göndərir.
- **`generic`**: `SMS_GENERIC_URL`-ə `{ to, message, sender }` JSON POST edir —
  Azərbaycan SMS provayderlərinə (məs. lsim.az və s.) asanlıqla bağlanır.

Prodakşnda real provayder seçin və müvafiq açarları doldurun.

## Skriptlər

| Skript | Funksiya |
|---|---|
| `npm run dev` | İnkişaf serveri |
| `npm run build` | `prisma generate` + prodakşn build |
| `npm start` | Prodakşn serveri |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Migrasiyaları tətbiq et (deploy) |
| `npm run db:migrate:dev` | İnkişaf migrasiyası yarat/tətbiq et |
| `npm run db:seed` | Başlanğıc məlumatları yüklə |
| `npm run db:studio` | Prisma Studio |

## Verilənlər bazası modelləri

`User`, `PatientProfile`, `CenterProfile`, `Service`, `CenterService`, `OTPCode`,
`Referral`, `AppointmentRequest`, `BlogPost`, `City`, `SeoSetting`, `AdminActionLog`.

İlk migrasiya: `prisma/migrations/0001_init/`.

## Səhifələr

**Publik:** Ana səhifə, Rentgen mərkəzləri (+ filtr), Mərkəz detalları, Xidmətlər
(+ hər xidmət üçün SEO landing), Həkimlər üçün (göndəriş forması), Mərkəzlər üçün,
Blog (+ məqalə), FAQ, Əlaqə, Gizlilik siyasəti, İstifadə şərtləri.

**Auth:** `/giris` (OTP).

**Pasiyent kabineti:** `/kabinet` (icmal, profil, seçilmişlər).

**Mərkəz kabineti:** `/merkez` (icmal, profil, xidmətlər/qiymətlər), `/merkez/qeydiyyat`.

**Admin:** `/admin` (icmal, mərkəzlər, pasiyentlər, müraciətlər, göndərişlər, blog,
parametrlər).

## SEO

- Hər səhifədə unikal meta title/description, canonical, Open Graph + Twitter card
- Dinamik OG şəkli (`app/opengraph-image.tsx`)
- JSON-LD: Organization, WebSite, BreadcrumbList, FAQPage, MedicalBusiness,
  MedicalProcedure, Article
- `sitemap.xml` (statik + xidmət + mərkəz + blog), `robots.txt`
- Azərbaycan dili (`lang="az"`, `latin-ext` şrift dəstəyi)

## Təhlükəsizlik

- OTP rate-limit (nömrə + IP üzrə), 5 dəqiqəlik etibarlılıq, hash-lənmiş saxlama
- Telefon normalizasiyası (+994 E.164)
- Server-side Zod validasiyası bütün formalarda
- Role-based access — `proxy.ts` (route qoruması) + hər səhifə/action-da `requireRole`
- Qorunan API/action-lar; spam əleyhinə limitlər (müraciət/göndəriş)

## Vercel deploy

1. Reponu GitHub-a push edin və Vercel-də import edin.
2. Vercel **Environment Variables** bölməsində yuxarıdakı dəyişənləri əlavə edin
   (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `OTP_SECRET`,
   `NEXT_PUBLIC_SITE_URL`, `SMS_PROVIDER`, `ADMIN_PHONE` + seçilən provayder açarları).
3. Build əmri default-dur (`npm run build` → `prisma generate && next build`).
4. İlk deploy-dan sonra bir dəfə migrasiyaları tətbiq edin:
   `npm run db:migrate` (lokal olaraq prod `DATABASE_URL` ilə) və ya CI addımı kimi.
5. İstəyə görə `npm run db:seed` ilə xidmət/şəhər/demo məlumatlarını yükləyin.

> Qeyd: `prisma migrate deploy` `DIRECT_URL` (pooler olmayan) bağlantıdan istifadə edir.
> Pasiyent/mərkəz girişi üçün real SMS göndərmək lazımdırsa `SMS_PROVIDER`-i
> `twilio` və ya `generic` edib açarları doldurun (əks halda `dev` rejimi işləyir).

## Admin girişi

`.env`-də `ADMIN_PHONE` təyin edin. Həmin nömrə ilə `/giris`-dən OTP ilə daxil
olduqda hesab avtomatik ADMIN roluna yüksəldilir (seed də bu nömrə üçün admin
istifadəçi yaradır).
