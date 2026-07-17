"use client";

/**
 * DICOM loading/decoding for the in-browser viewer (Level 2: series + MPR).
 *
 * Pure-JS pipeline (no wasm/workers): fetch → (unzip with fflate) → parse each
 * file with dicom-parser → pick the largest series → sort slices by position →
 * expose raw Int16 frames + geometry. Only uncompressed transfer syntaxes are
 * supported (implicit/explicit little endian + big endian via byte swap) —
 * compressed CBCT exports get a clear "download instead" error.
 */

import type { DataSet } from "dicom-parser";

export type LoadPhase =
  | { phase: "download"; loaded: number; total: number }
  | { phase: "unzip" }
  | { phase: "parse"; done: number; total: number };

export type DicomSlice = {
  data: Int16Array; // raw stored values (slope/intercept applied at render)
  pos: number; // position along the slice normal (sort key)
  z: number | null; // patient-Z (superior+) for orienting reconstructions
};

export type DicomVolume = {
  kind: "volume";
  slices: DicomSlice[];
  rows: number;
  cols: number;
  slope: number;
  intercept: number;
  invert: boolean; // MONOCHROME1
  wc: number; // default window center (after rescale)
  ww: number; // default window width
  rowSpacing: number; // mm
  colSpacing: number; // mm
  zSpacing: number; // mm
  downsampled: boolean;
  skipped: number; // non-DICOM / unsupported entries skipped
  zTopFirst: boolean; // true → slices[0] is superior (render it at the top)
};

export type DicomRgbImage = {
  kind: "rgb";
  rgb: Uint8Array; // interleaved RGB
  rows: number;
  cols: number;
};

export type LoadedDicom = DicomVolume | DicomRgbImage;

const SUPPORTED_TS = new Set([
  "1.2.840.10008.1.2", // implicit VR little endian
  "1.2.840.10008.1.2.1", // explicit VR little endian
  "1.2.840.10008.1.2.2", // explicit VR big endian (byte-swapped below)
]);

// Memory guards (bytes of raw pixel data).
const HARD_LIMIT = 750 * 1024 * 1024;
const DOWNSAMPLE_LIMIT = 320 * 1024 * 1024;

const num = (v: string | undefined, idx = 0): number | null => {
  if (!v) return null;
  const n = parseFloat(v.split("\\")[idx] ?? "");
  return Number.isFinite(n) ? n : null;
};

type ParsedFile = {
  seriesUid: string;
  rows: number;
  cols: number;
  bits: number;
  signed: boolean;
  samples: number;
  photometric: string;
  slope: number;
  intercept: number;
  wc: number | null;
  ww: number | null;
  rowSpacing: number;
  colSpacing: number;
  sliceThickness: number | null;
  spacingBetween: number | null;
  instance: number;
  frames: { bytes: Uint8Array; pos: number | null; z: number | null }[];
  bigEndian: boolean;
};

function parseOne(dicomParser: typeof import("dicom-parser"), bytes: Uint8Array): ParsedFile | null {
  let ds: DataSet;
  try {
    ds = dicomParser.parseDicom(bytes);
  } catch {
    return null; // not DICOM (DICOMDIR, report PDFs, vendor viewers inside ZIPs…)
  }
  const ts = (ds.string("x00020010") ?? "1.2.840.10008.1.2").trim();
  if (!SUPPORTED_TS.has(ts)) return null; // compressed — counted as skipped
  const el = ds.elements.x7fe00010;
  const rows = ds.uint16("x00280010") ?? 0;
  const cols = ds.uint16("x00280011") ?? 0;
  if (!el || !rows || !cols) return null;

  const bits = ds.uint16("x00280100") ?? 16;
  if (bits !== 8 && bits !== 16) return null;
  const samples = ds.uint16("x00280002") ?? 1;
  const photometric = (ds.string("x00280004") ?? "MONOCHROME2").trim();
  const nFrames = Math.max(1, parseInt(ds.string("x00280008") ?? "1", 10) || 1);
  const frameLen = rows * cols * (bits / 8) * samples;
  if (el.length < frameLen * nFrames) return null; // truncated / encapsulated

  // Per-file slice position projected on the normal (for series sorting) +
  // the patient-Z of the slice (to orient superior-up in reconstructions).
  const iop = ds.string("x00200037");
  const ipp = ds.string("x00200032");
  let pos: number | null = null;
  let posZ: number | null = null;
  if (ipp) {
    const p = ipp.split("\\").map(parseFloat);
    if (Number.isFinite(p[2])) posZ = p[2]; // LPS z increases toward superior
    if (iop) {
      const o = iop.split("\\").map(parseFloat);
      if (o.length === 6 && o.every(Number.isFinite)) {
        const n = [
          o[1] * o[5] - o[2] * o[4],
          o[2] * o[3] - o[0] * o[5],
          o[0] * o[4] - o[1] * o[3],
        ];
        pos = p[0] * n[0] + p[1] * n[1] + p[2] * n[2];
      }
    }
    if (pos == null && p.length === 3 && Number.isFinite(p[2])) pos = p[2];
  }

  const frames: ParsedFile["frames"] = [];
  for (let f = 0; f < nFrames; f++) {
    const start = el.dataOffset + f * frameLen;
    frames.push({
      bytes: bytes.subarray(start, start + frameLen),
      pos: nFrames === 1 ? pos : null, // multi-frame: natural order
      z: nFrames === 1 ? posZ : null,
    });
  }

  return {
    seriesUid: ds.string("x0020000e") ?? "series",
    rows,
    cols,
    bits,
    signed: (ds.uint16("x00280103") ?? 0) === 1,
    samples,
    photometric,
    slope: num(ds.string("x00281053")) ?? 1,
    intercept: num(ds.string("x00281052")) ?? 0,
    wc: num(ds.string("x00281050")),
    ww: num(ds.string("x00281051")),
    rowSpacing: num(ds.string("x00280030"), 0) ?? 1,
    colSpacing: num(ds.string("x00280030"), 1) ?? 1,
    sliceThickness: num(ds.string("x00180050")),
    spacingBetween: num(ds.string("x00180088")),
    instance: parseInt(ds.string("x00200013") ?? "0", 10) || 0,
    frames,
    bigEndian: ts === "1.2.840.10008.1.2.2",
  };
}

/** Decode one frame's raw bytes into Int16 stored values. */
function decodeFrame(f: ParsedFile, bytes: Uint8Array, downsample: boolean): Int16Array {
  const { rows, cols, bits, signed, bigEndian } = f;
  const step = downsample ? 2 : 1;
  const outRows = Math.floor(rows / step);
  const outCols = Math.floor(cols / step);
  const out = new Int16Array(outRows * outCols);
  if (bits === 8) {
    for (let y = 0; y < outRows; y++) {
      const src = y * step * cols;
      for (let x = 0; x < outCols; x++) out[y * outCols + x] = bytes[src + x * step];
    }
    return out;
  }
  // 16-bit — read via DataView to be independent of buffer alignment.
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const little = !bigEndian;
  for (let y = 0; y < outRows; y++) {
    const srcRow = y * step * cols;
    for (let x = 0; x < outCols; x++) {
      const off = (srcRow + x * step) * 2;
      if (signed) {
        out[y * outCols + x] = dv.getInt16(off, little);
      } else {
        const v = dv.getUint16(off, little);
        out[y * outCols + x] = v > 32767 ? 32767 : v; // clamp into Int16 range
      }
    }
  }
  return out;
}

/** Fetch the file (with progress), unzip if needed, decode the largest series. */
export async function loadDicom(
  url: string,
  onPhase: (p: LoadPhase) => void,
): Promise<LoadedDicom> {
  // ---- download ----
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Fayl yüklənmədi (HTTP ${resp.status}).`);
  const total = Number(resp.headers.get("content-length") ?? 0);
  let bytes: Uint8Array;
  if (resp.body && total) {
    const reader = resp.body.getReader();
    const buf = new Uint8Array(total);
    let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf.set(value, loaded);
      loaded += value.length;
      onPhase({ phase: "download", loaded, total });
    }
    bytes = buf.subarray(0, loaded);
  } else {
    bytes = new Uint8Array(await resp.arrayBuffer());
  }

  // ---- decompress if it's an archive (ZIP or RAR) ----
  let files: Uint8Array[] = [bytes];
  const isZip = bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03;
  const isRar = bytes.length > 4 && bytes[0] === 0x52 && bytes[1] === 0x61 && bytes[2] === 0x72 && bytes[3] === 0x21;
  if (isZip) {
    onPhase({ phase: "unzip" });
    const { unzip } = await import("fflate");
    const entries = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
      unzip(bytes, (err, data) => (err ? reject(err) : resolve(data)));
    });
    files = Object.entries(entries)
      .filter(([name, data]) => data.length > 200 && !name.endsWith("/"))
      .map(([, data]) => data);
    if (files.length === 0) throw new Error("ZIP arxivi boşdur.");
  } else if (isRar) {
    onPhase({ phase: "unzip" });
    const { createExtractorFromData } = await import("node-unrar-js");
    const wasmBinary = await fetch("/unrar.wasm").then((r) => r.arrayBuffer());
    // Pass a standalone ArrayBuffer (the fetched buffer may be a subarray view).
    const data = bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
      ? (bytes.buffer as ArrayBuffer)
      : (bytes.slice().buffer as ArrayBuffer);
    const extractor = await createExtractorFromData({ data, wasmBinary });
    const out: Uint8Array[] = [];
    const { files: arcFiles } = extractor.extract();
    for (const f of arcFiles) {
      if (f.fileHeader.flags.directory) continue;
      if (f.extraction && f.extraction.length > 200) out.push(f.extraction);
    }
    files = out;
    if (files.length === 0) {
      throw new Error("RAR arxivi boşdur və ya sıxılma metodu dəstəklənmir.");
    }
  }

  // ---- parse ----
  const dicomParser = await import("dicom-parser");
  const parsed: ParsedFile[] = [];
  let skipped = 0;
  for (let i = 0; i < files.length; i++) {
    const p = parseOne(dicomParser, files[i]);
    if (p) parsed.push(p);
    else skipped++;
    if (i % 20 === 19) {
      onPhase({ phase: "parse", done: i + 1, total: files.length });
      await new Promise((r) => setTimeout(r, 0)); // keep the UI responsive
    }
  }
  if (parsed.length === 0) {
    throw new Error(
      "Oxuna bilən DICOM tapılmadı. Fayl sıxılmış (JPEG/JPEG2000) formatda ola bilər — bu halda faylı endirib komputerdə açın.",
    );
  }

  // ---- RGB single image (ultrasound exports etc.) ----
  const first = parsed[0];
  if (parsed.length === 1 && first.frames.length === 1 && first.samples === 3 && first.bits === 8) {
    return { kind: "rgb", rgb: first.frames[0].bytes.slice(), rows: first.rows, cols: first.cols };
  }

  // ---- choose the largest consistent series ----
  const bySeries = new Map<string, ParsedFile[]>();
  for (const p of parsed) {
    if (p.samples !== 1) continue; // color frames don't join a volume
    const key = `${p.seriesUid}|${p.rows}x${p.cols}|${p.bits}`;
    (bySeries.get(key) ?? bySeries.set(key, []).get(key)!).push(p);
  }
  let best: ParsedFile[] | null = null;
  let bestFrames = 0;
  for (const group of bySeries.values()) {
    const n = group.reduce((s, g) => s + g.frames.length, 0);
    if (n > bestFrames) {
      bestFrames = n;
      best = group;
    }
  }
  if (!best || bestFrames === 0) throw new Error("Görüntü seriyası tapılmadı.");
  const ref = best[0];

  // ---- memory guard / downsample ----
  const rawBytes = bestFrames * ref.rows * ref.cols * 2;
  if (rawBytes > HARD_LIMIT) {
    throw new Error(
      "Seriya brauzer üçün çox böyükdür. Faylı endirib komputerdə DICOM proqramı ilə açın.",
    );
  }
  const downsample = rawBytes > DOWNSAMPLE_LIMIT && ref.rows >= 128 && ref.cols >= 128;

  // ---- decode frames (ordered) ----
  best.sort((a, b) => a.instance - b.instance);
  type Pending = { file: ParsedFile; bytes: Uint8Array; pos: number | null; z: number | null; order: number };
  const pending: Pending[] = [];
  let order = 0;
  for (const f of best)
    for (const fr of f.frames) pending.push({ file: f, bytes: fr.bytes, pos: fr.pos, z: fr.z, order: order++ });

  const slices: DicomSlice[] = [];
  for (let i = 0; i < pending.length; i++) {
    const p = pending[i];
    slices.push({
      data: decodeFrame(p.file, p.bytes, downsample),
      pos: p.pos ?? p.order,
      z: p.z,
    });
    if (i % 10 === 9) {
      onPhase({ phase: "parse", done: i + 1, total: pending.length });
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  slices.sort((a, b) => a.pos - b.pos);

  // Orient superior-up: after sorting by `pos`, decide whether index 0 is the
  // superior end using patient-Z (LPS z increases toward the head).
  const zFirst = slices[0]?.z;
  const zLast = slices[slices.length - 1]?.z;
  const zTopFirst =
    zFirst != null && zLast != null && zFirst !== zLast ? zFirst > zLast : false;

  // ---- geometry ----
  const step = downsample ? 2 : 1;
  const rows = Math.floor(ref.rows / step);
  const cols = Math.floor(ref.cols / step);
  const rowSpacing = ref.rowSpacing * step;
  const colSpacing = ref.colSpacing * step;
  let zSpacing = ref.spacingBetween ?? ref.sliceThickness ?? 1;
  if (slices.length > 2) {
    const diffs: number[] = [];
    for (let i = 1; i < Math.min(slices.length, 30); i++) {
      const d = Math.abs(slices[i].pos - slices[i - 1].pos);
      if (d > 0.001 && d < 50) diffs.push(d);
    }
    if (diffs.length > 2) {
      diffs.sort((a, b) => a - b);
      zSpacing = diffs[Math.floor(diffs.length / 2)];
    }
  }

  // ---- default window ----
  let wc = ref.wc;
  let ww = ref.ww;
  if (wc == null || ww == null || ww <= 1) {
    // Auto from the middle slice (percentile-ish via min/max of strided sample).
    const mid = slices[Math.floor(slices.length / 2)].data;
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < mid.length; i += 7) {
      const v = mid[i] * ref.slope + ref.intercept;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    if (!Number.isFinite(lo) || hi <= lo) {
      lo = 0;
      hi = 255;
    }
    wc = (lo + hi) / 2;
    ww = Math.max(1, hi - lo);
  }

  return {
    kind: "volume",
    slices,
    rows,
    cols,
    slope: ref.slope,
    intercept: ref.intercept,
    invert: ref.photometric === "MONOCHROME1",
    wc,
    ww,
    rowSpacing,
    colSpacing,
    zSpacing,
    downsampled: downsample,
    skipped,
    zTopFirst,
  };
}
