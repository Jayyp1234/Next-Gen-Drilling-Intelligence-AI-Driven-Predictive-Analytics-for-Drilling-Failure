"""
Physical-range quality control for DRLPAR channel data.

STEP 3 of the DrillGuard handoff brief: apply each channel's valid physical range
as a data-quality filter, and flag out-of-range values as SENSOR FAULTS, not
failures. Shared by the ETL and the training scripts so there is exactly one
definition of "physically possible".

This is not defensive boilerplate. The last 49 m of the Bilabri D4 file
(2543-2591 m, i.e. the run-up to a documented stuck-pipe event) carries
RPM 1485-2002 with SPP = GPM = temperatures = 0 while ROP still reads
11-35 m/hr. A drillstring does not turn at 2000 rpm, and you cannot drill with
the pumps off. RPM/WOB in those rows is EXACTLY 99.0 throughout -- a spreadsheet
formula, not a measurement.

Because MSE scales with RPM x torque, those rows produce a ~64x MSE spike that
reads exactly like a stuck-pipe precursor. Any model scoring D4 without this
filter will "detect" fabricated data.
"""

import pandas as pd

# (min, max) inclusive bounds per channel, in DRLPAR's own recorded units.
PHYSICAL_RANGES = {
    "rpm": (20.0, 250.0),        # surface rotary speed; >250 is not a drillstring
    "torque": (0.5, 60.0),       # kft-lbf
    "spp": (200.0, 6000.0),      # psi; 0 means pumps off => not drilling
    "gpm": (50.0, 1500.0),       # circulating rate
    "wob": (0.5, 60.0),          # klbf
    "rop": (0.1, 150.0),         # m/hr
}


def physical_bad_mask(df, ranges=None):
    """Boolean mask of rows violating any channel's valid physical range.

    Preferred for combining with other row masks — unlike index-membership
    tests against physical_qc's filtered frame, it cannot silently break if a
    caller ever resets or duplicates the index. Channels absent from the frame
    are skipped, so this is safe on partial column sets.
    """
    ranges = ranges or PHYSICAL_RANGES
    bad = pd.Series(False, index=df.index)
    for ch, (lo, hi) in ranges.items():
        if ch in df:
            bad |= (df[ch] < lo) | (df[ch] > hi)
    return bad


def physical_qc(df, ranges=None):
    """Drop rows violating any channel's valid physical range.

    Returns (clean_df, n_dropped, per_channel_counts). Channels absent from the
    frame are skipped, so this is safe to call on partial column sets.
    """
    ranges = ranges or PHYSICAL_RANGES
    bad = pd.Series(False, index=df.index)
    per_channel = {}
    for ch, (lo, hi) in ranges.items():
        if ch not in df:
            continue
        violated = (df[ch] < lo) | (df[ch] > hi)
        if violated.any():
            per_channel[ch] = int(violated.sum())
        bad |= violated
    return df[~bad].copy(), int(bad.sum()), per_channel


def qc_report(name, before_n, n_dropped, per_channel):
    """One-line human-readable summary, used by both callers."""
    detail = ", ".join(f"{k}:{v}" for k, v in sorted(per_channel.items())) or "none"
    pct = 100.0 * n_dropped / max(before_n, 1)
    return f"  {name:16s} dropped {n_dropped:4d}/{before_n:5d} ({pct:4.1f}%)  [{detail}]"
