"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, FileDown, Trash2, File as FileIcon } from "lucide-react";
import {
  requestUploadUrlAction,
  confirmUploadAction,
  getDownloadUrlAction,
  deleteFileAction,
} from "@/app/actions/rentgen-files";

export type RentgenFileItem = {
  id: string;
  fileName: string;
  size: number;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// Browsers sometimes leave file.type empty (e.g. .dcm) — infer from extension.
function resolveType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "zip") return "application/zip";
  if (ext === "dcm" || ext === "dicom") return "application/dicom";
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function putWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`upload ${xhr.status}`));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

/** Center-side: upload rentgen files for a request, list and delete them. */
export function RentgenFilesPanel({
  requestId,
  files,
}: {
  requestId: string;
  files: RentgenFileItem[];
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list || list.length === 0) return;
    setError(null);
    for (const file of Array.from(list)) {
      const contentType = resolveType(file);
      setBusy(`Yüklənir: ${file.name}`);
      setProgress(0);
      try {
        const signed = await requestUploadUrlAction({
          requestId,
          fileName: file.name,
          contentType,
          size: file.size,
        });
        if (!signed.ok) {
          setError(signed.error);
          break;
        }
        await putWithProgress(signed.url, file, contentType, setProgress);
        const done = await confirmUploadAction({
          requestId,
          key: signed.key,
          fileName: file.name,
          size: file.size,
          contentType,
        });
        if (!done.ok) {
          setError(done.error);
          break;
        }
      } catch {
        setError(`"${file.name}" yüklənmədi. Yenidən cəhd edin.`);
        break;
      }
    }
    setBusy(null);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  async function download(id: string) {
    setError(null);
    const res = await getDownloadUrlAction(id);
    if (!res.ok) return setError(res.error);
    window.open(res.url, "_blank", "noopener,noreferrer");
  }

  async function remove(id: string) {
    if (!confirm("Bu faylı silmək istəyirsiniz?")) return;
    setBusy("Silinir…");
    const res = await deleteFileAction(id);
    setBusy(null);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">Rentgen faylları</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={!!busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Fayl yüklə
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf,application/zip,application/dicom,.dcm,.zip"
          onChange={onPick}
          className="hidden"
        />
      </div>

      {busy && (
        <div className="text-xs text-slate-500">
          {busy}{" "}
          {progress > 0 && progress < 100 && (
            <span className="font-semibold text-brand-600">{progress}%</span>
          )}
        </div>
      )}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      {files.length > 0 ? (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <FileIcon className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate text-ink-800">{f.fileName}</span>
              <span className="shrink-0 text-xs text-slate-400">{formatBytes(f.size)}</span>
              <button
                type="button"
                onClick={() => download(f.id)}
                className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-brand-600"
                title="Endir"
              >
                <FileDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(f.id)}
                className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="Sil"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-400">Hələ fayl yüklənməyib.</p>
      )}
    </div>
  );
}
