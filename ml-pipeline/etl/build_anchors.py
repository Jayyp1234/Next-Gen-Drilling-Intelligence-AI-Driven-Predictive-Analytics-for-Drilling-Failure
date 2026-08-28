"""
Build the anchor table and pull channel windows around documented events.

Implements STEP 6 of the DrillGuard handoff brief, with one deliberate and
declared deviation from its schema:

    THE BRIEF ANCHORS IN TIME. THIS ANCHORS IN DEPTH.

Reason: the Bilabri GEOL reports state event depths exactly ("Casing stuck at
1529m", "Backreamed f/3229 to 3129m & hole packed off") but carry only 24-hour
date resolution, and DRLPAR is itself depth-indexed. Depth is therefore the
exact axis and time is the lossy one -- the reverse of the brief's assumption.
Lead time is reported primarily in METRES DRILLED, and converted to minutes only
with a stated ROP and an explicit uncertainty band (see lead_time_minutes()).

Outputs to ml-pipeline/artifacts/:
    events_anchors.csv       one row per anchor (STEP 6 schema + depth fields)
    anchor_windows/*.csv     channel data around each anchor
    fig5_anchor_signatures.png   do the precursors actually precede the events?

Run:
    .venv/bin/python ml-pipeline/etl/build_anchors.py
"""
import json
import math
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

REPO = Path(__file__).resolve().parents[2]
ART = REPO / "ml-pipeline" / "artifacts"
WIN = ART / "anchor_windows"

sys.path.insert(0, str(REPO / "ml-pipeline" / "training" / "baseline"))
from train_baseline import WELL_FILES, load_well, add_physics_features  # noqa: E402

# How much hole to pull either side of an anchor. 200 m before is roughly one to
# two days of drilling at Bilabri rates -- comfortably longer than any plausible
# precursor window, so the model is not handed a pre-trimmed problem.
LEAD_WINDOW_M = 200.0
TRAIL_WINDOW_M = 40.0

# Which side of the event depth holds the precursor evidence.
#   "above"  normal case: the bit drilled DOWN into the event, so the hole drilled
#            immediately shallower is what precedes it.
#   "below"  the string was tripping/backreaming UP when the event occurred, so the
#            evidence is in the DEEPER hole drilled before the string turned around.
# Getting this backwards silently searches an interval drilled AFTER the fact --
# it produced a spurious "no precursor" verdict for the D2 pack-off on first run.
PRECURSOR_ABOVE, PRECURSOR_BELOW = "above", "below"

# Valid physical ranges per channel (STEP 3 of the brief: out-of-range values are
# SENSOR FAULTS, not failures -- flag and drop them, never let them read as signal).
#
# This is not defensive boilerplate. The last 49 m of the D4 file (2543-2591 m,
# i.e. the run-up to a documented stuck-pipe event) carries RPM 1485-2002 with
# SPP = GPM = temperatures = 0. A string cannot turn at 2000 rpm, and it cannot
# drill with the pumps off. RPM/WOB in those rows is EXACTLY 99.0 throughout --
# a spreadsheet formula, not a measurement. Because MSE scales with RPM x torque,
# those rows produced a ~64x MSE spike that looked exactly like a stuck-pipe
# precursor. Without this filter the D4 anchor reports a spurious "strong
# precursor" that is pure fabrication.
PHYSICAL_RANGES = {
    "rpm": (20.0, 250.0),        # surface rotary; >250 is not a drillstring
    "torque": (0.5, 60.0),       # kft-lbf as recorded in DRLPAR
    "spp": (200.0, 6000.0),      # psi; 0 means pumps off => not drilling
    "gpm": (50.0, 1500.0),       # circulating rate
    "wob": (0.5, 60.0),          # klbf
    "rop": (0.1, 150.0),         # m/hr; cap matches train_baseline.ROP_MAX
}


def physical_qc(df):
    """Drop rows violating any channel's valid physical range.

    Returns (clean_df, n_dropped, per_channel_counts).
    """
    bad = pd.Series(False, index=df.index)
    per_channel = {}
    for ch, (lo, hi) in PHYSICAL_RANGES.items():
        if ch not in df:
            continue
        v = (df[ch] < lo) | (df[ch] > hi)
        if v.any():
            per_channel[ch] = int(v.sum())
        bad |= v
    return df[~bad].copy(), int(bad.sum()), per_channel

# Adjudicated anchors. Curated from ml-pipeline/artifacts/event_inventory.md by
# reading the verbatim quotes; only events whose depth is stated in the report
# AND falls inside DRLPAR coverage are included. `quote` is reproduced verbatim
# so the anchor can be audited back to its source without opening the .xls.
#
# adjudicated="pending" marks rows a petroleum engineer still needs to confirm.
ANCHORS = [
    dict(anchor_id="D2-STUCK-1659", well="BILABRI-D2", mechanism="stuck_pipe",
         event_depth_m=1659.0, date="2006-08-17", anchor_type="documented",
         precursor_side=PRECURSOR_ABOVE,
         source_file="BILABRI D2 AM GEOL RPT #16.xls",
         quote="Drilled directionally to 1659m, encountered fault with associated "
               "pipe stuck & sudden increase in torque (f/3-41 Amps).",
         note="Report states the torque signature itself (3->41 Amps).",
         adjudicated="confirmed"),
    dict(anchor_id="D2-PACKOFF-3129", well="BILABRI-D2", mechanism="pack_off",
         event_depth_m=3129.0, date="2006-09-08", anchor_type="documented",
         precursor_side=PRECURSOR_BELOW,
         source_file="BILABRI D2_ S2_REV3 AM GEOL RPT #36.xls",
         quote="Backreamed f/3229 to 3129m & hole packed off.",
         note="Packed off while backreaming UP from 3229 m to 3129 m. The precursor is "
              "the hole drilled BELOW 3129 m (cuttings loading during 3129->3229), "
              "not the hole above it.",
         adjudicated="confirmed"),
    dict(anchor_id="D4-STUCK-2591", well="BILABRI-D4", mechanism="stuck_pipe",
         event_depth_m=2591.0, date="2006-12-31", anchor_type="documented",
         precursor_side=PRECURSOR_ABOVE,
         source_file="BILABRI -D4 AM GEOL RPT (dec-31).xls",
         quote="Shut well in, stuck pipe.",
         note="Concurrent well-control situation; losses reached 984 bbls by 2007-01-11. "
              "2591 m is also the deepest sample in the D4 file, so the event sits at "
              "the very end of the record -- no post-event hole exists.",
         adjudicated="confirmed"),
    dict(anchor_id="D3-FISH-2541", well="BILABRI-D3", mechanism="twist_off_fishing",
         event_depth_m=2541.0, date="2006-10-27", anchor_type="documented",
         precursor_side=PRECURSOR_ABOVE,
         source_file="BILABRI_D3 AM GEOL RPT.xls",
         quote="Made up & run in hole fishing tool to top of fish at 2541m.",
         note="NO CHANNEL DATA. The D3 DRLPAR file is NAMED '841m - 2555m' but its rows "
              "stop at 2177 m -- the filename overstates coverage by 378 m. Do not trust "
              "DRLPAR filename depth ranges; read the rows.",
         adjudicated="pending"),
    dict(anchor_id="DEEP1-DIFFSTUCK-1529", well="BILABRI-DEEP-1",
         mechanism="differential_sticking",
         event_depth_m=1529.0, date="2005-12-20", anchor_type="documented",
         precursor_side=PRECURSOR_ABOVE,
         source_file="BILABRI DX1 AM GEOL RPT (dec-20).xls",
         quote="Casing stuck at 1529m.",
         note="CASING stuck, not drillpipe -- occurred while running casing, so the "
              "drilling channels describe hole condition BEFORE the run, not the "
              "sticking itself. Weaker anchor; treat with care.",
         adjudicated="pending"),
]


def lead_time_minutes(lead_m, rop_m_hr):
    """Convert a lead expressed in metres drilled to minutes at a stated ROP.

    Reported alongside the metre figure, never instead of it: at Bilabri's 1 m
    sampling the time axis is only as good as the ROP used to reconstruct it.
    """
    if not rop_m_hr or rop_m_hr <= 0 or lead_m is None:
        return None
    return 60.0 * lead_m / rop_m_hr


def zscore_vs_baseline(series, baseline_mask, clip=8.0):
    """Robust z-score against the quiet part of the window.

    Standardising against the window baseline rather than the whole well keeps
    the comparison local -- formation and BHA change down the hole, so a global
    mean would smear the very contrast being looked for.

    Uses median/MAD rather than mean/sd: MSE diverges as ROP -> 0, so a single
    near-zero-ROP sample otherwise dominates both the mean and the sd and
    flattens every real feature into a spike plus a baseline. Clipped for
    display only -- the ratios reported in the anchor table use medians on
    unclipped data.
    """
    base = series[baseline_mask].dropna()
    if len(base) < 3:
        return pd.Series(np.zeros(len(series)), index=series.index)
    med = base.median()
    mad = (base - med).abs().median() * 1.4826  # -> sd-equivalent for a normal
    if not np.isfinite(mad) or mad == 0:
        mad = base.std()
    if not np.isfinite(mad) or mad == 0:
        return pd.Series(np.zeros(len(series)), index=series.index)
    return ((series - med) / mad).clip(-clip, clip)


def main():
    WIN.mkdir(parents=True, exist_ok=True)

    wells, qc_log = {}, []
    print("PHYSICAL-RANGE QC (STEP 3: out-of-range = sensor fault, not failure)")
    print("-" * 78)
    for name, path in WELL_FILES.items():
        if not Path(path).exists():
            continue
        raw = load_well(name, Path(path))
        clean, n_bad, per_ch = physical_qc(raw)
        wells[name] = add_physics_features(clean)
        qc_log.append(dict(well=name, n_before=len(raw), n_dropped=n_bad,
                           pct_dropped=round(100 * n_bad / max(len(raw), 1), 2),
                           by_channel=per_ch))
        detail = ", ".join(f"{k}:{v}" for k, v in sorted(per_ch.items())) or "none"
        print(f"  {name:16s} dropped {n_bad:3d}/{len(raw):4d} "
              f"({100 * n_bad / max(len(raw), 1):4.1f}%)  [{detail}]")
    pd.DataFrame(qc_log).to_csv(ART / "physical_qc_log.csv", index=False)
    print()

    rows, windows = [], {}
    for a in ANCHORS:
        df = wells.get(a["well"])
        if df is None:
            print(f"  !! no channel data for {a['well']}, skipping {a['anchor_id']}")
            continue
        ed = a["event_depth_m"]
        below = a.get("precursor_side") == PRECURSOR_BELOW
        if below:
            lo, hi = ed - TRAIL_WINDOW_M, ed + LEAD_WINDOW_M
        else:
            lo, hi = ed - LEAD_WINDOW_M, ed + TRAIL_WINDOW_M
        w = df[(df.depth >= lo) & (df.depth <= hi)].copy()
        covered = len(w) > 0

        rec = dict(a)
        rec["n_samples_in_window"] = len(w)
        rec["window_lo_m"], rec["window_hi_m"] = lo, hi
        rec["channel_coverage"] = "yes" if covered else "NO DATA"

        if covered:
            rec["mean_rop_in_window_m_hr"] = round(float(w.rop.mean()), 2)
            # Approach interval = the 60 m of hole drilled immediately before the
            # event, on whichever side the precursor lives; baseline = the rest of
            # the window. The contrast between them is the question.
            if below:
                appr, base = w[w.depth <= ed + 60], w[w.depth > ed + 60]
                # Approach comes from BELOW, so the sample closest to the event is
                # the shallowest one at or deeper than it -- not the window edge.
                side = w.depth[w.depth >= ed]
                nearest = side.min() if len(side) else w.depth.min()
            else:
                appr, base = w[w.depth >= ed - 60], w[w.depth < ed - 60]
                side = w.depth[w.depth <= ed]
                nearest = side.max() if len(side) else w.depth.max()
            # How far short of the event the last VALID sample falls, and how much
            # data the approach ratios actually rest on. A large gap means the
            # sensor record stops before the event -- the ratios then describe the
            # run-up, not the onset, and must not be read as detection performance.
            rec["nearest_valid_sample_m"] = round(float(nearest), 1)
            rec["gap_to_event_m"] = round(abs(float(ed - nearest)), 1)
            rec["n_approach_samples"] = int(len(appr))
            for ch in ("torque", "torque_wob", "mse", "spp", "wob", "rop"):
                if len(appr) and len(base) and base[ch].notna().any():
                    b, p = base[ch].median(), appr[ch].median()
                    rec[f"{ch}_baseline"] = round(float(b), 3)
                    rec[f"{ch}_approach"] = round(float(p), 3)
                    rec[f"{ch}_ratio"] = round(float(p / b), 3) if b else None
            windows[a["anchor_id"]] = w
            out = WIN / f"{a['anchor_id']}.csv"
            w.to_csv(out, index=False)
        rows.append(rec)

    anchors = pd.DataFrame(rows)
    anchors.to_csv(ART / "events_anchors.csv", index=False)

    # ---- report ----
    print("=" * 78)
    print("ANCHOR TABLE  (depth-anchored; see module docstring for why)")
    print("=" * 78)
    for _, r in anchors.iterrows():
        print(f"\n{r.anchor_id}  [{r.mechanism}]  {r.anchor_type}/{r.adjudicated}")
        print(f"   {r.well} @ {r.event_depth_m:.0f} m  ({r.date})   "
              f"window {r.window_lo_m:.0f}-{r.window_hi_m:.0f} m  "
              f"n={r.n_samples_in_window}  [{r.channel_coverage}]")
        if r.channel_coverage == "yes":
            bits = []
            for ch in ("torque", "torque_wob", "mse", "spp", "rop"):
                k = f"{ch}_ratio"
                if k in r and pd.notna(r.get(k)):
                    bits.append(f"{ch} x{r[k]:.2f}")
            print("   approach 60 m vs baseline:  " + " | ".join(bits))
            warn = "  <-- SENSOR RECORD STOPS SHORT" if r.gap_to_event_m > 15 else ""
            print(f"   last valid sample {r.nearest_valid_sample_m:.0f} m "
                  f"(gap {r.gap_to_event_m:.0f} m), approach n={r.n_approach_samples}{warn}")

    # ---- figure: does the precursor precede the event? ----
    plotted = [(a["anchor_id"], a) for a in ANCHORS if a["anchor_id"] in windows]
    if plotted:
        n = len(plotted)
        fig, axes = plt.subplots(n, 1, figsize=(11, 3.1 * n), sharex=False)
        axes = np.atleast_1d(axes)
        for ax, (aid, a) in zip(axes, plotted):
            w = windows[aid].sort_values("depth")
            ed = a["event_depth_m"]
            below = a.get("precursor_side") == PRECURSOR_BELOW
            base_mask = (w.depth > ed + 60) if below else (w.depth < ed - 60)
            for ch, lbl, col in (("torque_wob", "torque/WOB", "#c1440e"),
                                 ("mse", "MSE", "#1f77b4"),
                                 ("spp_gpm", "SPP/GPM", "#2ca02c")):
                if ch in w and w[ch].notna().any():
                    z = zscore_vs_baseline(w[ch], base_mask)
                    ax.plot(w.depth, z.rolling(7, min_periods=1).mean(),
                            label=lbl, color=col, lw=1.4)
            ax.axvline(ed, color="k", ls="--", lw=1.8)
            ax.annotate(f"documented event\n{ed:.0f} m", xy=(ed, ax.get_ylim()[1]),
                        xytext=(-6, -6), textcoords="offset points",
                        ha="right", va="top", fontsize=8)
            ax.axvspan(*((ed, ed + 60) if below else (ed - 60, ed)),
                       color="orange", alpha=0.12)
            ax.set_title(f"{aid} — {a['mechanism'].replace('_',' ')} "
                         f"({a['well']}, {a['date']})", fontsize=10)
            ax.set_ylabel("z vs baseline")
            ax.legend(fontsize=7, loc="upper left")
            ax.grid(alpha=0.25)
        axes[-1].set_xlabel("Measured depth (m)   ·   shaded = last 60 m before event")
        fig.suptitle("Do documented failures have a measurable precursor in the channels?",
                     fontsize=12, y=0.998)
        fig.tight_layout()
        fig.savefig(ART / "fig5_anchor_signatures.png", dpi=150)
        print(f"\nwrote {(ART / 'fig5_anchor_signatures.png').relative_to(REPO)}")

    print(f"wrote {(ART / 'events_anchors.csv').relative_to(REPO)}")
    print(f"wrote {len(windows)} window files -> {WIN.relative_to(REPO)}/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
