#!/usr/bin/env python3
"""
TotalSegmentator multilabel NIfTI → DICOM SEG (rəngli, latın adlı seqmentlər)
usage: make-seg.py <source_dicom_dir> <multilabel.nii.gz> <task> <out.dcm>
Orthanc-a yüklənəndə OHIF seqmentasiya paneli hər strukturu ayrıca rəng +
SegmentLabel (latınca) ilə göstərir.
"""
import sys, os, glob, colorsys
import numpy as np
import pydicom
import nibabel as nib
import highdicom as hd
from pydicom.sr.codedict import codes
from pydicom.uid import generate_uid

src_dir, nii_path, task, out_path = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]

from totalsegmentator.map_to_binary import class_map
CLASSES = class_map[task]  # {label_int: name}

# İngilis sinif adı → Latın anatomik ad (əsas sümüklər + baş-boyun; qalanı olduğu kimi)
LATIN = {
    "skull": "Cranium", "mandible": "Mandibula", "maxilla": "Maxilla",
    "clavicula_left": "Clavicula sin.", "clavicula_right": "Clavicula dex.",
    "scapula_left": "Scapula sin.", "scapula_right": "Scapula dex.",
    "humerus_left": "Humerus sin.", "humerus_right": "Humerus dex.",
    "sternum": "Sternum", "spinal_cord": "Medulla spinalis",
    "femur_left": "Femur sin.", "femur_right": "Femur dex.",
    "hip_left": "Os coxae sin.", "hip_right": "Os coxae dex.",
    "sacrum": "Os sacrum", "brain": "Cerebrum", "trachea": "Trachea",
    "thyroid_gland": "Glandula thyroidea", "esophagus": "Oesophagus",
    "lung_upper_lobe_left": "Lobus superior pulmonis sin.",
    "lung_lower_lobe_left": "Lobus inferior pulmonis sin.",
    "lung_upper_lobe_right": "Lobus superior pulmonis dex.",
    "lung_middle_lobe_right": "Lobus medius pulmonis dex.",
    "lung_lower_lobe_right": "Lobus inferior pulmonis dex.",
    "heart": "Cor", "aorta": "Aorta", "liver": "Hepar", "spleen": "Splen/Lien",
    "kidney_left": "Ren sin.", "kidney_right": "Ren dex.",
    "stomach": "Gaster/Ventriculus", "pancreas": "Pancreas",
    "gallbladder": "Vesica biliaris", "urinary_bladder": "Vesica urinaria",
    "prostate": "Prostata", "duodenum": "Duodenum", "colon": "Colon",
    "small_bowel": "Intestinum tenue",
    "common_carotid_artery_left": "A. carotis communis sin.",
    "common_carotid_artery_right": "A. carotis communis dex.",
    "internal_jugular_vein_left": "V. jugularis interna sin.",
    "internal_jugular_vein_right": "V. jugularis interna dex.",
    "sternocleidomastoid_left": "M. sternocleidomastoideus sin.",
    "sternocleidomastoid_right": "M. sternocleidomastoideus dex.",
    "atlas_C1": "Atlas (C1)", "axis_C2": "Axis (C2)",
}
def latin(name: str) -> str:
    if name in LATIN:
        return LATIN[name]
    n = name
    for a, b in (("vertebrae_", "Vertebra "), ("rib_left_", "Costa sin. "), ("rib_right_", "Costa dex. "),
                 ("_left", " sin."), ("_right", " dex."), ("_", " ")):
        n = n.replace(a, b)
    return n[0].upper() + n[1:]

def color_for(i: int, total: int):
    # sabit, fərqləndirilə bilən palitra (HSV çarxı)
    h = (i * 0.61803398875) % 1.0
    r, g, b = colorsys.hsv_to_rgb(h, 0.78, 0.95)
    return [int(r * 255), int(g * 255), int(b * 255)]

# --- mənbə seriya (ən böyük CT seriyası) ---
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
by_series = {}
for suid, inum, f in files:
    by_series.setdefault(suid, []).append((inum, f))
suid = max(by_series, key=lambda k: len(by_series[k]))
slist = [f for _, f in sorted(by_series[suid])]
sources = [pydicom.dcmread(f, force=True) for f in slist]
print(f"source series: {len(sources)} slices", flush=True)

# --- labelmap → mask array (frames, rows, cols) mənbə sırası ilə ---
nii = nib.load(nii_path)
lab = np.asanyarray(nii.dataobj)  # (X, Y, Z) LPS/RAS...
# TotalSegmentator çıxışı mənbə həndəsəsinə uyğundur (dicom input → nii eyni grid).
# DICOM sırası: hər slice üçün nii-nin Z oxu; nibabel RAS+ → axial DICOM adətən
# lab[:, :, k] transpoze + flip tələb edir. Ən etibarlı: affinlərə görə yoxlamaq
# əvəzinə TotalSegmentator-un dicom girişində saxladığı sıraya güvənirik:
lab = np.flip(np.transpose(lab, (2, 1, 0)), axis=(0,))  # (Z,Y,X) → slice sırası
lab = np.ascontiguousarray(lab)
# kiçildilmiş çıxışı mənbə ölçüsünə qaytar
tgt = (len(sources), int(sources[0].Rows), int(sources[0].Columns))
if lab.shape != tgt:
    fz = max(1, round(tgt[0] / lab.shape[0]))
    fy = max(1, round(tgt[1] / lab.shape[1]))
    fx = max(1, round(tgt[2] / lab.shape[2]))
    if (fz, fy, fx) != (1, 1, 1):
        lab = np.repeat(np.repeat(np.repeat(lab, fz, 0), fy, 1), fx, 2)
    lab = lab[: tgt[0], : tgt[1], : tgt[2]]
    if lab.shape != tgt:
        pad = [(0, tgt[i] - lab.shape[i]) for i in range(3)]
        lab = np.pad(lab, pad)
# mənbə slice sayı ilə uyğunluq
if lab.shape[0] != len(sources):
    # bəzi hallarda Z tərs olur
    print(f"WARN shape {lab.shape} vs slices {len(sources)}", flush=True)

present = [int(v) for v in np.unique(lab) if int(v) != 0]
present = [v for v in present if v in CLASSES]
if not present:
    print("NO-SEGMENTS")
    sys.exit(3)
print("segments:", [CLASSES[v] for v in present], flush=True)

mask = np.zeros((len(sources), lab.shape[1], lab.shape[2]), dtype=np.uint8)
descs = []
for new_idx, v in enumerate(present, start=1):
    m = lab == v
    mask[m[: len(sources)]] = 0  # placeholder (aşağıda birbaşa yazacağıq)
seg_stack = np.zeros((len(sources), lab.shape[1], lab.shape[2]), dtype=np.uint8)
for new_idx, v in enumerate(present, start=1):
    seg_stack[lab[: len(sources)] == v] = new_idx

for new_idx, v in enumerate(present, start=1):
    name = CLASSES[v]
    rgb = color_for(new_idx, len(present))
    descs.append(
        hd.seg.SegmentDescription(
            segment_number=new_idx,
            segment_label=latin(name),
            segmented_property_category=codes.SCT.AnatomicalStructure,
            segmented_property_type=codes.SCT.Bone if any(
                k in name for k in ("skull", "mandible", "vertebra", "rib_", "femur", "hip", "sacrum",
                                     "humerus", "clavicula", "scapula", "sternum", "atlas", "axis", "maxilla")
            ) else codes.SCT.Organ,
            algorithm_type=hd.seg.SegmentAlgorithmTypeValues.AUTOMATIC,
            algorithm_identification=hd.AlgorithmIdentificationSequence(
                name="TotalSegmentator", version="2", family=codes.DCM.ArtificialIntelligence
            ),
            display_color=hd.color.CIELabColor.from_rgb(*rgb) if hasattr(hd.color, "CIELabColor") else None,
        )
    )

seg = hd.seg.Segmentation(
    source_images=sources,
    pixel_array=seg_stack,
    segmentation_type=hd.seg.SegmentationTypeValues.BINARY,
    segment_descriptions=descs,
    series_instance_uid=generate_uid(),
    series_number=900,
    sop_instance_uid=generate_uid(),
    instance_number=1,
    manufacturer="rentgen.az PACS",
    manufacturer_model_name="TotalSegmentator",
    software_versions="2",
    device_serial_number="1",
    series_description=f"AI seqmentasiya ({task})",
    omit_empty_frames=True,
)
seg.save_as(out_path)
print("SEG-OK", out_path, os.path.getsize(out_path), flush=True)
