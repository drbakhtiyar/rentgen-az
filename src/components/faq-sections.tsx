"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { FaqAccordion } from "@/components/faq-accordion";
import type { FaqSection } from "@/content/faq";

/**
 * Çip-naviqasiyalı FAQ (istifadəçi seçimi, 2026-08-10): yuxarıda platforma
 * bölməsi, altında yapışqan çip zolağı — çipə klik → bölməyə sürüşür.
 * BÜTÜN bölmələr həmişə DOM-dadır (SEO üçün) — çiplər yalnız naviqasiyadır.
 */
export function FaqSections({
  sections,
  countSuffix,
}: {
  sections: FaqSection[];
  countSuffix: string;
}) {
  const [active, setActive] = React.useState(sections[0]?.key ?? "");

  // Skrola görə aktiv çipin izlənməsi
  React.useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id.replace("faq-", ""));
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(`faq-${s.key}`);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [sections]);

  const scrollTo = (key: string) => {
    setActive(key);
    document.getElementById(`faq-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Yapışqan çip zolağı — sürüşmə YOXDUR: qısa adlarla bükülür,
          hamısı həmişə görünür (istifadəçi rəyi: yan skrol narahat idi) */}
      <div className="sticky top-16 z-20 -mx-4 mb-8 border-b border-slate-200/70 bg-white/85 px-4 py-3 backdrop-blur-sm sm:top-[68px]">
        <div className="flex flex-wrap justify-center gap-2">
          {sections.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => scrollTo(s.key)}
              className={cn(
                "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
                active === s.key
                  ? "border-iris-glow bg-iris-glow text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-iris-veil hover:text-iris-glow",
              )}
            >
              {s.chip}
            </button>
          ))}
        </div>
      </div>

      {/* Bölmələr — hamısı renderlənir (SEO) */}
      <div className="space-y-12">
        {sections.map((s) => (
          <section key={s.key} id={`faq-${s.key}`} className="scroll-mt-36">
            <h2 className="mb-4 font-display text-lg font-bold text-ink-900 sm:text-xl">
              {s.title}
              <span className="ml-2 align-middle text-xs font-medium text-slate-400">
                {s.items.length} {countSuffix}
              </span>
            </h2>
            <FaqAccordion items={s.items} />
          </section>
        ))}
      </div>
    </div>
  );
}
