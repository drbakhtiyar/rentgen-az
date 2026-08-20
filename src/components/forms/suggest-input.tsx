"use client";

import * as React from "react";
import { Input } from "@/components/ui/field";

export type SuggestOption = { value: string; label: string };

const azLower = (s: string) => s.toLocaleLowerCase("az");

/**
 * Ağıllı uyğunluq (2026-08-20): diakritik fold (ə→e/a, ş→s...), translit
 * (sh→ş, ch→ç), və hərf-buraxma dözümü — «bakl» → «Bakı», «gence» → «Gəncə».
 * specializations-picker ilə eyni fəlsəfə.
 */
const fold = (x: string, eAsA = false) =>
  x
    .toLowerCase()
    .replace(/i̇/g, "i")
    .replace(/ə/g, eAsA ? "a" : "e")
    .replace(/[ıî]/g, "i")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ç/g, "c")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/sh/g, "s")
    .replace(/ch/g, "c");

function subseq(needle: string, hay: string): boolean {
  let i = 0;
  for (const ch of hay) if (ch === needle[i]) i++;
  return i === needle.length;
}

export function smartMatch(label: string, query: string): boolean {
  const l1 = fold(label);
  const l2 = fold(label, true);
  const q1 = fold(query);
  if (l1.includes(q1) || l2.includes(q1)) return true;
  // Hərf-buraxma yalnız 4+ hərfdə — qısa sorğuda hər şeyə uyğun gəlir
  return q1.length >= 4 && (subseq(q1, l1) || subseq(q1, l2));
}

/**
 * Autocomplete combobox: type ≥3 letters, matching options appear as
 * suggestions (list order is preserved — pre-ranked lists keep their ranking).
 * Selecting stores option.value in a hidden input; free text without a pick
 * submits as empty (callers use it for optional fields/filters).
 */
export function SuggestInput({
  id,
  name,
  options,
  placeholder,
  typeHint,
  noMatches,
  initial,
  onPick,
}: {
  id?: string;
  name: string;
  options: SuggestOption[];
  placeholder: string;
  typeHint: string;
  noMatches: string;
  /** Prefill (e.g. the active filter from the URL). */
  initial?: SuggestOption | null;
  onPick?: (value: string) => void;
}) {
  const [text, setText] = React.useState(initial?.label ?? "");
  const [picked, setPicked] = React.useState(initial?.value ?? "");
  const [open, setOpen] = React.useState(false);
  const query = azLower(text.trim());
  const matches =
    query.length >= 3 ? options.filter((o) => smartMatch(o.label, query)).slice(0, 8) : [];

  function pick(o: SuggestOption) {
    setPicked(o.value);
    setText(o.label);
    setOpen(false);
    onPick?.(o.value);
  }

  return (
    <div className="relative">
      <Input
        id={id}
        value={text}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          if (picked) {
            setPicked("");
            onPick?.("");
          }
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      <input type="hidden" name={name} value={picked} />
      {open && !picked && query.length > 0 && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {query.length < 3 ? (
            <p className="px-3 py-2 text-xs text-slate-400">{typeHint}</p>
          ) : matches.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">{noMatches}</p>
          ) : (
            <ul className="max-h-56 overflow-y-auto py-1">
              {matches.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(o);
                    }}
                    className="block w-full px-3 py-2 text-left text-sm text-ink-900 hover:bg-brand-50"
                  >
                    {o.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
