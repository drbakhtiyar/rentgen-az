"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { parseHours, computeOpenStatus, type OpenStatus as Status } from "@/lib/hours";
import { getDict, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Live "open now / closing soon / closed" badge, computed in Azerbaijan time.
 * Renders nothing until mounted (avoids SSR/hydration mismatch) and when the
 * center has no structured hours.
 */
export function OpenStatus({
  hours,
  locale = DEFAULT_LOCALE,
  className,
}: {
  hours: unknown;
  locale?: Locale;
  className?: string;
}) {
  const [status, setStatus] = React.useState<Status | null>(null);

  React.useEffect(() => {
    const week = parseHours(hours);
    if (!week) return;
    const update = () => setStatus(computeOpenStatus(week));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [hours]);

  if (!status) return null;

  const { text, tone } = render(status, locale);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        tone,
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-current opacity-90" />
      </span>
      <Clock className="h-3.5 w-3.5" />
      {text}
    </span>
  );
}

function render(status: Status, locale: Locale): { text: string; tone: string } {
  const s = getDict(locale).status;
  switch (status.state) {
    case "open":
      return {
        text: s.openTpl.replace("{t}", status.closesAt),
        tone: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100",
      };
    case "closing":
      return {
        text: s.closingTpl.replace("{m}", String(status.minutesToClose)),
        tone: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100",
      };
    case "opens_later":
      return {
        text: s.opensTpl.replace("{t}", status.opensAt),
        tone: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
      };
    case "closed":
    default:
      return {
        text: s.closed,
        tone: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-100",
      };
  }
}
