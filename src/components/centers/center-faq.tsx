"use client";

import { trackCenterEventAction } from "@/app/actions/track";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import type { AnsweredFaq } from "@/content/center-faq";
import type { Locale } from "@/lib/i18n";
import { FaqReportForm } from "./faq-report-form";

const T = {
  az: {
    title: (name: string) => `${name} haqqında tez-tez verilən suallar`,
    provided: (name: string) => `Məlumatlar ${name} tərəfindən təqdim edilmişdir.`,
    updated: "Son yenilənmə",
  },
  ru: {
    title: (name: string) => `Часто задаваемые вопросы о ${name}`,
    provided: (name: string) => `Информация предоставлена ${name}.`,
    updated: "Последнее обновление",
  },
};

function FaqItem({ item, locale, centerId }: { item: AnsweredFaq; locale: Locale; centerId: string }) {
  const [open, setOpen] = React.useState(false);
  const tracked = React.useRef(false);
  const btnId = `faq-q-${item.key}`;
  const panelId = `faq-a-${item.key}`;
  return (
    <article className="border-b border-slate-100 last:border-0">
      <h3 className="m-0">
        <button
          type="button"
          id={btnId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => {
            setOpen((v) => !v);
            if (!tracked.current) {
              tracked.current = true;
              void trackCenterEventAction(centerId, "faq");
            }
          }}
          className="flex w-full items-center justify-between gap-3 py-4 text-left text-[15px] font-semibold text-ink-900 transition-colors hover:text-brand-700"
        >
          <span>{item.question}</span>
          <ChevronDown
            aria-hidden="true"
            className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </h3>
      {/* grid-rows trick = smooth height animation; answer stays in the DOM
          (collapsed) so it is always crawlable/SEO-visible. */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="whitespace-pre-line pb-4 pr-8 text-[15px] leading-relaxed text-slate-600">
            {item.answer}
          </p>
        </div>
      </div>
    </article>
  );
}

export function CenterFaq({
  items,
  centerName,
  centerId,
  lastUpdated,
  locale = "az",
}: {
  items: AnsweredFaq[];
  centerName: string;
  centerId: string;
  lastUpdated: string;
  locale?: Locale;
}) {
  if (items.length === 0) return null;
  const t = T[locale === "ru" ? "ru" : "az"];

  return (
    <section
      aria-labelledby="center-faq-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6"
    >
      <h2
        id="center-faq-heading"
        className="font-display text-xl font-bold text-ink-900"
      >
        {t.title(centerName)}
      </h2>
      <div className="mt-2 divide-y divide-slate-100">
        {items.map((item) => (
          <FaqItem key={item.key} item={item} locale={locale} centerId={centerId} />
        ))}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-400">
        <p>{t.provided(centerName)}</p>
        {lastUpdated && (
          <p className="mt-0.5">
            {t.updated}: {lastUpdated}
          </p>
        )}
        <FaqReportForm centerId={centerId} locale={locale} />
      </div>
    </section>
  );
}
