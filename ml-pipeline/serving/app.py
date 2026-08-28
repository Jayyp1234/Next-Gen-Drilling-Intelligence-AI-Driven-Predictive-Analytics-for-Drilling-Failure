"""
Phase A · step 3 — the LIVE INFERENCE SERVICE.

A real FastAPI service that loads the persisted models and scores drilling
telemetry on demand. This is what makes DrillGuard a prototype rather than a
replay: telemetry goes in, a freshly-computed prediction comes out.

    GET  /health                service + loaded models
    GET  /model                 model card / metadata
    POST /score      {window:[...]}   score the latest window  -> risk + tier + per-model
    POST /score-csv  (file=telemetry) BRING YOUR OWN DATA: score a whole run,
                                      return the risk trajectory + detected tier crossings

Run:  .venv/bin/uvicorn app:app --app-dir ml-pipeline/serving --port 8099
"""
import io
import os

import numpy as np
import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from infer import get_model

app = FastAPI(title="DrillGuard Inference", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.environ.get(
        "INFER_CORS", "http://localhost:3000,http://localhost:3100").split(",")],
    allow_methods=["*"], allow_headers=["*"],
)

DEFAULT_MODEL = "bilabri-d2"


class ScoreRequest(BaseModel):
    # Raw channels vary by model (D2: torque/wob/spp/gpm/mse_psi/rop;
    # Eos: stick_slip_index; Volve: spp/torque/flow) → accept arbitrary dicts.
    window: list[dict]
    model: str = DEFAULT_MODEL


@app.get("/health")
def health():
    m = get_model(DEFAULT_MODEL)
    return {"ok": True, "service": "drillguard-inference",
            "models_loaded": [DEFAULT_MODEL], "window": m.win}


@app.get("/model")
def model_card(model: str = DEFAULT_MODEL):
    m = _load(model)
    return {
        "model": model, "well": m.meta["well"], "mechanism": m.meta["mechanism"],
        "anchor": m.meta["anchor"], "event_depth_m": m.meta["event_depth"],
        "label_tier": m.meta["label_tier"], "window_samples": m.win,
        "features": m.feats, "raw_inputs": m.meta["raw_inputs"],
        "monitors": list(m.weights.keys()), "monitor_weights": m.weights,
        "tiers": [{"pct": t[0], "name": t[1]} for t in m.tiers],
        "note": "Scores are computed live from the persisted RF + LSTM-AE + DTW models, "
                "calibrated against the training-normal distribution.",
    }


@app.post("/score")
def score(req: ScoreRequest):
    m = _load(req.model)
    need = m.win + m.history
    if len(req.window) < need:
        raise HTTPException(422, f"window must have >= {need} samples (got {len(req.window)})")
    return {"model": req.model, **m.score_window(req.window)}


@app.post("/score-csv")
async def score_csv(file: UploadFile = File(...), model: str = DEFAULT_MODEL):
    """Bring your own data: upload a CSV of drilling telemetry (columns:
    torque, wob, spp, gpm, mse_psi, rop; optional depth) and get the whole run
    scored — proving the model generalises to data it has never seen."""
    m = _load(model)
    try:
        df = pd.read_csv(io.BytesIO(await file.read()))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(400, f"could not parse CSV: {e}")
    return _run_dataframe(m, model, df)


@app.get("/score-sample")
def score_sample(model: str = DEFAULT_MODEL):
    """Score the built-in example telemetry for this model — a one-call demo
    that needs no file upload (used by the mobile app)."""
    m = _load(model)
    path = os.path.join(os.path.dirname(__file__), "samples", f"{model}.csv")
    if not os.path.isfile(path):
        raise HTTPException(404, f"no sample telemetry for '{model}'")
    return _run_dataframe(m, model, pd.read_csv(path), sample=os.path.basename(path))


def _run_dataframe(m, model, df, sample=None):
    raw = m.meta["raw_inputs"]
    missing = [c for c in raw if c not in df.columns]
    if missing:
        raise HTTPException(422, {"error": "missing required columns", "missing": missing,
                                  "required": raw, "found": list(df.columns)})
    df = df.reset_index(drop=True)
    win = m.win
    depth = df["depth"].to_numpy(float) if "depth" in df.columns else np.arange(len(df), dtype=float)
    scored = m.score_run(df[raw].to_dict("records"))

    traj = []
    peak = {"risk": -1.0, "i": None}
    events = []
    prev_tier = "Normal"
    rank = {"Normal": 0, "Watch": 1, "Elevated": 2, "Action": 3}
    for i, out in enumerate(scored):
        r = out["risk"]
        if r is None:
            continue
        traj.append({"i": i, "depth": round(float(depth[i]), 2), **out})
        if r > peak["risk"]:
            peak = {"risk": r, "i": i}
        t = out["tier"]
        if t and rank.get(t, 0) > rank.get(prev_tier, 0):
            events.append({"i": i, "depth": round(float(depth[i]), 2), "tier": t,
                           "risk": r, "active_monitors": out["active_monitors"]})
            prev_tier = t

    return {
        "model": model, "sample": sample, "rows_scored": len(traj), "window": win,
        "peak_risk": None if peak["i"] is None else {"risk": round(peak["risk"], 2), "depth": round(float(depth[peak["i"]]), 2)},
        "tier_crossings": events,
        "trajectory": traj,
    }


def _load(model_id):
    try:
        return get_model(model_id)
    except FileNotFoundError:
        raise HTTPException(404, f"model '{model_id}' not found — run export_models.py")
