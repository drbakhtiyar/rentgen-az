#!/usr/bin/env python3
"""
DICOM seriya → (lazım olsa kiçildilmiş) NIfTI. 4GB RAM serverdə TotalSegmentator
OOM olmasın deyə böyük volumlar [::2,::2,::2] endirilir (nearest).
usage: prep-nifti.py <dicom_dir> <out.nii.gz>   # stdout: DOWNSAMPLE=1|0
"""
import sys, os, glob
import numpy as np
import pydicom
import nibabel as nib

src_dir, out_path = sys.argv[1], sys.argv[2]
MAX_VOXELS = 120_000_000  # bundan böyükdürsə 2x endir

files = []
for f in glob.glob(os.path.join(src_dir, "**", "*"), recursive=True):
    if not os.path.isfile(f):
        continue
    try:
        ds = pydicom.dcmread(f, stop_before_pixels=True, force=True)
        if getattr(ds, "Modality", "") in ("CT", "MR") and getattr(ds, "SeriesInstanceUID", None):
            files.append((str(ds.SeriesInstanceUID), int(getattr(ds, "InstanceNumber", 0) or 0), f))
    except Exception:
        pass
by = {}
for suid, inum, f in files:
    by.setdefault(suid, []).append((inum, f))
suid = max(by, key=lambda k: len(by[k]))
slist = [f for _, f in sorted(by[suid])]

d0 = pydicom.dcmread(slist[0], force=True)
rows, cols = int(d0.Rows), int(d0.Columns)
n = len(slist)
iop = [float(x) for x in d0.ImageOrientationPatient]
ipp0 = np.array([float(x) for x in d0.ImagePositionPatient])
ps = [float(x) for x in d0.PixelSpacing]
d1 = pydicom.dcmread(slist[min(1, n - 1)], force=True)
ipp1 = np.array([float(x) for x in d1.ImagePositionPatient])
zvec = ipp1 - ipp0 if n > 1 else np.array([0, 0, float(getattr(d0, "SliceThickness", 1) or 1)])
slope = float(getattr(d0, "RescaleSlope", 1) or 1)
icpt = float(getattr(d0, "RescaleIntercept", 0) or 0)

vol = np.empty((n, rows, cols), dtype=np.int16)
for i, f in enumerate(slist):
    ds = pydicom.dcmread(f, force=True)
    vol[i] = ds.pixel_array.astype(np.int16)
vol = (vol * slope + icpt).astype(np.int16)

step = 2 if (n * rows * cols) > MAX_VOXELS else 1
if step > 1:
    vol = vol[::step, ::step, ::step]
print(f"DOWNSAMPLE={step}", flush=True)

# affine (LPS→RAS): DICOM x→sağ(L), nib RAS
r = np.array(iop[:3]); c = np.array(iop[3:])
aff = np.eye(4)
aff[:3, 0] = c * ps[1] * step * -1  # kolon istiqaməti (x)
aff[:3, 1] = r * ps[0] * step * -1
aff[:3, 2] = zvec * step * -1
aff[0, :] *= -1; aff[1, :] *= -1  # LPS→RAS düzəlişini geri (yuxarıda -1 verdik)
aff[:3, 3] = ipp0 * np.array([-1, -1, 1])

# data sırası: nib (X,Y,Z) gözləyir → bizim (Z,Y,X) → transpoze
data = np.ascontiguousarray(np.transpose(vol, (2, 1, 0)))
img = nib.Nifti1Image(data, aff)
img.header.set_zooms((ps[1] * step, ps[0] * step, float(np.linalg.norm(zvec)) * step))
nib.save(img, out_path)
print("NII-OK", data.shape, flush=True)
