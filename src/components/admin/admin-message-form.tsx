"use client";

import * as React from "react";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { Input, Textarea, Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { sendAdminMessageAction } from "@/app/admin/actions";

/** Admin → send an in-app notification/message to a center or doctor. */
export function AdminMessageForm({ userId }: { userId: string }) {
  const [pending, startTransition] = React.useTransition();
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [done, setDone] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(null);
    startTransition(async () => {
      const res = await sendAdminMessageAction({ userId, title: title.trim(), body: body.trim() });
      if (!res.ok) return setError(res.error ?? "Xəta");
      setDone(res.message ?? "Göndərildi");
      setTitle("");
      setBody("");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Başlıq" htmlFor="am-title" required>
        <Input id="am-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Məs: Sənədlərinizi yeniləyin" required />
      </Field>
      <Field label="Mesaj" htmlFor="am-body">
        <Textarea id="am-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Mesaj mətni (istəyə bağlı)" />
      </Field>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {done && (
        <p className="flex items-center gap-1 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {done}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Bildiriş göndər
      </Button>
    </form>
  );
}
