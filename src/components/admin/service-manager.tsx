"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  Loader2,
  Save,
  Plus,
  Pencil,
  X,
  Upload,
  Star,
  Search,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/field";
import { ServiceIcon } from "@/components/ui/service-icon";
import { ActiveToggle } from "@/components/admin/settings-controls";
import { saveServiceAction } from "@/app/admin/actions";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type AdminService = {
  id: string;
  name: string;
  shortName: string | null;
  description: string | null;
  icon: string | null;
  iconUrl: string | null;
  category: string | null;
  order: number;
  featured: boolean;
  isActive: boolean;
};

export function ServiceManager({ services }: { services: AdminService[] }) {
  // null = closed, "new" = create form, otherwise the id being edited
  const [editing, setEditing] = React.useState<string | "new" | null>(null);
  const [q, setQ] = React.useState("");
  const [openCats, setOpenCats] = React.useState<Set<string>>(new Set());

  const query = q.trim().toLowerCase();
  const filtered = query
    ? services.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          (s.category ?? "").toLowerCase().includes(query),
      )
    : services;

  // Group (preserving the incoming catalog order) into categories.
  const groups: { category: string; items: AdminService[] }[] = [];
  const idx = new Map<string, number>();
  for (const s of filtered) {
    const cat = s.category || "Digər";
    if (!idx.has(cat)) {
      idx.set(cat, groups.length);
      groups.push({ category: cat, items: [] });
    }
    groups[idx.get(cat)!].items.push(s);
  }

  const toggleCat = (c: string) =>
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  const renderItem = (s: AdminService) =>
    editing === s.id ? (
      <div key={s.id} className="sm:col-span-2">
        <ServiceForm service={s} onClose={() => setEditing(null)} />
      </div>
    ) : (
      <div
        key={s.id}
        className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 p-2.5"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <ServiceIcon name={s.icon} url={s.iconUrl} className="h-3.5 w-3.5" />
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-sm font-medium text-ink-900">{s.name}</span>
            {s.featured && <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />}
            {!s.isActive && (
              <span className="shrink-0 rounded bg-slate-100 px-1 text-[10px] font-semibold text-slate-500">
                deaktiv
              </span>
            )}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setEditing(s.id)}
            title="Redaktə"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <ActiveToggle id={s.id} kind="service" active={s.isActive} />
        </span>
      </div>
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Xidmət və ya kateqoriya axtar…"
            className="w-full pl-9 sm:w-72"
          />
        </div>
        <Button type="button" onClick={() => setEditing(editing === "new" ? null : "new")}>
          <Plus className="h-4 w-4" /> Yeni xidmət
        </Button>
      </div>

      {editing === "new" && <ServiceForm onClose={() => setEditing(null)} />}

      {filtered.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">
          {query ? "Axtarışa uyğun xidmət tapılmadı." : "Hələ xidmət yoxdur. “Yeni xidmət” ilə əlavə edin."}
        </p>
      ) : query ? (
        // Search results: flat compact grid.
        <div className="grid gap-2 sm:grid-cols-2">{filtered.map(renderItem)}</div>
      ) : (
        // Collapsible category sections.
        <div className="space-y-2">
          {groups.map((g) => {
            const open = openCats.has(g.category);
            return (
              <div key={g.category} className="overflow-hidden rounded-xl border border-slate-100">
                <button
                  type="button"
                  onClick={() => toggleCat(g.category)}
                  className="flex w-full items-center justify-between gap-2 bg-slate-50/60 px-3 py-2.5 text-left hover:bg-slate-100/60"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                    <ChevronDown
                      className={cn("h-4 w-4 text-slate-400 transition-transform", open ? "" : "-rotate-90")}
                    />
                    {g.category}
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                      {g.items.length}
                    </span>
                  </span>
                </button>
                {open && (
                  <div className="grid gap-2 border-t border-slate-100 p-2 sm:grid-cols-2">
                    {g.items.map(renderItem)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ServiceForm({
  service,
  onClose,
}: {
  service?: AdminService;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [iconUrl, setIconUrl] = React.useState(service?.iconUrl ?? "");
  const [uploading, setUploading] = React.useState(false);
  const [featured, setFeatured] = React.useState(service?.featured ?? false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const blob = await upload(`service-icons/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setIconUrl(blob.url);
    } catch {
      setError("İkon yüklənmədi. Yenidən cəhd edin.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    const orderRaw = get("order");
    startTransition(async () => {
      const res = await saveServiceAction({
        id: service?.id,
        name: get("name"),
        shortName: get("shortName"),
        description: get("description"),
        category: get("category"),
        order: orderRaw ? Number(orderRaw) : 0,
        featured,
        iconUrl,
      });
      if (!res.ok) {
        setError(res.error ?? "Xəta baş verdi");
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-brand-200 bg-brand-50/30 p-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">
          {service ? "Xidməti redaktə et" : "Yeni xidmət"}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
      )}

      {/* Icon */}
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 ring-1 ring-slate-200">
          <ServiceIcon
            name={service?.icon}
            url={iconUrl || null}
            className="h-7 w-7"
          />
        </span>
        <div className="space-y-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/webp,image/svg+xml,image/jpeg"
            onChange={onPickFile}
            className="hidden"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              İkon yüklə
            </button>
            {iconUrl && (
              <button
                type="button"
                onClick={() => setIconUrl("")}
                className="text-xs font-medium text-slate-400 hover:text-red-600"
              >
                Sil
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Boş buraxsanız ada uyğun ikon avtomatik seçilir. PNG/SVG/WebP.
          </p>
        </div>
      </div>

      <Field label="Ad" htmlFor="svc-name" required>
        <Input
          id="svc-name"
          name="name"
          defaultValue={service?.name}
          required
          placeholder="Məs: Panoramik rentgen"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Qısa ad" htmlFor="svc-short" hint="Boş = addan törədilir">
          <Input
            id="svc-short"
            name="shortName"
            defaultValue={service?.shortName ?? ""}
            placeholder="Məs: Panoramik"
          />
        </Field>
        <Field label="Kateqoriya" htmlFor="svc-cat" hint="Boş = avtomatik">
          <Input
            id="svc-cat"
            name="category"
            list="svc-cat-options"
            defaultValue={service?.category ?? ""}
            placeholder="Dental / Onurğa / KT…"
          />
          <datalist id="svc-cat-options">
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
      </div>

      <Field label="Təsvir" htmlFor="svc-desc" hint="Boş buraxsanız SEO-uyğun mətn avtomatik yaranır">
        <Textarea
          id="svc-desc"
          name="description"
          defaultValue={service?.description ?? ""}
          className="min-h-[70px]"
          placeholder="Xidmətin qısa təsviri…"
        />
      </Field>

      <div className="flex flex-wrap items-end gap-4">
        <Field label="Sıra" htmlFor="svc-order">
          <Input
            id="svc-order"
            name="order"
            type="number"
            min={0}
            defaultValue={service?.order ?? 0}
            className="w-24"
          />
        </Field>
        <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm font-medium text-ink-800">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600"
          />
          Ana səhifədə vurğula
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || uploading}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Yadda saxla
        </Button>
        <button
          type="button"
          onClick={onClose}
          className={cn("text-sm font-medium text-slate-500 hover:text-slate-700")}
        >
          Ləğv et
        </button>
      </div>
    </form>
  );
}
