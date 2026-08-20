#!/usr/bin/env bash
# rentgen.az PACS — 7-day cache policy.
# Deletes studies whose last update is older than $TTL_DAYS, UNLESS the study
# carries a protected label: "archive" (paid cloud archive) or anything listed in
# PACS_KEEP_LABELS (comma-separated, e.g. a doctor label during the test phase).
# Runs daily from host cron: /opt/pacs/scripts/ttl-cleanup.sh >> /var/log/pacs-ttl.log
set -euo pipefail
cd /opt/pacs
set -a; . ./.env; set +a
TTL_DAYS="${PACS_TTL_DAYS:-7}"
KEEP_LABELS="archive,${PACS_KEEP_LABELS:-}"
O="http://127.0.0.1:8042"
AUTH="$ORTHANC_ADMIN_USER:$ORTHANC_ADMIN_PASS"
now=$(date +%s)
cutoff=$(( now - TTL_DAYS*86400 ))
deleted=0; kept=0; archived=0
run() { curl -fs -u "$AUTH" "$@"; }
for id in $(run "$O/studies" | jq -r '.[]'); do
  j=$(run "$O/studies/$id")
  labels=$(echo "$j" | jq -r '.Labels // [] | join(",")')
  keep=0
  IFS=, read -ra KL <<< "$KEEP_LABELS"
  for kl in "${KL[@]}"; do
    [ -n "$kl" ] && [[ ",$labels," == *",$kl,"* ]] && keep=1 && break
  done
  if [ "$keep" = 1 ]; then archived=$((archived+1)); continue; fi
  lu=$(echo "$j" | jq -r '.LastUpdate')            # e.g. 20260819T192600
  ts=$(date -u -d "${lu:0:8} ${lu:9:2}:${lu:11:2}:${lu:13:2}" +%s 2>/dev/null || echo "$now")
  if (( ts < cutoff )); then
    run -X DELETE "$O/studies/$id" >/dev/null && deleted=$((deleted+1))
  else
    kept=$((kept+1))
  fi
done
echo "$(date -Is) ttl=${TTL_DAYS}d deleted=$deleted kept=$kept archived=$archived"
