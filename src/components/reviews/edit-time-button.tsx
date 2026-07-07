"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, CalendarClock, Check, X } from "lucide-react";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { bakuTodayYmd, slotsForDate, type WeeklyHours } from "@/lib/hours";
import { editRequestTimeAction } from "@/app/kabinet/actions";

/**
 * Lets a patient edit the arrival time of a request. If the center has
 * structured hours, offers day + time-slot; otherwise a free date+time.
 */
export function EditTimeButton({
  requestId,
  hours,
}: {
  requestId: string;
  hours: WeeklyHours | null;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const today = React.useMemo(() => bakuTodayYmd(), []);
  const slots = React.useMemo(
    () => (hours && date ? slotsForDate(hours, date) : []),
    [hours, date],
  );

  function save() {
    setError(null);
    if (!date || !time) {
      setError("Tarix və saat seçin.");
      return;
    }
    const preferredDate = `${date}T${time}:00+04:00`;
    startTransition(async () => {
      const res = await editRequestTimeAction(requestId, preferredDate);
      if (!res.ok) {
        setError(res.error ?? "Xəta");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        <CalendarClock className="h-3.5 w-3.5" /> Vaxtı dəyiş
      </button>
    );
  }

  return (
    <div className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          type="date"
          min={today}
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setTime("");
          }}
          className="h-9 text-sm"
        />
        {hours ? (
          <Select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={!date || slots.length === 0}
            className="h-9 text-sm"
          >
            <option value="">
              {!date ? "Əvvəlcə tarix seçin" : slots.length === 0 ? "Vaxt yoxdur" : "Saat seçin"}
            </option>
            {slots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-9 text-sm"
          />
        )}
      </div>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
      <div className="mt-2 flex items-center gap-2">
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Yadda saxla
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          <X className="h-3.5 w-3.5" /> Ləğv et
        </button>
      </div>
    </div>
  );
}
