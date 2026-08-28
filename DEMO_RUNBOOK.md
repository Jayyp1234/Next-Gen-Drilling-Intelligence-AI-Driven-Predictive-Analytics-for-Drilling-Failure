# DrillGuard — Demo-Day Runbook

Everything to bring the FULL stack up from a cold Mac, the exact on-stage demo
path, and the fallbacks. Rehearse this once the night before.

---

## 1. Start the stack (4 services, in this order)

### 1a. Database — XAMPP MariaDB (holds the `drillguard` DB)
Open the XAMPP app → Start MySQL. Or from a terminal:

```bash
sudo /Applications/XAMPP/xamppfiles/xampp startmysql
```

⚠️ Do NOT `brew services start mysql` — the Homebrew MySQL 9 fights XAMPP for
port 3306 and its client can't speak to MariaDB. If ports conflict:
`brew services stop mysql`.

Check: `/Applications/XAMPP/xamppfiles/bin/mysql -h127.0.0.1 -uroot drillguard -e "SELECT COUNT(*) FROM alerts;"`

### 1b. PHP business API (port 8077)

```bash
cd ~/Developer/Next-Gen-Drilling-Intelligence-AI-Driven-Predictive-Analytics-for-Drilling-Failure/backend && php -S 127.0.0.1:8077 -t public public/index.php
```

Check: `curl -s http://127.0.0.1:8077/api/health` → `{"ok":true,...}`

### 1c. Python inference API (port 8099)

```bash
cd ~/Developer/Next-Gen-Drilling-Intelligence-AI-Driven-Predictive-Analytics-for-Drilling-Failure && ml-pipeline/serving/.venv/bin/uvicorn app:app --app-dir ml-pipeline/serving --host 127.0.0.1 --port 8099
```

Check: `curl -s http://127.0.0.1:8099/health` → `{"ok":true,"service":"drillguard-inference",...}`
(venv is Python 3.12 via uv; if ever rebuilt: `uv venv --python 3.12 --managed-python .venv` then `uv pip install --python .venv/bin/python -r requirements.txt` inside `ml-pipeline/serving`)

### 1d. Web app (port 3100)

```bash
cd ~/Developer/Next-Gen-Drilling-Intelligence-AI-Driven-Predictive-Analytics-for-Drilling-Failure/frontend/drillguard-web && npm run dev -- --port 3100
```

Open http://localhost:3100 — sign in `engineer@drilcorp.com` / `drillguard`
(or the "Launch demo" button).

### 1e. Mobile app (optional but impressive)

```bash
cd ~/Developer/Next-Gen-Drilling-Intelligence-AI-Driven-Predictive-Analytics-for-Drilling-Failure/mobile/drillguard-mobile && npx expo start
```

Then boot the simulator and launch the installed dev build:

```bash
xcrun simctl boot 840F898F-0D2C-42F6-AD77-9CEF11246FA1 ; open -a Simulator ; sleep 5 ; xcrun simctl launch booted com.heisienberg.drillguard-mobile
```

---

## 2. SMS alerts (LIVE via Termii)

- Config lives in `backend/.env` (gitignored): `SMS_PROVIDER=termii`,
  `SMS_SENDER=N-Alert`, `SMS_CHANNEL=dnd`, `SMS_API_KEY=<Termii key>`.
- The crew phone is on the user profile (Settings → Alert Notifications).
  Currently: 09032210788.
- Every Elevated/Action alert POSTed to `/api/alerts` sends a real SMS and logs
  the delivery receipt in the `notifications` table.
- Pre-demo check: Settings → Alert Notifications → **Send test notification**
  → SMS chip should read **sent**. (Termii balance was ₦93.8k on 2026-08-27.)
- Kill switch (if the phone must stay quiet): set `SMS_PROVIDER=log` in
  `backend/.env` — everything still works, deliveries log as `dryrun`.

## 3. The on-stage demo path (~6 minutes)

1. **Sign in** (real JWT auth against MariaDB). Note the alerts bell count —
   real rows in the DB.
2. **Live Monitoring** loads Bilabri D2 (Niger Delta, documented stuck pipe).
   Point out: `REPLAY · documented (GEOL daily report)` — real field data,
   documented incident, held-out well.
3. Point at the **Live Model panel**: risk is POSTed to the Python service and
   computed on the last 30 samples (~20-50 ms, RF+LSTM-AE+DTW). It matches the
   gauge. *"The system is thinking, not playing back."*
4. **Jump to event → Play (10×)**: watch the approach to the documented event
   at 1659 m; the RF channel warns ~50 m ahead. D2's fused tier honestly stays
   at Watch (the LSTM veto — say so, it's a feature).
5. **Switch well** (header picker) → *31/5-7 Eos MWD_9 — Stick-slip* → Play.
   In ~30 s it escalates to **Action** → the alert is recorded in the DB and
   **the crew phone BUZZES with a real SMS from N-Alert**. Hand the phone to a
   judge beforehand.
6. **Alerts page**: the new alert is there; acknowledge it.
7. **Mobile**: same alert in the Operations feed on the phone app; acknowledge
   from the phone → refresh web → acknowledged. One database, three surfaces.
8. **Analyze Well**: upload / "Try the sample well" on Pack-Off → 133 windows
   scored live, peak 98 @ 1399 m, Watch+Elevated ~17 m before the documented
   pack-off at 1416 m.
9. Close with the honesty line: every number came from a real model on real
   field data with documented incidents; what's not built is on the roadmap
   sheet.

## 4. Fallbacks

- **No internet on stage**: everything above is localhost — only the SMS needs
  internet, and SMS now has a **store-and-forward outbox**: while the link is
  down, alert SMS are QUEUED ("link down — queued for retry", amber chip in
  Settings → Alert Notifications), and they auto-send on the next alert once
  the link returns (or click the chip / POST /api/notifications/retry).
  This is demoable ON PURPOSE: add `SMS_API_URL=http://127.0.0.1:9/api/sms/send`
  to `backend/.env` to simulate the link dropping, fire an alert (queued),
  remove the line, click retry → the phone buzzes. "The rig keeps working;
  the message waits for the link." Verified end-to-end 2026-08-28.
- **Inference service dies**: the Live Model panel shows its error state; the
  replay gauge (precomputed pipeline scores) still runs. Restart with 1c.
- **Web dies**: the mobile app is a full second client.
- **Everything dies**: `chapters/demo_walkthrough_script.md` is OUTDATED (old
  mock frontend) — do NOT use it. Record a fresh backup video of the path in
  §3 the night before.

## 5. Known honest limits (say them before judges find them)

- D2's fused tier caps at Watch (LSTM veto) — the 50 m lead is the RF channel;
  framed as the STEP-5b falsification finding.
- Email channel is dry-run until SMTP credentials are added (SMS is live).
- Sustainability figures are estimates from measured activity (labelled).
- Kick/lost-circulation not yet modelled (data gaps documented).
