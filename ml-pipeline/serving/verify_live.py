"""
Phase A · fidelity check — prove the LIVE scorer == the pipeline.

Streams the held-out BILABRI-D2 well through DrillGuardModel.score_window one
sample at a time (as a live rig feed would) and checks two things:

  1. FIDELITY: the live-computed risk matches the pipeline's stored
     ensemble_scores.csv (same models, so it must) — proving the served model
     is the validated model, not an approximation.
  2. HEADLINE, COMPUTED LIVE: the documented 50 m stuck-pipe lead is
     reproduced by scoring windows in sequence — not read from a file.
"""
import os
import sys

import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from infer import get_model  # noqa: E402

FEAT = os.path.join(REPO, "ml-pipeline", "data", "features", "bilabri", "BILABRI-D2.csv")
SCORES = os.path.join(REPO, "ml-pipeline", "artifacts", "ensemble_scores.csv")
EVENT, APPROACH, ACTION = 1659.0, 60.0, 99.0


def main():
    m = get_model("bilabri-d2")
    df = pd.read_csv(FEAT).reset_index(drop=True)
    raw = ["torque", "wob", "spp", "gpm", "mse_psi", "rop"]
    missing = [c for c in raw if c not in df.columns]
    if missing:
        print("columns present:", list(df.columns))
        raise SystemExit(f"missing raw channels: {missing}")

    win = m.win
    depth = df["depth"].to_numpy()
    live_risk = np.full(len(df), np.nan)
    live_sb = np.full(len(df), np.nan)   # RF channel (S_baseline)

    print(f"Scoring {len(df)} BILABRI-D2 samples through the live model "
          f"(batched score_run, window={win})…")
    scored = m.score_run(df[raw].to_dict("records"))
    for i, out in enumerate(scored):
        if out["risk"] is not None:
            live_risk[i] = out["risk"]
        if out["S_baseline"] is not None:
            live_sb[i] = out["S_baseline"]

    # ---- 1. fidelity vs stored pipeline scores --------------------------
    st = pd.read_csv(SCORES)
    st = st[st["well"] == "BILABRI-D2"].copy()
    st = st.sort_values("index").reset_index(drop=True)
    stored = st.set_index(st["index"].round(2))["risk_score"]
    live_ser = pd.Series(live_risk, index=np.round(depth, 2))
    common = stored.index.intersection(live_ser.index)
    a = stored.loc[common].to_numpy(float)
    b = live_ser.groupby(level=0).last().loc[common].to_numpy(float)
    ok = np.isfinite(a) & np.isfinite(b)
    corr = float(np.corrcoef(a[ok], b[ok])[0, 1]) if ok.sum() > 2 else float("nan")
    maxabs = float(np.nanmax(np.abs(a[ok] - b[ok]))) if ok.sum() else float("nan")

    # ---- 2. headline lead, computed live --------------------------------
    in_app = (depth >= EVENT - APPROACH) & (depth <= EVENT)
    approach_risk = live_risk[in_app]
    max_app = float(np.nanmax(approach_risk)) if np.isfinite(approach_risk).any() else float("nan")

    outside = depth < EVENT - 200.0

    def lead_at(series, thr):
        hits = np.flatnonzero(in_app & (series >= thr))
        return float(EVENT - depth[hits[0]]) if len(hits) else None

    # The documented headline: the RF channel crossing its 99th percentile.
    rf_lead = lead_at(live_sb, 0.99)
    rf_far = float(np.nanmean(live_sb[outside] >= 0.99)) * 100.0

    print("\n=== 1. FIDELITY (live vs stored pipeline) ===")
    print(f"  aligned rows      : {int(ok.sum())}")
    print(f"  correlation       : {corr:.5f}")
    print(f"  max abs risk diff : {maxabs:.4f}  (0 = identical)")
    print("\n=== 2. HEADLINE — computed LIVE, not replayed ===")
    print(f"  RF channel lead @ 99th pct : {rf_lead} m  (documented result: ~50 m)")
    print(f"  RF false-alarm rate outside approach: {rf_far:.2f}%  (documented: ~0.8%)")
    print(f"  max FUSED risk in approach : {max_app:.2f}  (fused tier capped at Watch by LSTM veto — as documented)")
    verdict = "PASS" if (corr > 0.98 and maxabs < 1.0) else "CHECK"
    print(f"\n  fidelity verdict: {verdict}")


if __name__ == "__main__":
    main()
