"use client";

import * as React from "react";
import {
  Loader2,
  Download,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  FlipVertical,
  MousePointer2,
  Ruler,
  Triangle,
  Hand,
  Trash2,
  Crosshair as Crosshair2,
} from "lucide-react";
import { loadDicom, type LoadedDicom, type DicomVolume, type LoadPhase } from "./dicom-load";

/**
 * In-browser file viewer. Images/PDF preview directly; DICOM (single file or a
 * ZIP series, e.g. CBCT) opens in an MPR viewer: axial / coronal / sagittal
 * planes with linked crosshairs, slice scrolling and window/level control.
 */

type Props = { url: string; fileName: string; size: number; contentType: string };

const fmtMB = (n: number) => `${(n / 1024 / 1024).toFixed(0)} MB`;

// Window presets (HU-ish after rescale).
const PRESETS: { key: string; label: string; wc: number; ww: number }[] = [
  { key: "bone", label: "Sümük", wc: 400, ww: 2000 },
  { key: "soft", label: "Yumşaq", wc: 40, ww: 400 },
];

export function FileViewer({ url, fileName, size, contentType }: Props) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp"].includes(ext) || contentType.startsWith("image/")) {
    return <BlobPreview url={url} fileName={fileName} mode="image" />;
  }
  if (ext === "pdf" || contentType === "application/pdf") {
    return <BlobPreview url={url} fileName={fileName} mode="pdf" />;
  }
  return <DicomView url={url} fileName={fileName} size={size} />;
}

/* ------------------------- image / pdf preview ------------------------- */

function BlobPreview({ url, fileName, mode }: { url: string; fileName: string; mode: "image" | "pdf" }) {
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [zoom, setZoom] = React.useState(1);

  React.useEffect(() => {
    let revoke: string | null = null;
    let cancelled = false;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then((b) => {
        if (cancelled) return;
        revoke = URL.createObjectURL(mode === "pdf" ? new Blob([b], { type: "application/pdf" }) : b);
        setBlobUrl(revoke);
      })
      .catch(() => !cancelled && setError("Fayl yüklənə bilmədi."));
    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [url, mode]);

  if (error) return <ViewerError message={error} url={url} />;
  if (!blobUrl) return <ViewerLoading label="Yüklənir…" />;

  return (
    <div className="flex h-full flex-col">
      <Toolbar fileName={fileName} url={url}>
        {mode === "image" && (
          <div className="flex items-center gap-1">
            <IconBtn onClick={() => setZoom((z) => Math.max(0.25, z / 1.25))} title="Kiçilt">
              <ZoomOut className="h-4 w-4" />
            </IconBtn>
            <span className="w-12 text-center text-xs text-slate-300">{Math.round(zoom * 100)}%</span>
            <IconBtn onClick={() => setZoom((z) => Math.min(8, z * 1.25))} title="Böyüt">
              <ZoomIn className="h-4 w-4" />
            </IconBtn>
          </div>
        )}
      </Toolbar>
      <div className="flex-1 overflow-auto bg-slate-950 p-4">
        {mode === "image" ? (
          <div className="flex min-h-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blobUrl}
              alt={fileName}
              style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
              className="max-w-full transition-transform"
            />
          </div>
        ) : (
          <iframe src={blobUrl} title={fileName} className="h-full min-h-[80vh] w-full rounded-lg bg-white" />
        )}
      </div>
    </div>
  );
}

/* ----------------------------- DICOM / MPR ----------------------------- */

type Crosshair = { ix: number; iy: number; iz: number };

/* ------------------------- measurement tools ------------------------- */

type Plane = "axial" | "coronal" | "sagittal";
type Tool = "nav" | "ruler" | "angle" | "hu" | "pan";
type Pt = { fx: number; fy: number }; // fractions of the plane image [0..1]
type Measure = {
  id: string;
  plane: Plane;
  slice: number; // the fixed index this measurement lives on
  type: "ruler" | "angle" | "hu";
  pts: Pt[];
  hu?: number;
};

/** Physical size + pixel size of a plane's rendered image. */
function planeGeom(vol: DicomVolume, plane: Plane) {
  const n = vol.slices.length;
  if (plane === "axial") {
    return { physW: vol.cols * vol.colSpacing, physH: vol.rows * vol.rowSpacing };
  }
  if (plane === "coronal") {
    return { physW: vol.cols * vol.colSpacing, physH: n * vol.zSpacing };
  }
  return { physW: vol.rows * vol.rowSpacing, physH: n * vol.zSpacing };
}

/** Distance in mm between two fractional points on a plane. */
function distMm(vol: DicomVolume, plane: Plane, a: Pt, b: Pt): number {
  const g = planeGeom(vol, plane);
  return Math.hypot((b.fx - a.fx) * g.physW, (b.fy - a.fy) * g.physH);
}

/** Angle in degrees at vertex b (a-b-c). */
function angleDeg(vol: DicomVolume, plane: Plane, a: Pt, b: Pt, c: Pt): number {
  const g = planeGeom(vol, plane);
  const bax = (a.fx - b.fx) * g.physW;
  const bay = (a.fy - b.fy) * g.physH;
  const bcx = (c.fx - b.fx) * g.physW;
  const bcy = (c.fy - b.fy) * g.physH;
  const denom = Math.hypot(bax, bay) * Math.hypot(bcx, bcy) || 1;
  const cos = Math.max(-1, Math.min(1, (bax * bcx + bay * bcy) / denom));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Hounsfield value at a fractional point on a plane. */
function sampleHU(vol: DicomVolume, plane: Plane, cross: Crosshair, topFirst: boolean, fx: number, fy: number): number {
  const n = vol.slices.length;
  const cl = (v: number, max: number) => Math.max(0, Math.min(max, v));
  let raw: number;
  if (plane === "axial") {
    const ix = cl(Math.round(fx * (vol.cols - 1)), vol.cols - 1);
    const iy = cl(Math.round(fy * (vol.rows - 1)), vol.rows - 1);
    raw = vol.slices[cross.iz].data[iy * vol.cols + ix];
  } else {
    const zf = topFirst ? fy : 1 - fy;
    const sliceIdx = cl(Math.round(zf * (n - 1)), n - 1);
    if (plane === "coronal") {
      const ix = cl(Math.round(fx * (vol.cols - 1)), vol.cols - 1);
      raw = vol.slices[sliceIdx].data[cross.iy * vol.cols + ix];
    } else {
      const iy = cl(Math.round(fx * (vol.rows - 1)), vol.rows - 1);
      raw = vol.slices[sliceIdx].data[iy * vol.cols + cross.ix];
    }
  }
  return Math.round(raw * vol.slope + vol.intercept);
}

const sliceOf = (plane: Plane, c: Crosshair) => (plane === "axial" ? c.iz : plane === "coronal" ? c.iy : c.ix);

function DicomView({ url, fileName, size }: { url: string; fileName: string; size: number }) {
  const [phase, setPhase] = React.useState<LoadPhase | null>(null);
  const [data, setData] = React.useState<LoadedDicom | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    loadDicom(url, (p) => !cancelled && setPhase(p))
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Fayl açıla bilmədi."));
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) return <ViewerError message={error} url={url} />;
  if (!data) {
    let label = `Yüklənir… (${fmtMB(size)})`;
    if (phase?.phase === "download" && phase.total) {
      label = `Yüklənir… ${fmtMB(phase.loaded)} / ${fmtMB(phase.total)}`;
    } else if (phase?.phase === "unzip") {
      label = "Arxiv açılır…";
    } else if (phase?.phase === "parse") {
      label = `DICOM oxunur… ${phase.done}/${phase.total}`;
    }
    return <ViewerLoading label={label} />;
  }
  if (data.kind === "rgb") return <RgbView data={data} fileName={fileName} url={url} />;
  return <VolumeView vol={data} fileName={fileName} url={url} />;
}

function RgbView({ data, fileName, url }: { data: Extract<LoadedDicom, { kind: "rgb" }>; fileName: string; url: string }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = data.cols;
    c.height = data.rows;
    const ctx = c.getContext("2d")!;
    const img = ctx.createImageData(data.cols, data.rows);
    for (let i = 0, j = 0; i < data.rgb.length; i += 3, j += 4) {
      img.data[j] = data.rgb[i];
      img.data[j + 1] = data.rgb[i + 1];
      img.data[j + 2] = data.rgb[i + 2];
      img.data[j + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [data]);
  return (
    <div className="flex h-full flex-col">
      <Toolbar fileName={fileName} url={url} />
      <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-950 p-4">
        <canvas ref={ref} className="max-h-full max-w-full" />
      </div>
    </div>
  );
}

/** Render one plane of the volume into a canvas. */
function renderPlane(
  canvas: HTMLCanvasElement,
  vol: DicomVolume,
  plane: "axial" | "coronal" | "sagittal",
  cross: Crosshair,
  wc: number,
  ww: number,
  topFirst: boolean, // slices[0] rendered at the top of coronal/sagittal
) {
  const { slices, rows, cols, slope, intercept, invert } = vol;
  const n = slices.length;
  const w = plane === "sagittal" ? rows : cols;
  const h = plane === "axial" ? rows : n;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const px = img.data;
  const low = wc - ww / 2;
  const k = 255 / ww;

  let j = 0;
  const put = (raw: number) => {
    let g = (raw * slope + intercept - low) * k;
    g = g < 0 ? 0 : g > 255 ? 255 : g;
    if (invert) g = 255 - g;
    px[j] = g;
    px[j + 1] = g;
    px[j + 2] = g;
    px[j + 3] = 255;
    j += 4;
  };

  if (plane === "axial") {
    const d = slices[cross.iz].data;
    for (let i = 0; i < d.length; i++) put(d[i]);
  } else if (plane === "coronal") {
    const rowOff = cross.iy * cols;
    for (let r = 0; r < n; r++) {
      const d = slices[topFirst ? r : n - 1 - r].data;
      for (let x = 0; x < cols; x++) put(d[rowOff + x]);
    }
  } else {
    for (let r = 0; r < n; r++) {
      const d = slices[topFirst ? r : n - 1 - r].data;
      for (let y = 0; y < rows; y++) put(d[y * cols + cross.ix]);
    }
  }
  ctx.putImageData(img, 0, 0);
}

const PLANE_LABEL: Record<string, string> = { axial: "Aksial", coronal: "Koronal", sagittal: "Sagital" };

/** Label for a measurement (mm / degrees / HU), positioned over the image. */
function MeasureLabel({ vol, plane, m }: { vol: DicomVolume; plane: Plane; m: Measure }) {
  let pos: Pt;
  let text: string;
  if (m.type === "ruler") {
    pos = { fx: (m.pts[0].fx + m.pts[1].fx) / 2, fy: (m.pts[0].fy + m.pts[1].fy) / 2 };
    text = `${distMm(vol, plane, m.pts[0], m.pts[1]).toFixed(1)} mm`;
  } else if (m.type === "angle") {
    pos = m.pts[1];
    text = `${angleDeg(vol, plane, m.pts[0], m.pts[1], m.pts[2]).toFixed(1)}°`;
  } else {
    pos = m.pts[0];
    text = `${m.hu} HU`;
  }
  return (
    <span
      className="absolute -translate-y-1/2 translate-x-2 whitespace-nowrap rounded bg-slate-900/85 px-1.5 py-0.5 text-[11px] font-semibold text-amber-300 ring-1 ring-slate-700"
      style={{ left: `${pos.fx * 100}%`, top: `${pos.fy * 100}%` }}
    >
      {text}
    </span>
  );
}

function Viewport({
  vol,
  plane,
  cross,
  setCross,
  wc,
  ww,
  topFirst,
  tool,
  measures,
  pending,
  onMeasureClick,
  expanded,
  onToggleExpand,
  single,
}: {
  vol: DicomVolume;
  plane: Plane;
  cross: Crosshair;
  setCross: React.Dispatch<React.SetStateAction<Crosshair>>;
  wc: number;
  ww: number;
  topFirst: boolean;
  tool: Tool;
  measures: Measure[];
  pending: { plane: Plane; slice: number; pts: Pt[] } | null;
  onMeasureClick: (plane: Plane, fx: number, fy: number) => void;
  expanded: boolean;
  onToggleExpand: () => void;
  single: boolean;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = React.useState(1);
  const n = vol.slices.length;
  const curSlice = sliceOf(plane, cross);

  // Physical aspect ratio of the plane.
  const aspect =
    plane === "axial"
      ? (vol.cols * vol.colSpacing) / (vol.rows * vol.rowSpacing)
      : plane === "coronal"
        ? (vol.cols * vol.colSpacing) / (n * vol.zSpacing)
        : (vol.rows * vol.rowSpacing) / (n * vol.zSpacing);

  React.useEffect(() => {
    const c = canvasRef.current;
    if (c) renderPlane(c, vol, plane, cross, wc, ww, topFirst);
  }, [vol, plane, wc, ww, topFirst, plane === "axial" ? cross.iz : plane === "coronal" ? cross.iy : cross.ix]); // eslint-disable-line react-hooks/exhaustive-deps

  const sliceIndex = plane === "axial" ? cross.iz : plane === "coronal" ? cross.iy : cross.ix;
  const sliceMax = plane === "axial" ? n - 1 : plane === "coronal" ? vol.rows - 1 : vol.cols - 1;
  const setSlice = (v: number) => {
    const val = Math.max(0, Math.min(sliceMax, v));
    setCross((c) =>
      plane === "axial" ? { ...c, iz: val } : plane === "coronal" ? { ...c, iy: val } : { ...c, ix: val },
    );
  };

  // Click → move crosshair (nav) or add a measurement point (measure tools).
  const draggedRef = React.useRef(false);
  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    if (draggedRef.current) return; // a pan drag just ended — not a click
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    if (tool === "pan") return;
    if (tool !== "nav") {
      onMeasureClick(plane, fx, fy);
      return;
    }
    setCross((c) => {
      if (plane === "axial") {
        return { ...c, ix: Math.round(fx * (vol.cols - 1)), iy: Math.round(fy * (vol.rows - 1)) };
      }
      const zf = topFirst ? fy : 1 - fy; // vertical axis follows the render order
      if (plane === "coronal") {
        return { ...c, ix: Math.round(fx * (vol.cols - 1)), iz: Math.round(zf * (n - 1)) };
      }
      return { ...c, iy: Math.round(fx * (vol.rows - 1)), iz: Math.round(zf * (n - 1)) };
    });
  }

  // Pan: drag to scroll the (zoomed) viewport.
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (tool !== "pan") return;
    const box = boxRef.current;
    if (!box) return;
    draggedRef.current = false;
    const startX = e.clientX;
    const startY = e.clientY;
    const sl = box.scrollLeft;
    const st = box.scrollTop;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) draggedRef.current = true;
      box.scrollLeft = sl - dx;
      box.scrollTop = st - dy;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  // Measurements visible on the current slice of this plane (+ the in-progress one).
  const shown = measures.filter((m) => m.plane === plane && m.slice === curSlice);
  const draft = pending && pending.plane === plane && pending.slice === curSlice ? pending.pts : null;

  // Wheel = scroll through slices, WITHOUT scrolling the page. React's onWheel
  // is passive (preventDefault ignored), so attach a native non-passive
  // listener; a ref keeps it pointed at the latest slice.
  const applyWheelRef = React.useRef<(dy: number) => void>(() => {});
  applyWheelRef.current = (dy: number) => setSlice(sliceIndex + (dy > 0 ? 1 : -1));
  React.useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      applyWheelRef.current(e.deltaY);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // Crosshair positions (fractions) for the other two axes on this plane.
  const vFrac = plane === "axial" ? cross.ix / (vol.cols - 1) : plane === "coronal" ? cross.ix / (vol.cols - 1) : cross.iy / (vol.rows - 1);
  const zFrac = cross.iz / Math.max(1, n - 1);
  const hFrac = plane === "axial" ? cross.iy / (vol.rows - 1) : topFirst ? zFrac : 1 - zFrac;

  return (
    <div className={`flex flex-col rounded-xl border border-slate-800 bg-slate-900 ${expanded ? "col-span-full" : ""}`}>
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs font-semibold text-slate-300">
          {PLANE_LABEL[plane]} · {sliceIndex + 1}/{sliceMax + 1}
        </span>
        <div className="flex items-center gap-1">
          <IconBtn onClick={() => setZoom((z) => Math.max(1, z / 1.25))} title="Kiçilt">
            <ZoomOut className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn onClick={() => setZoom((z) => Math.min(6, z * 1.25))} title="Böyüt">
            <ZoomIn className="h-3.5 w-3.5" />
          </IconBtn>
          {!single && (
            <IconBtn onClick={onToggleExpand} title={expanded ? "Kiçilt" : "Genişləndir"}>
              {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </IconBtn>
          )}
        </div>
      </div>
      <div ref={boxRef} className="relative flex-1 touch-pan-y overflow-auto overscroll-contain">
        <div
          className={`relative mx-auto ${tool === "pan" ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"}`}
          style={{ aspectRatio: `${aspect}`, width: `${zoom * 100}%`, maxWidth: zoom === 1 ? "100%" : undefined }}
          onClick={onClick}
          onPointerDown={onPointerDown}
        >
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ imageRendering: zoom > 2 ? "pixelated" : "auto" }} />
          {!single && (
            <>
              <div className="pointer-events-none absolute inset-y-0 w-px bg-cyan-400/50" style={{ left: `${vFrac * 100}%` }} />
              <div className="pointer-events-none absolute inset-x-0 h-px bg-cyan-400/50" style={{ top: `${hFrac * 100}%` }} />
            </>
          )}

          {/* Measurement overlay */}
          {(shown.length > 0 || draft) && (
            <>
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {shown.map((m) => {
                  if (m.type === "ruler") {
                    const [a, b] = m.pts;
                    return <line key={m.id} x1={a.fx * 100} y1={a.fy * 100} x2={b.fx * 100} y2={b.fy * 100} stroke="#facc15" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />;
                  }
                  if (m.type === "angle") {
                    const [a, b, c] = m.pts;
                    return (
                      <g key={m.id} stroke="#facc15" strokeWidth={1.5} vectorEffect="non-scaling-stroke">
                        <line x1={b.fx * 100} y1={b.fy * 100} x2={a.fx * 100} y2={a.fy * 100} />
                        <line x1={b.fx * 100} y1={b.fy * 100} x2={c.fx * 100} y2={c.fy * 100} />
                      </g>
                    );
                  }
                  return null;
                })}
                {draft && draft.length === 2 && (
                  <line x1={draft[0].fx * 100} y1={draft[0].fy * 100} x2={draft[1].fx * 100} y2={draft[1].fy * 100} stroke="#fde68a" strokeWidth={1} strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />
                )}
              </svg>
              <div className="pointer-events-none absolute inset-0">
                {/* placed measurement dots + labels */}
                {shown.map((m) => (
                  <React.Fragment key={m.id}>
                    {m.pts.map((p, i) => (
                      <span key={i} className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 ring-1 ring-slate-900" style={{ left: `${p.fx * 100}%`, top: `${p.fy * 100}%` }} />
                    ))}
                    <MeasureLabel vol={vol} plane={plane} m={m} />
                  </React.Fragment>
                ))}
                {/* in-progress dots */}
                {draft?.map((p, i) => (
                  <span key={`d${i}`} className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200 ring-1 ring-slate-900" style={{ left: `${p.fx * 100}%`, top: `${p.fy * 100}%` }} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={sliceMax}
        value={sliceIndex}
        onChange={(e) => setSlice(Number(e.target.value))}
        className="mx-3 my-2 accent-cyan-500"
      />
    </div>
  );
}

function VolumeView({ vol, fileName, url }: { vol: DicomVolume; fileName: string; url: string }) {
  const n = vol.slices.length;
  const single = n === 1;
  const [cross, setCross] = React.useState<Crosshair>({
    ix: Math.floor(vol.cols / 2),
    iy: Math.floor(vol.rows / 2),
    iz: Math.floor(n / 2),
  });
  const [wc, setWc] = React.useState(Math.round(vol.wc));
  const [ww, setWw] = React.useState(Math.round(vol.ww));
  const [flipV, setFlipV] = React.useState(false);
  const topFirst = vol.zTopFirst !== flipV; // auto orientation, user-overridable
  const [expanded, setExpanded] = React.useState<"axial" | "coronal" | "sagittal" | null>(null);

  // Measurement tools.
  const [tool, setTool] = React.useState<Tool>("nav");
  const [measures, setMeasures] = React.useState<Measure[]>([]);
  const [pending, setPending] = React.useState<{ plane: Plane; slice: number; pts: Pt[] } | null>(null);
  const measureSeq = React.useRef(0);

  function onMeasureClick(plane: Plane, fx: number, fy: number) {
    if (tool === "nav" || tool === "pan") return;
    const slice = sliceOf(plane, cross);
    const need = tool === "angle" ? 3 : tool === "ruler" ? 2 : 1;
    const base = pending && pending.plane === plane && pending.slice === slice ? pending.pts : [];
    const pts = [...base, { fx, fy }];
    if (pts.length >= need) {
      const id = `m${measureSeq.current++}`;
      const m: Measure =
        tool === "hu"
          ? { id, plane, slice, type: "hu", pts, hu: sampleHU(vol, plane, cross, topFirst, fx, fy) }
          : { id, plane, slice, type: tool, pts };
      setMeasures((ms) => [...ms, m]);
      setPending(null);
    } else {
      setPending({ plane, slice, pts });
    }
  }
  function clearMeasures() {
    setMeasures([]);
    setPending(null);
  }

  const planes: ("axial" | "coronal" | "sagittal")[] = single
    ? ["axial"]
    : expanded
      ? [expanded]
      : ["axial", "coronal", "sagittal"];

  return (
    <div className="flex h-full flex-col">
      <Toolbar fileName={fileName} url={url}>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                setWc(p.wc);
                setWw(p.ww);
              }}
              className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setWc(Math.round(vol.wc));
              setWw(Math.round(vol.ww));
            }}
            className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Auto
          </button>
          {!single && (
            <button
              type="button"
              onClick={() => setFlipV((v) => !v)}
              title="Koronal/sagital görüntünü şaquli çevir"
              className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              <FlipVertical className="h-3.5 w-3.5" /> Çevir
            </button>
          )}
          <label className="flex items-center gap-1 text-[11px] text-slate-400">
            C
            <input
              type="range"
              min={-1000}
              max={3000}
              value={wc}
              onChange={(e) => setWc(Number(e.target.value))}
              className="w-20 accent-cyan-500"
            />
          </label>
          <label className="flex items-center gap-1 text-[11px] text-slate-400">
            W
            <input
              type="range"
              min={1}
              max={4000}
              value={ww}
              onChange={(e) => setWw(Number(e.target.value))}
              className="w-20 accent-cyan-500"
            />
          </label>
        </div>
      </Toolbar>

      {/* Measurement toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 bg-slate-900 px-4 py-1.5">
        {([
          ["nav", "Naviqasiya", MousePointer2],
          ["ruler", "Xətkəş", Ruler],
          ["hu", "HU sıxlıq", Crosshair2],
          ["angle", "Bucaq", Triangle],
          ["pan", "Pan", Hand],
        ] as [Tool, string, typeof Ruler][]).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTool(key);
              setPending(null);
            }}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              tool === key ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
        {measures.length > 0 && (
          <button
            type="button"
            onClick={clearMeasures}
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-red-900/50 hover:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5" /> Ölçüləri təmizlə ({measures.length})
          </button>
        )}
      </div>

      {tool !== "nav" && (
        <p className="bg-cyan-500/10 px-4 py-1 text-center text-[11px] text-cyan-300">
          {tool === "ruler"
            ? "2 nöqtəyə klik → məsafə (mm)"
            : tool === "angle"
              ? "3 nöqtəyə klik → bucaq"
              : tool === "hu"
                ? "Nöqtəyə klik → sümük sıxlığı (HU)"
                : "Böyüdüb şəkli sürüşdürün"}
        </p>
      )}

      {vol.downsampled && (
        <p className="bg-amber-500/10 px-4 py-1.5 text-center text-xs text-amber-400">
          Böyük seriya — yaddaşa qənaət üçün rezolyusiya 2 dəfə azaldılıb. Tam keyfiyyət üçün faylı endirin.
        </p>
      )}

      <div
        className={`grid flex-1 gap-2 overflow-hidden bg-slate-950 p-2 ${
          planes.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
        }`}
      >
        {planes.map((p) => (
          <Viewport
            key={p}
            vol={vol}
            plane={p}
            cross={cross}
            setCross={setCross}
            wc={wc}
            ww={ww}
            topFirst={topFirst}
            tool={tool}
            measures={measures}
            pending={pending}
            onMeasureClick={onMeasureClick}
            expanded={expanded === p}
            onToggleExpand={() => setExpanded((e) => (e === p ? null : p))}
            single={single}
          />
        ))}
      </div>

      <p className="bg-slate-950 px-4 pb-2 text-center text-[11px] text-slate-500">
        {vol.cols}×{vol.rows} · {n} kəsik · siçan təkəri = kəsik dəyişmə · klik = kəsişmə xətti
        {vol.skipped > 0 ? ` · ${vol.skipped} fayl ötürüldü` : ""}
      </p>
    </div>
  );
}

/* ------------------------------ chrome ------------------------------ */

function Toolbar({ fileName, url, children }: { fileName: string; url: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900 px-4 py-2">
      <span className="min-w-0 truncate text-sm font-semibold text-slate-100">{fileName}</span>
      <div className="flex items-center gap-3">
        {children}
        <a
          href={url}
          className="inline-flex items-center gap-1.5 rounded-full bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"
        >
          <Download className="h-3.5 w-3.5" /> Endir
        </a>
      </div>
    </div>
  );
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded p-1 text-slate-300 hover:bg-slate-700 hover:text-white"
    >
      {children}
    </button>
  );
}

function ViewerLoading({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 bg-slate-950 text-slate-300">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

function ViewerError({ message, url }: { message: string; url: string }) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center">
      <p className="max-w-md text-sm text-slate-300">{message}</p>
      <a
        href={url}
        className="inline-flex items-center gap-1.5 rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
      >
        <Download className="h-4 w-4" /> Faylı endir
      </a>
    </div>
  );
}
