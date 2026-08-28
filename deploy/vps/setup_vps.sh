#!/usr/bin/env bash
# DrillGuard — one-box VPS setup (Ubuntu 22.04/24.04, Apache).
# Run as root on the Namecheap VPS. Idempotent-ish: safe to re-run.
#
# Layout it produces:
#   /var/www/drillguard/backend     PHP API  (Apache vhost: api.DOMAIN)
#   /var/www/drillguard/serving     FastAPI  (systemd service on 127.0.0.1:8099,
#                                             Apache reverse proxy: infer.DOMAIN)
#   MariaDB database `drillguard`
set -euo pipefail

DOMAIN="${1:?usage: setup_vps.sh yourdomain.com}"
APP_DIR=/var/www/drillguard

echo "== 1. packages =="
apt-get update
apt-get install -y apache2 mariadb-server \
  php8.3 php8.3-fpm php8.3-mysql php8.3-curl php8.3-mbstring php8.3-xml \
  git curl unzip composer certbot python3-certbot-apache
# php8.3 ships on 24.04; on 22.04 replace with php8.1-* (the backend needs >= 8.1)

echo "== 2. uv + python 3.12 (matches the trained model artifacts) =="
command -v uv >/dev/null || curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

echo "== 3. apache modules =="
a2enmod proxy proxy_http rewrite headers ssl
systemctl enable --now apache2 mariadb php8.3-fpm

echo "== 4. database =="
mysql -e "CREATE DATABASE IF NOT EXISTS drillguard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'drillguard'@'localhost' IDENTIFIED BY 'CHANGE-ME-DB-PASS';"
mysql -e "GRANT ALL PRIVILEGES ON drillguard.* TO 'drillguard'@'localhost'; FLUSH PRIVILEGES;"
echo "   -> set the real DB password now: mysql -e \"ALTER USER 'drillguard'@'localhost' IDENTIFIED BY '<strong-pass>';\""

echo "== 5. app dirs =="
mkdir -p "$APP_DIR"
echo "   -> upload the repo's backend/ and ml-pipeline/serving/ into $APP_DIR"
echo "      (rsync -av backend serving root@VPS:$APP_DIR/ from your Mac)"

cat <<EOF

== NEXT STEPS (after uploading the code) ==
 1. PHP API:
      cd $APP_DIR/backend && composer install --no-dev
      cp .env.example .env && nano .env      # DB creds, JWT_SECRET, Termii key,
                                             # CORS_ORIGINS=https://app.$DOMAIN
      php scripts/migrate.php && php scripts/seed.php
      # also apply migrations 002-004:
      mysql drillguard < migrations/002_user_phone.sql
      mysql drillguard < migrations/003_messages.sql
      mysql drillguard < migrations/004_notification_outbox.sql
 2. Inference:
      cd $APP_DIR/serving
      uv venv --python 3.12 --managed-python .venv
      uv pip install --python .venv/bin/python -r requirements.txt \\
        --extra-index-url https://download.pytorch.org/whl/cpu
      cp /path/to/deploy/vps/drillguard-inference.service /etc/systemd/system/
      systemctl daemon-reload && systemctl enable --now drillguard-inference
 3. Apache vhosts:
      cp deploy/vps/apache-api.conf  /etc/apache2/sites-available/
      cp deploy/vps/apache-infer.conf /etc/apache2/sites-available/
      sed -i "s/DOMAIN/$DOMAIN/g" /etc/apache2/sites-available/apache-*.conf
      a2ensite apache-api apache-infer && systemctl reload apache2
 4. DNS (Namecheap dashboard): A records api.$DOMAIN and infer.$DOMAIN -> VPS IP
 5. HTTPS:
      certbot --apache -d api.$DOMAIN -d infer.$DOMAIN
 6. Smoke test:
      curl https://api.$DOMAIN/api/health
      curl https://infer.$DOMAIN/health
EOF
