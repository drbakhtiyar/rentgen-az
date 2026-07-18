"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X, Trash2, Ban, ExternalLink } from "lucide-react";
import { useLocale } from "@/components/locale-context";
import { getCrmDict } from "@/lib/i18n-crm";
import {
  addManualAppointmentAction,
  updateAppointmentAction,
  deleteAppointmentAction,
  rescheduleAppointmentAction,
  addTimeBlockAction,
  deleteTimeBlockAction,
} from "./actions";

export type GridAppt = {
  id: string;
  ymd: string;
  startMin: number;
  durationMin: number;
  name: string;
  phone: string;
  serviceSlug: string | null;
  serviceName: string | null;
  note: string | null;
  status: string;
  patientId: string | null;
};

export type GridBlock = { id: string; ymd: string; startMin: number; endMin: number; reason: string | null; fixed?: boolean };

export type GridDay = {
  ymd: string;
  weekday: string;
  dayNum: string;
  isToday: boolean;
  appts: GridAppt[];
  blocks: GridBlock[];
};

type Svc = { slug: string; name: string };

const PX_PER_HOUR = 112; // taller rows so appointment text is readable
const QUARTER = PX_PER_HOUR / 4; // 15-minute subdivisions

// Light status palette matching the site (StatusBadge).
const STATUS: Record<string, { ring: string; fill: string; bar: string; dot: string }> = {
  NEW: { ring: "ring-brand-200", fill: "bg-brand-50", bar: "bg-brand-500", dot: "bg-brand-500" },
  CONTACTED: { ring: "ring-cyan-200", fill: "bg-cyan-50", bar: "bg-cyan-500", dot: "bg-cyan-500" },
  COMPLETED: { ring: "ring-emerald-200", fill: "bg-emerald-50", bar: "bg-emerald-500", dot: "bg-emerald-500" },
  CANCELLED: { ring: "ring-red-200", fill: "bg-red-50", bar: "bg-red-400", dot: "bg-red-400" },
};

const fieldCls =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none";

function minToHM(min: number): string {
  const h = String(Math.floor(min / 60)).padStart(2, "0");
  const m = String(min % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function packLanes(appts: GridAppt[]) {
  const sorted = [...appts].sort((a, b) => a.startMin - b.startMin);
  const laneEnds: number[] = [];
  const placed = sorted.map((a) => {
    const end = a.startMin + Math.max(a.durationMin, 15);
    let lane = laneEnds.findIndex((e) => e <= a.startMin);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else laneEnds[lane] = end;
    return { appt: a, lane };
  });
  return { placed, laneCount: Math.max(1, laneEnds.length) };
}

export function CalendarClient({
  days,
  startHour,
  endHour,
  nowMin,
  slotMinutes,
  services,
}: {
  days: GridDay[];
  startHour: number;
  endHour: number;
  nowMin: number | null;
  slotMinutes: number;
  services: Svc[];
}) {
  const [apptModal, setApptModal] = React.useState<
    | { mode: "create"; ymd: string; time: string }
    | { mode: "edit"; appt: GridAppt }
    | null
  >(null);
  const [reschedule, setReschedule] = React.useState<{ appt: GridAppt; ymd: string; time: string } | null>(null);
  const dragApptRef = React.useRef<GridAppt | null>(null);

  const total = (endHour - startHour) * 60;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  function timeAt(el: HTMLDivElement, clientY: number): string {
    const rect = el.getBoundingClientRect();
    const y = clientY - rect.top;
    const rawMin = startHour * 60 + (y / PX_PER_HOUR) * 60;
    const snapped = Math.max(startHour * 60, Math.round(rawMin / slotMinutes) * slotMinutes);
    return minToHM(snapped);
  }

  function onColumnClick(ymd: string, e: React.MouseEvent<HTMLDivElement>) {
    setApptModal({ mode: "create", ymd, time: timeAt(e.currentTarget, e.clientY) });
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <div style={{ minWidth: days.length > 1 ? 900 : 460 }}>
            {/* header */}
            <div className="flex border-b border-slate-200">
              <div className="w-14 shrink-0" />
              <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0,1fr))` }}>
                {days.map((d) => (
                  <div key={d.ymd} className="border-l border-slate-100 px-2 py-2.5 text-center">
                    <span className={`text-sm font-semibold ${d.isToday ? "text-brand-600" : "text-slate-600"}`}>
                      {d.weekday} {d.dayNum}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* body */}
            <div className="flex">
              <div className="w-14 shrink-0" style={{ height: total * (PX_PER_HOUR / 60) }}>
                {hours.map((h) => (
                  <div key={h} className="relative" style={{ height: PX_PER_HOUR }}>
                    <span className="absolute -top-2 right-2 text-[11px] text-slate-400">
                      {String(h).padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>
              <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0,1fr))` }}>
                {days.map((d) => {
                  const { placed, laneCount } = packLanes(d.appts);
                  return (
                    <div
                      key={d.ymd}
                      className={`relative cursor-pointer border-l border-slate-100 ${d.isToday ? "bg-brand-50/30" : ""}`}
                      style={{ height: total * (PX_PER_HOUR / 60) }}
                      onClick={(e) => onColumnClick(d.ymd, e)}
                      onDragOver={(e) => {
                        if (dragApptRef.current) e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const appt = dragApptRef.current;
                        dragApptRef.current = null;
                        if (!appt) return;
                        setReschedule({ appt, ymd: d.ymd, time: timeAt(e.currentTarget, e.clientY) });
                      }}
                    >
                      {hours.map((h) => (
                        <div key={h} style={{ height: PX_PER_HOUR }}>
                          {/* 15-minute subdivisions: faint quarter lines, solid hour line */}
                          <div className="border-b border-dashed border-slate-100/70" style={{ height: QUARTER }} />
                          <div className="border-b border-slate-100/70" style={{ height: QUARTER }} />
                          <div className="border-b border-dashed border-slate-100/70" style={{ height: QUARTER }} />
                          <div className="border-b border-slate-100" style={{ height: QUARTER }} />
                        </div>
                      ))}

                      {/* time blocks */}
                      {d.blocks.map((b) => {
                        const top = (b.startMin - startHour * 60) * (PX_PER_HOUR / 60);
                        const height = Math.max(b.endMin - b.startMin, 16) * (PX_PER_HOUR / 60);
                        return (
                          <div
                            key={b.id}
                            className="absolute inset-x-1 z-10 overflow-hidden rounded-md border border-slate-200 bg-[repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9_6px,#e2e8f0_6px,#e2e8f0_12px)] px-2 py-1"
                            style={{ top, height }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate text-[11px] font-semibold text-slate-500">
                                {b.reason || "Bağlı"}
                              </span>
                              {b.fixed ? (
                                <span className="text-[10px] text-slate-400">sabit</span>
                              ) : (
                                <DeleteBlockButton id={b.id} />
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* now line */}
                      {d.isToday && nowMin != null && nowMin >= startHour * 60 && nowMin <= endHour * 60 && (
                        <div
                          className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                          style={{ top: (nowMin - startHour * 60) * (PX_PER_HOUR / 60) }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          <span className="h-px flex-1 bg-rose-500/60" />
                        </div>
                      )}

                      {/* appointments */}
                      <div className="absolute inset-0 z-10">
                        {placed.map(({ appt, lane }) => {
                          const top = (appt.startMin - startHour * 60) * (PX_PER_HOUR / 60);
                          const height = Math.max(appt.durationMin, 22) * (PX_PER_HOUR / 60);
                          const w = 100 / laneCount;
                          const s = STATUS[appt.status] ?? STATUS.NEW;
                          return (
                            <div
                              key={appt.id}
                              draggable
                              onDragStart={(e) => {
                                dragApptRef.current = appt;
                                e.dataTransfer.effectAllowed = "move";
                                // Required or some browsers (Firefox/Safari) never start the drag.
                                e.dataTransfer.setData("text/plain", appt.id);
                              }}
                              onDragEnd={() => {
                                dragApptRef.current = null;
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setApptModal({ mode: "edit", appt });
                              }}
                              className={`absolute cursor-grab overflow-hidden rounded-md ring-1 ring-inset ${s.ring} ${s.fill} px-2 py-1 hover:shadow-sm active:cursor-grabbing`}
                              style={{ top, height, left: `calc(${lane * w}% + 4px)`, width: `calc(${w}% - 8px)` }}
                            >
                              <span className={`absolute inset-y-0 left-0 w-1 ${s.bar}`} />
                              <span className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${s.dot}`} />
                              <div className="pl-1.5">
                                <div className="text-[11px] font-medium text-slate-500">{minToHM(appt.startMin)}</div>
                                <div className="truncate text-[13px] font-semibold text-ink-900">{appt.name}</div>
                                {appt.serviceName && height > 44 && (
                                  <div className="truncate text-[11px] text-slate-500">{appt.serviceName}</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {apptModal && (
        <AppointmentModal
          key={apptModal.mode === "edit" ? apptModal.appt.id : "create"}
          state={apptModal}
          services={services}
          onClose={() => setApptModal(null)}
        />
      )}
      {reschedule && <RescheduleModal data={reschedule} onClose={() => setReschedule(null)} />}
    </div>
  );
}

/** Toolbar actions (Yeni qəbul + Vaxt blokla) — placed on the page title row. */
export function CalendarActions({ services, defaultYmd }: { services: Svc[]; defaultYmd: string }) {
  const t = getCrmDict(useLocale());
  const [createOpen, setCreateOpen] = React.useState(false);
  const [blockOpen, setBlockOpen] = React.useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setBlockOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
      >
        <Ban className="h-4 w-4" /> {t.calendar.blockTime}
      </button>
      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        <Plus className="h-4 w-4" /> {t.calendar.newAppt}
      </button>
      {createOpen && (
        <AppointmentModal
          state={{ mode: "create", ymd: defaultYmd, time: "" }}
          services={services}
          onClose={() => setCreateOpen(false)}
        />
      )}
      {blockOpen && <TimeBlockModal defaultYmd={defaultYmd} onClose={() => setBlockOpen(false)} />}
    </div>
  );
}

function RescheduleModal({
  data,
  onClose,
}: {
  data: { appt: GridAppt; ymd: string; time: string };
  onClose: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function apply(agreed: boolean) {
    setBusy(true);
    setError(null);
    const res = await rescheduleAppointmentAction({
      id: data.appt.id,
      ymd: data.ymd,
      time: data.time,
      agreed,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onClose();
    router.refresh();
  }

  function cancel() {
    onClose();
    router.refresh(); // snap the block back to its original position
  }

  return (
    <ModalShell title="Vaxtı dəyiş" onClose={cancel}>
      <p className="text-sm text-slate-600">
        <span className="font-semibold text-ink-900">{data.appt.name}</span> →{" "}
        <span className="font-semibold text-brand-700">
          {data.ymd}, {data.time}
        </span>
      </p>
      <p className="mt-3 text-sm font-semibold text-ink-900">Yeni vaxt pasientlə razılaşdırılıb?</p>
      <p className="mt-1 text-xs text-slate-500">
        «Bəli» → randevu təsdiqlənmiş olur. «Xeyr» → təsdiqlənməmişə keçir.
      </p>
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => apply(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Bəli, razılaşdırılıb
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => apply(false)}
          className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          Xeyr
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={cancel}
          className="rounded-full px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-100"
        >
          Ləğv
        </button>
      </div>
    </ModalShell>
  );
}

function DeleteBlockButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async (e) => {
        e.stopPropagation();
        if (!confirm("Bu bloku silmək?")) return;
        setBusy(true);
        await deleteTimeBlockAction(id);
        router.refresh();
      }}
      className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-white hover:text-red-600"
      title="Bloku sil"
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
    </button>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/40 p-4 pt-16" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-ink-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AppointmentModal({
  state,
  services,
  onClose,
}: {
  state: { mode: "create"; ymd: string; time: string } | { mode: "edit"; appt: GridAppt };
  services: Svc[];
  onClose: () => void;
}) {
  const router = useRouter();
  const edit = state.mode === "edit";
  const appt = edit ? state.appt : null;
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmed, setConfirmed] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const common = {
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      serviceSlug: (fd.get("serviceSlug") as string) || null,
      ymd: (fd.get("ymd") as string) || null,
      time: (fd.get("time") as string) || null,
      note: (fd.get("note") as string) || null,
    };
    const res = edit
      ? await updateAppointmentAction({ id: appt!.id, ...common })
      : await addManualAppointmentAction({ ...common, confirmed });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onClose();
    router.refresh();
  }

  async function onDelete() {
    if (!appt || !confirm("Bu randevunu silmək?")) return;
    setBusy(true);
    setError(null);
    const res = await deleteAppointmentAction(appt.id);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onClose();
    router.refresh();
  }

  return (
    <ModalShell title={edit ? "Randevunu redaktə et" : "Yeni qəbul"} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Ad, soyad *</label>
            <input name="name" required defaultValue={appt?.name ?? ""} className={fieldCls} placeholder="Pasiyentin adı" />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Telefon *</label>
            <input name="phone" required defaultValue={appt?.phone ?? ""} className={fieldCls} placeholder="050 000 00 00" />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Xidmət</label>
            <select name="serviceSlug" defaultValue={appt?.serviceSlug ?? ""} className={fieldCls}>
              <option value="">— Seçilməyib —</option>
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Tarix</label>
            <input name="ymd" type="date" defaultValue={edit ? appt!.ymd : state.ymd} className={fieldCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Saat</label>
            <input
              name="time"
              type="time"
              defaultValue={edit ? minToHM(appt!.startMin) : state.time}
              className={fieldCls}
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Qeyd</label>
            <input name="note" defaultValue={appt?.note ?? ""} className={fieldCls} placeholder="İstəyə bağlı" />
          </div>
        </div>

        {!edit && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            Təsdiqlənib (vaxt tam bağlanır)
          </label>
        )}

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Yadda saxla
            </button>
            {edit && appt!.patientId && (
              <Link
                href={`/crm/pasiyentler/${appt!.patientId}`}
                className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50"
              >
                Kart <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
          {edit && (
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" /> Sil
            </button>
          )}
        </div>
      </form>
    </ModalShell>
  );
}

function TimeBlockModal({ defaultYmd, onClose }: { defaultYmd: string; onClose: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await addTimeBlockAction({
      ymd: String(fd.get("ymd") ?? ""),
      startTime: String(fd.get("startTime") ?? ""),
      endTime: String(fd.get("endTime") ?? ""),
      reason: (fd.get("reason") as string) || null,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onClose();
    router.refresh();
  }

  return (
    <ModalShell title="Vaxt blokla" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        <p className="text-sm text-slate-500">
          Seçilmiş vaxt aralığı bağlanır — pasiyentlər ora yazıla bilməz (fasilə, nahar, tətil).
        </p>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Tarix *</label>
          <input name="ymd" type="date" required defaultValue={defaultYmd} className={fieldCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Başlanğıc *</label>
            <input name="startTime" type="time" required className={fieldCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Bitmə *</label>
            <input name="endTime" type="time" required className={fieldCls} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Səbəb</label>
          <input name="reason" className={fieldCls} placeholder="Nahar, tətil və s. (istəyə bağlı)" />
        </div>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />} Blokla
        </button>
      </form>
    </ModalShell>
  );
}
