#!/usr/bin/env bash
# Export replay data from the Next.js pipeline endpoint into static JSON that the
# PHP backend serves. ONE source of truth: the transform stays in the ML/Next layer.
#
# Usage: scripts/export_replay.sh [NEXT_BASE_URL]
#   NEXT_BASE_URL defaults to http://localhost:3100 (the running Next dev server).
set -euo pipefail

NEXT="${1:-http://localhost:3100}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/data/replay"
mkdir -p "$OUT"

echo "Exporting replay from ${NEXT} -> ${OUT}"

# 1) catalog
curl -sf "${NEXT}/api/replay" -o "${OUT}/catalog.json"
echo "  catalog.json"

# 2) each dataset by id
IDS=$(python3 -c "import sys,json;print('\n'.join(d['id'] for d in json.load(open('${OUT}/catalog.json'))['datasets']))")
COUNT=0
for id in $IDS; do
  curl -sf "${NEXT}/api/replay/${id}" -o "${OUT}/${id}.json"
  COUNT=$((COUNT+1))
  echo "  ${id}.json"
done

echo "Exported ${COUNT} datasets."
