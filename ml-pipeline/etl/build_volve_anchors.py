"""
Volve pack-off anchors: adjudicated table + channel windows from USROP.

Source events: the official Volve DDRs (volve_ddr_step0.py inventory), depths
per the DDR activity/status records. Same discipline as the Bilabri anchors:
every anchor carries its verbatim quote, an operational-context adjudication
(drilling ahead vs reaming vs stationary — the DRLPAR lesson: depth-indexed
data records the hole being MADE, so an event that occurred during a later
re-pass is anchored to hole whose record predates the event), and a measured
precursor assessment rather than an assumed one.

The F-15 September-2008 events are ONE trouble episode (hole advanced only
1381->1416 m in 5 days with repeated pack-offs): one episode anchor at the
first documented onset, repeats recorded as notes — never three separate
detection targets from near-identical windows.

Run:
    .venv/bin/python ml-pipeline/etl/build_volve_anchors.py
"""

import os

import numpy as np
import pandas as pd

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ART = os.path.join(REPO, "ml-pipeline", "artifacts")
FEAT = os.path.join(REPO, "ml-pipeline", "data", "features", "usrop")

BASELINE_M = 150.0   # window below the event: [ed-150, ed-40) = baseline
APPROACH_M = 40.0    # [ed-40, ed] = approach

# RE-ADJUDICATED 2026-07-30 after an adversarial DDR-context review that read
# the surrounding activity records for every event. NONE of the four original
# anchors is a drilling-ahead pack-off, and three of the four windows contain
# post-event or cross-run data (USROP keeps ONE pass per depth — for F15-1381
# it kept the re-pass recorded FIVE DAYS AFTER the event). window_valid=False
# rows must never feed a detection claim; the two REBUILD candidates at the
# end are the drilling-time anchors a rerun should use.
ANCHORS = [
    dict(anchor_id="F15-PACKOFF-1381", usrop_file="15_9-F-15",
         well="15/9-F-15", mechanism="pack_off",
         event_depth_m=1381.0, date="2008-09-20", anchor_type="documented",
         operation_at_event="remedial LCM circulation, string off bottom "
                            "(~1338-1381 m): the '34 m3' = 9 m3 LCM pill + "
                            "19 m3 seawater chase + 4 m3 spotted, after ~30 h "
                            "of documented losses",
         window_valid=False,
         quote="After approx 34 m3 pumped observed pack off tendencies with "
               "SPP peaking rapidly to 180 bar.",
         context="EPISODE anchor, MID-TROUBLE-SEQUENCE — not onset. Aftermath: "
                 "string trapped (40 kNm/40 MT), backed off and dropped, "
                 "re-engaged and freed same day. USROP window provenance "
                 "FAILURE: approach rows match the 2008-09-25 re-pass "
                 "(4000 lpm / 193-204 bar / OBM) recorded 5 days AFTER this "
                 "event; no pre-event pass exists in USROP. Ratios previously "
                 "reported from this window are post-event data — withdrawn.",
         adjudicated="documented event; window INVALID for detection"),
    dict(anchor_id="F15A-PACKOFF-1532", usrop_file="15_9-F-15S",
         well="15/9-F-15 A (USROP name F-15S)", mechanism="pack_off",
         event_depth_m=1532.0, date="2008-12-18", anchor_type="documented",
         operation_at_event="running 13 3/8\" casing (Tesco tool, 25-30 MT "
                            "set-down through tight spots 1467/1481/1532); no "
                            "drilling BHA in hole",
         window_valid=False,
         quote="Observed pack off / rapid pressure build up to 20 bar - "
               "shut down pumps.",
         context="Casing-run event 5+ days after the hole was drilled; USROP "
                 "rows at these depths are the original hole-making pass — "
                 "contemporaneous with drilling, NOT with the event. Same "
                 "structural blindness as the Bilabri DEEP-1 casing anchor.",
         adjudicated="documented event; window INVALID for detection"),
    dict(anchor_id="F15A-PACKOFF-2614", usrop_file="15_9-F-15S",
         well="15/9-F-15 A (USROP name F-15S)", mechanism="pack_off",
         event_depth_m=2614.0, date="2008-12-28", anchor_type="documented",
         operation_at_event="reaming/RIH re-pass toward TD (obstruction "
                            "2610-2614 worked with reduced flow); episode "
                            "onset was actually 2008-12-27 @2594-2596",
         window_valid=False,
         quote="Observed 35 bar pressure increase and WOB increased while TDS "
               "was stationary (pack-off).",
         context="Junk/shoe-debris component possible ('red fiber-glass "
                 "material and swarf' over shakers). Window CROSS-RUN "
                 "CONTAMINATED: baseline rows are the 17.5\" run (1.46 sg), "
                 "approach rows the 8.5\" run (1.33 sg) — ratios compare "
                 "different BHAs/muds and are withdrawn.",
         adjudicated="documented event; window INVALID for detection"),
    dict(anchor_id="F5-PACKOFF-2927", usrop_file="15_9-F-5",
         well="15/9-F-5", mechanism="pack_off",
         event_depth_m=2927.0, date="2008-07-25", anchor_type="documented",
         operation_at_event="rathole cleanout after cement shoetrack "
                            "drill-out (old 12.25\" hole), BEFORE new 8.5\" "
                            "formation; third of three pack-offs in one "
                            "90-minute activity",
         window_valid=False,
         quote="Also saw pack off with bit on bottom, stopped pumping slump "
               "pipe opposite direction of movement, No losses seen after "
               "pack off.",
         context="'Bit on bottom' = bottom of the rathole cleanout, not new "
                 "hole. Window baseline is the PREVIOUS 12.25\" run vs a "
                 "cement-drill-out approach at WOB~0 — ratios are cross-run "
                 "artifacts, withdrawn. Aftermath benign (FIT 1.65 sg, "
                 "drilled ahead).",
         adjudicated="documented event; window INVALID for detection"),
    # ---- REBUILD candidates: the drilling-time anchors a rerun should use ----
    dict(anchor_id="F15-PACKOFF-1416", usrop_file="15_9-F-15",
         well="15/9-F-15", mechanism="pack_off",
         event_depth_m=1416.0, date="2008-09-25", anchor_type="documented",
         operation_at_event="drilling ahead — the ONLY event in the September "
                            "episode immediately preceded by fresh new hole "
                            "(35 m of 12.25\" formation, 1381-1416)",
         window_valid=True,
         quote="Observed pack-off tendencies at 1416 m MD... 205 to 220 bar... "
               "torque peaked at 25 kNm... 8 m3 losses.",
         context="USROP approach rows verified to match that day's operating "
                 "parameters. Restrict baseline to >=1381 m (new formation "
                 "only; above is shoetrack/rathole).",
         adjudicated="REBUILD candidate — pending evaluation rerun"),
    dict(anchor_id="F15A-PACKOFF-2594", usrop_file="15_9-F-15S",
         well="15/9-F-15 A (USROP name F-15S)", mechanism="pack_off",
         event_depth_m=2594.0, date="2008-12-27", anchor_type="documented",
         operation_at_event="episode ONSET: pressure spikes 15 then 35 bar at "
                            "2594-2596, could not return to bottom, full POOH",
         window_valid=True,
         quote="(onset per DDR 2008-12-27 activity records @2594-2596)",
         context="Baseline must be restricted to the 8.5\" run rows "
                 "(md >= 2591) to avoid the cross-run contamination that "
                 "invalidated the 2614 window.",
         adjudicated="REBUILD candidate — pending evaluation rerun"),
]


def main():
    rows = []
    for a in ANCHORS:
        df = pd.read_csv(os.path.join(FEAT, a["usrop_file"] + ".csv"))
        df["_spp_per_flow"] = (df["Average Standpipe Pressure kPa"]
                               / df["Mud Flow In L/min"].replace(0, np.nan))
        md = df["Measured Depth m"]
        ed = a["event_depth_m"]
        base = df[(md >= ed - BASELINE_M) & (md < ed - APPROACH_M)]
        appr = df[(md >= ed - APPROACH_M) & (md <= ed)]
        rec = dict(a)
        rec["n_baseline"], rec["n_approach"] = len(base), len(appr)
        nearest = float(md[md <= ed].max()) if (md <= ed).any() else np.nan
        rec["gap_to_event_m"] = round(abs(ed - nearest), 1)
        chans = {
            "spp": "Average Standpipe Pressure kPa",
            "torque": "Average Surface Torque kN.m",
            "rop": "Rate of Penetration m/h",
            "mse": "mse_psi",
        }
        chans["spp_per_flow"] = "_spp_per_flow"
        for name, col in chans.items():
            b = base[col].median() if col in base else np.nan
            p = appr[col].median() if col in appr else np.nan
            rec[f"{name}_ratio"] = round(float(p / b), 3) \
                if np.isfinite(b) and b else None
            # robust peak z of the approach vs baseline spread
            if col in base and base[col].notna().sum() > 30:
                mad = (base[col] - base[col].median()).abs().median() * 1.4826
                if mad > 0:
                    rec[f"{name}_peak_z"] = round(float(
                        (appr[col].max() - base[col].median()) / mad), 1)
        rows.append(rec)

    out = pd.DataFrame(rows)
    path = os.path.join(ART, "volve_anchors.csv")
    out.to_csv(path, index=False)
    print("=" * 86)
    print("VOLVE PACK-OFF ANCHORS — documented events, measured approach signatures")
    print("=" * 86)
    for _, r in out.iterrows():
        print(f"\n{r.anchor_id}  [{r.adjudicated}]  {r.well} @ {r.event_depth_m:.0f} m "
              f"({r.date})  approach n={r.n_approach}, gap {r.gap_to_event_m} m")
        print(f"   \"{r.quote[:110]}\"")
        bits = [f"{c} x{r[f'{c}_ratio']}" for c in
                ("spp", "spp_per_flow", "torque", "mse", "rop")
                if pd.notna(r.get(f"{c}_ratio"))]
        zs = [f"{c} z={r[f'{c}_peak_z']}" for c in ("spp", "torque")
              if pd.notna(r.get(f"{c}_peak_z"))]
        print(f"   approach/baseline: {' | '.join(bits)}")
        print(f"   approach peaks:    {' | '.join(zs)}")
        print(f"   context: {r.context[:160]}")
    print(f"\nwrote {os.path.relpath(path, REPO)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
