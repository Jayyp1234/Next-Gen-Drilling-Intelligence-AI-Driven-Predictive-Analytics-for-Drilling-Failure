# DrillGuard — Deployment Runbook (Phase B)

> **⭐ PREFERRED PATH (2026-08-28): the existing Namecheap VPS
> `server1.enetworkstechnologiesltd.com` (209.74.72.132, AlmaLinux 8 + cPanel,
> 6 GB, already runs live sites + the SepalSolver runner).** House pattern
> honoured: nothing touches Apache/cPanel/CSF — the Python model service runs
> loopback-only under systemd, reached through the **`/api/infer/*` proxy built
> into the PHP backend** (verified locally: health, score-sample, multipart
> score-csv all pass through; unknown paths 404). Clients set
> `*_INFER_BASE=https://api.<domain>/api/infer` — no other change.
>
> Kit in **`deploy/vps/`**: `setup-almalinux-drillguard.sh` (server prep — uv +
> py3.12, systemd unit, MemoryMax=1200M; every dnf uses
> `--disablerepo=MariaDB106` per the broken-repo gotcha) and
> `push_drillguard.sh` (rsync serving/ → build venv on server → restart →
> health check). PHP side is pure cPanel: subdomain api.<domain> →
> backend/public, DB via MySQL Databases, migrations 001–004, `.env` with
> Termii keys + `INFER_URL=http://127.0.0.1:8099`. No Docker required.
> Footprint: service a few hundred MB hot, 777 MB venv, 10 MB models — fine
> next to the 1–2 GB SepalSolver pool on 6 GB + 2 GB swap.
> (`setup_vps.sh` + apache-*.conf remain for a plain Ubuntu box.)
> **Web app: STATIC EXPORT VERIFIED (2026-08-28)** — `output: "export"` +
> `trailingSlash` in next.config; `/incidents/[id]` became `/incidents/view?id=`
> (Suspense-wrapped useSearchParams); internal replay routes baked as static
> JSON (catalog moved to `/api/replay-catalog`, aliased in PHP). Build with
> **`npm run build:static`** (pins API/INFER bases to
> api.drillguard.enetworkstechnologiesltd.com) and upload `out/` (6.3 MB) to the
> cPanel docroot of **drillguard.enetworkstechnologiesltd.com**. Rehearsed
> locally: login, replay stream, deep links, and the Live Model panel scoring
> through the /api/infer proxy — all from the static build. No Vercel needed.
>
> The sections below remain as the split-hosting alternative.

Everything needed to put the full stack on shareable URLs. There are **three
deployable services** + two client build targets. You supply the hosting
accounts (I can't create or pay for those); each step below is mechanical.

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────────┐
│ Next.js web │──▶──│ PHP API + MySQL  │     │ Python inference API  │
│  (Vercel)   │     │  (cPanel host)   │     │ (Railway/Render/Fly)  │
└─────────────┘     └──────────────────┘     └───────────────────────┘
       │  also calls the inference API directly ▲──────────────────────┘
Mobile (Expo) ── same PHP + inference APIs
```

## What deploys where

| Service | Path | Host (suggested) | Why |
|---|---|---|---|
| **Web app** | `frontend/drillguard-web` | **Vercel** (free) | native Next.js |
| **Business API + DB** | `backend/` (PHP 8) + MySQL | **cPanel shared hosting** (~₦3–8k/yr) | what it was built for |
| **Inference API** | `ml-pipeline/serving` (FastAPI) | **Railway / Render / Fly.io** (free tier) | needs Python + the model artifacts |
| **Mobile app** | `mobile/drillguard-mobile` | Expo Go (demo) or EAS build (store) | — |

The web app and mobile app talk to **both** the PHP API and the inference API.

---

## 1. Inference API (Python) → Railway / Render / Fly

The model artifacts (`ml-pipeline/serving/models/*`, ~15 MB) and samples are
committed, so the service is self-contained.

1. `requirements.txt` for the service:
   ```
   fastapi>=0.110
   uvicorn[standard]>=0.29
   python-multipart
   scikit-learn==1.9.0
   torch==2.13.0
   pandas
   numpy
   joblib
   scipy
   ```
   (Torch is the big one — pin the CPU wheel to keep the image small.)
2. Start command: `uvicorn app:app --app-dir ml-pipeline/serving --host 0.0.0.0 --port $PORT`
3. Env: `INFER_CORS=https://<your-vercel-app>.vercel.app` (comma-sep for several origins).
4. Deploy → note the URL, e.g. `https://drillguard-infer.up.railway.app`.
5. Smoke test: `GET /health`, `GET /model`, `GET /score-sample?model=bilabri-d2`.

> The 3 model folders (`bilabri-d2`, `eos-stick-slip`, `volve-packoff`) are
> reproducible: `python ml-pipeline/serving/export_models.py` (+ `export_eos.py`,
> `export_volve.py`). Commit them so the host doesn't need the training data.

## 2. PHP API + MySQL → cPanel

1. Create a MySQL DB + user in cPanel; note host/name/user/pass.
2. Upload `backend/` (run `composer install` locally first, or via host terminal).
3. Point a subdomain's document root at `backend/public/` (or rely on the
   included `public/.htaccess` rewrite).
4. Copy `backend/.env.example` → `.env` and set `DB_*`, a strong `JWT_SECRET`,
   `CORS_ORIGINS=https://<your-vercel-app>.vercel.app`, and `MAIL_*` / `SMS_*`
   when you have credentials (leave dry-run otherwise).
5. Run once (cPanel Terminal): `php scripts/migrate.php && php scripts/seed.php`.
6. Export + upload the replay JSON: locally run the web dev server, then
   `./backend/scripts/export_replay.sh http://localhost:3100`, and upload
   `backend/data/replay/*.json` to the host.
7. Smoke test: `GET /api/health`, `POST /api/auth/login` (demo creds).

## 3. Web app → Vercel

1. Import the repo, set **Root Directory** = `frontend/drillguard-web`.
2. Environment variables:
   ```
   NEXT_PUBLIC_API_BASE   = https://<your-cpanel-api-domain>
   NEXT_PUBLIC_INFER_BASE = https://<your-inference-host>
   ```
   (Leave both unset to fall back to the self-contained replay demo.)
3. Deploy → get `https://<app>.vercel.app`.
4. Go back and set `CORS_ORIGINS` (PHP) and `INFER_CORS` (inference) to this URL.
5. Verify: sign in, load a replay, watch the Live Model panel score, open
   **Analyze Well** → Try the sample well.

## 4. Mobile app

- **Demo (fastest):** `cd mobile/drillguard-mobile`, set `.env`
  `EXPO_PUBLIC_API_BASE` + `EXPO_PUBLIC_INFER_BASE` to the deployed URLs,
  `npx expo start`, scan the QR with **Expo Go**.
- **Store build:** `eas build` (needs an Expo account + EAS config) — out of
  scope for the demo, but the app is EAS-ready.

## Pre-flight checklist
- [ ] Inference `/health` green, `/score-sample?model=…` returns detections
- [ ] PHP `/api/health` green, demo login works, `/api/replay` serves 8 datasets
- [ ] Web app loads, live gauge computes, Analyze scores all 3 models
- [ ] CORS: both APIs list the Vercel origin; no console CORS errors
- [ ] Secrets: real `JWT_SECRET`, DB creds set via host panel — **never committed**

## Cost
Vercel free + a free Python tier + ~₦3–8k/yr cPanel = a fully live, shareable
stack for roughly the price of the domain.
