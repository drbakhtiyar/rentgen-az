#!/usr/bin/env bash
# rentgen.az PACS — seqmentasiya işçisi.
# Növbə: /opt/pacs/seg-jobs/<orthancStudyId>.job  (içi: task adı, məs. "teeth" | "total")
# Nəticə: DICOM SEG → Orthanc-a yüklənir (eyni tədqiqata düşür), status faylı yazılır.
# Host cron: * * * * * flock -n /opt/pacs/seg-jobs/.lock /opt/pacs/scripts/seg-worker.sh >> /var/log/pacs-seg.log 2>&1
set -uo pipefail
cd /opt/pacs
set -a; . ./.env; set +a
JOBS=/opt/pacs/seg-jobs
mkdir -p "$JOBS"
AUTH="$ORTHANC_ADMIN_USER:$ORTHANC_ADMIN_PASS"
O="http://127.0.0.1:8042"

job=$(ls "$JOBS"/*.job 2>/dev/null | head -1) || true
[ -z "${job:-}" ] && exit 0
sid=$(basename "$job" .job)
task=$(cat "$job" | tr -cd 'a-z_')
[ -z "$task" ] && task=total
mv "$job" "$JOBS/$sid.running"
echo "$(date -Is) START $sid task=$task"

W=/root/seg-work/$sid
rm -rf "$W"; mkdir -p "$W/src"
cleanup_fail() {
  echo "$(date -Is) FAIL $sid: $1"
  echo "{\"status\":\"failed\",\"error\":\"$1\",\"at\":\"$(date -Is)\"}" > "$JOBS/$sid.status"
  rm -f "$JOBS/$sid.running"; rm -rf "$W"
  exit 0
}

curl -sf -u "$AUTH" "$O/studies/$sid/archive" -o "$W/study.zip" || cleanup_fail "orthanc export"
unzip -q "$W/study.zip" -d "$W/src" || cleanup_fail "unzip"

/root/segvenv/bin/TotalSegmentator -i "$W/src" -o "$W/out" --ml -ta "$task" -d cpu > "$W/ts.log" 2>&1 \
  || cleanup_fail "TotalSegmentator ($(tail -1 "$W/ts.log" | tr -d '"' | cut -c1-120))"

NII=$(ls "$W"/out*.nii.gz "$W"/out/*.nii.gz 2>/dev/null | head -1)
[ -z "$NII" ] && cleanup_fail "nii tapılmadı"

/root/segvenv/bin/python /opt/pacs/scripts/make-seg.py "$W/src" "$NII" "$task" "$W/seg.dcm" > "$W/seg.log" 2>&1 \
  || cleanup_fail "SEG çevirmə ($(tail -1 "$W/seg.log" | cut -c1-120))"

curl -sf -u "$AUTH" -X POST "$O/instances" --data-binary @"$W/seg.dcm" -H "Content-Type: application/dicom" -H "Expect:" -o /dev/null \
  || cleanup_fail "orthanc yükləmə"

echo "{\"status\":\"done\",\"task\":\"$task\",\"at\":\"$(date -Is)\"}" > "$JOBS/$sid.status"
rm -f "$JOBS/$sid.running"; rm -rf "$W"
echo "$(date -Is) DONE $sid"
