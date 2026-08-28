"""
DrillGuard — Risk Engine: turns the validated anomaly model into the three
product features promised in the Stage 1 proposal, on REAL Bilabri data:

  1. A calibrated 0-100 RISK SCORE (one number the crew watches).
  2. A PLAIN-LANGUAGE ALERT layer (why risk is rising + what to do).
  3. An EMISSIONS-AVOIDED model (diesel litres + CO2 tonnes per prevented event).

The risk score is measured from the model; the emissions figures are an explicit,
transparent engineering ESTIMATE (assumptions stated), clearly not a measurement.

Run:
    .venv/bin/python ml-pipeline/training/baseline/risk_engine.py
"""
import importlib.util
import json
from pathlib import Path

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

HERE = Path(__file__).resolve()
REPO = HERE.parents[3]

# Reuse the validated data loaders / features from train_baseline.py (hyphenated dir).
spec = importlib.util.spec_from_file_location("train_baseline", HERE.parent / "train_baseline.py")
tb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tb)

ART = REPO / "ml-pipeline" / "artifacts"
PIDEC = Path("/Users/heisienberg/Developer/PIDEC/stage2")

AFEATS = ["wob", "rpm", "torque", "spp", "gpm", "rop", "torque_wob", "mse", "torque_rstd"]
TEST_WELL = "BILABRI-D4"

# --- Emissions model assumptions (from the Stage 1 proposal; stated transparently) ---
DIESEL_LPD_LOW, DIESEL_LPD_HIGH = 8_000, 15_000   # litres/day burned by an idle rig in NPT
NPT_DAYS_LOW, NPT_DAYS_HIGH = 3, 7                 # days lost to a stuck-pipe event
CO2_KG_PER_L_DIESEL = 2.68                         # standard diesel combustion factor


def load_all():
    frames = []
    for name, path in tb.WELL_FILES.items():
        if path.exists():
            frames.append(tb.add_physics_features(tb.load_well(name, path)))
    import pandas as pd
    return pd.concat(frames, ignore_index=True)


def risk_from_scores(train_scores, test_scores):
    """Map IsolationForest decision_function to 0-100 risk, calibrated on TRAIN only.
    Low decision_function = anomalous = high risk. risk = % of normal training data
    that looks at least this normal."""
    s = np.sort(train_scores)
    n = len(s)
    idx = np.searchsorted(s, test_scores, side="left")   # how many train scores < test
    return 100.0 * (n - idx) / n                          # fraction of train >= test, as %


def plain_language(row, ref):
    """Build a crew-facing recommendation from which features are elevated vs normal."""
    drivers, why = [], []
    if row["torque_wob"] > ref["torque_wob"] * 1.5:
        drivers.append("friction (torque/WOB)")
        why.append("string is dragging — possible pack-off / differential sticking")
    if row["mse"] > ref["mse"] * 1.3:
        drivers.append("mechanical specific energy")
        why.append("more energy per metre — inefficient/dysfunctional drilling")
    if row["rop"] < ref["rop"] * 0.8:
        drivers.append("low ROP")
        why.append("penetration falling despite effort")
    if row.get("spp_rstd", 0) > ref.get("spp_rstd", 1e9):
        drivers.append("unstable standpipe pressure")
        why.append("hole-cleaning / pack-off signature")
    if not drivers:
        drivers, why = ["multivariate drift"], ["combined parameters drifting from normal"]
    rec = ("Reduce WOB, work/ream the pipe and circulate bottoms-up; verify hole cleaning "
           "before continuing." if "friction (torque/WOB)" in drivers
           else "Slow drilling parameters and verify cuttings return / hole condition.")
    return ", ".join(drivers), "; ".join(why), rec


def severity(risk):
    return "CRITICAL" if risk >= 90 else "HIGH" if risk >= 80 else "ELEVATED"


def emissions(days, lpd):
    litres = days * lpd
    return litres, litres * CO2_KG_PER_L_DIESEL / 1000.0   # litres, tonnes CO2


def main():
    import pandas as pd
    data = load_all()
    ad = data.dropna(subset=AFEATS).copy()
    tr = ad[ad.well != TEST_WELL]
    te = ad[ad.well == TEST_WELL].copy()

    sc = StandardScaler().fit(tr[AFEATS])
    iso = IsolationForest(n_estimators=300, contamination=0.03, random_state=42, n_jobs=-1)
    iso.fit(sc.transform(tr[AFEATS]))

    tr_scores = iso.decision_function(sc.transform(tr[AFEATS]))
    te["risk"] = risk_from_scores(tr_scores, iso.decision_function(sc.transform(te[AFEATS])))
    te["alert"] = iso.predict(sc.transform(te[AFEATS])) == -1

    ref = {c: float(te.loc[~te.alert, c].median()) for c in
           ["torque_wob", "mse", "rop"]}
    ref["spp_rstd"] = float(te["spp_rstd"].median()) if "spp_rstd" in te else 1e9

    tb.banner("DrillGuard RISK ENGINE — unseen well " + TEST_WELL)
    print(f"Risk score range: {te.risk.min():.0f}-{te.risk.max():.0f}  "
          f"(mean {te.risk.mean():.1f}); {int(te.alert.sum())} alerts fired.\n")

    alerts = te[te.alert].sort_values("risk", ascending=False).head(8)
    print("TOP PLAIN-LANGUAGE ALERTS (real model output on a well it never trained on):")
    rows_md = ["| Depth (m) | Risk | Severity | Why | Recommended action |",
               "|---|---|---|---|---|"]
    for _, r in alerts.iterrows():
        drv, why, rec = plain_language(r, ref)
        print(f"  [{severity(r.risk)}] {r.depth:.0f} m  risk={r.risk:.0f}/100  -> {drv}")
        print(f"      why: {why}\n      action: {rec}")
        rows_md.append(f"| {r.depth:.0f} | {r.risk:.0f}/100 | {severity(r.risk)} "
                       f"| {why} | {rec} |")

    # --- Emissions-avoided model (transparent estimate) ---
    tb.banner("EMISSIONS-AVOIDED MODEL (per prevented stuck-pipe event)")
    lo_l, lo_t = emissions(NPT_DAYS_LOW, DIESEL_LPD_LOW)
    hi_l, hi_t = emissions(NPT_DAYS_HIGH, DIESEL_LPD_HIGH)
    mid_l, mid_t = emissions(5, 11_500)
    print(f"  Assumptions: {NPT_DAYS_LOW}-{NPT_DAYS_HIGH} NPT days, "
          f"{DIESEL_LPD_LOW:,}-{DIESEL_LPD_HIGH:,} L/day diesel, "
          f"{CO2_KG_PER_L_DIESEL} kg CO2/L.")
    print(f"  Per prevented event: {lo_l:,.0f}-{hi_l:,.0f} L diesel  ->  "
          f"{lo_t:.0f}-{hi_t:.0f} tonnes CO2 avoided.")
    print(f"  Midpoint (5 days, 11,500 L/day): {mid_l:,.0f} L  ->  {mid_t:.0f} t CO2.")

    # --- Risk replay figure (watch the score climb into the flagged zones) ---
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        d = te.sort_values("depth")
        fig, ax = plt.subplots(figsize=(9, 4.2))
        ax.plot(d["depth"], d["risk"], lw=0.7, color="#2563eb", label="DrillGuard risk score")
        ax.axhline(80, color="#dc2626", ls="--", lw=1, label="alert threshold")
        al = d[d.alert]
        ax.scatter(al["depth"], al["risk"], s=28, color="#dc2626", zorder=5, label="alert fired")
        ax.set_xlabel("Measured depth (m)"); ax.set_ylabel("Risk score (0-100)")
        ax.set_ylim(0, 105)
        ax.set_title(f"DrillGuard risk score along unseen well {TEST_WELL} — "
                     "rising into drilling-dysfunction zones", fontsize=11)
        ax.legend(loc="upper left", fontsize=8)
        fig.tight_layout(); fig.savefig(ART / "fig4_risk_replay.png", dpi=140)
        plt.close(fig)
        print(f"\nSaved replay figure -> {ART / 'fig4_risk_replay.png'}")
    except Exception as e:
        print(f"(replay figure skipped: {e})")

    # --- Persist alerts + emissions for the submission ---
    PIDEC.mkdir(parents=True, exist_ok=True)
    (PIDEC / "alerts_sample.md").write_text(
        "# DrillGuard — sample plain-language alerts (real model output, unseen well "
        f"{TEST_WELL})\n\n" + "\n".join(rows_md) + "\n")
    (ART / "risk_engine_output.json").write_text(json.dumps({
        "test_well": TEST_WELL, "n_alerts": int(te.alert.sum()),
        "risk_mean": float(te.risk.mean()),
        "emissions_per_event": {"diesel_l_low": lo_l, "diesel_l_high": hi_l,
                                 "co2_t_low": lo_t, "co2_t_high": hi_t,
                                 "co2_t_mid": mid_t},
        "assumptions": {"npt_days": [NPT_DAYS_LOW, NPT_DAYS_HIGH],
                        "diesel_lpd": [DIESEL_LPD_LOW, DIESEL_LPD_HIGH],
                        "co2_kg_per_l": CO2_KG_PER_L_DIESEL},
    }, indent=2))
    print(f"Saved alerts -> {PIDEC / 'alerts_sample.md'}")


if __name__ == "__main__":
    main()
