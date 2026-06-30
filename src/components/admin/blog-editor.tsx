"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/field";
import { slugify } from "@/lib/utils";
import { saveBlogPostAction } from "@/app/admin/actions";

export type BlogDefaults = {
  id?: string;
  slug?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string;
  published?: boolean;
};

export function BlogEditor({ defaults }: { defaults?: BlogDefaults }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [slug, setSlug] = React.useState(defaults?.slug ?? "");
  const [title, setTitle] = React.useState(defaults?.title ?? "");
  const [slugTouched, setSlugTouched] = React.useState(Boolean(defaults?.slug));

  const effectiveSlug = slugTouched ? slug : slugify(title);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    startTransition(async () => {
      const res = await saveBlogPostAction({
        id: defaults?.id,
        title: get("title"),
        slug: effectiveSlug,
        excerpt: get("excerpt"),
        content: get("content"),
        coverImage: get("coverImage"),
        metaTitle: get("metaTitle"),
        metaDescription: get("metaDescription"),
        tags: get("tags"),
        published: fd.get("published") === "on",
      });
      if (!res.ok) {
        setError(res.error ?? "Xəta");
        return;
      }
      router.push("/admin/blog");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <Field label="Başlıq" htmlFor="title" required>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Məqalənin başlığı"
          />
        </Field>
        <Field label="Slug" htmlFor="slug" hint={`URL: /blog/${effectiveSlug || "..."}`}>
          <Input
            id="slug"
            name="slug"
            value={slugTouched ? slug : effectiveSlug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder="meqale-slug"
          />
        </Field>
        <Field label="Qısa təsvir (excerpt)" htmlFor="excerpt">
          <Textarea id="excerpt" name="excerpt" defaultValue={defaults?.excerpt} className="min-h-[70px]" />
        </Field>
        <Field label="Məzmun (Markdown)" htmlFor="content" required>
          <Textarea
            id="content"
            name="content"
            defaultValue={defaults?.content}
            required
            className="min-h-[420px] font-mono text-sm"
            placeholder={"## Başlıq\n\nMətn...\n\n- maddə"}
          />
        </Field>
      </div>

      <aside className="space-y-4">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="published"
              defaultChecked={defaults?.published}
              className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
            />
            <span className="text-sm font-medium text-ink-900">Dərc et (published)</span>
          </label>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Yadda saxla
          </Button>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-sm font-bold text-ink-900">SEO</h3>
          <Field label="Meta title" htmlFor="metaTitle">
            <Input id="metaTitle" name="metaTitle" defaultValue={defaults?.metaTitle} />
          </Field>
          <Field label="Meta description" htmlFor="metaDescription">
            <Textarea id="metaDescription" name="metaDescription" defaultValue={defaults?.metaDescription} className="min-h-[70px]" />
          </Field>
          <Field label="Tags (vergüllə)" htmlFor="tags">
            <Input id="tags" name="tags" defaultValue={defaults?.tags} placeholder="3D tomoqrafiya, CBCT" />
          </Field>
          <Field label="Cover image URL" htmlFor="coverImage">
            <Input id="coverImage" name="coverImage" type="url" defaultValue={defaults?.coverImage} />
          </Field>
        </div>
      </aside>
    </form>
  );
}
