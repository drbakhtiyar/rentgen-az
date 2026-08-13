import type { NextConfig } from "next";

/**
 * Təhlükəsizlik başlıqları (2026-08-14 auditi, Faza 4). CSP QƏSDƏN
 * qoyulmayıb — Next.js inline skriptləri, Google Analytics, Vercel Blob və
 * xəritə üçün nonce-lu siyasət ayrıca mərhələdə hazırlanmalıdır; yarımçıq CSP
 * saytı sındıra bilər. Aşağıdakılar isə davranışı dəyişmir, yalnız qoruma
 * əlavə edir.
 */
const securityHeaders = [
  // Klikjekinq: sayt yalnız öz mənşəyində çərçivəyə salına bilər
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // MIME-sniffing bağlanır
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer sızması azaldılır (xarici saytlara yalnız origin gedir)
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // HSTS — 1 il, subdomenlər daxil (crm.rentgen.az da HTTPS-dədir)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Cihaz icazələri: heç bir səhifədə kamera/mikrofon/ödəniş API lazım deyil
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=(), interest-cohort=()" },
  // Başqa mənşədən resurs oğurlanmasının qarşısı (şəkillər üçün icazəli)
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // "X-Powered-By: Next.js" — texnologiya ifşası
  images: {
    remotePatterns: [
      // Bloq cover şəkilləri Vercel Blob-da saxlanılır
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Girişsiz token səhifələri və panel linkləri indekslənməməlidir
      {
        source: "/:prefix(q|f|m|panel|bot-sinaq|admin-giris)/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
};

export default nextConfig;
