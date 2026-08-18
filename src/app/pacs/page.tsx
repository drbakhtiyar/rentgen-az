import type { Metadata } from "next";
import Link from "next/link";
import { ScanEye, ShieldCheck, HardDrive, ArrowRight } from "lucide-react";

/**
 * pacs.rentgen.az kök səhifəsi (2026-08-19) — DICOM görüntü arxivi (PACS)
 * subdomeninin giriş nöqtəsi. Viewer hələ pre-launch (yalnız Dr. Bəxtiyar,
 * bax viewer-access.ts); bu səhifə subdomeni rəsmiləşdirir və ana saytın
 * dublikatı olmasının qarşısını alır. Launch-da buradan giriş axını qurulacaq.
 */

export const metadata: Metadata = {
  title: "PACS — rentgen.az görüntü arxivi",
  robots: { index: false, follow: false },
};

export default function PacsHomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-observatory px-6 text-center text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-20" />
      <div className="relative max-w-xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-clinical/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-clinical">
          <ScanEye className="h-4 w-4" /> PACS
        </span>
        <h1 className="font-display mt-6 text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
          rentgen.az görüntü arxivi
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ash-2">
          DICOM baxış, ölçmə və paylaşma sistemi hazırlanır. Mərkəzlər rentgen
          fayllarını buludda saxlayır, həkim və pasiyentlər nəticələrə
          brauzerdən baxır — heç bir proqram qurmadan.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-pearl/70">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-mint-vital" /> Girişə nəzarətli saxlama
          </span>
          <span className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-mint-vital" /> Buludda arxiv
          </span>
        </div>
        <div className="mt-10">
          <Link
            href="https://rentgen.az"
            className="inline-flex items-center gap-2 rounded-full bg-iris-pulse px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-iris-glow"
          >
            rentgen.az-a keç <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
