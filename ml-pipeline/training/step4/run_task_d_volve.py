"""
TASK D — Volve pack-off: PARTIAL-COVERAGE detection against DOCUMENTED anchors.

The experiment the whole framework points at: pack-off's MOS is {ECD, SPP,
torque}; USROP holds 2 of 3 (no ECD). Capability matrix §4.4 claims a
partially-covered mechanism degrades GRACEFULLY — observable at reduced
confidence through the channels present — rather than going dark. The Volve
DDRs supply documented pack-off events on three USROP wells, so that claim is
now testable: can monitors built on SPP + torque alone detect documented
pack-offs on held-out wells?

Honesty rails:
  * Coverage stays PARTIAL. A positive result is "partial-coverage detection
    demonstrated", never "pack-off observable on USROP". A negative result is
    equally reportable: partial coverage failing to detect is exactly the
    blind-spot cost the framework quantifies.
  * Monitors see ONLY the partial-MOS channel set (SPP, torque, SPP/flow —
    flow used solely as a normaliser, it is a gate channel). No WOB/ROP/MSE:
    those belong to other mechanisms' feature sets, and leaking them in would
    blur whose observability is being tested.
  * Train wells (F-14, F-9A, F-9, F-7) hold no documented pack-off inside
    their USROP intervals (volve_events.csv); test wells F-15, F-15S, F-5.
    Split by well; labels physics-consistency (correlated SPP+torque rise,
    per step7 tier 2, declared); evaluation = documented anchors ONLY.
  * Window 30 x 1-m bins ~ 1-3 h at these wells' ROP — inside pack-off's
    tau_dev 10 min-3 h (step1_leadtime_feasibility.csv row 3).
  * F-15's September-2008 cluster counts as ONE episode.

Run:
    .venv/bin/python ml-pipeline/training/step4/run_task_d_volve.py
"""

import os
import sys

import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
REPO = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(REPO, "ml-pipeline", "etl"))

from step4_common import (ART, load_usrop, sliding_windows,  # noqa: E402
                          grouped_train_windows, NormalCalibrator, write_log)
from models_step4 import (fit_rf, rf_scores, fit_lstm_ae, lstm_scores,  # noqa: E402
                          ChannelScaler)
import dtw_bank  # noqa: E402
from run_step4 import fuse_rows, THRESHOLD_SWEEP, ACTION  # noqa: E402

WIN = 30  # 30 x 1-m bins ~ 1-3 h at 10-30 m/hr — pack-off tau_dev band

ANCHORS_D = {
    "15_9-F-15": [dict(anchor="F15-PACKOFF-1381", ed=1381.0,
                       note="episode anchor (repeats 1368/1374/1416)")],
    "15_9-F-15S": [dict(anchor="F15A-PACKOFF-1532", ed=1532.0, note=""),
                   dict(anchor="F15A-PACKOFF-2614", ed=2614.0,
                        note="TDS stationary at event — weaker anchor")],
    "15_9-F-5": [dict(anchor="F5-PACKOFF-2927", ed=2927.0,
                      note="on-bottom pack-off; same-day reaming pack-off at shoe")],
}
TRAIN_WELLS = ["15_9-F-14", "15_9-F-9A", "15_9-F-9", "15_9-F-7"]
APPROACH_M = 40.0
EXCLUDE_M = 200.0

FEATS = ["spp_kpa", "torque_knm", "spp_per_flow"]


def prep(df):
    out = pd.DataFrame({
        "depth": df["Measured Depth m"],
        "spp_kpa": df["Average Standpipe Pressure kPa"],
        "torque_knm": df["Average Surface Torque kN.m"],
        "spp_per_flow": df["Average Standpipe Pressure kPa"]
        / df["Mud Flow In L/min"].replace(0, np.nan),
        "rop": df["Rate of Penetration m/h"],
    })
    return out


def packoff_consistency_labels(df):
    """step7 tier-2 labels: SPP and torque BOTH elevated vs their rolling
    robust baseline, sustained — the correlated pattern §2 predicts. Used for
    RF training only; never for evaluation."""
    z = {}
    for c in ("spp_kpa", "torque_knm"):
        med = df[c].rolling(120, min_periods=40, center=True).median()
        mad = (df[c] - med).abs().rolling(120, min_periods=40, center=True) \
            .median() * 1.4826
        z[c] = (df[c] - med) / mad.replace(0, np.nan)
    raw = ((z["spp_kpa"] > 1.5) & (z["torque_knm"] > 1.5)).fillna(False)
    return (raw.rolling(5, min_periods=5).min() > 0).fillna(False).astype(int)


def main():
    wells = {k: prep(v) for k, v in load_usrop().items()
             if k in TRAIN_WELLS + list(ANCHORS_D)}

    tr = pd.concat([wells[w] for w in TRAIN_WELLS], ignore_index=True)
    tr_ok = tr[FEATS].notna().all(axis=1)
    y_tr = pd.concat([packoff_consistency_labels(wells[w])
                      for w in TRAIN_WELLS], ignore_index=True)
    rf = fit_rf(tr.loc[tr_ok, FEATS], y_tr[tr_ok],
                label_tier="physics_consistency")
    cal_rf = NormalCalibrator(rf_scores(rf, tr.loc[tr_ok & (y_tr == 0), FEATS]))
    scaler = ChannelScaler(tr.loc[tr_ok & (y_tr == 0), FEATS].to_numpy())

    def normal_mask(df):
        return (df[FEATS].notna().all(axis=1)
                & (packoff_consistency_labels(df) == 0)).to_numpy()

    packs = [grouped_train_windows([wells[w]], FEATS, scaler, WIN, normal_mask)
             for w in TRAIN_WELLS]
    packs = [p for p in packs if len(p)]
    nw = np.vstack(packs) if packs else np.empty((0, WIN, len(FEATS)))
    nw = nw[::max(1, len(nw) // 8000)]
    lstm, lstm_log = fit_lstm_ae(nw)
    cal_lstm = NormalCalibrator(lstm_scores(lstm, nw))
    # DTW: the §2 pack-off signature restricted to the channels held — a
    # correlated SPP+torque accelerating ramp. Physics provenance; no
    # documented-event morphology is used anywhere (all anchors are TEST data).
    bank = [dtw_bank.Template(
        "packoff_partial_physics", "pack_off", ["spp_kpa", "torque_knm"],
        [dtw_bank._late_ramp(WIN), dtw_bank._late_ramp(WIN)],
        "physics",
        "correlated SPP+torque onset ramp (step2 pack-off, ECD-less projection)")]
    cal_dtw = NormalCalibrator(dtw_bank.dtw_scores(nw, FEATS, bank))

    results = []
    print("=" * 82)
    print("TASK D — Volve pack-off, PARTIAL coverage (SPP+torque, no ECD), "
          "documented anchors")
    print("=" * 82)
    print(f"  trained on {TRAIN_WELLS} (no documented pack-offs inside their "
          f"USROP intervals); LSTM windows n={len(nw)}")
    for test_well, anchors in ANCHORS_D.items():
        te = wells[test_well].reset_index(drop=True)
        te_rows = te[FEATS].to_numpy()
        m_ok = np.isfinite(te_rows).all(axis=1)
        sb = np.full(len(te), np.nan)
        sb[m_ok] = cal_rf(rf_scores(rf, te.loc[m_ok, FEATS]))
        wins_te, ends_te = sliding_windows(scaler(te_rows), WIN, valid_mask=m_ok)
        sl = np.full(len(te), np.nan)
        sd = np.full(len(te), np.nan)
        if len(wins_te):
            sl[ends_te] = cal_lstm(lstm_scores(lstm, wins_te))
            sd[ends_te] = cal_dtw(dtw_bank.dtw_scores(wins_te, FEATS, bank))
        risk, act = fuse_rows(sb, sl, sd)
        depth = te["depth"].to_numpy()

        for a in anchors:
            ed = a["ed"]
            in_appr = (depth >= ed - APPROACH_M) & (depth <= ed)
            outside = np.ones(len(te), dtype=bool)
            for aa in anchors:
                outside &= np.abs(depth - aa["ed"]) > EXCLUDE_M
            mean_rop = float(np.nanmean(te.loc[in_appr, "rop"])) \
                if in_appr.any() else np.nan

            def lead_at(series, thr):
                hits = np.flatnonzero(in_appr & (series >= thr))
                return float(ed - depth[hits[0]]) if len(hits) else np.nan

            series_map = dict(fused=risk, rf=100 * sb, lstm=100 * sl,
                              dtw=100 * sd)
            sweep = {str(t): {n: dict(
                lead_metres=lead_at(s, t),
                far_outside=float(np.nanmean(s[outside] >= t)))
                for n, s in series_map.items()} for t in THRESHOLD_SWEEP}
            rec = dict(test_well=test_well, anchor=a["anchor"], note=a["note"],
                       n_approach=int(in_appr.sum()),
                       mean_approach_rop=round(mean_rop, 1),
                       max_risk_approach=round(float(np.nanmax(risk[in_appr])), 1)
                       if in_appr.any() else None,
                       per_model_max=dict(
                           rf=round(float(np.nanmax(sb[in_appr])), 3),
                           lstm=round(float(np.nanmax(sl[in_appr])), 3)
                           if np.isfinite(sl[in_appr]).any() else None,
                           dtw=round(float(np.nanmax(sd[in_appr])), 3)
                           if np.isfinite(sd[in_appr]).any() else None),
                       threshold_sweep=sweep,
                       lstm_log=lstm_log,
                       dtw_templates=[t.meta() for t in bank])
            results.append(rec)
            l99 = lead_at(100 * sb, 99.0)
            l90f = lead_at(risk, 90.0)
            print(f"\n  {a['anchor']:20s} approach n={rec['n_approach']:5d} "
                  f"(ROP {rec['mean_approach_rop']} m/hr)  "
                  f"maxRisk={rec['max_risk_approach']}")
            print(f"     RF@99: {l99!s:>6} m lead @far "
                  f"{sweep['99.0']['rf']['far_outside']:.4f}   "
                  f"fused@90: {l90f!s:>6} m @far "
                  f"{sweep['90.0']['fused']['far_outside']:.4f}   {a['note']}")

    write_log("task_d_volve", results)
    print(f"\nwrote ml-pipeline/artifacts/step4_log_task_d_volve.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
