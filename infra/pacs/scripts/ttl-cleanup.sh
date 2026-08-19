#!/usr/bin/env bash
# rentgen.az PACS — 7-day cache policy.
# Deletes studies whose last update is older than $TTL_DAYS, UNLESS the study
# carries the Orthanc label "archive" (paid cloud archive) — those are kept forever.
# Runs daily from host cron: /opt/pacs/scripts/ttl-cleanup.sh >> /var/log/pacs-ttl.log
set -euo pipefail
cd /opt/pacs
set -a; . ./.env; set +a
TTL_DAYS="${PACS_TTL_DAYS:-7}"
O="http://127.0.0.1:8042"
AUTH="$ORTHANC_ADMIN_USER:$ORTHANC_ADMIN_PASS"
now=$(date +%s)
cutoff=$(( now - TTL_DAYS*86400 ))
deleted=0; kept=0; archived=0
run() { curl -fs -u "$AUTH" "$@"; }
for id in $(run "$O/studies" | jq -r '.[]'); do
  j=$(run "$O/studies/$id")
  labels=$(echo "$j" | jq -r '.Labels // [] | join(",")')
  if [[ ",$labels," == *",archive,"* ]]; then archived=$((archived+1)); continue; fi
  lu=$(echo "$j" | jq -r '.LastUpdate')            # e.g. 20260819T192600
  ts=$(date -u -d "${lu:0:8} ${lu:9:2}:${lu:11:2}:${lu:13:2}" +%s 2>/dev/null || echo "$now")
  if (( ts < cutoff )); then
    run -X DELETE "$O/studies/$id" >/dev/null && deleted=$((deleted+1))
  else
    kept=$((kept+1))
  fi
done
echo "$(date -Is) ttl=${TTL_DAYS}d deleted=$deleted kept=$kept archived=$archived"
