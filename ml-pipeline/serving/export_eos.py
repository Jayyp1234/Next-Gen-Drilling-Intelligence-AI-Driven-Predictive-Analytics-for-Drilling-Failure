"""
Export the Eos STICK-SLIP model (31/5-7, MWD_9 fold — instrument-labelled,
fused AUC 0.839 vs the downhole STICK channel). Mirrors run_step4.task_a.

Feature: stick_slip_index (self-diagnostic single channel → recipe 'identity').
Run:  .venv/bin/python ml-pipeline/serving/export_eos.py
"""
import os
import sys

import joblib
import numpy as np
import pandas as pd
import torch

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(REPO, "ml-pipeline", "training", "step4"))
sys.path.insert(0, os.path.join(REPO, "ml-pipeline", "etl"))

from step4_common import WINDOW, load_eos, grouped_train_windows  # noqa: E402
from models_step4 import fit_rf, rf_scores, fit_lstm_ae, lstm_scores, ChannelScaler  # noqa: E402
import dtw_bank  # noqa: E402
from coverage import MONITOR_WEIGHTS  # noqa: E402
from run_step4 import SEV_THRESHOLD, QUIET_SEV  # noqa: E402

OUT = os.path.join(HERE, "models", "eos-stick-slip")
os.makedirs(OUT, exist_ok=True)
FEATS = ["stick_slip_index"]
WIN = WINDOW["eos"]  # 30
TEST = "WL_RAW_BHPR-GR-MECH_TIME_MWD_9"


def main():
    runs = load_eos()
    # sev_meas + ffill, exactly as run_step4.task_a
    for df in runs.values():
        if "STICK" in df and "CRPM" in df:
            crpm_bar = df["CRPM"].rolling(30, min_periods=4).mean()
            df["sev_meas"] = df["STICK"] / (2.0 * crpm_bar.replace(0, np.nan))
        else:
            df["sev_meas"] = np.nan
        if "stick_slip_index" in df:
            df["stick_slip_index"] = df["stick_slip_index"].ffill(limit=6)

    labelled = {k: d for k, d in runs.items()
                if (d["sev_meas"].notna() & d["gate"]).sum() >= 200}
    train_runs = [n for n in labelled if n != TEST]
    print(f"labelled runs: {sorted(labelled)} | test {TEST.split('_')[-2]} | train {[t.split('_')[-2] for t in train_runs]}")

    tr = pd.concat([labelled[n] for n in train_runs], ignore_index=True)
    tr_rows = tr.loc[tr["gate"], FEATS + ["sev_meas"]].dropna()
    y_tr = (tr_rows["sev_meas"] >= SEV_THRESHOLD).astype(int)
    print(f"  RF: {len(tr_rows)} rows, {int(y_tr.sum())} positives")

    rf = fit_rf(tr_rows[FEATS], y_tr, label_tier="instrument")
    cal_rf_ref = np.sort(rf_scores(rf, tr_rows.loc[y_tr == 0, FEATS]))
    scaler = ChannelScaler(tr_rows.loc[y_tr == 0, FEATS].to_numpy())

    qwins = grouped_train_windows(
        [labelled[n] for n in train_runs], FEATS, scaler, WIN,
        mask_fn=lambda d: d["gate"].to_numpy(), min_valid_frac=0.7,
        hard_mask_fn=lambda d: ~(d["sev_meas"].ffill(limit=6) >= QUIET_SEV).to_numpy())
    lstm, lstm_log = fit_lstm_ae(qwins)
    cal_lstm_ref = np.sort(lstm_scores(lstm, qwins))
    bank = dtw_bank.bank_stick_slip(WIN)
    cal_dtw_ref = np.sort(dtw_bank.dtw_scores(qwins, FEATS, bank))
    print(f"  LSTM: {len(qwins)} quiet windows | DTW: {len(bank)} templates")

    joblib.dump(rf, os.path.join(OUT, "rf.joblib"))
    torch.save({"state_dict": lstm.state_dict(), "n_features": len(FEATS)},
               os.path.join(OUT, "lstm_ae.pt"))
    joblib.dump({
        "feats": FEATS, "win": WIN,
        "scaler_mu": np.asarray(scaler.mu, float), "scaler_sd": np.asarray(scaler.sd, float),
        "cal_rf_ref": cal_rf_ref, "cal_lstm_ref": cal_lstm_ref, "cal_dtw_ref": cal_dtw_ref,
        "bank": bank, "monitor_weights": MONITOR_WEIGHTS,
        "tiers": [(99.0, "Action"), (97.0, "Elevated"), (90.0, "Watch")],
        "event_depth": None, "anchor": "instrument (STICK channel)",
        "well": "31/5-7 Eos", "mechanism": "stick_slip", "label_tier": "instrument",
        "raw_inputs": ["stick_slip_index"], "recipe": "identity", "history": 0,
        "index_kind": "time_1900_days",
    }, os.path.join(OUT, "artifacts.joblib"))
    print(f"\nSaved → {OUT}")
    for f in sorted(os.listdir(OUT)):
        print(f"  {f:20s} {os.path.getsize(os.path.join(OUT, f))/1024:7.1f} KB")


if __name__ == "__main__":
    main()
