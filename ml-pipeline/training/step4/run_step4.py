"""
STEP 4 — train the three paradigms and produce ensemble scores, one task per
dataset, each at the best label tier that dataset supports:

  TASK A  Eos / stick-slip      labels: INSTRUMENT (STICK channel)  -> validation
  TASK B  Bilabri / stuck pipe  labels: physics-consistency (RF) but evaluated
                                ONLY against DOCUMENTED anchors     -> validation
  TASK C  USROP / bit wear      labels: physics-consistency, no anchors exist
                                -> DEMONSTRATION (declared; no detection claims)

Integrity rules enforced in code (step7_model_physics_alignment.md):
  * label tier declared on every RF fit; evaluation NEVER reuses the label rule
    (Task B's RF labels are physics-consistency; its evaluation anchors are the
    GEOL-documented events — different provenance by construction. Task A's
    labels come from a measured channel excluded from the features).
  * DTW templates: physics- or documented-event-derived (see dtw_bank), never
    model output.
  * splits by well (B, C) or run (A); calibration on training data only.
  * fusion = coverage-aware renormalisation over ACTIVE monitors, imported
    from coverage.py (the same weights the framework publishes). Early rows
    where no LSTM/DTW window exists renormalise over what IS active — the
    degradation path exercised on real data.

TASK A doubles as the EMPIRICAL C1-vs-C2 test (the sharpest test of
Objective 2): the same pipeline run with SSI-only features (C1, self-
diagnostic) vs ECD-only features (C2, relational) on identical test rows.

Alert tiers (fixed here, swept in STEP 5): Normal <25 <= Watch <50 <=
Elevated <75 <= Action.

Run:
    .venv/bin/python ml-pipeline/training/step4/run_step4.py
"""

import os
import sys

import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
REPO = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(REPO, "ml-pipeline", "etl"))

from step4_common import (REPO, ART, WINDOW, load_eos, load_bilabri,  # noqa: E402
                          load_usrop, sliding_windows, grouped_train_windows,
                          NormalCalibrator, write_log)
from models_step4 import (fit_rf, rf_scores, fit_lstm_ae, lstm_scores,  # noqa: E402
                          ChannelScaler)
import dtw_bank  # noqa: E402
from coverage import MONITOR_WEIGHTS, renormalised_weights  # noqa: E402

# Alert tiers are TAIL probabilities of the training-normal score distribution
# (scores are CDF-calibrated, so risk == percentile-of-normal). "Action >= 75"
# would fire on a quarter of perfectly normal drilling by construction; tiers
# therefore sit in the tail. STEP 5 sweeps these; THRESHOLD_SWEEP is recorded
# per fold so the headline never rests on one arbitrary cut (brief STEP 5).
TIERS = [(99.0, "Action"), (97.0, "Elevated"), (90.0, "Watch"), (-1.0, "Normal")]
ACTION = 99.0
# Sweep spans the whole plausible operating region (brief: "sweep it and
# compare ROC-style") — the 75-85 band matters because the FUSED Bilabri score
# peaks there while RF and DTW individually reach the high-90s.
THRESHOLD_SWEEP = (75.0, 80.0, 85.0, 90.0, 95.0, 97.0, 99.0, 99.5)

SEV_THRESHOLD = 0.5   # measured severity STICK/(2*<CRPM>_5min) >= this = event
QUIET_SEV = 0.2       # below this = "normal" for LSTM training selection


def tier(risk):
    for lo, name in TIERS:
        if risk >= lo:
            return name
    return "Normal"


def auc_rank(scores, labels):
    """Rank AUC (Mann-Whitney) with MIDRANK tie handling, NaN-safe.

    Midranks are load-bearing, not pedantry: CDF-calibrated scores and ffilled
    features tie heavily, and argsort-based ranks resolve ties in ROW ORDER —
    a constant score then returns an arbitrary row-order-dependent number
    (measured: 0.462 vs 0.541 for the same data reversed) instead of the
    correct 0.500. With midranks a constant score is exactly 0.5.
    """
    from scipy.stats import rankdata
    s, y = np.asarray(scores, float), np.asarray(labels, int)
    m = np.isfinite(s)
    s, y = s[m], y[m]
    if y.sum() == 0 or y.sum() == len(y):
        return np.nan
    ranks = rankdata(s, method="average")
    n1, n0 = int(y.sum()), int((1 - y).sum())
    return float((ranks[y == 1].sum() - n1 * (n1 + 1) / 2) / (n1 * n0))


def fuse_rows(sb, sl, sd):
    """Coverage-aware fusion per row. Inactive monitor = NaN score."""
    risk = np.full(len(sb), np.nan)
    active_str = np.empty(len(sb), dtype=object)
    for i in range(len(sb)):
        act = {}
        if np.isfinite(sb[i]):
            act["RF"] = sb[i]
        if np.isfinite(sl[i]):
            act["LSTM"] = sl[i]
        if np.isfinite(sd[i]):
            act["DTW"] = sd[i]
        if not act:
            active_str[i] = ""
            continue
        w = renormalised_weights(set(act))
        risk[i] = 100.0 * sum(w[k] * act[k] for k in act)
        active_str[i] = "|".join(sorted(act))
    return risk, active_str


def paradigm_pack(rows_std, win, gate_mask, bank, lstm_model, lstm_cal,
                  dtw_cal, channels):
    """Score S_LSTM and S_DTW for one well/run; returns row-aligned arrays."""
    wins, ends = sliding_windows(rows_std, win, valid_mask=gate_mask)
    sl = np.full(len(rows_std), np.nan)
    sd = np.full(len(rows_std), np.nan)
    if len(wins):
        sl[ends] = lstm_cal(lstm_scores(lstm_model, wins))
        sd[ends] = dtw_cal(dtw_bank.dtw_scores(wins, channels, bank))
    return sl, sd


# ====================================================================== A ==
def task_a_eos(results, score_rows):
    print("\n" + "=" * 78)
    print("TASK A — Eos stick-slip: instrument-labelled VALIDATION + C1 vs C2")
    print("=" * 78)
    runs = load_eos()
    win = WINDOW["eos"]

    # Measured severity from the instrument channel (excluded from features).
    # Denominator is the 5-min ROLLING mean of CRPM, not the same-row value:
    # mud-pulse frames interleave channels, so STICK and CRPM are almost never
    # non-null on the SAME 10 s row — the row-wise ratio produced ~0 labelled
    # rows. The rolling mean is also the physically right normaliser (severity
    # relative to the prevailing rotation rate, mirroring the SSI definition).
    for df in runs.values():
        if "STICK" in df and "CRPM" in df:
            crpm_bar = df["CRPM"].rolling(30, min_periods=4).mean()
            df["sev_meas"] = df["STICK"] / (2.0 * crpm_bar.replace(0, np.nan))
        else:
            df["sev_meas"] = np.nan
        # SSI is a trailing rolling statistic — piecewise-constant between
        # telemetry frames by construction — so a short forward-fill (<=60 s)
        # is a representation choice, not imputation. Without it the finite
        # runs flicker at MWD_5's ~80 s frame cadence (the >=4-frames-per-
        # window requirement hovers at its threshold) and no 5-minute
        # sequence window can ever form.
        if "stick_slip_index" in df:
            df["stick_slip_index"] = df["stick_slip_index"].ffill(limit=6)

    # >=200 labelled drilling rows qualifies a run (MWD_5: 1105, MWD_9: 268,
    # GR-MECH_1: 264 — the same drilling-row counts S5 reported). Folds with
    # no remaining training runs or too few training positives are skipped
    # with a stated reason, never silently.
    labelled = {k: d for k, d in runs.items()
                if (d["sev_meas"].notna() & d["gate"]).sum() >= 200}
    test_names = [n for n in ("WL_RAW_BHPR-GR-MECH_TIME_MWD_9",
                              "WL_RAW_BHPR-GR-MECH_TIME_MWD_5") if n in labelled]
    print(f"  labelled drilling runs: {sorted(labelled)}  test folds: {test_names}")

    for cfg, feats in (("C1-ssi", ["stick_slip_index"]), ("C2-ecd", ["ecd_gcm3"])):
        fold_metrics = []
        for test_name in test_names:
            train_runs = [n for n in labelled if n != test_name]
            if not train_runs:
                fold_metrics.append(dict(config=cfg, test_run=test_name,
                                         skipped="no training runs remain"))
                continue
            tr = pd.concat([labelled[n] for n in train_runs], ignore_index=True)
            te = runs[test_name].reset_index(drop=True)
            if any(f not in te or te[f].notna().sum() < 200 for f in feats):
                fold_metrics.append(dict(config=cfg, test_run=test_name,
                                         skipped=f"test run lacks {feats}"))
                continue
            tr_rows = tr.loc[tr["gate"], feats + ["sev_meas"]].dropna()
            y_tr = (tr_rows["sev_meas"] >= SEV_THRESHOLD).astype(int)
            if int(y_tr.sum()) < 10:
                fold_metrics.append(dict(
                    config=cfg, test_run=test_name,
                    skipped=f"only {int(y_tr.sum())} training positives "
                            f"(severity >= {SEV_THRESHOLD}) — RF unfittable"))
                continue

            rf = fit_rf(tr_rows[feats], y_tr, label_tier="instrument")
            cal_rf = NormalCalibrator(
                rf_scores(rf, tr_rows.loc[y_tr == 0, feats]))

            scaler = ChannelScaler(tr_rows.loc[y_tr == 0, feats].to_numpy())
            # Quietness is a HARD per-row requirement (one event-severity row
            # inside a "normal" window teaches the AE the event); the flickery
            # rig-state gate is the SOFT >=70% requirement. Unknown severity
            # (no STICK frame nearby) counts as quiet-eligible, declared.
            qwins = grouped_train_windows(
                [labelled[n] for n in train_runs], feats, scaler, win,
                mask_fn=lambda d: d["gate"].to_numpy(),
                min_valid_frac=0.7,
                hard_mask_fn=lambda d: ~(d["sev_meas"].ffill(limit=6)
                                         >= QUIET_SEV).to_numpy())
            lstm, lstm_log = fit_lstm_ae(qwins)
            cal_lstm = NormalCalibrator(lstm_scores(lstm, qwins))
            bank = dtw_bank.bank_stick_slip(win) if cfg == "C1-ssi" else \
                [dtw_bank.Template("ecd_ramp", "pack_off", ["ecd_gcm3"],
                                   [dtw_bank._late_ramp(win)], "physics",
                                   "ECD creep ramp — the only shape ECD alone offers")]
            cal_dtw = NormalCalibrator(dtw_bank.dtw_scores(qwins, feats, bank))

            te_rows = te[feats].to_numpy()
            m_ok = np.isfinite(te_rows).all(axis=1)
            sb = np.full(len(te), np.nan)
            sb[m_ok] = cal_rf(rf_scores(rf, te.loc[m_ok, feats]))
            # Test windows carry the SAME >=70% interior gate requirement as
            # training (symmetry — the reviewer's point: an end-row-gated
            # window whose interior is mostly off-gate would summarize
            # connection artifacts, the exact class the brief's gating rule
            # exists to exclude).
            wins_te, ends_te = sliding_windows(
                scaler(te_rows), win,
                valid_mask=te["gate"].to_numpy(), min_valid_frac=0.7)
            sl = np.full(len(te), np.nan)
            sd = np.full(len(te), np.nan)
            if len(wins_te):
                sl[ends_te] = cal_lstm(lstm_scores(lstm, wins_te))
                sd[ends_te] = cal_dtw(dtw_bank.dtw_scores(wins_te, feats, bank))
            risk, act = fuse_rows(sb, sl, sd)

            ev = te["gate"] & te["sev_meas"].notna()
            y_te = (te.loc[ev, "sev_meas"] >= SEV_THRESHOLD).astype(int).to_numpy()
            # FAR-per-hour denominator: eval rows are STICK FRAME rows arriving
            # every ~40-80 s, not every 10 s — measure the actual median
            # spacing of eval rows in this run (reviewer: 10 s/row inflated
            # FAR/hr ~4-8x).
            t_ev = te.loc[ev, "TIME_1900"].to_numpy() * 86400.0
            dt_ev = float(np.median(np.diff(t_ev))) if len(t_ev) > 2 else 10.0
            neg_hours = max((y_te == 0).sum() * dt_ev / 3600.0, 1e-9)
            # Label-robustness check (reviewer): the sev_meas label shares its
            # 1/CRPM normaliser with the SSI feature; re-evaluate with labels
            # on RAW STICK amplitude at matched prevalence. If AUC survives,
            # the instrument-independence claim holds.
            stick_raw = te.loc[ev, "STICK"].to_numpy()
            q = 1.0 - y_te.mean() if 0 < y_te.mean() < 1 else 0.5
            y_raw = (stick_raw >= np.nanquantile(stick_raw, q)).astype(int)
            met = dict(config=cfg, test_run=test_name,
                       n_eval=int(ev.sum()), n_pos=int(y_te.sum()),
                       eval_row_median_dt_s=round(dt_ev, 1),
                       auc_rf=auc_rank(sb[ev], y_te),
                       auc_lstm=auc_rank(sl[ev], y_te),
                       auc_dtw=auc_rank(sd[ev], y_te),
                       auc_fused=auc_rank(risk[ev], y_te),
                       auc_fused_rawstick_label=auc_rank(risk[ev], y_raw),
                       far_per_hr_at_action=float(np.nansum(
                           (risk[ev] >= ACTION) & (y_te == 0)) / neg_hours),
                       threshold_sweep={str(t): dict(
                           far_per_hr=float(np.nansum(
                               (risk[ev] >= t) & (y_te == 0)) / neg_hours),
                           detection_rate=float(np.nanmean(
                               risk[ev][y_te == 1] >= t))
                           if y_te.sum() else None)
                           for t in THRESHOLD_SWEEP},
                       calibration_note=(
                           "scores calibrated on IN-SAMPLE training-normal "
                           "predictions; reference CDF is compressed, so FAR "
                           "is biased UP (conservative direction) — declared"),
                       lstm_log=lstm_log,
                       dtw_templates=[t.meta() for t in bank])
            if cfg == "C2-ecd":
                met["c2_saturation_note"] = (
                    "RF/LSTM scores are near-constant on ECD-only input — the "
                    "model finds nothing to rank, so AUC is exactly 0.5 by "
                    "midrank construction; a flat score line in a plot is the "
                    "expected appearance of an uninformative channel")
            fold_metrics.append(met)
            print(f"  [{cfg}] test {test_name.split('_')[-2]}: "
                  f"AUC rf={met['auc_rf']:.3f} lstm={met['auc_lstm']:.3f} "
                  f"dtw={met['auc_dtw']:.3f} fused={met['auc_fused']:.3f} "
                  f"(n={met['n_eval']}, pos={met['n_pos']})")

            for i in np.flatnonzero(ev.to_numpy()):
                score_rows.append(dict(
                    well="31/5-7", index=te.at[i, "TIME_1900"],
                    index_kind="time_1900_days",
                    on_bottom_circulating=int(te.at[i, "gate"]),
                    S_baseline=sb[i], S_LSTM=sl[i], S_DTW=sd[i],
                    active_monitors=act[i],
                    risk_score=risk[i], alert_tier=tier(risk[i]) if np.isfinite(risk[i]) else "",
                    config_id=f"eos-{cfg}-test:{test_name}",
                    mechanism="stick_slip",
                    label=int(te.at[i, "sev_meas"] >= SEV_THRESHOLD)
                    if np.isfinite(te.at[i, "sev_meas"]) else ""))
        results[f"task_a_{cfg}"] = fold_metrics


# ====================================================================== B ==
ANCHORS_B = {  # documented, from events_anchors.csv (depth-anchored)
    "BILABRI-D2": dict(event_depth=1659.0, approach=60.0, anchor="D2-STUCK-1659"),
    "BILABRI-D4": dict(event_depth=2591.0, approach=60.0, anchor="D4-STUCK-2591"),
}


def physics_consistency_labels_b(df):
    """RF training labels: the correlated hole-drag pattern (torque/WOB high
    while WOB and ROP low) in within-well rolling robust-z terms. Tier:
    physics_consistency — NEVER used for evaluation (anchors are)."""
    z = {}
    for c in ("torque_wob", "wob", "rop"):
        med = df[c].rolling(100, min_periods=30, center=True).median()
        mad = (df[c] - med).abs().rolling(100, min_periods=30, center=True) \
            .median() * 1.4826
        z[c] = (df[c] - med) / mad.replace(0, np.nan)
    return ((z["torque_wob"] > 1.5) & (z["wob"] < -1.0) & (z["rop"] < -0.5)) \
        .fillna(False).astype(int)


def task_b_bilabri(results, score_rows):
    print("\n" + "=" * 78)
    print("TASK B — Bilabri stuck pipe: physics-consistency RF labels, "
          "DOCUMENTED-anchor evaluation")
    print("=" * 78)
    wells = load_bilabri()
    win = WINDOW["bilabri"]
    feats = ["torque_wob", "spp_gpm", "mse_psi", "rop", "wob"]

    fold_metrics = []
    for test_well, anch in ANCHORS_B.items():
        train_wells = [w for w in wells if w != test_well]
        tr = pd.concat([wells[w] for w in train_wells], ignore_index=True)
        te = wells[test_well].reset_index(drop=True)

        # Labels computed PER WELL before concatenation — rolling stats on the
        # concatenated frame crossed well boundaries (reviewer: 5 rows/fold
        # flipped; tiny, but boundary rows were labelled by a neighbour well).
        y_tr = pd.concat([physics_consistency_labels_b(wells[w])
                          for w in train_wells], ignore_index=True)
        tr_ok = tr[feats].notna().all(axis=1)
        rf = fit_rf(tr.loc[tr_ok, feats], y_tr[tr_ok],
                    label_tier="physics_consistency")
        cal_rf = NormalCalibrator(rf_scores(
            rf, tr.loc[tr_ok & (y_tr == 0), feats]))

        # LSTM normal = training rows >200 m from any documented anchor on
        # that well. Exclusions cover EVERY documented event, including
        # D2-PACKOFF-3129 whose precursor side is BELOW the event (packed off
        # backreaming UP; the hole drilled 3129-3229 m holds the cuttings-
        # loading history) — previously missed, so a documented pack-off
        # precursor interval was "normal" training data in the D4 fold.
        def normal_mask(well_name, df):
            m = df[feats].notna().all(axis=1)
            a = ANCHORS_B.get(well_name)
            if a:
                m &= (df["depth"] - a["event_depth"]).abs() > 200.0
            if well_name == "BILABRI-DEEP-1":
                m &= (df["depth"] - 1529.0).abs() > 200.0
            if well_name == "BILABRI-D2":
                m &= ~df["depth"].between(3129.0 - 50.0, 3229.0 + 200.0)
            return m.to_numpy()

        normal_rows = pd.concat(
            [wells[w].loc[normal_mask(w, wells[w]), feats] for w in train_wells],
            ignore_index=True)
        scaler = ChannelScaler(normal_rows.to_numpy())
        packs = [grouped_train_windows([wells[wn]], feats, scaler, win,
                                       lambda d, wn=wn: normal_mask(wn, d))
                 for wn in train_wells]
        packs = [p for p in packs if len(p)]
        nw = np.vstack(packs) if packs else np.empty((0, win, len(feats)))
        lstm, lstm_log = fit_lstm_ae(nw)
        cal_lstm = NormalCalibrator(lstm_scores(lstm, nw))
        # Leave-one-event-out template bank: the D2-1659-informed template is
        # excluded when D2 is the held-out well (matched-filter leakage,
        # per the adversarial review); kept for other folds, where it is the
        # legitimate cross-event library case.
        bank = dtw_bank.bank_hole_drag(
            win, exclude_documented=(test_well == "BILABRI-D2"))
        cal_dtw = NormalCalibrator(dtw_bank.dtw_scores(nw, feats, bank))

        te_rows = te[feats].to_numpy()
        m_ok = np.isfinite(te_rows).all(axis=1)
        sb = np.full(len(te), np.nan)
        sb[m_ok] = cal_rf(rf_scores(rf, te.loc[m_ok, feats]))
        sl, sd = paradigm_pack(scaler(te_rows), win, m_ok, bank, lstm,
                               cal_lstm, cal_dtw, feats)
        risk, act = fuse_rows(sb, sl, sd)

        # DOCUMENTED-anchor evaluation, in depth (exact axis).
        ed, app = anch["event_depth"], anch["approach"]
        depth = te["depth"].to_numpy()
        in_approach = (depth >= ed - app) & (depth <= ed)
        outside = depth < ed - 200.0
        det = np.nanmax(risk[in_approach]) if in_approach.any() else np.nan

        def lead_at(series, thr):
            hits = np.flatnonzero(in_approach & (series >= thr))
            return float(ed - depth[hits[0]]) if len(hits) else np.nan

        first_cross = lead_at(risk, ACTION)
        # Per-model AND fused sweep: the step7 checklist requires reporting
        # where fusion does NOT help, and on D2 it doesn't — RF and DTW
        # individually reach the high-90s in the approach while the LSTM
        # drags the weighted average down. The numbers must show that.
        series_map = dict(fused=risk, rf=100 * sb, lstm=100 * sl, dtw=100 * sd)
        sweep = {str(t): {name: dict(
            lead_metres=lead_at(s, t),
            far_outside=float(np.nanmean(s[outside] >= t)))
            for name, s in series_map.items()}
            for t in THRESHOLD_SWEEP}
        mean_rop = float(np.nanmean(te.loc[in_approach, "rop"])) \
            if in_approach.any() else np.nan
        met = dict(test_well=test_well, anchor=anch["anchor"],
                   n_approach=int(in_approach.sum()),
                   max_risk_in_approach=float(det) if np.isfinite(det) else None,
                   lead_metres_at_Action=first_cross,
                   lead_minutes_at_stated_rop=(
                       60.0 * first_cross / mean_rop
                       if np.isfinite(first_cross) and mean_rop and mean_rop > 0
                       else None),
                   mean_approach_rop_m_hr=mean_rop,
                   far_outside=dict(
                       n_rows=int(outside.sum()),
                       action_rate=float(np.nanmean(risk[outside] >= ACTION))),
                   threshold_sweep=sweep,
                   per_model_max_in_approach=dict(
                       rf=float(np.nanmax(sb[in_approach])) if in_approach.any() else None,
                       lstm=float(np.nanmax(sl[in_approach])) if in_approach.any() else None,
                       dtw=float(np.nanmax(sd[in_approach])) if in_approach.any() else None),
                   lstm_log=lstm_log,
                   dtw_templates=[t.meta() for t in bank],
                   caveat=("record stops 49 m short; 12 valid approach samples"
                           if test_well == "BILABRI-D4" else ""))
        fold_metrics.append(met)
        print(f"  held-out {test_well} vs {anch['anchor']}: "
              f"max risk in approach={met['max_risk_in_approach']}, "
              f"lead@Action={met['lead_metres_at_Action']} m, "
              f"FAR outside={met['far_outside']['action_rate']:.4f}"
              f"  {met['caveat']}")

        for i in np.flatnonzero(in_approach | outside):
            score_rows.append(dict(
                well=test_well, index=depth[i], index_kind="depth_m",
                on_bottom_circulating=1,
                S_baseline=sb[i], S_LSTM=sl[i], S_DTW=sd[i],
                active_monitors=act[i], risk_score=risk[i],
                alert_tier=tier(risk[i]) if np.isfinite(risk[i]) else "",
                config_id=f"bilabri-heldout:{test_well}",
                mechanism="stuck_pipe",
                label=int(in_approach[i])))
    results["task_b"] = fold_metrics


# ====================================================================== C ==
def physics_consistency_labels_c(df):
    """Bit-wear pattern: MSE high while ROP low, sustained (rolling robust z)."""
    z = {}
    for c in ("mse_psi", "rop"):
        med = df[c].rolling(120, min_periods=40, center=True).median()
        mad = (df[c] - med).abs().rolling(120, min_periods=40, center=True) \
            .median() * 1.4826
        z[c] = (df[c] - med) / mad.replace(0, np.nan)
    raw = ((z["mse_psi"] > 1.0) & (z["rop"] < -1.0)).fillna(False)
    return (raw.rolling(10, min_periods=10).min() > 0).fillna(False).astype(int)


def task_c_usrop(results, score_rows):
    print("\n" + "=" * 78)
    print("TASK C — USROP bit wear: physics-consistency labels; NO anchors -> "
          "DEMONSTRATION (declared)")
    print("=" * 78)
    wells = load_usrop()
    win = WINDOW["usrop"]
    feats = ["mse_psi", "d_exp", "rop", "torque_knm", "wob_kkgf", "rpm"]
    ren = {"Average Surface Torque kN.m": "torque_knm",
           "Weight on Bit kkgf": "wob_kkgf",
           "Average Rotary Speed rpm": "rpm",
           "Rate of Penetration m/h": "rop"}
    for w in wells.values():
        w.rename(columns=ren, inplace=True)

    fold_metrics = []
    for test_well in ("15_9-F-14", "15_9-F-15S"):
        train_wells = [w for w in wells if w != test_well]
        tr = pd.concat([wells[w] for w in train_wells], ignore_index=True)
        te = wells[test_well].reset_index(drop=True)
        tr_ok = tr[feats].notna().all(axis=1)
        # Per-well labels (same boundary-contamination fix as Task B, and now
        # consistent with normal_mask_c which was already per-well).
        y_tr = pd.concat([physics_consistency_labels_c(wells[w])
                          for w in train_wells], ignore_index=True)

        rf = fit_rf(tr.loc[tr_ok, feats], y_tr[tr_ok],
                    label_tier="physics_consistency")
        cal_rf = NormalCalibrator(rf_scores(rf, tr.loc[tr_ok & (y_tr == 0), feats]))
        scaler = ChannelScaler(tr.loc[tr_ok & (y_tr == 0), feats].to_numpy())

        def normal_mask_c(df):
            ok = df[feats].notna().all(axis=1)
            return (ok & (physics_consistency_labels_c(df) == 0)).to_numpy()

        packs = [grouped_train_windows([wells[wn]], feats, scaler, win,
                                       normal_mask_c)
                 for wn in train_wells]
        packs = [p for p in packs if len(p)]
        nw = np.vstack(packs) if packs else np.empty((0, win, len(feats)))
        # cap training windows for runtime; deterministic stride, no sampling
        nw = nw[::max(1, len(nw) // 8000)]
        lstm, lstm_log = fit_lstm_ae(nw)
        cal_lstm = NormalCalibrator(lstm_scores(lstm, nw))
        bank = dtw_bank.bank_bit_wear(win)
        cal_dtw = NormalCalibrator(dtw_bank.dtw_scores(nw[::4], feats, bank))

        te_rows = te[feats].to_numpy()
        m_ok = np.isfinite(te_rows).all(axis=1)
        sb = np.full(len(te), np.nan)
        sb[m_ok] = cal_rf(rf_scores(rf, te.loc[m_ok, feats]))
        sl, sd = paradigm_pack(scaler(te_rows), win, m_ok, bank, lstm,
                               cal_lstm, cal_dtw, feats)
        risk, act = fuse_rows(sb, sl, sd)

        # DEMONSTRATION metrics only: no detection-rate claims possible.
        hrs = float(np.nansum(1.0 / te.loc[m_ok & (te["rop"] > 0), "rop"]))
        met = dict(test_well=test_well,
                   framing="demonstration (physics-consistency labels; no "
                           "documented anchors exist in USROP)",
                   n_scored=int(np.isfinite(risk).sum()),
                   drilling_hours_scored=round(hrs, 1),
                   action_rate=float(np.nanmean(risk >= ACTION)),
                   action_per_hour=float(np.nansum(risk >= ACTION) / max(hrs, 1e-9)),
                   threshold_sweep={str(t): dict(
                       rate=float(np.nanmean(risk >= t)),
                       per_hour=float(np.nansum(risk >= t) / max(hrs, 1e-9)))
                       for t in THRESHOLD_SWEEP},
                   consistency_auc_vs_own_tier=(
                       "REFUSED — evaluating against the labelling rule is the "
                       "circularity step7 forbids"),
                   lstm_log=lstm_log,
                   dtw_templates=[t.meta() for t in bank])
        fold_metrics.append(met)
        print(f"  held-out {test_well}: scored {met['n_scored']} bins "
              f"(~{met['drilling_hours_scored']} h), Action rate "
              f"{met['action_rate']:.4f} ({met['action_per_hour']:.2f}/h)")

        step = max(1, len(te) // 4000)
        for i in range(0, len(te), step):
            if not np.isfinite(risk[i]):
                continue
            score_rows.append(dict(
                well=test_well.replace("15_9-", "15/9-"),
                index=te.at[i, "Measured Depth m"], index_kind="depth_m",
                on_bottom_circulating=1,
                S_baseline=sb[i], S_LSTM=sl[i], S_DTW=sd[i],
                active_monitors=act[i], risk_score=risk[i],
                alert_tier=tier(risk[i]),
                config_id=f"usrop-demo-heldout:{test_well}",
                mechanism="bit_wear", label=""))
    results["task_c"] = fold_metrics


def main():
    results, score_rows = {}, []
    task_a_eos(results, score_rows)
    task_b_bilabri(results, score_rows)
    task_c_usrop(results, score_rows)

    out = os.path.join(ART, "ensemble_scores.csv")
    pd.DataFrame(score_rows).to_csv(out, index=False)
    log_path = write_log("step4_metrics", results)
    print("\n" + "=" * 78)
    print(f"wrote {os.path.relpath(out, REPO)}  ({len(score_rows)} rows)")
    print(f"wrote {os.path.relpath(log_path, REPO)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
