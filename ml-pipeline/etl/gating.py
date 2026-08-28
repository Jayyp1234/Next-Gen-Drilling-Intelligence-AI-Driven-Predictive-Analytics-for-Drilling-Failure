"""
STEP 1 (data_inventory.csv) + STEP 2 (rig-state gating) of the handoff brief.

One row per data file across all three datasets: row count, index range,
sampling interval, channel list WITH HEADER UNITS, and the rig-state gate's
duty cycle. The brief's mask is

    on_bottom_circulating = circulating AND on-bottom AND making hole

but no dataset here carries the full channel set the brief assumes (block
position + flow + bit depth + hole depth together), so each dataset gets the
closest honest approximation, and the gate DEFINITION travels in the CSV next
to the duty cycle it produced. Component duty cycles are reported separately so
no proxy hides inside an AND.

`sampling` semantics follow `index_type`: temporal (median dt) for the
time-indexed Eos runs, spatial (median dz / rows-per-metre) for the
depth-indexed USROP and Bilabri files. Read them together.

Dataset-specific reality (verified by reading files, then adversarially
re-verified by an independent 4-agent review on 2026-07-30 — the fixes from
that review are marked [R] below):

  USROP    depth-indexed; no timestamps. The dataset was CONSTRUCTED for ROP
           benchmarking -- off-bottom intervals were already removed at build
           time, so the brief's gate is largely vacuous here ("pre-gated by
           construction"); duty cycle vs the raw WITSML is unknowable. We still
           apply and report the mask so the claim is measured, not assumed.
           [R] dz/ROP time reconstruction must EXCLUDE gap-bridging steps:
           single dz jumps up to 166 m (the removed off-bottom intervals) were
           being charged at the post-gap row's ROP, inflating fleet drilling
           hours ~24% (~706 h naive vs ~540 h continuous). Steps with dz > 1 m
           (20-30x median spacing) are excluded and reported separately.

  Bilabri  depth-indexed, 1 row/m, no timestamps, no block position, no
           flow-out. Gate = pumps on + bit loaded + rotating + advancing
           plus the STEP 3 physical-range QC from qc.py -- identical to the
           training filter, so the duty cycle here is exactly the fraction of
           rows the models see. [R] dz for the time reconstruction is computed
           on the RAW frame before gating (diffing after filtering credited
           rejected rows' footage to drilling time, +0.4-3.4% per well) and
           capped at 3 m.

  31/5-7   TIME-indexed at 10 s -- the ONLY dataset where the brief's gating
  (Eos)    rationale genuinely applies. Components:
             circulating : mud-pulse telemetry arriving. The downhole RT
                           channels (STICK/CRPM/SHKRSK/SHKPK) are transmitted
                           by mud pulse, which needs flow; their non-nullness
                           is the flow proxy. [R] Telemetry frames interleave
                           channels, so RT samples land only every ~40-80 s in
                           a 10 s file; the per-row proxy flickers and
                           undercuts true circulating time ~3x. The proxy is
                           therefore SMOOTHED with a rolling max over ~3x the
                           measured per-file median RT inter-sample gap.
                           Measured during drilling, telemetry gaps never
                           exceed 4.2 min, so the smoothing bridges frame gaps
                           without bridging pump-off stretches (which are
                           bimodally longer).
                           NB: ECD/DHAP are (RM) MEMORY channels, recorded
                           downhole and merged after the run -- measured
                           present through an 8.1 h pumps-off trip (61.8% of
                           rows) and a 3.9 h trip (100%). They are NOT a
                           circulating proxy. The converse also fails: ECD
                           ABSENCE does not mean pumps off (one run's first
                           1.5 h of RIH has ECD on 1.3% of rows -- the memory
                           record simply had not started).
             on-bottom   : [R] DEPTH is BIT depth -- it also advances while
                           tripping in or reaming old hole (9.8% of gated rows
                           on MWD_4 sat >1 m above the deepest hole yet made).
                           Gate requires DEPTH >= cummax(DEPTH) - 1 m, with the
                           cummax SEEDED by the deepest hole reached in all
                           chronologically earlier runs -- a within-file cummax
                           cannot see the trip back to the previous run's TD,
                           and the seed is what exposed that MWD_2 (tops out
                           930.4 m vs MWD_1's sustained 944.3 m TD) and MWD_4
                           (1905.7 m vs MWD_3's 1906.2 m) are hole-CONDITIONING
                           trips reaming old hole toward fill, not drilling
                           runs. Both prior TDs are sustained for >20 min, so
                           they are real, not depth spikes. The first run has
                           no seed (pre-MWD hole unknown) -- a stated
                           limitation.
             making hole : DEPTH advancing over a 1-minute window. [R] The
                           advance floor is 0.01 m/min (~0.6 m/hr) -- the
                           original 0.05 m/min floor equalled a 3 m/hr ROP
                           minimum, structurally excluding the slow-drilling
                           regime where stuck pipe develops. The 1-minute
                           window is only trusted where 6 samples really span
                           <= 70 s.
             rotating    : CRPM > 10, reported as a component but NOT gated on
                           -- requiring it would cut 50.8% of gated rows,
                           mostly legitimate slide drilling.
           Gate = circulating(smoothed) AND on-bottom AND making-hole, and a
           per-file SELF-TEST asserts no >10 min stretch of making-hole with
           the smoothed proxy absent (drilling without telemetry would refute
           the proxy; result travels in the gate_selftest column).

Run:
    .venv/bin/python ml-pipeline/etl/gating.py
"""

import glob
import os
import re
import sys
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ART = os.path.join(REPO, "ml-pipeline", "artifacts")
USROP_DIR = os.path.join(REPO, "ml-pipeline", "data", "usrop")
EOS_DIR = os.path.join(REPO, "Volve dataset", "05.LWD_Log_data")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from qc import physical_bad_mask  # noqa: E402

LAS_NULL = -999.25

# Canonical 15/9-F well names for the USROP files (the brief asks for well
# names; the file basenames encode them obliquely).
USROP_WELLS = {
    "USROP_A 0 N-NA_F-9_Ad": "15/9-F-9A",
    "USROP_A 1 N-S_F-7d": "15/9-F-7",
    "USROP_A 2 N-SH_F-14d": "15/9-F-14",
    "USROP_A 3 N-SH-F-15d": "15/9-F-15",
    "USROP_A 4 N-SH_F-15Sd": "15/9-F-15S",
    "USROP_A 5 N-SH-F-5d": "15/9-F-5",
    "USROP_A 6 N-SH_F-9d": "15/9-F-9",
}

# Bilabri DRLPAR: the four canonical per-well files used by training.
# Header row is column names ONLY -- no units are stated in the file. The units
# below are therefore INFERRED from value ranges (SPP 199-3544 -> psi, torque
# 1-25 -> kft-lbf, temps 85-170 -> degF) and flagged as such in the inventory;
# the brief's "never assume field units" rule is met by declaring the
# assumption rather than hiding it.
BILABRI_FILES = {
    "BILABRI-DEEP-1": os.path.join(REPO, "actual data", "BILABRI DEEP -1 FINAL REPORT",
                                   "Daily Reports", "BILABRI DX1_DRLPAR_460m-2860_18-01-06.txt"),
    "BILABRI-D2": os.path.join(REPO, "actual data", "Bilabri D2", "PLOG RPTS",
                               "GasROP&Drl Rpts",
                               "BILABRI-D2-S2-REV3 (12.25 SECTION)_DRLPAR_464m - 3230m_08-09-06.txt"),
    "BILABRI-D3": os.path.join(REPO, "ml-pipeline", "data", "bilabri_drlpar", "D3",
                               "BILABRI-D3 (12.25 SECTION)_DRLPAR_841m - 2555m_25-10-06.txt"),
    "BILABRI-D4": os.path.join(REPO, "ml-pipeline", "data", "bilabri_drlpar", "D4",
                               "BILABRI-D4 (12.25 SECTION)_DRLPAR_900m-2591m_30-12-06.txt"),
}
BILABRI_COLS = ["depth", "tvd", "rop", "wob", "rpm", "torque", "spp", "gpm",
                "temp_in", "temp_out"]
BILABRI_UNITS = ("depth:m(inferred)|tvd:m(inferred)|rop:m/hr(inferred)|"
                 "wob:klbf(inferred)|rpm:rpm(inferred)|torque:kft-lbf(inferred)|"
                 "spp:psi(inferred)|gpm:gpm(inferred)|temp_in:degF(inferred)|"
                 "temp_out:degF(inferred)")

# Eos downhole real-time telemetry mnemonics -- arrive by mud pulse, so their
# non-nullness is the circulating proxy. BLKP/GR are excluded: BLKP is a
# surface channel and GR sensors vary by tool string.
EOS_RT_TELE = ["STICK", "CRPM", "SHKRSK", "SHKPK"]

USROP_FLOW_MIN_LPM = 300.0   # circulating threshold; well below any drilling flow seen
USROP_ROP_MIN = 0.0          # making hole
USROP_GAP_CAP_M = 1.0        # dz above this bridges a build-time gap, not drilling
BILABRI_GAP_CAP_M = 3.0      # nominal spacing 1 m; larger dz = missing rows
EOS_CRPM_ROTATING = 10.0     # c/min; component only, not part of the gate
EOS_ADVANCE_WINDOW = 6       # samples = 1 min at 10 s
EOS_ADVANCE_MIN_M = 0.01     # ~0.6 m/hr floor; keeps the slow-drilling regime
EOS_WINDOW_MAX_S = 70.0      # trust diff(6) only where 6 samples span ~1 min
EOS_ONBOTTOM_TOL_M = 1.0     # bit within 1 m of deepest hole yet made
EOS_SELFTEST_MAX_MIN = 10.0  # drilling with proxy absent longer than this = refuted


# ---------------------------------------------------------------- USROP ----
def inventory_usrop():
    rows = []
    for path in sorted(glob.glob(os.path.join(USROP_DIR, "USROP_A*.csv"))):
        df = pd.read_csv(path)
        base = os.path.basename(path).replace(".csv", "")
        chans = [c for c in df.columns if not c.startswith("Unnamed")]
        units = "|".join(chans)  # units are embedded in the column names
        md = df["Measured Depth m"].to_numpy()
        rop = df["Rate of Penetration m/h"].to_numpy()
        flow = df["Mud Flow In L/min"].to_numpy()
        dz = np.diff(md)
        dz_med = float(np.median(dz[dz > 0])) if (dz > 0).any() else np.nan

        circulating = flow > USROP_FLOW_MIN_LPM
        making_hole = rop > USROP_ROP_MIN
        gate = circulating & making_hole
        # dz/ROP reconstruction on gated rows. Steps larger than the gap cap
        # bridge intervals removed at dataset build time; charging them at the
        # post-gap ROP inflated fleet hours ~24%, so they are excluded and
        # accounted for separately.
        with np.errstate(divide="ignore", invalid="ignore"):
            step_ok = (rop[1:] > 0) & (dz > 0) & gate[1:]
            dt_hr = np.where(step_ok, dz / rop[1:], 0.0)
        hours = float(np.nansum(np.where(dz <= USROP_GAP_CAP_M, dt_hr, 0.0)))
        bridged = float(np.nansum(np.where(dz > USROP_GAP_CAP_M, dt_hr, 0.0)))

        rows.append(dict(
            dataset="USROP (Volve 15/9-F)",
            well=USROP_WELLS.get(base, base),
            file=os.path.relpath(path, REPO),
            index_type="depth (no timestamps)",
            n_rows=len(df),
            index_start=f"{md.min():.1f} m",
            index_end=f"{md.max():.1f} m",
            sampling=f"median dz {dz_med:.3f} m",
            reconstructed_drilling_hours=round(hours, 1),
            gap_bridged_hours_excluded=round(bridged, 1),
            channels_with_units=units,
            gate_definition=(f"flow_in > {USROP_FLOW_MIN_LPM:.0f} L/min AND rop > 0 "
                             "(hole-depth/block-position unavailable); time steps "
                             f"with dz > {USROP_GAP_CAP_M:.0f} m excluded as gap-bridging"),
            duty_cycle=round(float(gate.mean()), 4),
            duty_circulating=round(float(circulating.mean()), 4),
            duty_making_hole=round(float(making_hole.mean()), 4),
            duty_rotating=round(float((df["Average Rotary Speed rpm"] > 20).mean()), 4),
            gate_selftest="n/a",
            note=("PRE-GATED BY CONSTRUCTION: off-bottom intervals were removed when "
                  "the USROP dataset was built, so duty cycle ~1 is expected and says "
                  "nothing about rig time. 'Hole Depth (TVD)' is TVD, not hole depth."),
        ))
    return rows


# -------------------------------------------------------------- Bilabri ----
def inventory_bilabri():
    rows = []
    for well, path in BILABRI_FILES.items():
        raw = pd.read_csv(path, sep=r"\s+", skiprows=1, header=None,
                          names=BILABRI_COLS, engine="python", on_bad_lines="skip")
        raw = raw.apply(pd.to_numeric, errors="coerce").dropna()
        on_bottom = ((raw.gpm > 50) & (raw.wob > 0.5) & (raw.rpm > 20)
                     & (raw.rop > 0.1) & (raw.torque > 0.5))
        gate = on_bottom & ~physical_bad_mask(raw)
        # dz on the RAW frame, before gating: diffing the filtered frame bridged
        # the very gaps the gate created and credited rejected rows' footage to
        # drilling time (+0.4-3.4% per well). Capped so missing-row gaps in the
        # source file are not charged as drilling either.
        dz = raw.depth.diff()
        with np.errstate(divide="ignore", invalid="ignore"):
            step_ok = gate & (raw.rop > 0) & (dz > 0) & (dz <= BILABRI_GAP_CAP_M)
            hours = float(np.nansum(np.where(step_ok, dz / raw.rop, 0.0)))
            bridged = float(np.nansum(np.where(gate & (dz > BILABRI_GAP_CAP_M),
                                               dz / raw.rop, 0.0)))

        rows.append(dict(
            dataset="Bilabri DRLPAR",
            well=well,
            file=os.path.relpath(path, REPO),
            index_type="depth (no timestamps)",
            n_rows=len(raw),
            index_start=f"{raw.depth.min():.0f} m",
            index_end=f"{raw.depth.max():.0f} m",
            sampling="1 row per metre",
            reconstructed_drilling_hours=round(hours, 1),
            gap_bridged_hours_excluded=round(bridged, 1),
            channels_with_units=BILABRI_UNITS,
            gate_definition=("gpm>50 AND wob>0.5 AND rpm>20 AND rop>0.1 AND torque>0.5 "
                             "AND physical_qc (qc.py) — identical to the training filter; "
                             f"time steps with dz > {BILABRI_GAP_CAP_M:.0f} m excluded"),
            duty_cycle=round(float(gate.mean()), 4),
            duty_circulating=round(float((raw.gpm > 50).mean()), 4),
            duty_making_hole=round(float((raw.rop > 0.1).mean()), 4),
            duty_rotating=round(float((raw.rpm > 20).mean()), 4),
            gate_selftest="n/a",
            note=("Units NOT stated in file header — inferred from value ranges and "
                  "flagged. Depth-indexed: rows exist only where hole was made, so "
                  "off-bottom operations (where 4 of 5 documented failures developed) "
                  "are structurally invisible."),
        ))
    return rows


# ----------------------------------------------------------- 31/5-7 Eos ----
def _parse_las(path):
    """Minimal LAS 2.0 reader for these files: ~C for column order + units,
    ~A for whitespace-delimited data. Column order VARIES between runs, so
    each file's ~C section is authoritative. Fails loudly on a malformed file
    rather than silently parsing its header as data."""
    mnems, units = [], {}
    with open(path, "r", encoding="latin-1") as fh:
        lines = fh.readlines()
    in_c = False
    data_start = None
    for i, ln in enumerate(lines):
        if ln.startswith("~C"):
            in_c = True
            continue
        if ln.startswith("~A"):
            data_start = i + 1
            break
        if ln.startswith("~"):
            in_c = False
            continue
        if in_c and ln.strip() and not ln.strip().startswith("#"):
            m = re.match(r"\s*(\S+)\s*\.(\S*)", ln)
            if m:
                mnems.append(m.group(1))
                units[m.group(1)] = m.group(2) or "-"
    if data_start is None or not mnems:
        raise ValueError(f"no ~A/~C section found in {path}")
    if len(set(mnems)) != len(mnems):
        raise ValueError(f"duplicate curve mnemonics in {path}: {mnems}")
    df = pd.read_csv(path, sep=r"\s+", skiprows=data_start, header=None,
                     names=mnems, engine="python", on_bad_lines="skip",
                     encoding="latin-1")
    for c in df.columns:
        if c != "TIME":
            df[c] = pd.to_numeric(df[c], errors="coerce")
            df.loc[df[c] == LAS_NULL, c] = np.nan
    return df, mnems, units


def _smoothed_circulating(df, tele, dt_med_s):
    """Frame-cadence-aware circulating proxy.

    RT channels arrive in interleaved mud-pulse frames every ~40-80 s (run
    dependent), so per-row non-nullness flickers in a 10 s file and undercounts
    circulating time ~3x. Smooth with a centred rolling max over ~3x the
    measured median inter-sample gap of the telemetry itself. Measured drilling
    telemetry gaps never exceed 4.2 min while pump-off stretches are bimodally
    longer, so this bridges frame gaps without absorbing pump-off time.
    """
    raw = df[tele].notna().any(axis=1)
    t_s = df["TIME_1900"].to_numpy() * 86400.0
    idx = np.flatnonzero(raw.to_numpy())
    if len(idx) < 2:
        return raw, np.nan
    gap_med = float(np.median(np.diff(t_s[idx])))
    win = max(3, int(round(3.0 * gap_med / max(dt_med_s, 1e-9))))
    smoothed = raw.astype(int).rolling(win, center=True, min_periods=1).max().astype(bool)
    return smoothed, gap_med


def eos_parse_chronological():
    """Parse every Eos time-indexed run, sorted CHRONOLOGICALLY (file numbering
    does not order the runs -- GR-MECH_1 is the earliest). Returns a list of
    (t_start_days, path, df, mnems, units)."""
    parsed = []
    for path in sorted(glob.glob(os.path.join(EOS_DIR, "*_TIME_MWD_*.LAS"))):
        df, mnems, units = _parse_las(path)
        parsed.append((float(df["TIME_1900"].iloc[0]), path, df, mnems, units))
    parsed.sort()
    return parsed


def eos_gate(df, seed_td):
    """The 31/5-7 rig-state gate for one run, seeded with the deepest hole made
    by all chronologically earlier runs (seed_td). Returns (masks, diag).

    Shared by inventory_eos and the STEP 3 feature builder so there is exactly
    one gate definition; any change here changes both, and data_inventory.csv
    is the regression reference.
    """
    dt_med = float(np.median(np.diff(df["TIME_1900"].to_numpy())) * 86400.0)

    tele = [c for c in EOS_RT_TELE if c in df.columns]
    if tele:
        circulating, tele_gap_s = _smoothed_circulating(df, tele, dt_med)
    else:
        circulating, tele_gap_s = pd.Series(False, index=df.index), np.nan

    # making hole: net advance over a ~1 min window, trusted only where the
    # window really spans ~1 min. Floor 0.01 m/min (~0.6 m/hr) keeps the
    # slow-drilling regime where stuck pipe develops.
    adv = df["DEPTH"].diff(EOS_ADVANCE_WINDOW)
    span_s = df["TIME_1900"].diff(EOS_ADVANCE_WINDOW) * 86400.0
    making_hole = (adv > EOS_ADVANCE_MIN_M) & (span_s <= EOS_WINDOW_MAX_S)
    # on-bottom: DEPTH is BIT depth and also advances while re-running old
    # hole; require the bit to be at the deepest hole yet made, where "yet"
    # includes every chronologically earlier run via the seed. This is what
    # identifies conditioning trips (MWD_2, MWD_4) as ~0 new hole.
    seeded_cummax = np.maximum(df["DEPTH"].cummax(), seed_td)
    on_bottom = df["DEPTH"] >= (seeded_cummax - EOS_ONBOTTOM_TOL_M)
    rotating = df["CRPM"] > EOS_CRPM_ROTATING if "CRPM" in df \
        else pd.Series(False, index=df.index)
    gate = circulating & making_hole & on_bottom

    # SELF-TEST: sustained making-hole with the smoothed proxy absent would
    # mean drilling without telemetry, which would refute the proxy. Those
    # rows are NOT gated either way, so a failure here is conservative
    # (under-gating) -- but it must be reported, not absorbed.
    unproxied = (making_hole & on_bottom & ~circulating).to_numpy()
    longest = run = 0
    for v in unproxied:
        run = run + 1 if v else 0
        longest = max(longest, run)

    masks = dict(gate=gate, circulating=circulating, making_hole=making_hole,
                 on_bottom=on_bottom, rotating=rotating)
    diag = dict(dt_med=dt_med, tele=tele, tele_gap_s=tele_gap_s,
                longest_unproxied_min=longest * dt_med / 60.0,
                max_depth=float(df["DEPTH"].max()))
    return masks, diag


def inventory_eos():
    rows = []
    prior_td = 0.0  # deepest hole made by all earlier runs; 0 for the first
    for t_start, path, df, mnems, units in eos_parse_chronological():
        seed_td = prior_td  # capture BEFORE this run's TD folds in
        t0 = datetime(1899, 12, 30)
        start = t0 + timedelta(days=float(df["TIME_1900"].iloc[0]))
        end = t0 + timedelta(days=float(df["TIME_1900"].iloc[-1]))

        masks, diag = eos_gate(df, seed_td)
        circulating, making_hole = masks["circulating"], masks["making_hole"]
        rotating, gate = masks["rotating"], masks["gate"]
        dt_med, tele, tele_gap_s = diag["dt_med"], diag["tele"], diag["tele_gap_s"]
        longest_min, max_depth = diag["longest_unproxied_min"], diag["max_depth"]

        new_hole_m = max(0.0, max_depth - seed_td) if seed_td else float("nan")
        if longest_min <= EOS_SELFTEST_MAX_MIN:
            selftest = f"PASS (longest unproxied advancing {longest_min:.1f} min)"
        else:
            selftest = (f"FLAG ({longest_min:.1f} min of on-bottom advance without "
                        "telemetry — dropout during slow drilling, or wash-down of "
                        "hole older than the seed; rows are excluded from the gate, "
                        "so the error direction is conservative)")
        prior_td = max(prior_td, max_depth)

        rows.append(dict(
            dataset="31/5-7 Eos",
            well="31/5-7",
            file=os.path.relpath(path, REPO),
            index_type="time (10 s)",
            n_rows=len(df),
            index_start=start.strftime("%Y-%m-%dT%H:%M:%S"),
            index_end=end.strftime("%Y-%m-%dT%H:%M:%S"),
            sampling=f"median dt {dt_med:.1f} s",
            reconstructed_drilling_hours=round(float(gate.sum()) * dt_med / 3600.0, 1),
            gap_bridged_hours_excluded=0.0,
            channels_with_units="|".join(f"{m}:{units.get(m, '-')}" for m in mnems),
            gate_definition=(f"telemetry proxy (any of {'/'.join(tele) or 'none'} non-null, "
                             f"smoothed over 3x median frame gap = {tele_gap_s:.0f} s) AND "
                             f"on-bottom (DEPTH >= cummax seeded with prior-run TD "
                             f"{seed_td:.0f} m, tol {EOS_ONBOTTOM_TOL_M:.0f} m) AND "
                             f"advance > {EOS_ADVANCE_MIN_M} m/min"),
            new_hole_m=round(new_hole_m, 1) if np.isfinite(new_hole_m) else "unknown (first run)",
            duty_cycle=round(float(gate.mean()), 4),
            duty_circulating=round(float(circulating.mean()), 4),
            duty_making_hole=round(float(making_hole.mean()), 4),
            duty_rotating=round(float(rotating.mean()), 4),
            gate_selftest=selftest,
            note=("ECD/DHAP are (RM) MEMORY channels merged after the run — measured "
                  "present through 8.1 h and 3.9 h pumps-off trips, so NOT a circulating "
                  "proxy; nor does ECD absence imply pumps off (memory record can start "
                  "late). DEPTH is bit depth. The only time-indexed dataset, hence the "
                  "only one whose duty cycle reflects real rig time."),
        ))
    return rows


def main():
    os.makedirs(ART, exist_ok=True)
    rows = inventory_usrop() + inventory_bilabri() + inventory_eos()
    inv = pd.DataFrame(rows)
    out = os.path.join(ART, "data_inventory.csv")
    inv.to_csv(out, index=False)

    print("=" * 96)
    print("DATA INVENTORY + RIG-STATE GATING  (STEP 1 + STEP 2)")
    print("=" * 96)
    for _, r in inv.iterrows():
        print(f"\n{r.dataset:22s} {r.well}")
        print(f"   {r.file}")
        print(f"   {r.n_rows:6d} rows  {r.index_start} -> {r.index_end}  ({r.sampling})")
        extra = (f"  (excl. {r.gap_bridged_hours_excluded} h gap-bridged)"
                 if r.gap_bridged_hours_excluded else "")
        print(f"   duty cycle {r.duty_cycle:6.1%}   "
              f"[circulating {r.duty_circulating:6.1%} | making-hole {r.duty_making_hole:6.1%}"
              f" | rotating {r.duty_rotating:6.1%}]   "
              f"gated drilling ≈ {r.reconstructed_drilling_hours} h{extra}")
        if r.gate_selftest != "n/a":
            print(f"   self-test: {r.gate_selftest}")

    tot = inv.groupby("dataset")[["reconstructed_drilling_hours",
                                  "gap_bridged_hours_excluded"]].sum()
    print("\nGATED DRILLING HOURS BY DATASET:")
    for ds, r in tot.iterrows():
        print(f"   {ds:24s} {r.reconstructed_drilling_hours:7.1f} h"
              f"   (+{r.gap_bridged_hours_excluded:.1f} h excluded as gap-bridged)")
    print(f"\n{len(inv)} files inventoried")
    print(f"wrote {os.path.relpath(out, REPO)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
