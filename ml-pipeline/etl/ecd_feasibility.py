"""
Can ECD be derived from USROP, and would it satisfy the pack-off MOS?

Arm C found ECD blocks 4 of 8 mechanisms, and that on USROP it is the ONLY
channel missing for pack-off. Physical Foundations §3 lists ECD as derived
feature #4 rather than a raw channel, so it is worth testing whether it can be
computed from what USROP carries.

    ECD = MW + dP_annulus / (0.052 * TVD_ft)          [ppg, field units]

This script answers three questions in order, and stops being useful if any of
them fails:

  Q1  Are the inputs present?
  Q2  If some are assumed, how much does ECD move across the plausible range of
      those assumptions, relative to the signal we would need to detect?
  Q3  Even if numerically stable, does a derived ECD carry INFORMATION that the
      surface channels do not already carry? A minimum observable set is about
      independent evidence -- re-encoding existing channels under a new name
      does not make a mechanism observable.

Annular friction uses the Bingham-plastic laminar form (standard for annular
flow in these geometries):

    dP/dL = PV*v / (1000*(D2-D1)^2)  +  YP / (200*(D2-D1))

with v in ft/min, diameters in inches, dP/dL in psi/ft. Cuttings loading is
added because that is precisely the pack-off-relevant term.

Run:
    .venv/bin/python ml-pipeline/etl/ecd_feasibility.py
"""

import glob
import itertools
import os

import numpy as np
import pandas as pd

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(REPO, "ml-pipeline", "data", "usrop")
ART = os.path.join(REPO, "ml-pipeline", "artifacts")

# Unit conversions
LPM_TO_GPM = 1.0 / 3.785412
MM_TO_IN = 1.0 / 25.4
M_TO_FT = 3.280840
SG_TO_PPG = 8.345404

# What ECD needs, and where USROP stands.
ECD_INPUTS = {
    "mud density":        ("Mud Density In g/cm3", "PRESENT"),
    "flow rate":          ("Mud Flow In L/min", "PRESENT"),
    "hole diameter":      ("Diameter mm", "PRESENT"),
    "TVD":                ("Hole Depth (TVD) m", "PRESENT"),
    "ROP (cuttings gen)": ("Rate of Penetration m/h", "PRESENT"),
    "drillpipe OD":       (None, "ABSENT — must be assumed"),
    "plastic viscosity":  (None, "ABSENT — must be assumed"),
    "yield point":        (None, "ABSENT — must be assumed"),
    "cuttings density":   (None, "ABSENT — assumed 2.6 sg (low sensitivity)"),
}

# Plausible ranges for the absent inputs. These are ordinary field values for
# North Sea WBM in 8.5"-17.5" hole, not extremes -- the point is that even a
# CONSERVATIVE assumption range dominates the answer.
DP_OD_IN = [5.0, 5.875]              # 5" and 5-7/8" drillpipe
PV_CP = [15.0, 25.0, 35.0]           # plastic viscosity
YP_LB100 = [8.0, 15.0, 25.0]         # yield point
CUTTINGS_SG = 2.6


def annular_ecd(df, dp_od_in, pv, yp, cuttings_sg=CUTTINGS_SG):
    """ECD in ppg under one set of assumptions."""
    d_hole = df["Diameter mm"].to_numpy() * MM_TO_IN
    q_gpm = df["Mud Flow In L/min"].to_numpy() * LPM_TO_GPM
    tvd_ft = df["Hole Depth (TVD) m"].to_numpy() * M_TO_FT
    mw_ppg = df["Mud Density In g/cm3"].to_numpy() * SG_TO_PPG
    rop_fthr = df["Rate of Penetration m/h"].to_numpy() * M_TO_FT

    gap = d_hole - dp_od_in                      # annular gap, inches
    area = d_hole ** 2 - dp_od_in ** 2           # in^2 (x pi/4 folded into 24.5)
    with np.errstate(divide="ignore", invalid="ignore"):
        v_ftmin = 24.5 * q_gpm / area            # annular velocity
        # Bingham laminar annular friction gradient, psi/ft
        grad = pv * v_ftmin / (1000.0 * gap ** 2) + yp / (200.0 * gap)
        dp_ann = grad * tvd_ft                   # psi

        # Cuttings loading: volumetric concentration in the annulus, then its
        # density contribution. This is the term pack-off actually perturbs.
        q_cuttings = rop_fthr * (np.pi / 4.0) * (d_hole / 12.0) ** 2 / 60.0  # ft^3/min
        q_mud = q_gpm / 7.48052                                             # ft^3/min
        conc = q_cuttings / np.maximum(q_mud + q_cuttings, 1e-9)
        ecd_cuttings = conc * (cuttings_sg * SG_TO_PPG - mw_ppg)

        ecd = mw_ppg + dp_ann / (0.052 * tvd_ft) + ecd_cuttings
    return ecd, mw_ppg, dp_ann / (0.052 * np.maximum(tvd_ft, 1e-9)), ecd_cuttings


def main():
    files = sorted(glob.glob(os.path.join(DATA, "USROP_A*.csv")))
    if not files:
        print("no USROP data found"); return 1
    df = pd.read_csv(files[2])  # F-14d, the largest well
    df = df[(df["Mud Flow In L/min"] > 100) & (df["Rate of Penetration m/h"] > 0)].copy()

    print("=" * 78)
    print("Q1 — ARE THE ECD INPUTS PRESENT IN USROP?")
    print("=" * 78)
    n_absent = 0
    for label, (col, status) in ECD_INPUTS.items():
        if status != "PRESENT":
            n_absent += 1
        print(f"  {label:20s} {status}")
    print(f"\n  --> {n_absent} of {len(ECD_INPUTS)} inputs are absent and must be assumed.")

    print("\n" + "=" * 78)
    print("Q2 — HOW MUCH DOES ECD MOVE ACROSS PLAUSIBLE ASSUMPTIONS?")
    print("=" * 78)
    grid, results = list(itertools.product(DP_OD_IN, PV_CP, YP_LB100)), {}
    for dp, pv, yp in grid:
        ecd, mw, fric, cut = annular_ecd(df, dp, pv, yp)
        results[(dp, pv, yp)] = ecd
    stack = np.vstack([results[k] for k in grid])

    _, mw_ppg, fric_ppg, cut_ppg = annular_ecd(df, DP_OD_IN[0], PV_CP[1], YP_LB100[1])
    ecd_mid = stack[len(grid) // 2]

    print(f"  mud weight (measured)          median {np.nanmedian(mw_ppg):7.3f} ppg")
    print(f"  ECD - MW  (what we'd compute)  median {np.nanmedian(ecd_mid - mw_ppg):7.3f} ppg")
    print(f"     of which annular friction   median {np.nanmedian(fric_ppg):7.3f} ppg")
    print(f"     of which cuttings loading   median {np.nanmedian(cut_ppg):7.3f} ppg")

    spread = np.nanmax(stack, axis=0) - np.nanmin(stack, axis=0)
    signal = ecd_mid - mw_ppg
    print(f"\n  SPREAD across the {len(grid)} assumption sets:")
    print(f"     median spread in ECD        {np.nanmedian(spread):7.3f} ppg")
    print(f"     median |signal| (ECD-MW)    {np.nanmedian(np.abs(signal)):7.3f} ppg")
    ratio = np.nanmedian(spread) / max(np.nanmedian(np.abs(signal)), 1e-9)
    print(f"     spread / signal             {ratio:7.2f}x")
    if ratio >= 1.0:
        print("     --> The assumption uncertainty EXCEEDS the entire quantity being")
        print("         computed. The derived ECD is a function of our guesses about")
        print("         PV, YP and pipe OD, not of the well.")

    print("\n" + "=" * 78)
    print("Q3 — WOULD A DERIVED ECD ADD INDEPENDENT INFORMATION?")
    print("=" * 78)
    print("  A minimum observable set is about INDEPENDENT evidence. ECD earns its")
    print("  place in the pack-off MOS because it responds to annular cuttings")
    print("  loading and hole restriction -- physics the surface channels do not")
    print("  separately observe. A derived ECD here is an explicit closed-form")
    print("  function of channels already held:")
    print("      ECD = f(mud density, flow rate, hole diameter, TVD, ROP)")
    print("           + assumed(PV, YP, pipe OD, cuttings density)")
    print("  and critically it uses NO measurement of the annulus itself. It cannot")
    print("  respond to a restriction it never observes.")

    # Demonstrate the re-encoding explicitly: fit the derived ECD from its own inputs.
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.metrics import r2_score
    feats = ["Mud Density In g/cm3", "Mud Flow In L/min", "Diameter mm",
             "Hole Depth (TVD) m", "Rate of Penetration m/h"]
    sub = df[feats].copy()
    y = ecd_mid
    ok = np.isfinite(y) & sub.notna().all(axis=1).to_numpy()
    sub, y = sub[ok], y[ok]

    # RANDOM split is the CORRECT tool for this specific question, and the
    # opposite of what train_baseline.py must use. There, a random split is
    # leaky and inflates generalization claims. Here the question is not "does
    # it generalize" but "is y a DETERMINISTIC FUNCTION of X" -- an
    # interpolation test. A sequential split answers the wrong question: the
    # deepest 30% of this well is a different hole section (8.5") than the
    # shallow 70% (17.5"/12.25"), so the model is asked to extrapolate to an
    # unseen diameter and scores R2 = -0.38, which says nothing about
    # determinism. Stated explicitly so the two splits are never conflated.
    rng = np.random.default_rng(0)
    idx = rng.permutation(len(sub))
    tr, te = idx[: int(0.7 * len(idx))], idx[int(0.7 * len(idx)):]
    rf = RandomForestRegressor(n_estimators=120, max_depth=12, n_jobs=-1, random_state=0)
    rf.fit(sub.iloc[tr], y[tr])
    r2 = r2_score(y[te], rf.predict(sub.iloc[te]))
    print(f"\n  Predicting the derived ECD from its own inputs: R2 = {r2:.4f}")
    if r2 > 0.95:
        print("  --> Essentially perfectly reproducible from channels already held.")
        print("      It is a RE-ENCODING, not a new observable. Adding it to the")
        print("      channel list would NOT satisfy the pack-off MOS.")

    print("\n" + "=" * 78)
    print("VERDICT")
    print("=" * 78)
    print("  ECD CANNOT be legitimately derived from USROP.")
    print("  - 4 of 9 inputs absent, including mud rheology (PV, YP), which is")
    print("    actively managed during drilling and cannot be inferred from density.")
    print(f"  - Assumption spread ({np.nanmedian(spread):.3f} ppg) is {ratio:.1f}x the whole")
    print("    computed ECD-MW signal.")
    print("  - Even held numerically stable, it is a closed-form function of existing")
    print("    channels and observes nothing about the annulus.")
    print("\n  PACK-OFF REMAINS UNOBSERVABLE on every dataset we hold. Report it as a")
    print("  declared blind spot (STEP 7), not as a modelling shortfall.")
    print("\n  To unlock pack-off, the DATA REQUEST is specific and small:")
    print("    1. a measured downhole ECD / annular pressure (PWD) channel   <-- best")
    print("    2. or: mud rheology (PV, YP) + drillstring geometry, to compute it")
    print("  Either turns pack-off from unobservable to observable on USROP, which")
    print("  already has the other two MOS channels (SPP, torque).")

    out = os.path.join(ART, "ecd_feasibility.txt")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write("ECD derivation feasibility on USROP — VERDICT: NOT DERIVABLE\n\n")
        fh.write(f"absent inputs: {n_absent}/{len(ECD_INPUTS)} "
                 "(drillpipe OD, plastic viscosity, yield point, cuttings density)\n")
        fh.write(f"median ECD-MW signal      : {np.nanmedian(np.abs(signal)):.4f} ppg\n")
        fh.write(f"median assumption spread  : {np.nanmedian(spread):.4f} ppg\n")
        fh.write(f"spread/signal             : {ratio:.2f}x\n")
        fh.write(f"derived-ECD predictable from own inputs: R2={r2:.4f}\n\n")
        fh.write("Pack-off remains UNOBSERVABLE. Data request: measured PWD/ECD channel,\n"
                 "or mud rheology (PV,YP) + drillstring geometry.\n")
    print(f"\nwrote {os.path.relpath(out, REPO)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
