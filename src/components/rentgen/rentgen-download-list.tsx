"use client";

import * as React from "react";
import { FileDown, Loader2, File as FileIcon, Eye } from "lucide-react";
import { getDownloadUrlAction } from "@/app/actions/rentgen-files";
import { isViewableFile, viewerUrl } from "@/lib/viewer-url";
import type { RentgenFileItem } from "./rentgen-files-panel";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** Download-only list of a request's rentgen files (doctor / patient). */
export function RentgenDownloadList({ files }: { files: RentgenFileItem[] }) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  if (files.length === 0) return null;

  async function download(id: string) {
    setError(null);
    setBusy(id);
    const res = await getDownloadUrlAction(id);
    setBusy(null);
    if (!res.ok) return setError(res.error);
    window.open(res.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-2 space-y-1.5">
      <ul className="divide-y divide-brand-100 rounded-lg bg-brand-50/60 ring-1 ring-inset ring-brand-100">
        {files.map((f) => (
          <li key={f.id} className="flex items-center gap-2 px-3 py-2 text-sm">
            <FileIcon className="h-4 w-4 shrink-0 text-brand-500" />
            <span className="min-w-0 flex-1 truncate text-ink-800">{f.fileName}</span>
            <span className="shrink-0 text-xs text-slate-400">{formatBytes(f.size)}</span>
            {isViewableFile(f.fileName) && (
              <button
                type="button"
                onClick={() => window.open(viewerUrl(f.id), "_blank", "noopener,noreferrer")}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 hover:bg-brand-50"
                title="Brauzerdə bax"
              >
                <Eye className="h-3.5 w-3.5" />
                Bax
              </button>
            )}
            <button
              type="button"
              onClick={() => download(f.id)}
              disabled={busy === f.id}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy === f.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )}
              Endir
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
