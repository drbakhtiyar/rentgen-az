"use client";

import * as React from "react";
import { Input } from "@/components/ui/field";

export type SuggestOption = { value: string; label: string };

const azLower = (s: string) => s.toLocaleLowerCase("az");

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
    query.length >= 3 ? options.filter((o) => azLower(o.label).includes(query)).slice(0, 8) : [];

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
