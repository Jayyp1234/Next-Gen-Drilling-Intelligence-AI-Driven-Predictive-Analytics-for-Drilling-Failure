#!/usr/bin/env bash
# Push/update the DrillGuard model service on the VPS (mirrors the SepalSolver
# push.sh pattern). Usage:
#   RUNNER_HOST=root@209.74.72.132 ./deploy/vps/push_drillguard.sh
set -euo pipefail

HOST="${RUNNER_HOST:?set RUNNER_HOST=root@209.74.72.132}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP=/opt/drillguard

echo "== rsync serving code + models (venv is built ON the server) =="
rsync -av --delete \
  --exclude .venv --exclude __pycache__ --exclude .gitignore \
  "$ROOT/ml-pipeline/serving/" "$HOST:$APP/ml-pipeline/serving/"

echo "== rsync training/etl modules infer.py imports =="
rsync -av --exclude __pycache__ "$ROOT/ml-pipeline/training/step4/" "$HOST:$APP/ml-pipeline/training/step4/"
rsync -av --exclude __pycache__ "$ROOT/ml-pipeline/etl/" "$HOST:$APP/ml-pipeline/etl/"

echo "== build venv + restart service =="
ssh "$HOST" bash -s <<'REMOTE'
set -euo pipefail
export PATH="$HOME/.local/bin:$PATH"
cd /opt/drillguard/ml-pipeline/serving
[ -d .venv ] || uv venv --python 3.12 --managed-python .venv
uv pip install --python .venv/bin/python -r requirements.txt \
  --extra-index-url https://download.pytorch.org/whl/cpu
systemctl enable --now drillguard-inference 2>/dev/null || true
systemctl restart drillguard-inference
sleep 3
curl -s http://127.0.0.1:8099/health && echo
REMOTE

echo "== done. Public check (once the cPanel subdomain is up): =="
echo "   curl https://api.<domain>/api/infer/health"
