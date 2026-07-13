"use client";

import * as React from "react";
import { Loader2, KeyRound, RefreshCw } from "lucide-react";
import { regenerateApiKeyAction } from "@/app/merkez/export/actions";
import { useLocale } from "@/components/locale-context";
import { getPanelDict } from "@/lib/i18n-panel";

export function ApiKeyPanel({ initialKey }: { initialKey: string | null }) {
  const t = getPanelDict(useLocale()).center;
  const [key, setKey] = React.useState(initialKey);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function regenerate() {
    setError(null);
    startTransition(async () => {
      const res = await regenerateApiKeyAction();
      if (!res.ok) return setError(res.error ?? t.apiError);
      setKey(res.apiKey ?? null);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <code className="flex-1 overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 font-mono text-sm text-cyan-300">
          {key ?? t.apiNoKey}
        </code>
        <button
          type="button"
          onClick={regenerate}
          disabled={pending}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : key ? <RefreshCw className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
          {key ? t.apiRegen : t.apiCreate}
        </button>
      </div>
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-slate-400">{t.apiHint}</p>
    </div>
  );
}
