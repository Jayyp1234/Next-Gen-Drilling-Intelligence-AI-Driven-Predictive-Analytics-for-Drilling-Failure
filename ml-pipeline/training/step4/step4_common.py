"""
Shared infrastructure for the STEP 4 three-model ensemble.

Design constraints inherited from step7_model_physics_alignment.md, enforced
here so no individual model file can quietly violate them:

  * Splits are BY WELL (USROP/Bilabri) or BY RUN/time block (Eos) — never
    random row shuffles (adjacent samples are near-duplicates).
  * Scores are calibrated to [0,1] against the TRAINING-normal distribution
    only (empirical CDF) — no test-set statistics leak into the calibration.
  * Label provenance is a first-class field: every label array carries its
    source tier (documented / instrument / physics_consistency / weak) so the
    evaluation layer can refuse to score a model against its own label rule.

Window lengths are justified from mechanism development timescales (tau_dev),
not from the draft's 60-sample convention. Sources, precisely:

    bit wear     "hours"          step1_leadtime_feasibility.csv row 2
                 -> 60 bins x 1 m ~ 2-4 h (USROP, 1-m re-binned so a window
                    spans hours, not the ~2 minutes 60 raw rows would)
    stuck pipe   10 min-3 h       the PACK-OFF / hole-cleaning row (csv row 3)
                 -> 30 rows x 1 m ~ 0.7-1.5 h (Bilabri). NB mechanical
                    sticking itself is classed RISK-STATE, 2 min-1 h, with
                    ZERO predicted lead channels — so any measured lead on the
                    Bilabri anchors is a STEP 5b falsification-test outcome
                    (a found precursor where none was predicted), never an
                    assumed-lead detection claim.
    stick-slip   "minutes"        brief STEP 5b table (the csv has no
                 -> 30 x 10 s = 5 min (Eos)   stick-slip row)
"""

import json
import os

import numpy as np
import pandas as pd

REPO = os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))
FEAT = os.path.join(REPO, "ml-pipeline", "data", "features")
ART = os.path.join(REPO, "ml-pipeline", "artifacts")

WINDOW = {"eos": 30, "bilabri": 30, "usrop": 60}

LABEL_TIERS = ("documented", "instrument", "physics_consistency", "weak")


# ------------------------------------------------------------- loading ----
def load_eos():
    """All Eos runs, chronological file order preserved by name sort; each df
    carries `gate` and the raw channels + stick_slip_index + ecd_gcm3."""
    d = os.path.join(FEAT, "eos")
    return {os.path.basename(p).replace(".csv", ""): pd.read_csv(os.path.join(d, p))
            for p in sorted(os.listdir(d)) if p.endswith(".csv")}


def load_bilabri():
    d = os.path.join(FEAT, "bilabri")
    out = {}
    for p in sorted(os.listdir(d)):
        if not p.endswith(".csv"):
            continue
        df = pd.read_csv(os.path.join(d, p))
        # Ratio features the anchors analysis established as the hole-drag
        # signature; computed here (not stored by STEP 3).
        df["torque_wob"] = df["torque"] / df["wob"].replace(0, np.nan)
        df["spp_gpm"] = df["spp"] / df["gpm"].replace(0, np.nan)
        out[p.replace(".csv", "")] = df
    return out


def load_usrop(bin_m=1.0):
    """USROP re-binned to 1 m so a 60-step window spans hours (bit-wear tau),
    not minutes. Median-aggregated per bin; bin depth = bin centre."""
    d = os.path.join(FEAT, "usrop")
    out = {}
    for p in sorted(os.listdir(d)):
        if not p.endswith(".csv"):
            continue
        df = pd.read_csv(os.path.join(d, p))
        md = df["Measured Depth m"]
        df["_bin"] = (md // bin_m).astype(int)
        agg = df.groupby("_bin").median(numeric_only=True).reset_index(drop=True)
        out[p.replace(".csv", "")] = agg
    return out


# ------------------------------------------------------------- windows ----
def sliding_windows(arr2d, win, valid_mask=None, min_valid_frac=1.0,
                    hard_mask=None):
    """(n, f) -> (m, win, f) windows ending at each index i >= win-1, plus the
    array of end indices.

    Two mask semantics, deliberately separate:
      hard_mask   must hold on EVERY row (like finiteness). Use for
                  conditions where a single violating row poisons the window —
                  e.g. "normal" training selection: one event-severity row
                  inside an LSTM 'normal' window teaches the model the event.
      valid_mask  soft, controlled by min_valid_frac: a window qualifies when
                  at least that fraction of rows are valid. Use for the
                  rig-state gate, which flickers row-to-row with making-hole
                  noise at telemetry cadence — a 100% requirement shatters
                  every 5-minute sequence into sub-window fragments.
    """
    n = len(arr2d)
    finite = np.isfinite(arr2d).all(axis=1)
    if hard_mask is not None:
        finite = finite & np.asarray(hard_mask, dtype=bool)
    finite = finite.astype(int)
    # run length of consecutive finite rows ending at i
    finite_run = np.zeros(n, dtype=int)
    for i in range(n):
        finite_run[i] = finite_run[i - 1] + 1 if finite[i] and i else finite[i]
    if valid_mask is None:
        valid_frac = np.ones(n)
    else:
        v = np.asarray(valid_mask, dtype=float)
        c = np.concatenate([[0.0], np.cumsum(v)])
        valid_frac = np.full(n, np.nan)
        valid_frac[win - 1:] = (c[win:] - c[:-win]) / win
    ends = np.flatnonzero((finite_run >= win)
                          & (np.nan_to_num(valid_frac) >= min_valid_frac))
    ends = ends[ends >= win - 1]
    if not len(ends):
        return np.empty((0, win, arr2d.shape[1])), np.array([], dtype=int)
    wins = np.stack([arr2d[i - win + 1:i + 1] for i in ends])
    return wins, ends


def grouped_train_windows(group_dfs, feats, scaler, win, mask_fn,
                          min_valid_frac=1.0, hard_mask_fn=None):
    """Training windows built PER GROUP (well/run) so no window ever straddles
    a group boundary — sliding over a concatenated frame would stitch the end
    of one well onto the start of the next and train the LSTM on physically
    impossible sequences. mask_fn(df) -> boolean row mask of eligible rows.
    """
    packs = []
    for df in group_dfs:
        if any(f not in df.columns for f in feats):
            continue
        rows = df[feats].to_numpy(dtype=float)
        mask = np.asarray(mask_fn(df), dtype=bool)
        hard = np.asarray(hard_mask_fn(df), dtype=bool) \
            if hard_mask_fn is not None else None
        w, _ = sliding_windows(scaler(rows), win, valid_mask=mask,
                               min_valid_frac=min_valid_frac, hard_mask=hard)
        if len(w):
            packs.append(w)
    if not packs:
        return np.empty((0, win, len(feats)))
    return np.vstack(packs)


# --------------------------------------------------------- calibration ----
class NormalCalibrator:
    """Map raw anomaly scores to [0,1] via the empirical CDF of TRAINING-normal
    scores. S=0.5 means 'median normal'; S->1 means 'beyond everything normal
    seen in training'. Fitted on training data only, ever."""

    def __init__(self, train_scores):
        s = np.asarray(train_scores, dtype=float)
        self.ref = np.sort(s[np.isfinite(s)])

    def __call__(self, scores):
        s = np.asarray(scores, dtype=float)
        out = np.full(s.shape, np.nan)
        m = np.isfinite(s)
        if len(self.ref):
            out[m] = np.searchsorted(self.ref, s[m], side="right") / len(self.ref)
        return out


# ------------------------------------------------------------- logging ----
def write_log(name, payload):
    os.makedirs(ART, exist_ok=True)
    path = os.path.join(ART, f"step4_log_{name}.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, default=str)
    return path
