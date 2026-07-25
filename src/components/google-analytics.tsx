import Script from "next/script";

/**
 * Google Analytics 4 (gtag.js). Renders nothing until NEXT_PUBLIC_GA_ID is set
 * (the GA4 Measurement ID, e.g. "G-XXXXXXXXXX"). Loaded after hydration so it
 * never blocks first paint. Coexists with Vercel Analytics — both run.
 */
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`}
      </Script>
    </>
  );
}
