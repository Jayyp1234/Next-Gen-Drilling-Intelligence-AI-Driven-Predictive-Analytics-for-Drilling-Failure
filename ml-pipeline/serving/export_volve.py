"""
Export the Volve PACK-OFF model (15/9-F-15 fold — partial coverage, 2 of 3 MOS
channels; the §4.4 partial-coverage detection result). Mirrors run_task_d_v2.main().

Features: trailing robust-z of SPP, torque, SPP/flow (recipe 'robust_z', needs
Z_WIN=120 rows of history). robust-z is unit-invariant, so field or SI units both work.
Run:  .venv/bin/python ml-pipeline/serving/export_volve.py
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

from step4_common import load_usrop, grouped_train_windows  # noqa: E402
from models_step4 import fit_rf, rf_scores, fit_lstm_ae, lstm_scores, ChannelScaler  # noqa: E402
import dtw_bank  # noqa: E402
from coverage import MONITOR_WEIGHTS  # noqa: E402
from run_task_d_v2 import (prep, labels_v2, FEATS, WIN, Z_WIN,  # noqa: E402
                           TRAIN_WELLS, ANCHORS_V2, CONTROL_WELL)

OUT = os.path.join(HERE, "models", "volve-packoff")
os.makedirs(OUT, exist_ok=True)


def main():
    wells = {k: prep(v) for k, v in load_usrop().items()
             if k in TRAIN_WELLS + list(ANCHORS_V2) + [CONTROL_WELL]}
    tr_frames = {w: wells[w] for w in TRAIN_WELLS}
    tr = pd.concat(tr_frames.values(), ignore_index=True)
    tr_ok = tr[FEATS].notna().all(axis=1)
    y_tr = pd.concat([labels_v2(f) for f in tr_frames.values()], ignore_index=True)
    print(f"RF training positives: {int(y_tr[tr_ok].sum())}")

    rf = fit_rf(tr.loc[tr_ok, FEATS], y_tr[tr_ok], label_tier="physics_consistency")
    # cross-fitted calibration reference (leave-one-training-well-out)
    ref = []
    for w in TRAIN_WELLS:
        others = [x for x in TRAIN_WELLS if x != w]
        otr = pd.concat([tr_frames[x] for x in others], ignore_index=True)
        ook = otr[FEATS].notna().all(axis=1)
        oy = pd.concat([labels_v2(tr_frames[x]) for x in others], ignore_index=True)
        if int(oy[ook].sum()) < 5:
            continue
        rfx = fit_rf(otr.loc[ook, FEATS], oy[ook], label_tier="physics_consistency")
        m = tr_frames[w][FEATS].notna().all(axis=1) & (labels_v2(tr_frames[w]) == 0)
        ref.append(rf_scores(rfx, tr_frames[w].loc[m, FEATS]))
    cal_rf_ref = np.sort(np.concatenate(ref) if ref else np.array([]))

    scaler = ChannelScaler(tr.loc[tr_ok & (y_tr == 0), FEATS].to_numpy())
    packs = [grouped_train_windows([wells[w]], FEATS, scaler, WIN,
                                   lambda d, w=w: (d[FEATS].notna().all(axis=1)
                                                   & (labels_v2(d) == 0)).to_numpy())
             for w in TRAIN_WELLS]
    packs = [p for p in packs if len(p)]
    nw = np.vstack(packs) if packs else np.empty((0, WIN, len(FEATS)))
    nw = nw[::max(1, len(nw) // 8000)]
    lstm, lstm_log = fit_lstm_ae(nw)
    cal_lstm_ref = np.sort(lstm_scores(lstm, nw))
    bank = [dtw_bank.Template(
        "packoff_partial_physics_z", "pack_off", ["spp_z", "torque_z"],
        [dtw_bank._late_ramp(WIN), dtw_bank._late_ramp(WIN)],
        "physics", "correlated SPP+torque onset ramp on standardized channels")]
    cal_dtw_ref = np.sort(dtw_bank.dtw_scores(nw, FEATS, bank))
    print(f"  RF fitted | LSTM: {len(nw)} normal windows | DTW: {len(bank)} templates")

    joblib.dump(rf, os.path.join(OUT, "rf.joblib"))
    torch.save({"state_dict": lstm.state_dict(), "n_features": len(FEATS)},
               os.path.join(OUT, "lstm_ae.pt"))
    joblib.dump({
        "feats": FEATS, "win": WIN,
        "scaler_mu": np.asarray(scaler.mu, float), "scaler_sd": np.asarray(scaler.sd, float),
        "cal_rf_ref": cal_rf_ref, "cal_lstm_ref": cal_lstm_ref, "cal_dtw_ref": cal_dtw_ref,
        "bank": bank, "monitor_weights": MONITOR_WEIGHTS,
        "tiers": [(99.0, "Action"), (97.0, "Elevated"), (90.0, "Watch")],
        "event_depth": ANCHORS_V2["15_9-F-15"][0]["ed"], "anchor": "F15-PACKOFF-1416",
        "well": "15/9-F-15 (Volve)", "mechanism": "pack_off", "label_tier": "physics_consistency",
        "raw_inputs": ["spp", "torque", "flow"], "recipe": "robust_z",
        "history": Z_WIN, "z_win": Z_WIN, "index_kind": "depth_m",
        "coverage_note": "partial: 2 of 3 MOS channels (SPP, torque; ECD absent)",
    }, os.path.join(OUT, "artifacts.joblib"))
    print(f"\nSaved → {OUT}")
    for f in sorted(os.listdir(OUT)):
        print(f"  {f:20s} {os.path.getsize(os.path.join(OUT, f))/1024:7.1f} KB")


if __name__ == "__main__":
    main()
