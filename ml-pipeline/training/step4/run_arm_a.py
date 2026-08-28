"""
ARM A — parameter-coupling ablation (brief STEP 5): single channel -> pairs ->
minimum observable set -> all available, measured against ground truth.

Where it runs and why:
  Bilabri  documented anchor D2-STUCK-1659 (held-out well). The TRUE MOS rung
           for mechanical sticking ({torque, hookload, block_position}) is
           STRUCTURALLY ABSENT — no Bilabri channel supplies block position —
           so that rung is emitted as a declared blind-spot row (metrics None),
           which is Arm C's coverage result surfacing inside Arm A, not a gap
           in the experiment.
  Eos      instrument labels (STICK). Stick-slip's MOS is ONE self-diagnostic
           channel, so the ladder inverts: it tests whether channels BEYOND a
           self-diagnostic MOS add anything (physics predicts: little).
  USROP    EXCLUDED: Arm A measures latency/detection against anchors, and
           USROP has none (Task C is demonstration-only).

Two declared method choices:
  * RF LABELS are generated from the full training-well channel set even on
    reduced-channel rungs: labels are training-side supervision; the ablation
    is over what the deployed MONITOR observes. Evaluation never uses the
    label rule (anchors / instrument channel only).
  * DTW templates whose channels a rung lacks simply don't match (monitor
    inactive) and the fusion renormalises — the coverage-aware degradation
    path exercised rung by rung. The D2-informed template stays excluded
    (leave-one-event-out, as in run_step4).

Run:
    .venv/bin/python ml-pipeline/training/step4/run_arm_a.py
"""

import os
import sys

import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
REPO = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(REPO, "ml-pipeline", "etl"))

from step4_common import (ART, WINDOW, load_eos, load_bilabri,  # noqa: E402
                          sliding_windows, grouped_train_windows,
                          NormalCalibrator, write_log)
from models_step4 import (fit_rf, rf_scores, fit_lstm_ae, lstm_scores,  # noqa: E402
                          ChannelScaler)
import dtw_bank  # noqa: E402
from run_step4 import (fuse_rows, auc_rank, physics_consistency_labels_b,  # noqa: E402
                       ANCHORS_B, SEV_THRESHOLD, QUIET_SEV, THRESHOLD_SWEEP)

D2 = "BILABRI-D2"

# ---- Bilabri rungs: channels -> model features they enable ----------------
BILABRI_RUNGS = [
    dict(rung="B1-single", channels="torque",
         feats=["torque"]),
    dict(rung="B2-pair", channels="torque|wob",
         feats=["torque", "wob", "torque_wob"]),
    dict(rung="B-MOS", channels="torque|hookload|block_position",
         feats=None,   # STRUCTURALLY ABSENT — declared, not skipped silently
         note="mechanical-sticking MOS requires block_position (and hookload); "
              "neither exists in Bilabri DRLPAR — Arm C blind spot, declared"),
    dict(rung="B3-hydraulic", channels="torque|wob|spp|gpm",
         feats=["torque", "wob", "spp", "gpm", "torque_wob", "spp_gpm"]),
    dict(rung="B4-all", channels="torque|wob|spp|gpm|rop(+GEOL mw,bit)",
         feats=["torque", "wob", "spp", "gpm", "rop",
                "torque_wob", "spp_gpm", "mse_psi"]),
]

# ---- Eos rungs ------------------------------------------------------------
EOS_RUNGS = [
    dict(rung="E1-MOS", channels="stick_slip (self-diagnostic MOS=1)",
         feats=["stick_slip_index"]),
    dict(rung="E2-plus-shock", channels="stick_slip|shock_risk",
         feats=["stick_slip_index", "SHKRSK"]),
    dict(rung="E3-plus-shockpk", channels="stick_slip|shock_risk|shock_peak",
         feats=["stick_slip_index", "SHKRSK", "SHKPK"]),
    dict(rung="E4-all", channels="stick_slip|shocks|ecd",
         feats=["stick_slip_index", "SHKRSK", "SHKPK", "ecd_gcm3"]),
    dict(rung="E0-relational-only", channels="ecd (C2 rerun in-harness)",
         feats=["ecd_gcm3"]),
]


def bilabri_arm_a(rows):
    wells = load_bilabri()
    win = WINDOW["bilabri"]
    test_well = D2
    anch = ANCHORS_B[test_well]
    train_wells = [w for w in wells if w != test_well]
    te = wells[test_well].reset_index(drop=True)
    depth = te["depth"].to_numpy()
    ed, app = anch["event_depth"], anch["approach"]
    in_approach = (depth >= ed - app) & (depth <= ed)
    outside = depth < ed - 200.0
    mean_rop = float(np.nanmean(te.loc[in_approach, "rop"]))

    # Fixed label rule from the FULL training channel set (declared above).
    tr = pd.concat([wells[w] for w in train_wells], ignore_index=True)
    y_tr_full = pd.concat([physics_consistency_labels_b(wells[w])
                           for w in train_wells], ignore_index=True)

    def normal_mask(well_name, df, feats):
        m = df[feats].notna().all(axis=1)
        a = ANCHORS_B.get(well_name)
        if a:
            m &= (df["depth"] - a["event_depth"]).abs() > 200.0
        if well_name == "BILABRI-DEEP-1":
            m &= (df["depth"] - 1529.0).abs() > 200.0
        if well_name == "BILABRI-D2":
            m &= ~df["depth"].between(3079.0, 3429.0)
        return m.to_numpy()

    print("\n" + "=" * 78)
    print(f"ARM A — Bilabri hole drag, held-out {test_well} vs {anch['anchor']}"
          f" (approach ROP {mean_rop:.1f} m/hr)")
    print("=" * 78)
    for cfg in BILABRI_RUNGS:
        if cfg["feats"] is None:
            print(f"  {cfg['rung']:16s} STRUCTURALLY ABSENT — {cfg['note']}")
            rows.append(dict(dataset="bilabri", rung=cfg["rung"],
                             channels=cfg["channels"], status="MOS-unreachable",
                             note=cfg["note"]))
            continue
        feats = cfg["feats"]
        tr_ok = tr[feats].notna().all(axis=1)
        rf = fit_rf(tr.loc[tr_ok, feats], y_tr_full[tr_ok],
                    label_tier="physics_consistency")
        cal_rf = NormalCalibrator(rf_scores(
            rf, tr.loc[tr_ok & (y_tr_full == 0), feats]))
        normal_rows = pd.concat(
            [wells[w].loc[normal_mask(w, wells[w], feats), feats]
             for w in train_wells], ignore_index=True)
        scaler = ChannelScaler(normal_rows.to_numpy())
        packs = [grouped_train_windows([wells[wn]], feats, scaler, win,
                                       lambda d, wn=wn: normal_mask(wn, d, feats))
                 for wn in train_wells]
        packs = [p for p in packs if len(p)]
        nw = np.vstack(packs) if packs else np.empty((0, win, len(feats)))
        lstm, _ = fit_lstm_ae(nw)
        cal_lstm = NormalCalibrator(lstm_scores(lstm, nw))
        bank = dtw_bank.bank_hole_drag(win, exclude_documented=True)
        cal_dtw = NormalCalibrator(dtw_bank.dtw_scores(nw, feats, bank)) \
            if len(nw) else NormalCalibrator([])

        te_rows = te[feats].to_numpy()
        m_ok = np.isfinite(te_rows).all(axis=1)
        sb = np.full(len(te), np.nan)
        sb[m_ok] = cal_rf(rf_scores(rf, te.loc[m_ok, feats]))
        wins_te, ends_te = sliding_windows(scaler(te_rows), win, valid_mask=m_ok)
        sl = np.full(len(te), np.nan)
        sd = np.full(len(te), np.nan)
        if len(wins_te):
            sl[ends_te] = cal_lstm(lstm_scores(lstm, wins_te))
            sd[ends_te] = cal_dtw(dtw_bank.dtw_scores(wins_te, feats, bank))
        risk, act = fuse_rows(sb, sl, sd)

        def lead_at(series, thr):
            hits = np.flatnonzero(in_approach & (series >= thr))
            return float(ed - depth[hits[0]]) if len(hits) else np.nan

        monitors = sorted({m for a in act[np.isfinite(risk)] for m in a.split("|") if m})
        rec = dict(dataset="bilabri", rung=cfg["rung"], channels=cfg["channels"],
                   status="ok", monitors_active="|".join(monitors),
                   max_risk_approach=round(float(np.nanmax(risk[in_approach])), 1),
                   lead_m_fused_75=lead_at(risk, 75.0),
                   far_fused_75=round(float(np.nanmean(risk[outside] >= 75.0)), 3),
                   lead_m_rf_99=lead_at(100 * sb, 99.0),
                   far_rf_99=round(float(np.nanmean(100 * sb[outside] >= 99.0)), 4),
                   lead_min_rf_99_at_stated_rop=(
                       round(60.0 * lead_at(100 * sb, 99.0) / mean_rop, 0)
                       if np.isfinite(lead_at(100 * sb, 99.0)) else None))
        rows.append(rec)
        print(f"  {cfg['rung']:16s} monitors={rec['monitors_active']:14s} "
              f"maxRisk={rec['max_risk_approach']:5.1f}  "
              f"fused@75: {rec['lead_m_fused_75']!s:>6} m @far {rec['far_fused_75']:.3f}  "
              f"RF@99: {rec['lead_m_rf_99']!s:>6} m @far {rec['far_rf_99']:.4f}")


def eos_arm_a(rows):
    runs = load_eos()
    win = WINDOW["eos"]
    for df in runs.values():
        if "STICK" in df and "CRPM" in df:
            crpm_bar = df["CRPM"].rolling(30, min_periods=4).mean()
            df["sev_meas"] = df["STICK"] / (2.0 * crpm_bar.replace(0, np.nan))
        else:
            df["sev_meas"] = np.nan
        for c in ("stick_slip_index", "SHKRSK", "SHKPK"):
            if c in df:
                df[c] = df[c].ffill(limit=6)   # trailing RT stats, declared

    labelled = {k: d for k, d in runs.items()
                if (d["sev_meas"].notna() & d["gate"]).sum() >= 200}
    test_name = "WL_RAW_BHPR-GR-MECH_TIME_MWD_9"
    train_runs = [n for n in labelled if n != test_name]
    te = runs[test_name].reset_index(drop=True)
    ev = te["gate"] & te["sev_meas"].notna()
    y_te = (te.loc[ev, "sev_meas"] >= SEV_THRESHOLD).astype(int).to_numpy()
    t_ev = te.loc[ev, "TIME_1900"].to_numpy() * 86400.0
    dt_ev = float(np.median(np.diff(t_ev)))
    neg_hours = max((y_te == 0).sum() * dt_ev / 3600.0, 1e-9)

    print("\n" + "=" * 78)
    print(f"ARM A — Eos stick-slip, held-out {test_name} "
          f"(n={int(ev.sum())}, pos={int(y_te.sum())})")
    print("=" * 78)
    for cfg in EOS_RUNGS:
        feats = cfg["feats"]
        if any(f not in te.columns or te[f].notna().sum() < 200 for f in feats):
            rows.append(dict(dataset="eos", rung=cfg["rung"],
                             channels=cfg["channels"], status="channels-absent"))
            print(f"  {cfg['rung']:20s} channels absent on test run — declared")
            continue
        tr = pd.concat([labelled[n] for n in train_runs
                        if all(f in labelled[n].columns for f in feats)],
                       ignore_index=True)
        tr_rows = tr.loc[tr["gate"], feats + ["sev_meas"]].dropna()
        y_tr = (tr_rows["sev_meas"] >= SEV_THRESHOLD).astype(int)
        if int(y_tr.sum()) < 10 or len(tr_rows) < 100:
            rows.append(dict(dataset="eos", rung=cfg["rung"],
                             channels=cfg["channels"],
                             status=f"insufficient training rows "
                                    f"({len(tr_rows)}, pos {int(y_tr.sum())})"))
            print(f"  {cfg['rung']:20s} insufficient training data — declared")
            continue
        rf = fit_rf(tr_rows[feats], y_tr, label_tier="instrument")
        cal_rf = NormalCalibrator(rf_scores(rf, tr_rows.loc[y_tr == 0, feats]))
        scaler = ChannelScaler(tr_rows.loc[y_tr == 0, feats].to_numpy())
        qwins = grouped_train_windows(
            [labelled[n] for n in train_runs], feats, scaler, win,
            mask_fn=lambda d: d["gate"].to_numpy(), min_valid_frac=0.7,
            hard_mask_fn=lambda d: ~(d["sev_meas"].ffill(limit=6)
                                     >= QUIET_SEV).to_numpy())
        lstm, _ = fit_lstm_ae(qwins)
        cal_lstm = NormalCalibrator(lstm_scores(lstm, qwins))
        bank = dtw_bank.bank_stick_slip(win)
        cal_dtw = NormalCalibrator(dtw_bank.dtw_scores(qwins, feats, bank)) \
            if len(qwins) else NormalCalibrator([])

        te_rows = te[feats].to_numpy()
        m_ok = np.isfinite(te_rows).all(axis=1)
        sb = np.full(len(te), np.nan)
        sb[m_ok] = cal_rf(rf_scores(rf, te.loc[m_ok, feats]))
        wins_te, ends_te = sliding_windows(scaler(te_rows), win,
                                           valid_mask=te["gate"].to_numpy(),
                                           min_valid_frac=0.7)
        sl = np.full(len(te), np.nan)
        sd = np.full(len(te), np.nan)
        if len(wins_te):
            sl[ends_te] = cal_lstm(lstm_scores(lstm, wins_te))
            sd[ends_te] = cal_dtw(dtw_bank.dtw_scores(wins_te, feats, bank))
        risk, act = fuse_rows(sb, sl, sd)

        monitors = sorted({m for a in act[np.isfinite(risk)] for m in a.split("|") if m})
        rec = dict(dataset="eos", rung=cfg["rung"], channels=cfg["channels"],
                   status="ok", monitors_active="|".join(monitors),
                   auc_fused=round(auc_rank(risk[ev], y_te), 3),
                   auc_rf=round(auc_rank(sb[ev], y_te), 3),
                   auc_lstm=round(auc_rank(sl[ev], y_te), 3),
                   far_per_hr_fused_99=round(float(np.nansum(
                       (risk[ev] >= 99.0) & (y_te == 0)) / neg_hours), 2))
        rows.append(rec)
        print(f"  {cfg['rung']:20s} monitors={rec['monitors_active']:14s} "
              f"AUC fused={rec['auc_fused']:.3f} rf={rec['auc_rf']:.3f} "
              f"lstm={rec['auc_lstm']!s:>5}  FAR/hr@99={rec['far_per_hr_fused_99']}")


def main():
    rows = []
    bilabri_arm_a(rows)
    eos_arm_a(rows)
    out = os.path.join(ART, "arm_a_ablation.csv")
    pd.DataFrame(rows).to_csv(out, index=False)
    write_log("arm_a", rows)
    print(f"\nwrote {os.path.relpath(out, REPO)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
