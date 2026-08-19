#!/usr/bin/env python3
"""
Import one DICOM file into Orthanc, splitting huge multi-frame CBCT exports
into a normal single-frame CT series (one instance per slice). Prints the
Orthanc study IDs touched (one per line, prefixed STUDY).
usage: split_upload.py <file.dcm> [label ...]
env: ORTHANC_ADMIN_USER / ORTHANC_ADMIN_PASS
"""
import sys, os, io, json, base64, http.client, copy
import pydicom
from pydicom.dataset import Dataset, FileMetaDataset
from pydicom.uid import generate_uid, ExplicitVRLittleEndian, CTImageStorage

U, P = os.environ["ORTHANC_ADMIN_USER"], os.environ["ORTHANC_ADMIN_PASS"]
AUTH = "Basic " + base64.b64encode(f"{U}:{P}".encode()).decode()
path = sys.argv[1]
labels = sys.argv[2:]

def post(body: bytes):
    c = http.client.HTTPConnection("127.0.0.1", 8042, timeout=600)
    c.request("POST", "/instances", body=body, headers={"Authorization": AUTH, "Content-Type": "application/dicom"})
    r = c.getresponse(); data = r.read()
    if r.status not in (200, 201):
        raise RuntimeError(f"orthanc {r.status}: {data[:200]!r}")
    return json.loads(data)

def put(path_):
    c = http.client.HTTPConnection("127.0.0.1", 8042, timeout=60)
    c.request("PUT", path_, body=b"", headers={"Authorization": AUTH})
    r = c.getresponse(); r.read(); return r.status

ds = pydicom.dcmread(path, force=True)
n = int(ds.get("NumberOfFrames", 1) or 1)
ts = str(ds.file_meta.get("TransferSyntaxUID", "")) if hasattr(ds, "file_meta") else ""
studies = set()

if n <= 1:
    with open(path, "rb") as f:
        r = post(f.read())
    studies.add(r["ParentStudy"])
    print("single-frame instance →", r["ParentStudy"])
else:
    if ts and pydicom.uid.UID(ts).is_compressed:
        print("ERROR compressed multiframe not supported", ts); sys.exit(2)
    rows, cols = int(ds.Rows), int(ds.Columns)
    spp = int(ds.get("SamplesPerPixel", 1)); ba = int(ds.BitsAllocated)
    fb = rows * cols * spp * (ba // 8)
    px = ds.PixelData
    if len(px) < fb * n:
        print("ERROR pixel data too short", len(px), fb * n); sys.exit(2)

    # geometry
    shared = ds.get("SharedFunctionalGroupsSequence", None)
    perframe = ds.get("PerFrameFunctionalGroupsSequence", None)
    def sfg(name, sub):
        if shared is None: return None
        s = shared[0].get(sub, None)
        return s[0].get(name, None) if s else None
    iop = ds.get("ImageOrientationPatient", None) or sfg("ImageOrientationPatient", "PlaneOrientationSequence") or [1, 0, 0, 0, 1, 0]
    spacing = ds.get("PixelSpacing", None) or sfg("PixelSpacing", "PixelMeasuresSequence") or [1, 1]
    thick = ds.get("SliceThickness", None) or sfg("SliceThickness", "PixelMeasuresSequence") or ds.get("SpacingBetweenSlices", None) or sfg("SpacingBetweenSlices", "PixelMeasuresSequence") or 1.0
    step = float(ds.get("SpacingBetweenSlices", None) or sfg("SpacingBetweenSlices", "PixelMeasuresSequence") or thick)
    ipp0 = ds.get("ImagePositionPatient", None) or sfg("ImagePositionPatient", "PlanePositionSequence") or [0, 0, 0]
    slope = ds.get("RescaleSlope", None) or sfg("RescaleSlope", "PixelValueTransformationSequence") or 1
    icpt = ds.get("RescaleIntercept", None) or sfg("RescaleIntercept", "PixelValueTransformationSequence") or 0
    wc = ds.get("WindowCenter", None) or sfg("WindowCenter", "FrameVOILUTSequence")
    ww = ds.get("WindowWidth", None) or sfg("WindowWidth", "FrameVOILUTSequence")
    # slice normal = row × col
    r_, c_ = [float(x) for x in iop[:3]], [float(x) for x in iop[3:]]
    nrm = [r_[1]*c_[2]-r_[2]*c_[1], r_[2]*c_[0]-r_[0]*c_[2], r_[0]*c_[1]-r_[1]*c_[0]]

    base = copy.deepcopy(ds)
    for tag in ("PixelData", "NumberOfFrames", "SharedFunctionalGroupsSequence", "PerFrameFunctionalGroupsSequence",
                "FrameIncrementPointer", "DimensionIndexSequence", "DimensionOrganizationSequence", "ConcatenationUID",
                "InConcatenationNumber", "ConcatenationFrameOffsetNumber"):
        if tag in base: del base[tag]
    base.SOPClassUID = CTImageStorage
    base.Modality = ds.get("Modality", "CT") if str(ds.get("Modality", "CT")) in ("CT", "OT") else "CT"
    if not base.get("SeriesInstanceUID"): base.SeriesInstanceUID = generate_uid()
    base.ImageOrientationPatient = [float(x) for x in iop]
    base.PixelSpacing = [float(x) for x in spacing]
    base.SliceThickness = float(thick)
    base.RescaleSlope = float(slope); base.RescaleIntercept = float(icpt)
    base.RescaleType = ds.get("RescaleType", "HU")
    if wc is not None and ww is not None:
        base.WindowCenter = wc; base.WindowWidth = ww
    base.ImageType = ["DERIVED", "PRIMARY", "AXIAL"]
    base.file_meta = FileMetaDataset()
    base.file_meta.TransferSyntaxUID = ExplicitVRLittleEndian
    base.file_meta.MediaStorageSOPClassUID = CTImageStorage
    base.is_little_endian = True; base.is_implicit_VR = False

    print(f"multiframe: {n} frames {rows}x{cols} step={step}mm; splitting…", flush=True)
    for i in range(n):
        pos = None
        if perframe is not None and i < len(perframe):
            pps = perframe[i].get("PlanePositionSequence", None)
            if pps: pos = [float(x) for x in pps[0].ImagePositionPatient]
        if pos is None:
            pos = [float(ipp0[k]) + nrm[k] * step * i for k in range(3)]
        inst = base  # reuse object, mutate per frame (we serialize immediately)
        inst.SOPInstanceUID = generate_uid()
        inst.file_meta.MediaStorageSOPInstanceUID = inst.SOPInstanceUID
        inst.InstanceNumber = i + 1
        inst.ImagePositionPatient = pos
        inst.SliceLocation = float(sum(pos[k] * nrm[k] for k in range(3)))
        inst.PixelData = px[i * fb:(i + 1) * fb]
        inst["PixelData"].VR = "OW" if ba > 8 else "OB"
        buf = io.BytesIO(); inst.save_as(buf, write_like_original=False)
        r = post(buf.getvalue())
        studies.add(r["ParentStudy"])
        if i % 100 == 0: print(f"  frame {i}/{n}", flush=True)

for s in studies:
    for lb in labels:
        put(f"/studies/{s}/labels/{lb}")
    print("STUDY", s)
