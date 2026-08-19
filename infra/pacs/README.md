# infra/pacs — pacs.rentgen.az

Hetzner CPX22 (Falkenstein, `167.233.72.179`, Ubuntu 24.04), Docker Compose in `/opt/pacs`.
Secrets live ONLY in `/opt/pacs/.env` on the server (`ORTHANC_ADMIN_USER/PASS`,
`ORTHANC__REGISTERED_USERS`, `PACS_SHARED_SECRET`) and in Vercel env (`PACS_SHARED_SECRET`,
`PACS_ORTHANC_URL`, `PACS_ORTHANC_USER/PASS`).

| Service | Image | Role |
|---|---|---|
| caddy | caddy:2-alpine | TLS (Let's Encrypt), routing, `forward_auth` |
| orthanc | orthancteam/orthanc | DICOM index + storage (local SSD, ≤60 GB), DICOMweb at `/orthanc/dicom-web/` |
| ohif | ohif/app | Viewer at `/` (`/viewer?StudyInstanceUIDs=…`) |
| auth | node:22-alpine + `auth/server.mjs` | `/open?t=` signed link → cookie; `/verify` for every `/orthanc/*` |

**Access model:** rentgen.az mints HMAC tokens (`{sub, role, study, exp}`) with the shared
secret; `study="*"` = full access (admin), otherwise one StudyInstanceUID. Gateways (clinic
Orthanc peers) authenticate with their own Basic credentials registered in Orthanc — they
bypass the cookie check (`/verify` passes any request carrying `Authorization`).

**Retention:** `scripts/ttl-cleanup.sh` (host cron, daily 04:00 Baku) deletes studies older
than `PACS_TTL_DAYS` (7) unless labelled `archive` (paid cloud archive → kept).

**Deploy changes:** edit here → `scp -r infra/pacs/* root@167.233.72.179:/opt/pacs/` →
`docker compose up -d` (Caddy reload: `docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile`).
