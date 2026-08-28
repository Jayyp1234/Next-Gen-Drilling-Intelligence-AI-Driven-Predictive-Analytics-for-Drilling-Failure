#!/usr/bin/env bash
# DrillGuard — server prep for server1.enetworkstechnologiesltd.com
# (AlmaLinux 8 + cPanel/CSF, 6 GB RAM, already runs live sites + the SepalSolver
#  runner). Follows the house pattern: touch NOTHING in Apache/cPanel/CSF —
#  the model service lives on loopback only, reached through the PHP proxy
#  built into the DrillGuard backend (/api/infer/*). No Docker needed.
#
# Run as root:  bash setup-almalinux-drillguard.sh
set -euo pipefail

APP=/opt/drillguard

echo "== 0. sanity =="
free -h
df -h / | tail -1
# NOTE: the MariaDB106 dnf repo on this box is broken (10.6 moved to archive).
# Every dnf call below disables it, per the SepalSolver deploy notes.
DNF="dnf --disablerepo=MariaDB106 -y"

echo "== 1. uv (brings its own Python 3.12 — matches the trained artifacts) =="
command -v uv >/dev/null || curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
uv --version

echo "== 2. app dir =="
mkdir -p "$APP"
echo "   -> now push code from the Mac:  RUNNER_HOST=root@209.74.72.132 ./deploy/vps/push_drillguard.sh"

echo "== 3. systemd unit =="
cat > /etc/systemd/system/drillguard-inference.service <<'UNIT'
[Unit]
Description=DrillGuard inference API (uvicorn, loopback only)
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/drillguard/serving
# uvicorn genuinely binds 127.0.0.1 (unlike .NET HttpListener) — the service is
# not reachable from outside even before any firewall consideration.
ExecStart=/opt/drillguard/serving/.venv/bin/uvicorn app:app --host 127.0.0.1 --port 8099 --workers 1
Restart=always
RestartSec=3
# 6 GB box shared with live sites + the SepalSolver warm pool: hard cap.
MemoryMax=1200M

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
echo "   -> after the first push: systemctl enable --now drillguard-inference"

echo "== 4. (optional, defense in depth) CSF belt-and-braces for 8099 =="
echo "   uvicorn already binds loopback, so this is OPTIONAL. To mirror the"
echo "   5099 pattern in /usr/local/csf/bin/csfpost.sh, append:"
echo '     iptables -I INPUT ! -i lo -p tcp --dport 8099 -j DROP'

cat <<'EOF'

== REMAINING STEPS (cPanel side, no SSH needed) ==
 1. MySQL: cPanel > MySQL Databases (on the account that will host the API):
      create DB `<acct>_drillguard` + user, ALL PRIVILEGES.
 2. Subdomain: cPanel > Domains: api.<yourdomain> with document root pointing
    at the uploaded backend/public (AutoSSL issues the cert on its own).
 3. Upload backend/ (with vendor/ from `composer install --no-dev` run locally)
    into the account; set .env: DB creds, JWT_SECRET, Termii SMS_* keys,
    CORS_ORIGINS=https://<web-app-origin>, INFER_URL=http://127.0.0.1:8099.
 4. Import schema: run migrations 001..004 via phpMyAdmin (or cPanel Terminal:
      php scripts/migrate.php && php scripts/seed.php
      mysql <db> < migrations/002_user_phone.sql   (and 003, 004)
 5. Upload backend/data/replay/*.json (already in the repo tree).
 6. Smoke test:
      curl https://api.<domain>/api/health
      curl https://api.<domain>/api/infer/health     <- proxied to loopback
EOF
