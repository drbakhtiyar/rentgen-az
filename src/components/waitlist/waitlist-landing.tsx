"use client";

import * as React from "react";
import { Search, ListChecks, CalendarCheck2, ShieldAlert, Sparkles } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import { WAITLIST_COPY, type WaitlistLocale } from "@/content/waitlist-copy";
import { cn } from "@/lib/utils";

const STEP_ICONS = [Search, ListChecks, CalendarCheck2];

export function WaitlistLanding({ initialLocale = "az" as WaitlistLocale }) {
  const [locale, setLocale] = React.useState<WaitlistLocale>(initialLocale);
  const copy = WAITLIST_COPY[locale];

  return (
    <>
      {/* ---------------- LANGUAGE TOGGLE ---------------- */}
      <div className="border-b border-white/10 bg-ink-950">
        <Container>
          <div className="flex justify-end gap-1 py-2.5">
            {(["az", "ru"] as WaitlistLocale[]).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  locale === l
                    ? "bg-white text-ink-950"
                    : "text-slate-400 hover:text-white",
                )}
                aria-pressed={locale === l}
              >
                {WAITLIST_COPY[l].langLabel}
              </button>
            ))}
          </div>
        </Container>
      </div>

      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-50" />
        <div className="glow absolute -left-20 top-0 h-96 w-96 opacity-50" />
        <div className="glow-cyan absolute right-0 top-40 h-96 w-96 opacity-40" />
        <Container className="relative pt-14 pb-16 lg:pt-20 lg:pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-cyan-300 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {copy.eyebrow}
            </span>
            <h1 className="font-display mt-5 text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
              {copy.title}{" "}
              <span className="text-gradient">{copy.highlight}</span>{" "}
              {copy.titleEnd}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
              {copy.subtitle}
            </p>

            <div className="mt-8 flex justify-center">
              <a
                href="#waitlist-form"
                className="inline-flex h-12 items-center justify-center rounded-full bg-brand-600 px-7 text-sm font-semibold text-white shadow-[0_8px_24px_-10px_rgba(10,95,240,0.7)] transition-all hover:bg-brand-700"
              >
                {copy.ctaScroll}
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* ---------------- DISCLAIMER ---------------- */}
      <div className="border-b border-slate-200 bg-amber-50">
        <Container>
          <div className="flex items-start gap-3 py-4 text-sm text-amber-900">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{copy.disclaimer}</p>
          </div>
        </Container>
      </div>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <Section className="bg-surface">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700 ring-1 ring-brand-100">
              {copy.stepsEyebrow}
            </span>
            <h2 className="font-display mt-4 text-2xl font-bold text-ink-900 sm:text-3xl">
              {copy.stepsTitle}
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {copy.steps.map((step, i) => {
              const Icon = STEP_ICONS[i] ?? Search;
              return (
                <Card key={step.title} className="p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display mt-4 text-base font-bold text-ink-900">
                    {i + 1}. {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* ---------------- WAITLIST FORM ---------------- */}
      <Section id="waitlist-form" className="pb-24">
        <Container>
          <div className="mx-auto max-w-xl">
            <Card className="p-6 sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700 ring-1 ring-brand-100">
                {copy.formEyebrow}
              </span>
              <h2 className="font-display mt-4 text-2xl font-bold text-ink-900">
                {copy.formTitle}
              </h2>
              <p className="mt-2 mb-6 text-sm leading-relaxed text-slate-600">
                {copy.formSubtitle}
              </p>
              <WaitlistForm copy={copy} locale={locale} />
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
