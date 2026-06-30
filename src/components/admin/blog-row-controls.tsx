"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Loader2, ExternalLink } from "lucide-react";
import { deleteBlogPostAction } from "@/app/admin/actions";

export function BlogRowControls({
  id,
  slug,
  published,
}: {
  id: string;
  slug: string;
  published: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function remove() {
    if (!confirm("Bu məqaləni silmək istədiyinizə əminsiniz?")) return;
    startTransition(async () => {
      await deleteBlogPostAction(id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      {published && (
        <Link
          href={`/blog/${slug}`}
          target="_blank"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          aria-label="Bax"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      )}
      <Link
        href={`/admin/blog/${id}`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-brand-600 hover:bg-brand-50"
        aria-label="Redaktə et"
      >
        <Pencil className="h-4 w-4" />
      </Link>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
        aria-label="Sil"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
