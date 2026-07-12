"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { adminSendSmsAction } from "@/app/admin/actions";

/** Admin-side free-form SMS sender (support / follow-up to any number). */
export function AdminSmsSender({ initialPhone = "" }: { initialPhone?: string }) {
  const router = useRouter();
  const [phone, setPhone] = React.useState(initialPhone);
  const [message, setMessage] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  // Sync when a "SMS yaz" link prefills the number.
  React.useEffect(() => {
    if (initialPhone) setPhone(initialPhone);
  }, [initialPhone]);

  function send() {
    setError(null);
    setDone(false);
    startTransition(async () => {
      const res = await adminSendSmsAction({ phone, message });
      if (!res.ok) {
        setError(res.error ?? "Xəta");
        return;
      }
      setDone(true);
      setMessage("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Nömrə</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+994 XX XXX XX XX"
            className="h-10"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Mesaj <span className="text-slate-400">({message.length}/480)</span>
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 480))}
            placeholder="Mesaj mətni…"
            rows={2}
          />
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={send} disabled={pending || !phone.trim() || message.trim().length < 2}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          SMS göndər
        </Button>
        {done && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Göndərildi
          </span>
        )}
      </div>
    </div>
  );
}
