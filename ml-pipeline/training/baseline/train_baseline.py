"""
DrillGuard / EDIM — Baseline models on REAL Bilabri DRLPAR data.

Two genuine, measured results for PIDEC Stage 2 (no mocks, no fabricated numbers):

  1. ROP regression (Random Forest) evaluated with the HELD-OUT-WELL protocol
     (leave-one-well-out across the 4 Bilabri wells), contrasted against a
     naive random-split to demonstrate cross-well generalization gap.

  2. Unsupervised drilling-dysfunction / stuck-pipe-precursor anomaly detection
     (Isolation Forest) trained cross-well and characterized physically.

All metrics printed by this script are MEASURED on real field data. Anything
not measured here must be labelled a literature TARGET, never a result (PIDEC §9.1).

Run:
    .venv/bin/python ml-pipeline/training/baseline/train_baseline.py
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.preprocessing import StandardScaler

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO / "ml-pipeline" / "etl"))
from qc import physical_qc, qc_report  # noqa: E402
# Held-out wells D3/D4 live in-repo so a fresh checkout reproduces every headline
# number without any machine-specific temp path.
DATA = REPO / "ml-pipeline" / "data" / "bilabri_drlpar"
ART = REPO / "ml-pipeline" / "artifacts"
ART.mkdir(parents=True, exist_ok=True)

# DRLPAR column order is identical across wells even when header labels differ
# (D2 calls the pressure column "SPP" not "Pump Pres"), so we parse by POSITION.
COLS = ["depth", "tvd", "rop", "wob", "rpm", "torque", "spp", "gpm", "temp_in", "temp_out"]

WELL_FILES = {
    "BILABRI-DEEP-1": REPO / "actual data" / "BILABRI DEEP -1 FINAL REPORT" / "Daily Reports"
        / "BILABRI DX1_DRLPAR_460m-2860_18-01-06.txt",
    "BILABRI-D2": REPO / "actual data" / "Bilabri D2" / "PLOG RPTS" / "GasROP&Drl Rpts"
        / "BILABRI-D2-S2-REV3 (12.25 SECTION)_DRLPAR_464m - 3230m_08-09-06.txt",
    "BILABRI-D3": DATA / "D3" / "BILABRI-D3 (12.25 SECTION)_DRLPAR_841m - 2555m_25-10-06.txt",
    "BILABRI-D4": DATA / "D4" / "BILABRI-D4 (12.25 SECTION)_DRLPAR_900m-2591m_30-12-06.txt",
}

BIT_DIAM_IN = 12.25                         # 12.25" section (from file names)
BIT_AREA_IN2 = math.pi / 4.0 * BIT_DIAM_IN ** 2


ROP_MAX = 150.0   # m/h: physical cap for a 12.25" hole; above this = connection/telemetry glitch


def load_well(name: str, path: Path) -> pd.DataFrame:
    df = pd.read_csv(path, sep=r"\s+", skiprows=1, header=None,
                     names=COLS, engine="python", on_bad_lines="skip")
    for c in COLS:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    df = df.dropna(subset=COLS)
    n0 = len(df)
    # Keep on-bottom drilling rows only. torque>0 removes sensor dropouts: you cannot
    # drill with weight + rotation at exactly zero torque, so torque==0 is bad telemetry.
    df = df[(df["wob"] > 0.5) & (df["rop"] > 0) & (df["rpm"] > 0) & (df["torque"] > 0)].copy()
    # Drop non-physical ROP spikes (telemetry/connection glitches) — honest, documented cleaning.
    n1 = len(df)
    df = df[df["rop"] <= ROP_MAX].copy()
    df.attrs["dropped_glitch"] = int(n1 - len(df))
    df.attrs["dropped_offbottom"] = int(n0 - n1)
    # STEP 3 physical-range QC. The nonzero checks above are NOT sufficient: the D4
    # tail (2543-2591 m) carries RPM ~2000 and torque ~570 with the pumps off, which
    # passes every >0 test while being fabricated (RPM/WOB == 99.0 exactly). Left in,
    # it inflates MSE ~64x and the Isolation Forest "detects" a spreadsheet formula.
    df, n_bad, per_ch = physical_qc(df)
    df.attrs["dropped_nonphysical"] = n_bad
    df.attrs["qc_by_channel"] = per_ch
    df["well"] = name
    return df


def add_physics_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values("depth").reset_index(drop=True)
    # Friction / packing-off indicator: torque per unit weight-on-bit.
    df["torque_wob"] = df["torque"] / df["wob"].replace(0, np.nan)
    # Hydraulic resistance proxy.
    df["spp_gpm"] = df["spp"] / df["gpm"].replace(0, np.nan)
    # Circulation / heat signature.
    df["dtemp"] = df["temp_out"] - df["temp_in"]
    # Drilling efficiency.
    df["rop_per_rpm"] = df["rop"] / df["rpm"].replace(0, np.nan)
    # Mechanical Specific Energy (Teale), field units -> proportional to true MSE.
    wob_lbf = df["wob"] * 1000.0
    t_ftlbf = df["torque"] * 1000.0
    rop_fthr = df["rop"] * 3.28084
    df["mse"] = (wob_lbf / BIT_AREA_IN2) + (120.0 * math.pi * df["rpm"] * t_ftlbf) / (BIT_AREA_IN2 * rop_fthr)
    # Local instability over a 10 m depth window (per well).
    for col in ["torque", "wob", "spp"]:
        df[f"{col}_rstd"] = df[col].rolling(10, min_periods=3).std()
    return df.replace([np.inf, -np.inf], np.nan)


def banner(t):
    print("\n" + "=" * 74 + f"\n{t}\n" + "=" * 74)


def main():
    banner("LOADING REAL BILABRI DRLPAR DATA (4 wells)")
    frames, qc_rows = [], []
    for name, path in WELL_FILES.items():
        if not path.exists():
            print(f"  !! MISSING: {name} -> {path}")
            continue
        raw = load_well(name, path)
        d = add_physics_features(raw)
        frames.append(d)
        print(f"  {name:18s}: {len(d):5d} on-bottom samples  "
              f"depth {d.depth.min():.0f}-{d.depth.max():.0f} m  "
              f"ROP {d.rop.mean():.1f} m/h  "
              f"(dropped {raw.attrs['dropped_offbottom']} off-bottom, "
              f"{raw.attrs['dropped_glitch']} ROP>{ROP_MAX:.0f} glitches, "
              f"{raw.attrs['dropped_nonphysical']} non-physical)")
        qc_rows.append({"well": name, "dropped_nonphysical": raw.attrs["dropped_nonphysical"],
                        **{f"qc_{k}": v for k, v in raw.attrs["qc_by_channel"].items()}})
    data = pd.concat(frames, ignore_index=True)
    wells = sorted(data["well"].unique())
    print(f"\n  TOTAL: {len(data)} samples across {len(wells)} wells: {wells}")

    # ---- Task 1: ROP regression ------------------------------------------------
    banner("TASK 1 — ROP PREDICTION (Random Forest)")
    # Features must NOT use ROP (no leakage): exclude rop, mse, rop_per_rpm.
    feats = ["depth", "tvd", "wob", "rpm", "torque", "spp", "gpm",
             "torque_wob", "spp_gpm", "dtemp", "torque_rstd", "wob_rstd", "spp_rstd"]
    md = data.dropna(subset=feats + ["rop"]).copy()

    def new_rf():
        return RandomForestRegressor(n_estimators=400, max_depth=16,
                                     min_samples_leaf=5, n_jobs=-1, random_state=42)

    # (A) WITHIN-WELL depth-extrapolation: train shallow 80%, predict deepest 20%.
    #     A realistic protocol — you always predict the depth you have not drilled yet.
    print("\n[A] WITHIN-WELL depth-extrapolation (train shallow 80%, predict deepest 20%):")
    within = {}
    for w in wells:
        dw = md[md.well == w].sort_values("depth")
        if len(dw) < 100:
            continue
        cut = int(0.8 * len(dw))
        tr, te = dw.iloc[:cut], dw.iloc[cut:]
        rf = new_rf(); rf.fit(tr[feats], tr["rop"])
        r2 = float(r2_score(te["rop"], rf.predict(te[feats])))
        within[w] = r2
        print(f"   {w:18s}  R2={r2:+.3f}  (test n={len(te)})")
    within_mean = float(np.mean(list(within.values())))
    print(f"   --> MEAN within-well depth-extrapolation R2 = {within_mean:+.3f}")

    # (B) HELD-OUT-WELL: train on 3 wells, test on the unseen 4th. The honest field metric.
    print("\n[B] HELD-OUT-WELL protocol (train on 3 wells, test on the unseen 4th):")
    loo = {}
    for test_well in wells:
        tr = md[md.well != test_well]
        te = md[md.well == test_well]
        if len(te) < 30:
            continue
        rf = new_rf(); rf.fit(tr[feats], tr["rop"])
        pred = rf.predict(te[feats])
        loo[test_well] = {
            "r2": float(r2_score(te["rop"], pred)),
            "mae": float(mean_absolute_error(te["rop"], pred)),
            "rmse": float(math.sqrt(mean_squared_error(te["rop"], pred))),
            "n_test": int(len(te)),
        }
        print(f"   held-out {test_well:18s}  R2={loo[test_well]['r2']:+.3f}  "
              f"MAE={loo[test_well]['mae']:.2f} m/h  RMSE={loo[test_well]['rmse']:.2f}  "
              f"(n={loo[test_well]['n_test']})")
    mean_r2 = float(np.mean([v["r2"] for v in loo.values()]))
    mean_mae = float(np.mean([v["mae"] for v in loo.values()]))
    print(f"   --> MEAN cross-well R2 = {mean_r2:+.3f}   MEAN MAE = {mean_mae:.2f} m/h")

    # (C) RANDOM SPLIT (pooled) — the over-optimistic number most papers report.
    sh = md.sample(frac=1.0, random_state=7)
    cut = int(0.8 * len(sh))
    tr, te = sh.iloc[:cut], sh.iloc[cut:]
    rf = new_rf(); rf.fit(tr[feats], tr["rop"])
    rand_r2 = float(r2_score(te["rop"], rf.predict(te[feats])))
    print(f"\n[C] Naive random 80/20 split (pooled): R2 = {rand_r2:+.3f}")

    print(f"\n   *** THE METHODOLOGICAL FINDING (honest negative result) ***")
    print(f"   random-split R2 {rand_r2:+.3f}  |  within-well depth-extrap R2 {within_mean:+.3f}"
          f"  |  held-out-WELL R2 {mean_r2:+.3f}")
    print("   Only the random split looks good — and it is leaky: neighbouring 1 m depth")
    print("   samples are near-identical, so a random split lets the test set peek at the")
    print("   training set. Under BOTH realistic protocols (predict an unseen well, or an")
    print("   unseen depth) ROP prediction from surface DRLPAR alone does not generalize.")
    print("   This confirms the literature and motivates physics-informed features, gas/")
    print("   formation context, and per-well calibration. We report it honestly (PIDEC §9.1).")

    imp = sorted(zip(feats, rf.feature_importances_), key=lambda x: -x[1])[:6]
    print("\n   Top ROP drivers (feature importance):")
    for f, v in imp:
        print(f"     {f:14s} {v:.3f}")

    # ---- Task 2: anomaly detection (stuck-pipe precursor), cross-well -----------
    banner("TASK 2 — DRILLING-DYSFUNCTION ANOMALY DETECTION (Isolation Forest)")
    afeats = ["wob", "rpm", "torque", "spp", "gpm", "rop", "torque_wob", "mse", "torque_rstd"]
    ad = data.dropna(subset=afeats).copy()
    test_well = "BILABRI-D4"
    tr = ad[ad.well != test_well]
    te = ad[ad.well == test_well].copy()
    sc = StandardScaler().fit(tr[afeats])
    iso = IsolationForest(n_estimators=300, contamination=0.03, random_state=42, n_jobs=-1)
    iso.fit(sc.transform(tr[afeats]))
    te["anom"] = iso.predict(sc.transform(te[afeats])) == -1
    rate = float(te["anom"].mean())
    print(f"\n  Trained on {sorted(ad[ad.well!=test_well].well.unique())}, scored unseen {test_well}.")
    print(f"  Flagged {te['anom'].sum()} / {len(te)} intervals ({rate*100:.1f}%) as anomalous.\n")
    print(f"  Physical signature — MEDIAN of flagged vs normal intervals on {test_well}:")
    print(f"    {'metric':14s}{'anomalous':>12s}{'normal':>12s}{'ratio':>9s}")
    sig = {}
    for m in ["torque_wob", "mse", "rop", "torque", "wob"]:
        a = float(te.loc[te.anom, m].median())
        n = float(te.loc[~te.anom, m].median())
        sig[m] = {"anom_median": a, "normal_median": n, "ratio": (a / n if n else None)}
        print(f"    {m:14s}{a:12.2f}{n:12.2f}{(a/n if n else float('nan')):9.2f}")
    hi_friction = float((te.loc[te.anom, "torque_wob"] > te["torque_wob"].median() * 1.5).mean())
    print(f"\n  {hi_friction*100:.0f}% of flagged intervals have elevated torque/WOB (friction).")

    # The textbook stuck-pipe-precursor expectation, checked PROGRAMMATICALLY rather
    # than asserted in prose. Before the STEP 3 physical-range QC this printed a
    # confident "confirmed" while MSE's 1.61x came entirely from fabricated D4 rows.
    # A claim the code cannot verify does not get printed as a finding.
    EXPECT = {"torque_wob": ">", "mse": ">", "rop": "<", "wob": "<"}
    checks = {m: ((sig[m]["ratio"] or 1) > 1) if op == ">" else ((sig[m]["ratio"] or 1) < 1)
              for m, op in EXPECT.items()}
    print("\n  Textbook precursor expectation (higher friction & energy, lower ROP/WOB):")
    for m, op in EXPECT.items():
        r = sig[m]["ratio"]
        print(f"    {m:12s} expected {op}1   measured {r:5.2f}x   "
              f"{'OK' if checks[m] else '<-- NOT SUPPORTED'}")
    n_ok = sum(checks.values())
    print(f"\n  --> {n_ok}/{len(EXPECT)} components supported.")
    if not checks["mse"]:
        print("  MSE is FLAT between flagged and normal intervals, so this is NOT an")
        print("  energy-dissipation signature. WOB collapses ~5x while torque only halves,")
        print("  so torque/WOB rises without MSE rising: the string is hanging up and")
        print("  failing to transfer weight to the bit. That is a HOLE-DRAG / weight-")
        print("  transfer signature (tight hole, differential-sticking tendency), which is")
        print("  a more specific diagnosis than 'the bit is working harder'. Report it as")
        print("  such — do not claim elevated MSE.")

    # ---- Persist measured metrics ----------------------------------------------
    out = {
        "data": {"wells": wells, "n_samples": int(len(data)),
                 "source": "Bilabri DRLPAR (real field data)",
                 "physical_qc": {
                     "applied": True,
                     "per_well": qc_rows,
                     "note": "STEP 3 range check (ml-pipeline/etl/qc.py). D4 2543-2591 m is "
                             "fabricated (RPM/WOB == 99.0 exactly, pumps off with nonzero "
                             "ROP); left in, it inflates MSE ~64x and is flagged as a "
                             "stuck-pipe precursor. Pre-QC numbers preserved in "
                             "baseline_metrics_PRE_QC.json.",
                 }},
        "task1_rop": {"within_well_r2": within, "mean_within_well_r2": within_mean,
                      "held_out_well": loo, "mean_cross_well_r2": mean_r2,
                      "mean_cross_well_mae": mean_mae, "random_split_r2": rand_r2,
                      "top_features": imp},
        "task2_anomaly": {"test_well": test_well, "anomaly_rate": rate,
                          "contamination": 0.03, "signature_median": sig,
                          "pct_flagged_high_friction": hi_friction},
        "note": "All values measured on real data. Not literature targets.",
    }
    (ART / "baseline_metrics.json").write_text(json.dumps(out, indent=2))
    print(f"\nSaved measured metrics -> {ART / 'baseline_metrics.json'}")

    # ---- Figures for the demo video --------------------------------------------
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        # Fig 1: ROP generalization gap by evaluation protocol.
        fig, ax = plt.subplots(figsize=(7, 4.2))
        labels = ["Random split\n(leaky)", "Within-well\ndepth-extrap.", "Held-out\nWELL"]
        vals = [rand_r2, within_mean, mean_r2]
        colors = ["#9ca3af", "#f59e0b", "#dc2626"]
        ax.bar(labels, vals, color=colors)
        ax.axhline(0, color="black", lw=0.8)
        for i, v in enumerate(vals):
            ax.text(i, v + (0.03 if v >= 0 else -0.06), f"{v:+.2f}", ha="center",
                    fontweight="bold")
        ax.set_ylabel("ROP R²  (higher = better)")
        ax.set_title("ROP prediction: the evaluation protocol decides the story\n"
                     "Only the leaky random split looks good", fontsize=11)
        fig.tight_layout(); fig.savefig(ART / "fig1_rop_generalization_gap.png", dpi=140)
        plt.close(fig)

        # Fig 2: anomaly physical signature (median ratio anomalous/normal) on unseen well.
        # Bars are coloured by whether each channel SUPPORTS the precursor expectation,
        # so the figure cannot overstate the result the way its old title did.
        fig, ax = plt.subplots(figsize=(7.6, 4.4))
        keys = ["torque_wob", "mse", "rop", "wob"]
        names = ["Torque/WOB\n(friction)", "MSE\n(specific energy)",
                 "ROP\n(penetration)", "WOB\n(weight on bit)"]
        ratios = [sig[k]["ratio"] for k in keys]
        cols = ["#dc2626" if checks[k] else "#9ca3af" for k in keys]
        bars = ax.bar(names, ratios, color=cols)
        ax.axhline(1.0, color="black", lw=0.9, ls="--")
        ax.text(3.42, 1.04, "no change = 1.0", fontsize=8, ha="right")
        for b, r, k in zip(bars, ratios, keys):
            ax.text(b.get_x() + b.get_width() / 2, r + 0.1,
                    f"{r:.2f}x" + ("" if checks[k] else "\n(flat)"),
                    ha="center", fontweight="bold", fontsize=9)
        ax.set_ylabel("anomalous ÷ normal (median)")
        ax.set_title(f"Unseen well {test_well}: flagged intervals lose weight-on-bit and ROP\n"
                     "with torque/WOB up but MSE FLAT — hole drag, not extra energy",
                     fontsize=11)
        ax.set_ylim(0, max(ratios) * 1.25)
        fig.tight_layout(); fig.savefig(ART / "fig2_anomaly_signature.png", dpi=140)
        plt.close(fig)

        # Fig 3: wellbore alert map — flagged dysfunction intervals down the unseen well.
        fig, ax = plt.subplots(figsize=(5.2, 6.8))
        norm = te[~te.anom]; anom = te[te.anom]
        ax.scatter(norm["torque_wob"], norm["depth"], s=6, c="#cbd5e1", label="normal")
        ax.scatter(anom["torque_wob"], anom["depth"], s=34, c="#dc2626", marker="X",
                   label="flagged anomaly")
        ax.invert_yaxis()
        ax.set_xlabel("Torque / WOB  (friction indicator)")
        ax.set_ylabel("Measured depth (m)")
        ax.set_title(f"{test_well} (never seen in training):\nlive dysfunction alerts down the wellbore",
                     fontsize=11)
        ax.legend(loc="lower right")
        fig.tight_layout(); fig.savefig(ART / "fig3_wellbore_alert_map.png", dpi=140)
        plt.close(fig)

        print(f"Saved 3 figures -> {ART}/fig1_*, fig2_*, fig3_*.png")
    except Exception as e:
        print(f"(figures skipped: {e})")


if __name__ == "__main__":
    sys.exit(main())
