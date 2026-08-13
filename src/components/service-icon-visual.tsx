import Image from "next/image";

/**
 * Xidmət detal səhifəsinin başlıq vizualı (2026-08-14) — premium anatomik
 * ikon canlandırılır: haşiyə boyunca gəzən siyan işıq (conic beam), üzərindən
 * süzülən skan zolağı, künc nişanları və yüngül üzmə. Saf CSS; reduced-motion
 * rejimində hərəkət dayanır, təsvir yerində qalır.
 */
export function ServiceIconVisual({ url, alt }: { url: string; alt: string }) {
  return (
    <div className="relative h-64 w-64 motion-safe:animate-floaty xl:h-72 xl:w-72">
      {/* haşiyə boyunca fırlanan işıq — kartın ətrafında nazik hərəkət */}
      <div className="beam-ring absolute -inset-px rounded-3xl" />

      <div className="relative h-full w-full overflow-hidden rounded-3xl bg-[#0d1330] ring-1 ring-iris-border shadow-[0_28px_64px_-24px_rgba(64,60,213,0.6)]">
        <Image src={url} alt={alt} fill sizes="288px" priority className="object-cover" />

        {/* skan zolağı — rentgen aparatının işığı kimi süzülür */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 h-20 bg-gradient-to-b from-transparent via-clinical/30 to-transparent motion-safe:animate-[hero-scan_4.5s_ease-in-out_infinite]" />
        </div>

        {/* künc nişanları — «kadr fokusu» hissi */}
        <span className="pointer-events-none absolute left-3 top-3 h-5 w-5 rounded-tl-md border-l-2 border-t-2 border-clinical/60" />
        <span className="pointer-events-none absolute right-3 top-3 h-5 w-5 rounded-tr-md border-r-2 border-t-2 border-clinical/60" />
        <span className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 rounded-bl-md border-b-2 border-l-2 border-clinical/60" />
        <span className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 rounded-br-md border-b-2 border-r-2 border-clinical/60" />

        {/* aktivlik nöqtəsi */}
        <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-mint-vital shadow-[0_0_10px_2px_rgba(0,255,170,0.7)] motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
