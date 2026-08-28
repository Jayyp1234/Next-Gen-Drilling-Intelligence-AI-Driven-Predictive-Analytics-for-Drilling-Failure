# DrillGuard Live Inference (Phase A)

Turns the project from a **replay of recorded scores** into a **prototype that
computes predictions**. The STEP 4 models are persisted and served; new
telemetry is scored on demand through the real RF + LSTM-AE + DTW ensemble.

## Why this exists
Until Phase A, the models were trained in-memory and discarded — only their
scores were saved (`ensemble_scores.csv`), so the app could only replay them.
Now the models are artifacts and there is a service that runs them live.

## Layout
```
export_models.py   train the D2-fold models (reusing the exact pipeline code) + SAVE them
infer.py           DrillGuardModel — loads artifacts, scores a window of telemetry
verify_live.py     streams held-out D2 through the live model; proves fidelity + the 50 m lead
app.py             FastAPI service (/score, /score-csv, /model, /health)
models/bilabri-d2/ rf.joblib · lstm_ae.pt · artifacts.joblib
```

## Reproduce
```bash
# 1. persist the models (deterministic, SEED=42)
.venv/bin/python ml-pipeline/serving/export_models.py

# 2. prove the served model == the validated pipeline, and the lead is computed live
.venv/bin/python ml-pipeline/serving/verify_live.py
#   -> correlation 1.00000 · max risk diff 0.0005
#   -> RF channel lead @ 99th pct: 50.0 m at 0.82% FAR   (documented result, COMPUTED live)

# 3. run the inference API
.venv/bin/uvicorn app:app --app-dir ml-pipeline/serving --port 8099
```

## API
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | service + loaded models |
| GET | `/model` | model card (well, mechanism, window, weights, tiers) |
| POST | `/score` | `{window:[{torque,wob,spp,gpm,mse_psi,rop}×30]}` → risk + tier + per-model |
| POST | `/score-csv` | **bring your own data**: upload a telemetry CSV → whole run scored + tier crossings |

`/score` needs the last **30** samples (the window). Raw inputs required:
`torque, wob, spp, gpm, mse_psi, rop` (optional `depth` for reporting).

## What is proven
- **Fidelity**: live scoring reproduces the pipeline's stored scores at
  correlation 1.00000 (max diff 0.0005) — the served model *is* the validated model.
- **Headline, computed live**: the documented **50 m stuck-pipe lead at ~0.8% FAR**
  is reproduced by streaming windows through the saved model, not read from a file.

## Not yet (next steps)
- Wire the web/mobile Live Monitoring to call `/score` so the on-screen gauge is
  model-computed, not replayed (Phase A step 4).
- Additional served models (Volve pack-off, Eos stick-slip) via more `export_*` folds.
- Deploy (Phase B).
