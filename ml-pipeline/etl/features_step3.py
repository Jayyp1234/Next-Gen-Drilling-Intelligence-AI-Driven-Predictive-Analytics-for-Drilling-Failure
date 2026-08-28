"""
STEP 3 — compute the canonical physics features on the rig-state-gated data.

Uses `ml-pipeline/physics/drill_physics_features.py` AS-IS (the brief's "do not
re-derive" rule); this module only handles unit routing, the gate, the
per-feature valid-range fault filter, and the physics sanity checks.

WHAT IS COMPUTED WHERE — and, just as deliberately, what is NOT:

  feature                 USROP        Bilabri      31/5-7 Eos
  1  MSE                  YES (SI)     YES (field)  no WOB/torque
  2  d-exponent           YES          YES          no WOB
  3  d_c                  YES          YES (GEOL MW) no MW
  4  ECD                  NOT DERIVABLE (closed: ecd_feasibility.py)  MEASURED
  5  ECD margin           no FG        no FG        no FG / no MW
  6  transport ratio      ASSUMED*     ASSUMED*     no flow
  7  slip velocity        ASSUMED*     ASSUMED*     no flow
  8  annular velocity     ASSUMED*     ASSUMED*     no flow
  9  overbalance          no pore P    no pore P    DHAP but no pore P
  10 stick force          no inputs    no inputs    no inputs
  11 stick-slip index     NO (surface  NO (same)    YES (CRPM) + validated
                          RPM is top-               against the instrument
                          drive-regulated)          STICK channel
  12 hydraulic HP         YES          YES          no SPP/flow

  *ASSUMED = computable only under declared rheology/geometry assumptions
   (drillpipe OD, cuttings size/density, mud viscosity). Computed for the STEP 3
   sanity check with the nominal set below, written with an `_assumed` suffix,
   and NEVER to be used as model evidence — the ecd_feasibility.py lesson is
   that assumption spread can dwarf the signal; these carry the same caveat.

Bilabri gains two channels no DRLPAR file has, joined from the AM GEOL daily
reports (ml-pipeline/artifacts/geol_reports.csv): per-interval MUD WEIGHT
(-> d_c) and BIT DIAMETER (-> MSE with the true per-section size, replacing
train_baseline.py's fixed 12.25" — DEEP-1's file spans the 17.5" section too).

Fault filter: each feature's valid range (step3_feature_catalog.md §3.3, plus
input-channel ranges) marks values as SENSOR FAULT -> NaN, counted per channel
per well, never silently dropped rows.

Sanity checks (brief STEP 3 — "if these fail, the pipeline is wrong"):
  S1  efficient-drilling MSE ~ 1.5-2 x UCS   (Hugin sandstone UCS = 15,000 psi,
      from the catalog's worked value 25,354 psi = 1.69 x UCS)
  S2  ECD >= mud weight — directly checkable NOWHERE (no dataset holds both);
      adapted Eos form: dynamic ECD >= pumps-off ECD baseline, margin plausible
  S3  d_c rises with depth under normal compaction (USROP + Bilabri)
  S4  transport ratio in a sensible range (order 0.5-1.5) under assumptions
  S5  (bonus) Eos: stick_slip_index computed from CRPM windows vs the
      instrument-measured STICK channel — feature #11 against ground truth

Outputs:
  ml-pipeline/data/features/<dataset>/<well>.csv
      USROP/Bilabri: gated rows + features. Bilabri input-range violations are
      ROW-DROPPED by the shared training gate (counted in the fault report as
      "(row-dropped)"), unlike USROP inputs which are NaN'd in place.
      Eos: ALL rows, with the rig-state gate travelling as a `gate` column --
      stick-slip while reaming is physically real, so off-bottom rows keep
      their features and the consumer chooses.
  ml-pipeline/artifacts/features_step3_report.md     faults, coverage, sanity

Run:
    .venv/bin/python ml-pipeline/etl/features_step3.py
"""

import glob
import os
import sys

import numpy as np
import pandas as pd

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ART = os.path.join(REPO, "ml-pipeline", "artifacts")
OUT = os.path.join(REPO, "ml-pipeline", "data", "features")

sys.path.insert(0, os.path.join(REPO, "ml-pipeline", "physics"))
sys.path.insert(0, os.path.join(REPO, "ml-pipeline", "etl"))
sys.path.insert(0, os.path.join(REPO, "ml-pipeline", "training", "baseline"))

import drill_physics_features as dpf              # noqa: E402  canonical, as-is
from gating import (                              # noqa: E402  one gate definition
    BILABRI_FILES, BILABRI_COLS, USROP_DIR, USROP_WELLS,
    USROP_FLOW_MIN_LPM, eos_parse_chronological, eos_gate)
from qc import physical_bad_mask, PHYSICAL_RANGES as QC_RANGES  # noqa: E402

# ---------------------------------------------------------------- units ----
KKGF_TO_N = 9806.65        # 1000 kgf
KKGF_TO_KLBF = 2.20462
KNM_TO_NM = 1000.0
KNM_TO_FTLBF = 737.562
MH_TO_MS = 1.0 / 3600.0
MH_TO_FTHR = 3.280840
MM_TO_M = 1e-3
MM_TO_IN = 1.0 / 25.4
KPA_TO_PSI = 0.145038
LPM_TO_GPM = 1.0 / 3.785412
GCM3_TO_PPG = 8.345404
PSI = 6894.757             # Pa

UCS_PSI = 15_000.0         # Hugin Fm sandstone; catalog: 25,354 psi = 1.69 x UCS

# Declared nominal assumptions for the *_assumed features (context only).
ASSUMED = dict(dp_od_in=5.0, cuttings_d_m=0.004, cuttings_sg=2.6,
               mu_pa_s=0.025)  # 4 mm cuttings, apparent viscosity 25 cP

# Valid ranges: feature outputs (catalog §3.3) + input channels per unit system.
# Violations -> NaN + counted as sensor faults, per the brief ("faults, not
# failures"). Input ranges mirror qc.PHYSICAL_RANGES translated per dataset.
FEATURE_RANGES = {
    "mse_psi": (0.0, 50.0 * UCS_PSI),      # beyond 50xUCS = glitch, not drilling
    "d_exp": (0.0, 5.0),                   # 1.0-1.6 normal
    "d_c": (0.0, 5.0),
    "hhp": (0.0, 5000.0),
    "annular_velocity_assumed_ftmin": (0.0, 1000.0),
    "slip_velocity_assumed_ms": (0.0, 2.0),
    "transport_ratio_assumed": (-2.0, 1.0),  # <=1 by construction; <0 = bed forms
    "stick_slip_index": (0.0, 3.0),
    "ecd_gcm3": (0.9, 2.5),
    # Joined GEOL channels get the same fault treatment as everything else --
    # the DEEP-1 "107 PPG" typo taught us joined values must not bypass the
    # filter (extract_geol_events now also refuses out-of-band values at
    # ingest; this is the belt to that suspenders).
    "mud_weight_ppg_geol": (7.0, 20.0),
    "bit_diameter_in_geol": (3.0, 30.0),
}
USROP_INPUT_RANGES = {  # in USROP's own header units
    "Weight on Bit kkgf": (0.0, 50.0),
    "Average Rotary Speed rpm": (0.0, 250.0),
    "Average Surface Torque kN.m": (0.0, 60.0),
    "Rate of Penetration m/h": (0.0, 150.0),
    "Average Standpipe Pressure kPa": (0.0, 42_000.0),
    "Mud Flow In L/min": (0.0, 6000.0),
    "Mud Density In g/cm3": (0.9, 2.5),
    "Diameter mm": (100.0, 700.0),
}


def _apply_ranges(df, ranges, faults, well):
    """NaN out-of-range values and count them per channel (sensor faults)."""
    for col, (lo, hi) in ranges.items():
        if col not in df:
            continue
        bad = (df[col] < lo) | (df[col] > hi)
        n = int(bad.sum())
        if n:
            faults.append(dict(well=well, channel=col, n_faults=n,
                               lo=lo, hi=hi))
            df.loc[bad, col] = np.nan
    return df


# ---------------------------------------------------------------- USROP ----
def features_usrop(faults):
    frames = {}
    for path in sorted(glob.glob(os.path.join(USROP_DIR, "USROP_A*.csv"))):
        base = os.path.basename(path).replace(".csv", "")
        well = USROP_WELLS.get(base, base)
        df = pd.read_csv(path).drop(columns=["Unnamed: 0"], errors="ignore")
        gate = (df["Mud Flow In L/min"] > USROP_FLOW_MIN_LPM) & \
               (df["Rate of Penetration m/h"] > 0)
        df = df[gate].copy()
        df = _apply_ranges(df, USROP_INPUT_RANGES, faults, well)

        wob_n = df["Weight on Bit kkgf"] * KKGF_TO_N
        d_m = df["Diameter mm"] * MM_TO_M
        a_m2 = np.pi / 4.0 * d_m ** 2
        t_nm = df["Average Surface Torque kN.m"] * KNM_TO_NM
        rop_ms = df["Rate of Penetration m/h"] * MH_TO_MS
        rpm = df["Average Rotary Speed rpm"]

        # canonical SI MSE -> report in psi so the UCS check reads naturally
        df["mse_psi"] = dpf.mse_si(wob_n, a_m2, rpm, t_nm, rop_ms) / PSI
        df["d_exp"] = dpf.d_exponent(df["Rate of Penetration m/h"] * MH_TO_FTHR,
                                     rpm,
                                     df["Weight on Bit kkgf"] * KKGF_TO_KLBF,
                                     df["Diameter mm"] * MM_TO_IN)
        df["d_c"] = dpf.dc_exponent(df["d_exp"],
                                    df["Mud Density In g/cm3"] * GCM3_TO_PPG)
        df["hhp"] = dpf.hydraulic_hp(df["Average Standpipe Pressure kPa"] * KPA_TO_PSI,
                                     df["Mud Flow In L/min"] * LPM_TO_GPM)
        _assumed_hydraulics(df,
                            q_gpm=df["Mud Flow In L/min"] * LPM_TO_GPM,
                            d_hole_in=df["Diameter mm"] * MM_TO_IN,
                            mw_gcm3=df["Mud Density In g/cm3"])
        df = _apply_ranges(df, FEATURE_RANGES, faults, well)
        frames[well] = df
    return frames


def _assumed_hydraulics(df, q_gpm, d_hole_in, mw_gcm3):
    """Features 6-8 under the DECLARED nominal assumptions. `_assumed` suffix =
    context only, never model evidence (see module docstring)."""
    df["annular_velocity_assumed_ftmin"] = dpf.annular_velocity(
        q_gpm, d_hole_in, ASSUMED["dp_od_in"])
    v_ann_ms = df["annular_velocity_assumed_ftmin"] * 0.3048 / 60.0
    v_slip = dpf.slip_velocity_stokes(
        ASSUMED["cuttings_d_m"], ASSUMED["cuttings_sg"] * 1000.0,
        mw_gcm3 * 1000.0, ASSUMED["mu_pa_s"])
    df["slip_velocity_assumed_ms"] = v_slip
    df["transport_ratio_assumed"] = dpf.transport_ratio(v_ann_ms, v_slip)


# -------------------------------------------------------------- Bilabri ----
def _geol_lookup():
    """well -> interval table (depth_from, depth_to, mud_weight_ppg, bit_in, date).

    Stable-sorted by (depth, date) so tie-breaking between reports whose
    intervals end at the same depth is deterministic, not quicksort luck.
    Mud weight outside 7-20 ppg is refused here as well as at extraction.
    """
    path = os.path.join(ART, "geol_reports.csv")
    g = pd.read_csv(path)
    g.loc[~g["mud_weight_ppg"].between(7.0, 20.0), "mud_weight_ppg"] = np.nan
    g["date"] = g["date"].fillna("")
    tables = {}
    for well, grp in g.groupby("well_key"):
        grp = grp.dropna(subset=["depth_2400_m"]) \
                 .sort_values(["depth_2400_m", "date"], kind="stable")
        rows = []
        for _, r in grp.iterrows():
            lo = r["previous_depth_m"] if np.isfinite(r.get("previous_depth_m", np.nan)) \
                else r["depth_2400_m"]
            rows.append((float(min(lo, r["depth_2400_m"])), float(r["depth_2400_m"]),
                         r.get("mud_weight_ppg", np.nan),
                         r.get("bit_diameter_in", np.nan),
                         str(r["date"])))
        tables[well] = rows
    return tables


def _join_geol(depths, table, col):
    """Per-sample GEOL value. Selection rules, in order:

    1. Report intervals CONTAINING the depth; among several (the D2 sidetrack
       re-covers 1938-2912 m already covered by original-hole reports), the
       LATEST-dated wins -- the DRLPAR files are the latest pass through that
       hole, so the era-matching report is the most recent one.
    2. Else forward-fill from the DEEPEST interval above (mud properties
       persist until changed). NB the loop looks first-wins but is last-wins:
       the table is depth-ascending and the ffill branch overwrites without
       breaking, so the final assignment is the deepest interval above.
    3. Bit diameter only: depths ABOVE the first report interval (49 D2 rows
       at 464-512 m) backfill from the FIRST report's bit -- the bit is a
       structural property of the section being drilled, and the filename
       fallback of 12.25" was provably the wrong section there (17.5").
       Mud weight is NOT backfilled (it genuinely varies day to day).

    Returns (values, n_matched_in_interval, n_backfilled).
    """
    idx = 2 if col == "mud_weight_ppg" else 3
    first_below = next((row[idx] for row in table if np.isfinite(row[idx])), np.nan)
    vals = np.full(len(depths), np.nan)
    matched = backfilled = 0
    for i, d in enumerate(depths):
        containing = []
        ffill = np.nan
        for row in table:
            lo, hi, v, date = row[0], row[1], row[idx], row[4]
            if not np.isfinite(v):
                continue
            if lo <= d <= hi:
                containing.append((date, v))
            elif hi <= d:
                ffill = v  # deepest-above wins (see docstring)
        if containing:
            vals[i] = max(containing)[1]  # latest date
            matched += 1
        elif np.isfinite(ffill):
            vals[i] = ffill
        elif idx == 3 and np.isfinite(first_below):
            vals[i] = first_below
            backfilled += 1
    return vals, matched, backfilled


def features_bilabri(faults):
    geol = _geol_lookup()
    frames = {}
    for well, path in BILABRI_FILES.items():
        raw = pd.read_csv(path, sep=r"\s+", skiprows=1, header=None,
                          names=BILABRI_COLS, engine="python", on_bad_lines="skip")
        raw = raw.apply(pd.to_numeric, errors="coerce").dropna()
        activity = ((raw.gpm > 50) & (raw.wob > 0.5) & (raw.rpm > 20)
                    & (raw.rop > 0.1) & (raw.torque > 0.5))
        bad = physical_bad_mask(raw)
        # Bilabri inputs are ROW-DROPPED by the shared training gate rather
        # than NaN'd like USROP inputs; count the drops per channel so they
        # appear in the same fault report instead of vanishing silently.
        for ch, (lo, hi) in QC_RANGES.items():
            if ch in raw:
                n = int((((raw[ch] < lo) | (raw[ch] > hi)) & activity).sum())
                if n:
                    faults.append(dict(well=well, channel=f"{ch} (row-dropped)",
                                       n_faults=n, lo=lo, hi=hi))
        df = raw[activity & ~bad].copy()

        mw, n_mw, _ = _join_geol(df.depth.to_numpy(), geol.get(well, []),
                                 "mud_weight_ppg")
        bit, n_bit, n_backfill = _join_geol(df.depth.to_numpy(), geol.get(well, []),
                                            "bit_diameter_in")
        df["mud_weight_ppg_geol"] = mw
        # Residual fallback (nothing contained, above, or below): the section
        # named in the DRLPAR filename. Counted so the report can state how
        # much rests on it -- after interval/ffill/backfill it should be zero.
        df["bit_diameter_in_geol"] = np.where(np.isfinite(bit), bit, 12.25)
        df.attrs["geol_mw_coverage"] = float(np.isfinite(mw).mean())
        df.attrs["geol_bit_coverage"] = float(np.isfinite(bit).mean())
        df.attrs["geol_bit_backfilled"] = int(n_backfill)

        # canonical FIELD MSE with the true per-interval bit size
        df["mse_psi"] = dpf.mse_field(df.wob, df["bit_diameter_in_geol"], df.rpm,
                                      df.torque * 1000.0,  # kft-lbf -> ft-lbf
                                      df.rop * MH_TO_FTHR)
        df["d_exp"] = dpf.d_exponent(df.rop * MH_TO_FTHR, df.rpm, df.wob,
                                     df["bit_diameter_in_geol"])
        df["d_c"] = dpf.dc_exponent(df["d_exp"], df["mud_weight_ppg_geol"])
        df["hhp"] = dpf.hydraulic_hp(df.spp, df.gpm)
        _assumed_hydraulics(df, q_gpm=df.gpm,
                            d_hole_in=df["bit_diameter_in_geol"],
                            mw_gcm3=df["mud_weight_ppg_geol"] / GCM3_TO_PPG)
        df = _apply_ranges(df, FEATURE_RANGES, faults, well)
        frames[well] = df
    return frames


# ----------------------------------------------------------- 31/5-7 Eos ----
SSI_WINDOW = 30          # 5 min of 10 s samples
SSI_MIN_FRAMES = 4       # CRPM arrives every ~40-80 s; need >=4 real frames


def features_eos(faults):
    frames = {}
    prior_td = 0.0
    for t_start, path, df, mnems, units in eos_parse_chronological():
        run = os.path.basename(path).replace(".LAS", "")
        masks, diag = eos_gate(df, prior_td)
        prior_td = max(prior_td, diag["max_depth"])

        # Feature 11 on rolling CRPM stats -- computed on ALL rows (stick-slip
        # while reaming is physically real), then the gate travels as a column.
        if "CRPM" in df.columns:
            crpm = df["CRPM"]
            roll = crpm.rolling(SSI_WINDOW, min_periods=SSI_MIN_FRAMES)
            ssi = dpf.stick_slip_index(roll.max(), roll.min(), roll.mean())
            # Continuity guard (mirrors eos_gate's span check): a window whose
            # CRPM frames straddle a telemetry/pump outage mixes two separate
            # episodes. NaN the index where any inter-frame gap inside the
            # window exceeds 3x this run's median frame cadence (measured:
            # 0.35% of windows, which otherwise leak into the gate and the
            # S5 ground-truth comparison).
            t_s = df["TIME_1900"] * 86400.0
            frame_t = t_s.where(crpm.notna())
            frame_gap = frame_t.dropna().diff()
            gap_series = pd.Series(np.nan, index=df.index)
            gap_series.loc[frame_gap.index] = frame_gap
            med_gap = float(frame_gap.median()) if len(frame_gap) else np.nan
            if np.isfinite(med_gap) and med_gap > 0:
                worst_gap = gap_series.rolling(SSI_WINDOW, min_periods=1).max()
                ssi = ssi.where(worst_gap <= 3.0 * med_gap)
            df["stick_slip_index"] = ssi
        else:
            df["stick_slip_index"] = np.nan
        if "ECD" in df:
            df["ecd_gcm3"] = df["ECD"]  # measured; (RM) memory caveat applies
        df["gate"] = masks["gate"]
        df["circulating"] = masks["circulating"]
        df = _apply_ranges(df, FEATURE_RANGES, faults, f"31/5-7:{run}")
        frames[run] = df
    return frames


# -------------------------------------------------------- sanity checks ----
def sanity_checks(usrop, bilabri, eos):
    lines = []

    def emit(s):
        lines.append(s)
        print(s)

    emit("\n" + "=" * 78)
    emit("PHYSICS SANITY CHECKS (brief STEP 3)")
    emit("=" * 78)

    # S1 -- MSE vs UCS in efficient drilling (top-decile ROP = least founder).
    # PER HOLE SECTION: MSE here uses SURFACE torque (bit torque is not
    # recorded), which includes string friction and therefore overestimates
    # MSE increasingly with depth -- the deep 8.5" sections read far above the
    # UCS band for that reason, not from a unit error. The check is meaningful
    # in the shallow low-drag sections and is reported per section.
    emit(f"\nS1  efficient-drilling MSE vs UCS ({UCS_PSI:,.0f} psi, Hugin sandstone),")
    emit("    per hole section; surface-torque MSE = upper bound (string friction):")
    for well, df in usrop.items():
        d = df.dropna(subset=["mse_psi"])
        if not len(d):
            continue
        for dia, g in d.groupby("Diameter mm"):
            eff = g[g["Rate of Penetration m/h"]
                    >= g["Rate of Penetration m/h"].quantile(0.9)]
            if len(eff) < 30:
                continue
            ratio = float(eff["mse_psi"].median()) / UCS_PSI
            verdict = "OK (1-3x)" if 1.0 <= ratio <= 3.0 else \
                ("high — deep-section string friction" if ratio > 3 else "low — soft/washout")
            emit(f"    USROP    {well:12s} {dia / 25.4:5.2f}\" section  "
                 f"MSE/UCS = {ratio:5.2f}x   {verdict}")
    emit("    Bilabri vs the HUGIN reference (wrong rock for the Niger Delta —")
    emit("    local unconsolidated-sand UCS is roughly 4-8k psi, not 15k):")
    for well, df in bilabri.items():
        d = df.dropna(subset=["mse_psi"])
        if not len(d):
            continue
        eff = d[d["rop"] >= d["rop"].quantile(0.9)]
        ratio = float(eff["mse_psi"].median()) / UCS_PSI
        emit(f"    Bilabri  {well:16s} MSE/UCS(Hugin) = {ratio:5.2f}x  "
             f"(~{ratio * 15000 / 6000:.1f}x against a mid-range 6k psi local UCS)")

    # S2 -- adapted ECD check on Eos (nowhere holds ECD and MW together).
    emit("\nS2  ECD >= mud weight — NOT directly checkable on any dataset "
         "(none holds both).")
    emit("    Adapted Eos form: dynamic (pumps-on) ECD vs pumps-off ECD baseline:")
    for run, df in eos.items():
        if "ecd_gcm3" not in df:
            continue
        d = df.dropna(subset=["ecd_gcm3"])
        on = d.loc[d["circulating"], "ecd_gcm3"]
        off = d.loc[~d["circulating"], "ecd_gcm3"]
        if len(on) < 100 or len(off) < 100:
            continue
        margin = float(on.median() - off.median())
        # Same-depth control: pumps-off rows are tripping data at moving
        # depths, so confirm the margin inside 50 m depth bins holding >=20
        # samples of EACH state -- this pre-empts "it's just depth mixing".
        bins = (d["DEPTH"] // 50).astype(int)
        diffs = []
        for _, g in d.groupby(bins):
            a, b = g.loc[g["circulating"], "ecd_gcm3"], g.loc[~g["circulating"], "ecd_gcm3"]
            if len(a) >= 20 and len(b) >= 20:
                diffs.append(float(a.median() - b.median()))
        binned = (f"; same-depth bins: {sum(x > 0 for x in diffs)}/{len(diffs)} "
                  f"positive, median {np.median(diffs):+.3f}" if len(diffs) >= 5 else "")
        verdict = "OK (positive, plausible)" if 0.0 <= margin <= 0.15 else "REVIEW"
        emit(f"    {run:38s} dyn-static margin {margin:+.3f} g/cm3   {verdict}{binned}")

    # S3 -- d_c rises with depth (normal compaction). The mud-weight trend is
    # printed alongside because it separates the two failure explanations: a
    # FLAT d_c against a RISING mud weight is the compensated-overpressure
    # signature (the MW correction divides the d_exp rise away), whereas a
    # falling d_c at constant MW is either shallow-section noise or real.
    emit("\nS3  d_c vs depth (should RISE under normal compaction; MW trend "
         "shown as the overpressure corroborator):")
    for name, frames in (("USROP", usrop), ("Bilabri", bilabri)):
        for well, df in frames.items():
            depth_col = "Measured Depth m" if name == "USROP" else "depth"
            mw_col = "Mud Density In g/cm3" if name == "USROP" else "mud_weight_ppg_geol"
            d = df.dropna(subset=["d_c", depth_col])
            if len(d) < 200:
                emit(f"    {name:8s} {well:16s} insufficient d_c coverage (n={len(d)})")
                continue
            rho = float(d[depth_col].corr(d["d_c"], method="spearman"))
            rho_mw = float(d[depth_col].corr(d[mw_col], method="spearman")) \
                if mw_col in d and d[mw_col].notna().sum() > 200 else np.nan
            if abs(rho) < 0.05:
                verdict = ("FLAT — with rising MW: compensated overpressure (textbook)"
                           if rho_mw > 0.3 else "FLAT")
            elif rho > 0:
                verdict = "OK (rising)"
            else:
                verdict = "REVIEW (falling — overpressure entry or data issue)"
            emit(f"    {name:8s} {well:16s} d_c rho = {rho:+.2f}  MW rho = "
                 f"{rho_mw:+.2f}   {verdict}")

    # S4 -- transport ratio under declared assumptions.
    emit("\nS4  transport ratio (ASSUMED rheology/geometry — context only):")
    for name, frames in (("USROP", usrop), ("Bilabri", bilabri)):
        allv = pd.concat([df["transport_ratio_assumed"].dropna()
                          for df in frames.values()])
        emit(f"    {name:8s} median {allv.median():.2f}  IQR "
             f"[{allv.quantile(.25):.2f}, {allv.quantile(.75):.2f}]   "
             f"(sensible band ~0.5-1.0)")

    # S5 -- feature #11 vs the instrument STICK channel (ground truth). The
    # gated-only column shows the validation survives restriction to actual
    # drilling; the pooled value alone could be challenged as driven by the
    # on/off-bottom contrast.
    emit("\nS5  stick_slip_index(CRPM) vs instrument STICK channel (31/5-7):")
    for run, df in eos.items():
        if "STICK" not in df:
            continue
        d = df.dropna(subset=["stick_slip_index", "STICK"])
        if len(d) < 200:
            continue
        rho = float(d["stick_slip_index"].corr(d["STICK"], method="spearman"))
        g = d[d["gate"]]
        rho_g = float(g["stick_slip_index"].corr(g["STICK"], method="spearman")) \
            if len(g) >= 100 else np.nan
        emit(f"    {run:38s} spearman = {rho:+.2f} (n={len(d)})   "
             f"drilling-only = {rho_g:+.2f} (n={len(g)})")
    emit("    (STICK is the tool's own stick-slip severity — a positive rank "
         "correlation validates feature #11 against downhole ground truth, "
         "and it must hold on the drilling-only subset to count.)")
    return lines


def main():
    os.makedirs(OUT, exist_ok=True)
    faults = []
    print("computing features (gated rows only)...")
    usrop = features_usrop(faults)
    bilabri = features_bilabri(faults)
    eos = features_eos(faults)

    for ds, frames in (("usrop", usrop), ("bilabri", bilabri), ("eos", eos)):
        ddir = os.path.join(OUT, ds)
        os.makedirs(ddir, exist_ok=True)
        for well, df in frames.items():
            safe = well.replace("/", "_").replace(":", "_")
            df.to_csv(os.path.join(ddir, f"{safe}.csv"), index=False)

    print("\nSAMPLES WITH FEATURES (USROP/Bilabri tables are gated rows; Eos "
          "tables are ALL rows with the gate as a column):")
    for ds, frames in (("USROP", usrop), ("Bilabri", bilabri)):
        n = sum(len(df) for df in frames.values())
        print(f"  {ds:8s} {n:7d} gated rows across {len(frames)} files")
    n_all = sum(len(df) for df in eos.values())
    n_gated = sum(int(df["gate"].sum()) for df in eos.values())
    print(f"  Eos      {n_all:7d} rows across {len(eos)} files "
          f"({n_gated} gated = drilling)")
    for well, df in bilabri.items():
        print(f"  GEOL join {well:16s} mud-weight coverage "
              f"{df.attrs['geol_mw_coverage']:6.1%}, bit-diameter "
              f"{df.attrs['geol_bit_coverage']:6.1%} "
              f"({df.attrs['geol_bit_backfilled']} rows backfilled from first report)")

    fdf = pd.DataFrame(faults)
    print(f"\nSENSOR-FAULT FILTER: {int(fdf.n_faults.sum()) if len(fdf) else 0} "
          f"values NaN'd across {len(fdf)} well×channel pairs")
    if len(fdf):
        for _, r in fdf.sort_values("n_faults", ascending=False).head(12).iterrows():
            print(f"    {r.well:22s} {r.channel:34s} {r.n_faults:5d} outside "
                  f"[{r.lo:g}, {r.hi:g}]")

    lines = sanity_checks(usrop, bilabri, eos)

    report = os.path.join(ART, "features_step3_report.md")
    with open(report, "w", encoding="utf-8") as fh:
        fh.write("# STEP 3 — Feature Computation Report\n\n")
        fh.write("Canonical module: `ml-pipeline/physics/drill_physics_features.py` "
                 "(used as-is).\nGate: one definition, shared with "
                 "`gating.py`/`data_inventory.csv`.\n\n## Computability per dataset\n\n"
                 "See module docstring of `features_step3.py` — features 4, 5, 9, 10 "
                 "are NOT computed (inputs absent or derivation closed by "
                 "`ecd_feasibility.py`); features 6-8 carry `_assumed` suffixes and "
                 "are context-only.\n\n## Sensor faults (out-of-range -> NaN)\n\n")
        if len(fdf):
            fh.write("```\n" + fdf.to_string(index=False) + "\n```\n")
        else:
            fh.write("None.\n")
        fh.write("\n## Sanity checks\n\n```\n" + "\n".join(lines) + "\n```\n")
    print(f"\nwrote {os.path.relpath(report, REPO)}")
    print(f"wrote feature tables -> {os.path.relpath(OUT, REPO)}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
