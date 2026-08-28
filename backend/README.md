# DrillGuard Backend (PHP + MySQL/MariaDB)

The business backend for DrillGuard: **auth, wells, alerts, incidents, replay serving,
and email/SMS alert dispatch**. Plain PHP 8 + PDO — no framework, no build step — so it
deploys to ordinary cPanel/shared hosting.

> **What this backend does NOT do:** run the ML models. Prediction is Python (offline).
> The models' output is exported to compact JSON (`scripts/export_replay.sh`) and this
> backend serves it. One source of truth for what the models produced.

## Architecture

```
MySQL/MariaDB  ─ users · wells · alerts · incidents · incident_activity · notifications
      │
PHP API (public/index.php front controller)
      ├─ POST /api/auth/register · /login · /logout   ·  GET /api/auth/me     (JWT + bcrypt)
      ├─ GET  /api/wells
      ├─ GET/POST /api/alerts · GET /api/alerts/{id} · POST /api/alerts/{id}/ack
      ├─ GET/POST /api/incidents · GET/PATCH /api/incidents/{id}
      └─ GET  /api/replay · /api/replay/{id}           (serves exported pipeline JSON)
      │
Next.js frontend  ─ fetches from NEXT_PUBLIC_API_BASE (see src/lib/api/client.ts)
```

## Local setup

```bash
cd backend
composer install
cp .env.example .env            # then edit DB_* and set a real JWT_SECRET
php scripts/migrate.php         # creates the tables
php scripts/seed.php            # demo user + wells + documented anchors
php -S 127.0.0.1:8077 -t public public/index.php   # dev server
```

Export the replay data (needs the Next dev server running so the transform is reused):

```bash
./scripts/export_replay.sh http://localhost:3100   # writes data/replay/*.json
```

Health check: `curl http://127.0.0.1:8077/api/health`

**Demo login:** `engineer@drilcorp.com` / `drillguard`

## API summary

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create account, returns JWT |
| POST | `/api/auth/login` | – | Login, returns JWT |
| GET  | `/api/auth/me` | ✔ | Current user |
| GET  | `/api/wells` | ✔ | Wells registry |
| GET  | `/api/alerts?status=` | ✔ | List alerts (filter by status) |
| POST | `/api/alerts` | ✔ | Record a fired alert; notifies on Elevated/Action |
| POST | `/api/alerts/{id}/ack` | ✔ | Acknowledge |
| GET  | `/api/incidents` | ✔ | List incidents |
| POST | `/api/incidents` | ✔ | Create / escalate from an alert |
| GET  | `/api/incidents/{id\|code}` | ✔ | Incident + activity log |
| PATCH| `/api/incidents/{id\|code}` | ✔ | Update (status, owner, …) — logs activity |
| GET  | `/api/replay` | – | Dataset catalog (exported pipeline output) |
| GET  | `/api/replay/{id}` | – | One dataset's rows + anchors |

Send the JWT as `Authorization: Bearer <token>`.

## Email + SMS alerts

**Safe by default:** with `MAIL_ENABLED=false` and `SMS_PROVIDER=log`, nothing is sent —
each attempt is recorded in the `notifications` table with status `dryrun`. This is so the
system is *ready* without fake "sent" claims.

To go live, set in `.env`:

- **Email (SMTP):** `MAIL_ENABLED=true`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`,
  `MAIL_PASSWORD`, `MAIL_FROM`. (Gmail needs an App Password.)
- **SMS:** `SMS_PROVIDER=termii` (Nigerian gateway) or `twilio`, plus `SMS_API_KEY`
  (and `SMS_ACCOUNT_SID` + `SMS_FROM` for Twilio).

Alerts at tier **Elevated** or **Action** trigger dispatch on creation.

## Deploy to cPanel / shared hosting

1. Upload the `backend/` folder (run `composer install` locally first, or via the host).
2. Point the domain/subdomain document root at `backend/public/`.
   (If you can't move the web root, the included `public/.htaccess` handles rewriting.)
3. Create a MySQL DB + user in cPanel; put the credentials in `.env`.
4. Run migrate + seed once (cPanel "Terminal", or a temporary `setup.php`).
5. Run `export_replay.sh` locally and upload `data/replay/*.json`.
6. Set `CORS_ORIGINS` to your deployed frontend URL and a strong `JWT_SECRET`.

## Frontend wiring

`frontend/drillguard-web/src/lib/api/client.ts` is the ready client. Set
`NEXT_PUBLIC_API_BASE` in the frontend's `.env.local` to this API's URL. Until it's set,
`apiEnabled` is `false` and the app keeps its current local behaviour — so wiring is
opt-in and non-breaking.
