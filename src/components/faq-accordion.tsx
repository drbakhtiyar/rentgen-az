"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type FaqItem = { question: string; answer: string };

/* Impilo üslubu (2026-08-12): ayrı-ayrı 24px kartlar, nömrə çipi (7px radius),
 * açıq sual Iris Pulse aksenti alır, "+" ikonu 45° fırlanıb "×" olur, cavab
 * grid-rows keçidi ilə yumşaq açılır. Hover: haşiyə bənövşəyiyə keçir. */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={cn(
              "overflow-hidden rounded-3xl bg-white ring-1 transition-all duration-300",
              isOpen
                ? "ring-iris-veil/60 shadow-[0_16px_44px_-22px_rgba(64,60,213,0.4)]"
                : "ring-ash-2 hover:ring-iris-veil/40",
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="group flex w-full items-center gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] text-xs font-semibold transition-all duration-300",
                  isOpen
                    ? "bg-iris-pulse text-white shadow-[0_0_16px_rgba(60,57,185,0.45)]"
                    : "border border-ash-2 text-iris-glow group-hover:border-iris-veil/50",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "flex-1 font-semibold transition-colors duration-300",
                  isOpen ? "text-iris-pulse" : "text-iris-canvas group-hover:text-iris-pulse",
                )}
              >
                {item.question}
              </span>
              <Plus
                className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-300",
                  isOpen ? "rotate-45 text-iris-pulse" : "text-fog-2 group-hover:text-iris-pulse",
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="pb-5 pl-[4.25rem] pr-5 text-sm leading-relaxed text-slate-600">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
