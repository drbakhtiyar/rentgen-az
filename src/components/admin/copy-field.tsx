"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";

/** Birklikli kopyalama sahəsi (gizli linklər üçün). */
export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={value}
        onFocus={(e) => e.currentTarget.select()}
        className="h-10 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-xs text-slate-700 outline-none focus:border-brand-400"
      />
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(value).catch(() => null);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-ink-900 px-3.5 text-sm font-semibold text-white hover:bg-ink-950"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        {copied ? "Kopyalandı" : "Kopyala"}
      </button>
    </div>
  );
}
