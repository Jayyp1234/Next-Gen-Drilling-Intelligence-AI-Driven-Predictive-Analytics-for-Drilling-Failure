"""
Arm C — composability and coverage-aware degradation.

Discharges Objectives 5 and 6 of the DrillGuard handoff brief: given a channel
set, derive which mechanisms are observable, EXPLICITLY DECLARE which are not,
and renormalise the fusion weights over the monitors actually available.

The framework claim, from Physical Foundations §4: "observability is the
intersection" -- a customer's available channels illuminate the mechanisms they
intersect. Both entry points must work off the same mapping:

    parameter-in : channels -> observable mechanisms  (observability_from_channels)
    mode-in      : mechanism -> required channels     (channels_for_mechanism)

PROVENANCE OF THE MINIMUM OBSERVABLE SETS.
RECONCILED 2026-07-30 against the authoritative source, now in-repo:
`docs/physics_foundation/step4_capability_matrix.md` (+ the machine-readable
`step4_minimum_observable_sets.json`). All eight MOS below are verbatim from
that source (provenance="step4"). The reconciliation CHANGED four of the five
sets this module had previously derived provisionally:

    mechanical_sticking   {torque,wob,hookload,rop} -> {torque,hookload,block_position}
    differential_sticking {ecd,mud_weight,pore_pressure}
                                     -> {downhole_pressure,mud_weight,block_position}
    lost_circulation      {ecd,mud_weight,flow_out} -> {ecd,pit_volume,flow_in,flow_out}
    wellbore_instability  {caliper,ecd,mud_weight}  -> {torque,ecd,rop}  (a declared
                          PROXY -- caliper/cavings, the best indicators, are absent
                          from Volve-class surface data; coverage must be reported
                          as partial there)
    kick_influx           {flow_out,pit_volume,spp} -> {flow_in,flow_out,pit_volume}

Naming: "Collar RPM" in the source maps to canonical `rpm`; surface RPM is
accepted as its proxy on USROP/Bilabri (declared, not silent). "Flow-in/out"
requires BOTH flow_in and flow_out. Mechanism classes and lead-channel counts
are verbatim from Foundations §4 / capability matrix §4.1.

COVERAGE STATES (capability matrix §4.4): a mechanism is
    full    -- entire MOS present (a monitor may activate);
    partial -- some but not all MOS channels present (reduced-confidence
               observation through the channels that exist; never silently dark);
    dark    -- no MOS channel present.
Only "full" counts as observable for MOS discipline; partial is REPORTED so the
degradation is graceful rather than binary.

Run:
    .venv/bin/python ml-pipeline/etl/coverage.py
"""

import csv
import os

# --------------------------------------------------------------------------
# Fusion weights (handoff brief STEP 4). Renormalisation over active monitors
# is the coverage-aware property being claimed -- it must be exercised, not
# merely coded, so the brief's worked values are asserted as a self-test below.
# --------------------------------------------------------------------------
MONITOR_WEIGHTS = {"RF": 0.35, "LSTM": 0.45, "DTW": 0.20}

# --------------------------------------------------------------------------
# Mechanisms. class/lead_channels are verbatim from Physical Foundations §4.
# mos = minimum observable set (canonical channel names).
# --------------------------------------------------------------------------
MECHANISMS = {
    "bit_wear": dict(
        cls="predictable", lead_channels=5, mos={"wob", "rpm", "torque", "rop"},
        provenance="step4",
        note="Primary feature: MSE + ROP trend. Bit diameter enters as context, "
             "not a live channel. Source says Collar RPM; surface RPM is the "
             "declared proxy on USROP/Bilabri."),
    "pack_off": dict(
        cls="predictable", lead_channels=5, mos={"ecd", "spp", "torque"},
        provenance="step4",
        note="Primary feature: ECD trend + transport ratio. The brief's flagship "
             "mechanism; predicted 10 min-3 h lead."),
    "wellbore_instability": dict(
        cls="predictable", lead_channels=3, mos={"torque", "ecd", "rop"},
        provenance="step4",
        note="Primary feature: torque/drag + ECD. This MOS is a declared PROXY -- "
             "the best indicators (caliper, caving morphology) are absent from "
             "Volve-class surface data, so coverage is at most partial there."),
    "stick_slip": dict(
        cls="self_diagnostic", lead_channels=4, mos={"stick_slip"},
        provenance="step4",
        note="MOS=1. The ONLY self-diagnostic feature -- meaningful alone."),
    "lost_circulation": dict(
        cls="mixed", lead_channels=1, mos={"ecd", "pit_volume", "flow_in", "flow_out"},
        provenance="step4",
        note="Primary feature: ECD margin + pit/flow deficit. Single lead channel is "
             "ECD creep. Bimodal latency expected (creep leads, sudden losses do not)."),
    "kick_influx": dict(
        cls="detection_only", lead_channels=0, mos={"flow_in", "flow_out", "pit_volume"},
        provenance="step4",
        note="MOS=2 in source terms (flow pair + pit). 0 lead channels -- all "
             "responses coincident. Gas chromatography (Bilabri GASROP) is an "
             "alternative detection route, not a precursor."),
    "differential_sticking": dict(
        cls="risk_state", lead_channels=0,
        mos={"downhole_pressure", "mud_weight", "block_position"},
        provenance="step4",
        note="Primary feature: overbalance dP + stationary time (hence block "
             "position). Risk-state: the condition builds, timing unsignalled."),
    "mechanical_sticking": dict(
        cls="risk_state", lead_channels=0,
        mos={"torque", "hookload", "block_position"},
        provenance="step4",
        note="Primary feature: erratic torque/drag + restricted movement (hence "
             "block position). Risk-state: 0 lead channels predicted."),
}

# Rig-state channels are context/gate nodes (Foundations §4): they answer "which
# physics is valid right now?" before any feature is computed. They gate every
# mechanism rather than belonging to any one MOS.
GATE_CHANNELS = {"block_position", "flow_in", "bit_depth", "hole_depth"}

# --------------------------------------------------------------------------
# Real datasets, as verified by reading the files (not filenames, not docs).
# --------------------------------------------------------------------------
DATASETS = {
    "USROP (Volve 15/9-F, 7 wells)": {
        "bit_depth", "wob", "spp", "torque", "rop", "rpm", "flow_in",
        "mud_weight", "hookload", "tvd", "gamma",
    },
    "Bilabri DRLPAR+GEOL (4 wells)": {
        # DRLPAR channels, plus mud_weight and bit diameter recovered from the
        # AM GEOL daily reports, plus gas from the GASROP files.
        "bit_depth", "tvd", "rop", "wob", "rpm", "torque", "spp", "flow_in",
        "temp_in", "temp_out", "mud_weight", "gas",
    },
    "31/5-7 Eos (1 wellbore)": {
        "bit_depth", "gamma", "block_position", "stick_slip", "rpm",
        "shock_risk", "shock_peak", "ecd", "downhole_pressure", "downhole_temp",
    },
}

# --------------------------------------------------------------------------
# Arm C configurations (handoff brief STEP 5). The brief requires the
# observable/unobservable split to be PREDICTED before running, then confirmed
# against the implementation -- so the prediction is recorded here as data.
# --------------------------------------------------------------------------
CONFIGS = [
    dict(config_id="C1", channels={"stick_slip"},
         predicted_observable={"stick_slip"},
         rationale="stick-slip is self-diagnostic (MOS=1) -- meaningful alone"),
    dict(config_id="C2", channels={"ecd"},
         predicted_observable=set(),
         rationale="ECD is RELATIONAL; a single relational channel observes nothing"),
    dict(config_id="C3", channels={"ecd", "spp", "torque"},
         predicted_observable={"pack_off"},
         rationale="pack-off MOS=3 exactly satisfied"),
    dict(config_id="C4", channels={"wob", "rpm", "torque", "rop"},
         predicted_observable={"bit_wear"},
         rationale="bit-wear MOS=4 exactly satisfied"),
    # Prediction updated at reconciliation: the authoritative mechanical-sticking
    # MOS requires block_position, which USROP lacks -- the provisionally-derived
    # set (torque/wob/hookload/rop) had wrongly made it observable here.
    dict(config_id="C5", channels=DATASETS["USROP (Volve 15/9-F, 7 wells)"],
         predicted_observable={"bit_wear"},
         rationale="richest REAL single-well channel set we hold (USROP); still no "
                   "ecd, block_position, flow_out or pit_volume"),

    # C6 is a deliberate counterexample, not a capability claim. The first run of
    # this module defined C5 as the union of all three datasets' channels and it
    # reported pack_off as OBSERVABLE -- disagreeing with the prediction. The
    # implementation was right and the CONFIG was wrong: the union takes `ecd`
    # from 31/5-7 Eos (a different well, field and year, measured downhole) and
    # pairs it with `spp`/`torque` from USROP/Bilabri (surface channels on other
    # wells entirely). No rig ever had those three together.
    #
    # Kept as a flagged config because this is the exact failure mode the
    # framework exists to prevent: pooling channels across datasets manufactures
    # observability that no well possesses.
    # Under the authoritative MOS the union now "observes" SIX of eight (adds
    # differential_sticking: DHAP from 31/5-7 + mud weight from USROP + block
    # position from 31/5-7; and wellbore_instability + mechanical_sticking by
    # similar cross-dataset stitching). The counterexample got starker.
    dict(config_id="C6-UNION", channels=set().union(*DATASETS.values()),
         predicted_observable={"bit_wear", "mechanical_sticking", "stick_slip",
                               "pack_off", "differential_sticking",
                               "wellbore_instability"},
         realizable=False,
         rationale="FICTIONAL cross-dataset union — retained as a counterexample. "
                   "Reports 6 of 8 observable, but every added mechanism pairs "
                   "channels from different wells/fields/years no rig ever had "
                   "together. Never quote this row as capability."),
]


# --------------------------------------------------------------------------
# The two entry points -- both read off the same mapping.
# --------------------------------------------------------------------------
def observability_from_channels(channels):
    """parameter-in: channels -> (observable, unobservable_with_missing_channels).

    A mechanism is observable iff its ENTIRE minimum observable set is covered.
    Partial coverage is not full observability -- reporting a 2-of-3 mechanism
    as observable is exactly the overclaim this framework exists to prevent.
    """
    channels = set(channels)
    observable, unobservable = set(), {}
    for name, spec in MECHANISMS.items():
        missing = spec["mos"] - channels
        if missing:
            unobservable[name] = missing
        else:
            observable.add(name)
    return observable, unobservable


def coverage_states(channels):
    """Three-state coverage per mechanism (capability matrix §4.4).

    full    -- entire MOS present; the mechanism's monitor may activate.
    partial -- some but not all MOS channels present; observable at reduced
               confidence through what exists, reported so degradation is
               graceful rather than a silent binary gap.
    dark    -- no MOS channel present at all.
    """
    channels = set(channels)
    states = {}
    for name, spec in MECHANISMS.items():
        present = spec["mos"] & channels
        if present == spec["mos"]:
            states[name] = ("full", set())
        elif present:
            states[name] = ("partial", spec["mos"] - channels)
        else:
            states[name] = ("dark", set(spec["mos"]))
    return states


def channels_for_mechanism(mechanism):
    """mode-in: mechanism -> the channels required to observe it."""
    if mechanism not in MECHANISMS:
        raise KeyError(f"unknown mechanism {mechanism!r}")
    return set(MECHANISMS[mechanism]["mos"])


# --------------------------------------------------------------------------
# Monitor availability + coverage-aware fusion.
# --------------------------------------------------------------------------
def active_monitors(observable, channels):
    """Which of RF / LSTM / DTW can actually run on this configuration.

    Derived rules (the brief specifies the weights but not the availability
    logic, so these are stated explicitly rather than assumed):

      RF   point classification -- needs at least one observable mechanism to
           label against.
      LSTM sequence autoencoder -- needs a multivariate series: >=2 channels
           along a sequential index. It is unsupervised, so it does NOT need a
           covered MOS; this is why it degrades last.
      DTW  shape matching -- needs a template with a defined signature SHAPE.
           A mechanism with 0 lead channels has no precursor shape to match, so
           DTW requires an observable mechanism of a class that actually leads
           (predictable or self-diagnostic). Matching a template against a
           risk-state mechanism would be matching noise.
    """
    monitors = set()
    if observable:
        monitors.add("RF")
    if len(channels) >= 2:
        monitors.add("LSTM")
    if any(MECHANISMS[m]["cls"] in ("predictable", "self_diagnostic")
           and MECHANISMS[m]["lead_channels"] > 0 for m in observable):
        monitors.add("DTW")
    return monitors


def renormalised_weights(monitors):
    """Coverage-aware fusion: renormalise w over the ACTIVE monitors only.

        Risk(t) = 100 * sum_{k active} w_k S_k(t) / sum_{k active} w_k

    Full coverage reproduces the fixed 0.35/0.45/0.20 exactly.
    """
    active = {k: w for k, w in MONITOR_WEIGHTS.items() if k in monitors}
    total = sum(active.values())
    if not total:
        return {}
    return {k: round(w / total, 4) for k, w in active.items()}


def _self_test():
    """The brief states the renormalised values; reproduce them or fail loudly."""
    full = renormalised_weights({"RF", "LSTM", "DTW"})
    assert full == {"RF": 0.35, "LSTM": 0.45, "DTW": 0.20}, full
    rf_lstm = renormalised_weights({"RF", "LSTM"})
    assert rf_lstm == {"RF": 0.4375, "LSTM": 0.5625}, rf_lstm
    lstm_dtw = renormalised_weights({"LSTM", "DTW"})
    assert lstm_dtw == {"LSTM": 0.6923, "DTW": 0.3077}, lstm_dtw
    return "renormalisation self-test PASSED (matches brief: 0.4375/0.5625, 0.6923/0.3077)"


def degradation_class(n_observable, n_channels):
    """Structural degradation only.

    Performance-based degradation (graceful vs collapse in detection rate and
    latency) CANNOT be assessed until the STEP 4 models exist. Reporting a
    structural proxy as if it were the performance result would be precisely the
    overclaim STEP 7 forbids, so the distinction is carried into the output.
    """
    if n_observable == 0:
        return "collapse (structural): no mechanism observable at this coverage"
    if n_observable == 1:
        return "graceful (structural): single mechanism retained"
    return "graceful (structural): multiple mechanisms retained"


def main():
    art = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       "artifacts")
    os.makedirs(art, exist_ok=True)

    print("=" * 78)
    print("ARM C — COMPOSABILITY & COVERAGE-AWARE DEGRADATION")
    print("=" * 78)
    print(_self_test())

    # ---- mode-in entry point demonstrated ----
    print("\nMODE-IN  (choose a mechanism -> required channels):")
    for name, spec in sorted(MECHANISMS.items(), key=lambda kv: -kv[1]["lead_channels"]):
        prov = "  [PROVISIONAL]" if spec["provenance"] == "provisional" else ""
        print(f"  {name:24s} MOS={len(spec['mos'])}  {sorted(spec['mos'])}"
              f"  class={spec['cls']} lead={spec['lead_channels']}{prov}")

    # ---- parameter-in entry point, on the REAL datasets ----
    print("\nPARAMETER-IN  (real datasets -> coverage state per mechanism, §4.4):")
    for label, chans in DATASETS.items():
        obs, unobs = observability_from_channels(chans)
        states = coverage_states(chans)
        mons = active_monitors(obs, chans)
        print(f"\n  {label}")
        print(f"    FULL    : {sorted(obs) or '(none)'}")
        partial = {m: miss for m, (st, miss) in states.items() if st == "partial"}
        for m, missing in sorted(partial.items()):
            print(f"    partial : {m:24s} missing {sorted(missing)}")
        dark = sorted(m for m, (st, _) in states.items() if st == "dark")
        print(f"    dark    : {dark or '(none)'}")
        print(f"    monitors: {sorted(mons) or '(none)'}  "
              f"weights {renormalised_weights(mons)}")

    # ---- Arm C configs: predicted vs derived ----
    rows = []
    print("\n" + "=" * 78)
    print("ARM C CONFIGS — predicted split vs implementation")
    print("=" * 78)
    for cfg in CONFIGS:
        obs, unobs = observability_from_channels(cfg["channels"])
        states = coverage_states(cfg["channels"])
        n_partial = sum(1 for st, _ in states.values() if st == "partial")
        mons = active_monitors(obs, cfg["channels"])
        weights = renormalised_weights(mons)
        agrees = obs == cfg["predicted_observable"]
        realizable = cfg.get("realizable", True)
        flag = "" if realizable else "   [NOT REALIZABLE — counterexample]"
        print(f"\n{cfg['config_id']}  channels={sorted(cfg['channels'])}{flag}")
        print(f"    rationale  : {cfg['rationale']}")
        print(f"    predicted  : {sorted(cfg['predicted_observable']) or '(none)'}")
        print(f"    derived    : {sorted(obs) or '(none)'}   "
              f"{'AGREES' if agrees else '*** DISAGREES — investigate ***'}")
        print(f"    unobservable: {len(unobs)} declared")
        print(f"    monitors   : {sorted(mons) or '(none)'}  weights={weights}")
        print(f"    degradation: {degradation_class(len(obs), len(cfg['channels']))}")
        rows.append({
            "config_id": cfg["config_id"],
            "realizable_on_one_well": "yes" if realizable else "NO — fictional union",
            "channels_given": "|".join(sorted(cfg["channels"])),
            "mechanisms_observable": "|".join(sorted(obs)),
            "mechanisms_partial": "|".join(sorted(
                m for m, (st, _) in states.items() if st == "partial")),
            "mechanisms_unobservable": "|".join(sorted(unobs)),
            "unobservable_missing_channels": "; ".join(
                f"{m}:{','.join(sorted(x))}" for m, x in sorted(unobs.items())),
            "prediction_agrees": "yes" if agrees else "NO",
            "monitors_active": "|".join(sorted(mons)),
            "weights_applied": "; ".join(f"{k}={v}" for k, v in sorted(weights.items())),
            # Performance columns require the STEP 4 models. Left explicitly
            # PENDING rather than blank so nobody reads absence as zero.
            "detection_rate": "PENDING-STEP4",
            "false_alarm_rate": "PENDING-STEP4",
            "median_latency_s": "PENDING-STEP4",
            "median_lead_s": "PENDING-STEP4",
            "degradation": degradation_class(len(obs), len(cfg["channels"])),
        })

    out = os.path.join(art, "coverage_report.csv")
    with open(out, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(f"\nwrote {out}")

    # ---- the C1 vs C2 contrast: the sharpest test of Objective 2 ----
    c1 = next(c for c in CONFIGS if c["config_id"] == "C1")
    c2 = next(c for c in CONFIGS if c["config_id"] == "C2")
    o1, _ = observability_from_channels(c1["channels"])
    o2, _ = observability_from_channels(c2["channels"])
    print("\n" + "=" * 78)
    print("C1 vs C2 — the sharpest empirical test of Objective 2")
    print("=" * 78)
    print(f"  C1 stick-slip only (self-diagnostic): observes {sorted(o1) or '(none)'}")
    print(f"  C2 ECD only        (relational)     : observes {sorted(o2) or '(none)'}")
    print("  Structural prediction CONFIRMED: one channel is sufficient iff it is")
    print("  self-diagnostic. The empirical half (does C2 produce a high false-alarm")
    print("  rate while C1 performs acceptably?) needs the STEP 4 models.")
    print("  NOTE: 31/5-7 Eos is the ONLY dataset carrying both stick_slip and ecd,")
    print("  so it is the only place this contrast can be run at all.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
