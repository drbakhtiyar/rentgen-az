"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, FileDown, Trash2, File as FileIcon, Eye } from "lucide-react";
import { isViewableFile, viewerUrl } from "@/lib/viewer-url";
import {
  requestUploadUrlAction,
  confirmUploadAction,
  startMultipartUploadAction,
  completeMultipartUploadAction,
  abortMultipartUploadAction,
  getDownloadUrlAction,
  deleteFileAction,
} from "@/app/actions/rentgen-files";
import { useLocale } from "@/components/locale-context";
import { getPanelDict } from "@/lib/i18n-panel";

export type RentgenFileItem = {
  id: string;
  fileName: string;
  size: number;
  createdAt?: string | Date;
  downloadNote?: string; // e.g. "Həkim endirib" (center-facing receipt)
};

// Must match the server (src/lib/b2.ts).
const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100 MB

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDate(d?: string | Date): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("az", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

function resolveType(file: File): string {
  // Map by extension first — browsers report inconsistent MIME types for zip/
  // xml/dicom (or none at all), so the extension is the reliable signal.
  const ext = file.name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "zip":
      return "application/zip";
    case "dcm":
    case "dicom":
      return "application/dicom";
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "xml":
      return "application/xml";
    case "txt":
      return "text/plain";
  }
  return file.type || "application/octet-stream";
}

/** PUT a blob to a presigned URL; resolves with the ETag response header. */
function putBlob(
  url: string,
  body: Blob,
  contentType: string | null,
  onLoaded: (loaded: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    if (contentType) xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onLoaded(e.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.getResponseHeader("ETag") ?? "");
      } else {
        reject(new Error(`upload ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(body);
  });
}

async function putBlobRetry(
  url: string,
  body: Blob,
  contentType: string | null,
  onLoaded: (loaded: number) => void,
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await putBlob(url, body, contentType, onLoaded);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/** Center-side: upload rentgen files for a request, list and delete them. */
export function RentgenFilesPanel({
  requestId,
  files,
  trashDays = 0,
}: {
  requestId: string;
  files: RentgenFileItem[];
  trashDays?: number;
}) {
  const router = useRouter();
  const t = getPanelDict(useLocale()).center;
  const deleteWarning =
    trashDays <= 0 ? t.svcDeleteConfirmPerm : `${t.svcDeleteConfirmTrash} ${t.confirmContinue}`;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);

  async function uploadOne(file: File) {
    const contentType = resolveType(file);
    setProgress(0);

    if (file.size > MULTIPART_THRESHOLD) {
      // Resumable multipart upload.
      const start = await startMultipartUploadAction({
        requestId,
        fileName: file.name,
        contentType,
        size: file.size,
      });
      if (!start.ok) throw new Error(start.error);
      const { key, uploadId, partSize, urls } = start;
      const parts: { PartNumber: number; ETag: string }[] = [];
      let base = 0;
      try {
        for (let i = 0; i < urls.length; i++) {
          const chunk = file.slice(i * partSize, Math.min((i + 1) * partSize, file.size));
          const etag = await putBlobRetry(urls[i], chunk, null, (loaded) =>
            setProgress(Math.round(((base + loaded) / file.size) * 100)),
          );
          parts.push({ PartNumber: i + 1, ETag: etag });
          base += chunk.size;
          setProgress(Math.round((base / file.size) * 100));
        }
      } catch (e) {
        await abortMultipartUploadAction({ key, uploadId }).catch(() => {});
        throw e;
      }
      const done = await completeMultipartUploadAction({
        requestId,
        key,
        uploadId,
        parts,
        fileName: file.name,
        size: file.size,
        contentType,
      });
      if (!done.ok) throw new Error(done.error);
    } else {
      // Single presigned PUT.
      const signed = await requestUploadUrlAction({
        requestId,
        fileName: file.name,
        contentType,
        size: file.size,
      });
      if (!signed.ok) throw new Error(signed.error);
      await putBlobRetry(signed.url, file, contentType, (loaded) =>
        setProgress(Math.round((loaded / file.size) * 100)),
      );
      const done = await confirmUploadAction({
        requestId,
        key: signed.key,
        fileName: file.name,
        size: file.size,
        contentType,
      });
      if (!done.ok) throw new Error(done.error);
    }
  }

  async function handleFiles(list: FileList | File[]) {
    const arr = Array.from(list);
    if (arr.length === 0) return;
    setError(null);
    for (const file of arr) {
      setBusy(`${t.uploading}: ${file.name}`);
      try {
        await uploadOne(file);
      } catch (e) {
        setError(e instanceof Error ? e.message : `"${file.name}" yüklənmədi.`);
        break;
      }
    }
    setBusy(null);
    setProgress(0);
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
    if (!confirm(deleteWarning)) return;
    setBusy(t.deleting);
    const res = await deleteFileAction(id);
    setBusy(null);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">{t.filesLabel}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={!!busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {t.svcUpload}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf,application/zip,application/dicom,application/xml,text/xml,text/plain,.dcm,.zip,.xml,.txt"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Drag & drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!busy && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        className={
          "rounded-xl border border-dashed px-3 py-4 text-center text-xs transition-colors " +
          (dragOver ? "border-brand-400 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-400")
        }
      >
        {t.svcDropHint}
        <span className="block text-[11px] text-slate-400">
          JPG, PNG, PDF, ZIP, DICOM, XML, TXT · maks. 2 GB · CBCT üçün ZIP tövsiyə olunur
        </span>
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
              <span className="min-w-0 flex-1 truncate text-ink-800">
                {f.fileName}
                {f.downloadNote && (
                  <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 align-middle">
                    <FileDown className="h-3 w-3" /> {f.downloadNote}
                  </span>
                )}
              </span>
              <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">
                {formatDate(f.createdAt)}
              </span>
              <span className="shrink-0 text-xs text-slate-400">{formatBytes(f.size)}</span>
              {isViewableFile(f.fileName) && (
                <button
                  type="button"
                  onClick={() => window.open(viewerUrl(f.id), "_blank", "noopener,noreferrer")}
                  className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-brand-600"
                  title="Brauzerdə bax"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => download(f.id)}
                className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-brand-600"
                title={t.downloadTitle}
              >
                <FileDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(f.id)}
                className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title={t.deleteTitle}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-400">{t.noFilesYet}</p>
      )}
    </div>
  );
}
