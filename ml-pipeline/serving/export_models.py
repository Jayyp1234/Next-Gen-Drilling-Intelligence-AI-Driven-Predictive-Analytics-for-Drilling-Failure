"""
Phase A · step 1 — PERSIST the trained models.

Until now the STEP 4 models were trained in-memory and discarded; only their
SCORES were saved (ensemble_scores.csv), which is why the app could only
*replay* results, never *compute* them. This script re-runs the exact
Bilabri D2-fold training from run_step4.task_b_bilabri (same code, same SEED)
and writes every artifact needed to score NEW telemetry live:

    models/bilabri-d2/rf.joblib        RandomForest (S_baseline)
    models/bilabri-d2/lstm_ae.pt       LSTM autoencoder (S_LSTM)
    models/bilabri-d2/artifacts.joblib scaler, calibrators, DTW bank, weights, meta

Deterministic (SEED=42, torch manual_seed) → identical to the pipeline run.
Run:  .venv/bin/python ml-pipeline/serving/export_models.py
"""
import os
import sys

import joblib
import numpy as np
import pandas as pd
import torch

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
STEP4 = os.path.join(REPO, "ml-pipeline", "training", "step4")
ETL = os.path.join(REPO, "ml-pipeline", "etl")
sys.path.insert(0, STEP4)
sys.path.insert(0, ETL)

from step4_common import WINDOW, load_bilabri, grouped_train_windows  # noqa: E402
from models_step4 import fit_rf, rf_scores, fit_lstm_ae, lstm_scores, ChannelScaler  # noqa: E402
import dtw_bank  # noqa: E402
from coverage import MONITOR_WEIGHTS  # noqa: E402
from run_step4 import physics_consistency_labels_b, ANCHORS_B  # noqa: E402  (main-guarded, safe)

OUT = os.path.join(HERE, "models", "bilabri-d2")
os.makedirs(OUT, exist_ok=True)

FEATS = ["torque_wob", "spp_gpm", "mse_psi", "rop", "wob"]
TEST_WELL = "BILABRI-D2"
WIN = WINDOW["bilabri"]  # 30


def normal_mask(well_name, df):
    """Copied verbatim from run_step4.task_b_bilabri — LSTM 'normal' selection."""
    m = df[FEATS].notna().all(axis=1)
    a = ANCHORS_B.get(well_name)
    if a:
        m &= (df["depth"] - a["event_depth"]).abs() > 200.0
    if well_name == "BILABRI-DEEP-1":
        m &= (df["depth"] - 1529.0).abs() > 200.0
    if well_name == "BILABRI-D2":
        m &= ~df["depth"].between(3129.0 - 50.0, 3229.0 + 200.0)
    return m.to_numpy()


def main():
    print("Loading Bilabri wells (D2 held out for test)…")
    wells = load_bilabri()
    train_wells = [w for w in wells if w != TEST_WELL]
    tr = pd.concat([wells[w] for w in train_wells], ignore_index=True)

    # ---- RF (S_baseline) ------------------------------------------------
    y_tr = pd.concat([physics_consistency_labels_b(wells[w]) for w in train_wells],
                     ignore_index=True)
    tr_ok = tr[FEATS].notna().all(axis=1)
    rf = fit_rf(tr.loc[tr_ok, FEATS], y_tr[tr_ok], label_tier="physics_consistency")
    cal_rf_ref = np.sort(rf_scores(rf, tr.loc[tr_ok & (y_tr == 0), FEATS]))
    print(f"  RF fitted: {int(tr_ok.sum())} rows, {int(y_tr[tr_ok].sum())} positives")

    # ---- Scaler + LSTM-AE (S_LSTM) -------------------------------------
    normal_rows = pd.concat(
        [wells[w].loc[normal_mask(w, wells[w]), FEATS] for w in train_wells],
        ignore_index=True)
    scaler = ChannelScaler(normal_rows.to_numpy())
    packs = [grouped_train_windows([wells[wn]], FEATS, scaler, WIN,
                                   lambda d, wn=wn: normal_mask(wn, d))
             for wn in train_wells]
    packs = [p for p in packs if len(p)]
    nw = np.vstack(packs) if packs else np.empty((0, WIN, len(FEATS)))
    lstm, lstm_log = fit_lstm_ae(nw)
    cal_lstm_ref = np.sort(lstm_scores(lstm, nw))
    print(f"  LSTM-AE fitted: {len(nw)} normal windows, {lstm_log.get('epochs')} epochs")

    # ---- DTW bank (S_DTW), leave-one-event-out for D2 ------------------
    bank = dtw_bank.bank_hole_drag(WIN, exclude_documented=True)
    cal_dtw_ref = np.sort(dtw_bank.dtw_scores(nw, FEATS, bank))
    print(f"  DTW bank: {len(bank)} templates (D2-informed template excluded)")

    # ---- persist --------------------------------------------------------
    joblib.dump(rf, os.path.join(OUT, "rf.joblib"))
    torch.save({"state_dict": lstm.state_dict(), "n_features": len(FEATS)},
               os.path.join(OUT, "lstm_ae.pt"))
    joblib.dump({
        "feats": FEATS,
        "win": WIN,
        "scaler_mu": np.asarray(scaler.mu, float),
        "scaler_sd": np.asarray(scaler.sd, float),
        "cal_rf_ref": cal_rf_ref,
        "cal_lstm_ref": cal_lstm_ref,
        "cal_dtw_ref": cal_dtw_ref,
        "bank": bank,
        "monitor_weights": MONITOR_WEIGHTS,
        "tiers": [(99.0, "Action"), (97.0, "Elevated"), (90.0, "Watch")],
        "event_depth": ANCHORS_B[TEST_WELL]["event_depth"],
        "anchor": ANCHORS_B[TEST_WELL]["anchor"],
        "well": TEST_WELL,
        "mechanism": "stuck_pipe",
        "label_tier": "physics_consistency",
        "raw_inputs": ["torque", "wob", "spp", "gpm", "mse_psi", "rop"],
        "recipe": "ratio_d2",   # feats derived: torque_wob=torque/wob, spp_gpm=spp/gpm
        "history": 0,           # extra trailing rows the feature recipe needs
        "index_kind": "depth_m",
    }, os.path.join(OUT, "artifacts.joblib"))

    print(f"\nSaved model artifacts → {OUT}")
    for f in sorted(os.listdir(OUT)):
        sz = os.path.getsize(os.path.join(OUT, f))
        print(f"  {f:20s} {sz/1024:7.1f} KB")


if __name__ == "__main__":
    main()
