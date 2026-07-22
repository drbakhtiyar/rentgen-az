"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const azLower = (s: string) => s.toLocaleLowerCase("az");

/**
 * Center-name search for the admin reviews filter. Free text still submits with
 * the form (name="q"); typing ≥3 letters also shows matching center names as
 * suggestions, and picking one applies the filter immediately (keeping the
 * active date range).
 */
export function CenterSuggestFilter({
  names,
  defaultValue,
  preserve,
}: {
  names: string[];
  defaultValue: string;
  /** Active date params to keep when picking a suggestion (range/from/to). */
  preserve: Record<string, string>;
}) {
  const router = useRouter();
  const [text, setText] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const q = azLower(text.trim());
  const matches = q.length >= 3 ? names.filter((n) => azLower(n).includes(q)).slice(0, 8) : [];

  function pick(name: string) {
    setText(name);
    setOpen(false);
    const qs = new URLSearchParams();
    qs.set("q", name);
    for (const [k, v] of Object.entries(preserve)) if (v) qs.set(k, v);
    router.push(`/admin/reyler?${qs.toString()}`);
  }

  return (
    <div className="relative flex-1">
      <input
        name="q"
        value={text}
        autoComplete="off"
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Mərkəz adı ilə axtar…"
        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-brand-400 focus:outline-none"
      />
      {open && matches.length > 0 && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <ul className="max-h-56 overflow-y-auto py-1">
            {matches.map((n) => (
              <li key={n}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(n);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-ink-900 hover:bg-brand-50"
                >
                  {n}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
