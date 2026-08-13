import Image from "next/image";

const HERO =
  "https://e0laauvwfyekwbiy.public.blob.vercel-storage.com/site/services-hero.png";

/**
 * /xidmetler başlığındakı canlı vizual (2026-08-14) — şəffaf PNG üzərinə
 * qatlar: nəfəs alan halo, iki əks istiqamətdə fırlanan halqa (biri qırıq-qırıq,
 * üzərində «skan nöqtəsi»), üstündən keçən skan zolağı və yüngül üzmə.
 * Hamısı CSS — kitabxana yoxdur; prefers-reduced-motion-da hər şey dayanır.
 */
export function ServicesHeroVisual() {
  return (
    <div className="relative h-[19rem] w-[19rem] shrink-0 xl:h-[22rem] xl:w-[22rem]">
      {/* nəfəs alan halo */}
      <div className="absolute inset-6 rounded-full bg-clinical/15 blur-3xl motion-safe:animate-[halo-breathe_5s_ease-in-out_infinite]" />

      {/* xarici halqa — skan nöqtəsi ilə saat əqrəbi istiqamətində */}
      <div className="absolute inset-0 rounded-full border border-clinical/25 motion-safe:animate-[spin_26s_linear_infinite]">
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-clinical shadow-[0_0_14px_3px_rgba(0,177,255,0.8)]" />
      </div>

      {/* daxili qırıq-qırıq halqa — əks istiqamətdə (Word Highlight Box dili) */}
      <div className="absolute inset-[1.15rem] rounded-full border border-dashed border-iris-veil/40 motion-safe:animate-[spin_38s_linear_infinite_reverse]" />

      {/* mint qövs — canlılıq nişanı */}
      <div className="absolute inset-[2.4rem] rounded-full border-2 border-transparent border-t-mint-vital/50 motion-safe:animate-[spin_16s_linear_infinite]" />

      {/* əsas təsvir — yüngül üzür */}
      <div className="absolute inset-[2.2rem] motion-safe:animate-floaty">
        <Image
          src={HERO}
          alt="Rentgen, tomoqrafiya və USM xidmətləri"
          fill
          sizes="352px"
          priority
          className="object-contain drop-shadow-[0_0_28px_rgba(0,177,255,0.35)]"
        />
      </div>

      {/* skan zolağı — dairə içində yuxarıdan aşağı süzülür */}
      <div className="pointer-events-none absolute inset-[2.2rem] overflow-hidden rounded-full">
        <div className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-clinical/25 to-transparent motion-safe:animate-[hero-scan_4.5s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
