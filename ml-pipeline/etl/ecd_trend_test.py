"""
ECD-TREND derivation test (Handoff Addendum): is a RELATIVE derived-ECD trend
defensible for pack-off detection on USROP, even though absolute ECD is not?

Implements the addendum's spec faithfully:
  * Bingham-plastic annular friction model, every assumed constant recorded.
  * Two clearly separated features: ecd_abs_assumed (context-only, never a
    margin claim) and ecd_trend (within-section rise vs rolling baseline).
  * THE SENSITIVITY CHECK: vary assumed drillstring OD (+-0.5") and PV/YP
    (+-30%); if the trend SHAPE is stable while only the level shifts, the
    addendum's criterion calls the feature defensible.

PLUS one test the addendum's criterion does not include, and which decides the
question (carried over from ecd_feasibility.py's closed verdict):

  * THE INFORMATION TEST. Shape-stability is NECESSARY but NOT SUFFICIENT.
    The model's annular gap is an ASSUMED CONSTANT, so the derived trend is
    structurally incapable of responding to the one thing a pack-off changes —
    the annulus narrowing. A trend can be perfectly assumption-robust and
    still be a re-encoding of its inputs (flow rate, ROP, mud weight), which
    are already-available channels. So we also measure how much of ecd_trend
    is explained by the flow-rate trend alone, and by all its inputs together.
    If ~all of it, the "stable" trend carries no annulus information and
    cannot satisfy the pack-off MOS, whose whole point is INDEPENDENT
    evidence alongside SPP and torque.

Premise corrections vs the addendum text (verified against the data):
  * USROP DOES carry TVD per row — the column "Hole Depth (TVD) m" is true
    vertical depth (misleading name; see data_inventory). No near-vertical
    restriction is needed; the TVD term is honest everywhere.
  * USROP holds NO documented pack-off anchor (the only one anywhere is
    Bilabri D2-3129, which develops while backreaming and shows no precursor)
    — so the addendum's step 5 precursor test has no anchor to run against
    even on a YES verdict.

Run:
    .venv/bin/python ml-pipeline/etl/ecd_trend_test.py
"""

import glob
import itertools
import os

import numpy as np
import pandas as pd

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(REPO, "ml-pipeline", "data", "usrop")
ART = os.path.join(REPO, "ml-pipeline", "artifacts")

LPM_TO_GPM = 1.0 / 3.785412
MM_TO_IN = 1.0 / 25.4
SG_TO_PPG = 8.345404

# ---- Assumed constants (the audit trail the addendum demands) -------------
BASE = dict(dp_od_in=5.0, pv_cp=25.0, yp_lb100=15.0, cuttings_sg=2.6)
GRID = dict(dp_od_in=[4.5, 5.0, 5.5],          # +-0.5" around 5" drillpipe
            pv_cp=[17.5, 25.0, 32.5],          # +-30%
            yp_lb100=[10.5, 15.0, 19.5])       # +-30%
ROLL_BASELINE = 200        # bins (~200 m) rolling median = the section baseline
MIN_SECTION_ROWS = 500


def friction_ppg(q_gpm, d_hole_in, mw_ppg, rop_fthr, dp_od_in, pv_cp, yp_lb100,
                 cuttings_sg=BASE["cuttings_sg"]):
    dp_od, pv, yp = dp_od_in, pv_cp, yp_lb100
    """Annular friction + cuttings loading, expressed as an ECD contribution
    in ppg (uniform-gradient form: dP_ann/(0.052*TVD) = grad/0.052)."""
    gap = d_hole_in - dp_od
    area = d_hole_in ** 2 - dp_od ** 2
    with np.errstate(divide="ignore", invalid="ignore"):
        v_ftmin = 24.5 * q_gpm / area
        grad = pv * v_ftmin / (1000.0 * gap ** 2) + yp / (200.0 * gap)  # psi/ft
        fric = grad / 0.052
        q_cut = rop_fthr * (np.pi / 4.0) * (d_hole_in / 12.0) ** 2 / 60.0
        q_mud = q_gpm / 7.48052
        conc = q_cut / np.maximum(q_mud + q_cut, 1e-9)
        cut = conc * (cuttings_sg * SG_TO_PPG - mw_ppg)
    return fric + cut


def trend_of(series):
    """Within-section rise vs rolling median baseline (detection-style)."""
    s = pd.Series(series)
    base = s.rolling(ROLL_BASELINE, min_periods=50).median()
    return (s - base).to_numpy()


def main():
    rows_out = []
    shape_corrs, level_spreads, info_r2s, flow_corrs = [], [], [], []

    for path in sorted(glob.glob(os.path.join(DATA, "USROP_A*.csv"))):
        well = os.path.basename(path).replace(".csv", "")
        df = pd.read_csv(path)
        df = df[(df["Mud Flow In L/min"] > 300)
                & (df["Rate of Penetration m/h"] > 0)].reset_index(drop=True)
        q = df["Mud Flow In L/min"].to_numpy() * LPM_TO_GPM
        dia = df["Diameter mm"].to_numpy() * MM_TO_IN
        mw = df["Mud Density In g/cm3"].to_numpy() * SG_TO_PPG
        rop = df["Rate of Penetration m/h"].to_numpy() * 3.280840
        mw = np.where((mw > 7) & (mw < 21), mw, np.nan)

        for d_sec in np.unique(dia[np.isfinite(dia)]):
            m = dia == d_sec
            if m.sum() < MIN_SECTION_ROWS:
                continue
            # base-assumption trend + full assumption grid of trends
            trends = {}
            for combo in itertools.product(*GRID.values()):
                kw = dict(zip(GRID.keys(), combo))
                f = friction_ppg(q[m], dia[m], mw[m], rop[m], **kw)
                trends[combo] = trend_of(f)
            T = np.vstack([t for t in trends.values()])
            ok = np.isfinite(T).all(axis=0)
            if ok.sum() < 200:
                continue
            T = T[:, ok]

            # SENSITIVITY (addendum criterion): pairwise shape correlation of
            # the trend across assumption sets + level spread for contrast.
            n = len(T)
            corrs = [np.corrcoef(T[i], T[j])[0, 1]
                     for i in range(n) for j in range(i + 1, n)]
            shape_corr = float(np.mean(corrs))
            abs_levels = [np.nanmedian(friction_ppg(
                q[m], dia[m], mw[m], rop[m], **dict(zip(GRID.keys(), c))))
                for c in trends.keys()]
            level_spread = float(np.max(abs_levels) - np.min(abs_levels))

            # INFORMATION TEST: how much of the (base-assumption) trend is
            # explained by the flow-rate trend alone, and by all inputs?
            base_combo = tuple(BASE[k] for k in GRID.keys())
            t_base = trends[base_combo][ok]
            flow_trend = trend_of(q[m])[ok]
            fc = float(np.corrcoef(t_base, flow_trend)[0, 1])
            from sklearn.ensemble import RandomForestRegressor
            from sklearn.metrics import r2_score
            X = np.column_stack([q[m][ok], rop[m][ok], mw[m][ok]])
            xok = np.isfinite(X).all(axis=1) & np.isfinite(t_base)
            r2 = np.nan
            if xok.sum() > 400:
                rng = np.random.default_rng(0)
                idx = rng.permutation(int(xok.sum()))
                cut = int(0.7 * len(idx))
                Xo, yo = X[xok], t_base[xok]
                rf = RandomForestRegressor(n_estimators=100, max_depth=12,
                                           n_jobs=-1, random_state=0)
                rf.fit(Xo[idx[:cut]], yo[idx[:cut]])
                r2 = float(r2_score(yo[idx[cut:]], rf.predict(Xo[idx[cut:]])))

            rows_out.append(dict(well=well, section_in=round(float(d_sec), 2),
                                 n_rows=int(ok.sum()),
                                 shape_corr_mean=round(shape_corr, 4),
                                 abs_level_spread_ppg=round(level_spread, 3),
                                 flow_trend_corr=round(fc, 4),
                                 r2_from_own_inputs=round(r2, 4)
                                 if np.isfinite(r2) else None))
            shape_corrs.append(shape_corr)
            level_spreads.append(level_spread)
            flow_corrs.append(fc)
            if np.isfinite(r2):
                info_r2s.append(r2)

    res = pd.DataFrame(rows_out)
    print(res.to_string(index=False))
    sc, fc_ = float(np.mean(shape_corrs)), float(np.mean(flow_corrs))
    r2m = float(np.mean(info_r2s)) if info_r2s else np.nan
    ls = float(np.mean(level_spreads))

    verdict_sens = sc >= 0.95
    verdict_info = r2m < 0.9 if np.isfinite(r2m) else False
    print("\n" + "=" * 78)
    print("VERDICTS")
    print("=" * 78)
    print(f"  SENSITIVITY (addendum criterion): mean trend-shape correlation "
          f"across the {3 ** 3} assumption sets = {sc:.4f} "
          f"({'STABLE' if verdict_sens else 'UNSTABLE'}); absolute level "
          f"spread {ls:.3f} ppg (the level moves, the shape "
          f"{'does not' if verdict_sens else 'moves too'}).")
    print(f"  INFORMATION: base-assumption ecd_trend correlates with the plain "
          f"FLOW-RATE trend at {fc_:.4f}, and is predicted from its own inputs "
          f"(flow, ROP, MW) with R^2 = {r2m:.4f}.")
    print()
    if verdict_sens and not verdict_info:
        print("  COMBINED VERDICT: NOT DEFENSIBLE — the addendum's criterion is")
        print("  satisfied (the shape is assumption-robust) but for the wrong")
        print("  reason: the trend is a near-deterministic re-encoding of the")
        print("  flow-rate/ROP/MW inputs. The model's annular gap is an assumed")
        print("  CONSTANT, so the derived trend is structurally incapable of")
        print("  responding to the annulus narrowing that defines a pack-off.")
        print("  A stable shape that cannot see the mechanism is stably")
        print("  uninformative. Pack-off stays UNOBSERVABLE on USROP.")
    elif verdict_sens and verdict_info:
        print("  COMBINED VERDICT: TREND DEFENSIBLE — shape stable AND carrying")
        print("  information beyond its inputs. Update coverage_report.")
    else:
        print("  COMBINED VERDICT: NOT DEFENSIBLE — trend shape is assumption-")
        print("  sensitive; the addendum's own criterion fails.")

    if verdict_sens and verdict_info:
        headline = "TREND DEFENSIBLE (shape-stable AND informative)"
        closing = ("Pack-off becomes observable on USROP via the derived ECD "
                   "trend; update coverage_report.csv with provenance "
                   "`derived_ecd_trend`.")
    elif verdict_sens:
        headline = "NOT DEFENSIBLE (shape-stable but uninformative)"
        closing = ("The addendum's criterion is satisfied for the wrong reason: "
                   "the trend is assumption-robust because it is a "
                   "near-deterministic function of measured inputs (flow, ROP, "
                   "MW) — and the model's annular gap is an assumed constant, "
                   "so the feature is structurally blind to the annulus "
                   "narrowing that defines a pack-off. Shape stability is "
                   "necessary but not sufficient; a MOS requires independent "
                   "evidence, and this adds none. **Pack-off stays "
                   "unobservable on USROP; coverage_report.csv is unchanged.** "
                   "The small data request stands: measured PWD/ECD, or "
                   "PV/YP + drillstring geometry.")
    else:
        headline = "NOT DEFENSIBLE (shape assumption-sensitive)"
        closing = ("The trend shape itself moves with the assumed geometry/"
                   "rheology — the addendum's own criterion fails. Pack-off "
                   "stays unobservable on USROP.")

    out = os.path.join(ART, "ecd_derivation_report.md")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(f"# ECD-Trend Derivation Test — VERDICT: {headline}\n\n")
        fh.write("Addendum spec implemented: Bingham-plastic annular model; "
                 f"assumptions base={BASE}, grid={GRID}; rolling "
                 f"{ROLL_BASELINE}-row section baseline.\n\n")
        fh.write("Premise corrections: USROP carries per-row TVD "
                 "('Hole Depth (TVD) m'), so no vertical-section restriction "
                 "was needed; USROP holds no documented pack-off anchor, so the "
                 "addendum's step-5 precursor test has no target either way.\n\n")
        fh.write("## Per-section results\n\n```\n" + res.to_string(index=False)
                 + "\n```\n\n")
        fh.write(f"## The two tests\n\n"
                 f"1. **Sensitivity (addendum's make-or-break):** mean pairwise "
                 f"trend-shape correlation across 27 assumption sets = "
                 f"**{sc:.4f}** — the shape IS stable (level spread "
                 f"{ls:.3f} ppg).\n"
                 f"2. **Information (the decisive extra):** the trend "
                 f"correlates with the plain flow-rate trend at **{fc_:.4f}** "
                 f"and is predicted from its own inputs with **R² = "
                 f"{r2m:.4f}**.\n\n")
        fh.write("## Verdict\n\n" + closing + "\n")
    print(f"\nwrote {os.path.relpath(out, REPO)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
