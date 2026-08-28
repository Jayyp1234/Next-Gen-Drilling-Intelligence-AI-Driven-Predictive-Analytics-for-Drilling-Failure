# Handoff Brief — Empirical Work for Outcomes 3 & 6

**Purpose.** Everything needed to run the three-model ensemble on Volve data and produce the
latency-reduction result, on a machine with unrestricted network and a persistent filesystem. The physics
side (objectives 1–4) is complete and specified in `DrillGuard_Physical_Foundations.md`; this brief covers
only the empirical work that produces **Outcome 3** (quantified latency / false-alarm reduction) and
**Outcome 6** (per-model and fused ensemble performance).

**Division of labour.** Data acquisition, feature computation and model training run on the local machine.
The latency analysis, statistical comparison, publication figures and thesis write-up run in the analysis
environment where the physics foundation and its lineage already live. The interface between them is a
single results table (§6) — a few MB, not gigabytes.

**Bridge module.** `drill_physics_features.py` (already written and unit-verified: 12 features, 8/8
symbolic dimensional checks, field-vs-SI MSE agreement 0.4%) is the canonical feature implementation. Use
it as-is. Do not re-derive features.

---

## Traceability — which objective each step serves

Objectives 1–4 are complete in the physics foundation and are **not** re-done here. This brief exists to
discharge Objectives 5–8 and to put Objectives 2 and 4 to empirical test.

| Objective | Discharged by | Note |
|---|---|---|
| 1 — mechanism physics | *complete* (`step2_failure_mode_physics.md`) | not repeated here |
| 2 — parameter interaction / independence | **Arm C** (§5) puts it to test | physics predicts which channels work alone |
| 3 — features, unit-checked | *complete* (`drill_physics_features.py`) | used as-is |
| 4 — lead vs coincident mapping | **Step 8** falsification test | physics predicts *which* channels lead |
| **5 — minimum observable sets / composability** | **Arm C** + observability log (§6) | must declare *unobservable* mechanisms too |
| **6 — three models, coverage-aware fusion** | Steps 4, 5 (Arms B & C) | renormalisation must be exercised, not just coded |
| **7 — latency reduction** | Arms A & B (§5) | the headline result |
| **8 — Volve validation** | Steps 0–3 | conventions, gating, physics sanity checks |

**Two framing commitments carried from Chapter One.** (i) The contribution is *two-layered*: the
composable, coverage-aware framework is the primary claim, the three-model ensemble its instantiation. The
experiments must therefore demonstrate the **framework property** (capability derived from available
parameters), not merely ensemble accuracy. (ii) The system must support **both entry points** — *parameter-in*
(a user selects channels; the system reports which mechanisms are then observable) and *mode-in* (a user
selects a mechanism; the system reports the channels required). Both are read off the same minimum-observable-set
mapping and must be exercised in Arm C.

---

## STEP 0 — The prerequisite that decides the experimental design

**Do this before any modelling.** Determine whether the Volve data contains **timestamped failure / NPT
events**.

Where to look:
- daily drilling reports (DDR) or end-of-well reports in the Volve release
- any event, incident, or NPT log
- free-text `remarks` / `comment` / `activity` columns in the WITSML/CSV exports
- drilling-activity codes that flag stuck pipe, pack-off, losses, or well-control events

Record findings in `event_inventory.md`: source file, well, timestamp, event type, and a verbatim quote of
the describing text.

**The branch:**

| Finding | Design | Claim |
|---|---|---|
| **Events with timestamps exist** | Anchor detection latency and lead time to real event times | Labelled **validation** — strongest outcome |
| **No timestamped events** | Anchor to **physics-derived signature onsets** (§2 of the foundations: pack-off ECD/SPP/torque ramp, MSE↑/ROP↓ crossover) | **Demonstration** of physically-consistent latency reduction |

Both are publishable. State plainly which one applies — this is the single most important honesty
commitment in the empirical chapter. Do not describe a demonstration as a validation.

---

## STEP 1 — Data acquisition

Target the real-time drilling time-series for **Volve wells in the 15/9-F series** (the corrected
identity: block 15/9, licence PL 046, rig *Mærsk Inspirer* — **not** "31/5-7 / West Hercules", which was
wrong in the original draft).

Sources: the Equinor Volve data-sharing release, and the University of Stavanger real-time
drilling-data release (WITSML → CSV; Tunkiel et al.) commonly used for the time-indexed surface logs.
Confirm the exact citation from the paper itself before citing it.

For each well downloaded, log to `data_inventory.csv`: well name, file, row count, start/end timestamps,
sampling interval, channel list, and each channel's **header unit**.

**Minimum channels needed** (from the minimum-observable-set analysis):
- pack-off (MOS = 3): ECD, standpipe pressure, torque
- bit wear (MOS = 4): WOB, RPM, torque, ROP
- gating (mandatory): block position, flow (in/out), bit depth, hole depth
- useful additions: hookload, mud weight, downhole pressure, pit volume

Prefer 2–4 wells with good channel coverage over many wells with sparse coverage.

---

## STEP 2 — Units and rig-state gating (do not skip)

**Units.** Volve is metric/SI (depth m, ROP m/hr, pressure bar/kPa, mud weight s.g. or kg/m³). Read each
channel's header unit and route to the **SI feature forms**. Never assume field units.

**Rig-state gating — the most important data-physics rule.** Volve data is time-indexed. At every pipe
connection ROP → 0 and depth freezes; this is a **rig-state artifact, not an anomaly**. Ungated, a model
fires false positives on every connection and MSE diverges as ROP → 0.

Construct a boolean mask `on_bottom_circulating`:
```
flow_in > threshold                       # circulating
AND (hole_depth - bit_depth) < tol        # on bottom
AND block position moving down / ROP > 0  # making hole
```
Compute all mechanism features **only** where the mask is true. Segment the series by rig state first.
Report the mask's duty cycle (fraction of samples retained) in `data_inventory.csv` — a sanity check in
its own right.

---

## STEP 3 — Features

Compute the 12 features from `drill_physics_features.py` on the masked data. Apply each feature's
**valid physical range** as a data-quality filter; flag out-of-range values as **sensor faults, not
failures** (log counts per channel).

Physics sanity checks before modelling — if these fail, the pipeline is wrong, not the physics:
- efficient drilling intervals give MSE ≈ 1.5–2× rock UCS (Hugin Fm sandstone)
- ECD ≥ mud weight always, and exceeds it by a plausible annular-friction margin
- d_c rises with depth under normal compaction
- transport ratio in a physically sensible range (order 0.5–1.5)

---

## STEP 4 — The three models

Each targets a **different physical signature class**; this is why they are complementary rather than
redundant.

**Random Forest — point classification.** Input: per-sample feature vector. Labels per the hierarchy in
`step7_model_physics_alignment.md`: documented events > physics-consistency labels (multiple independent
features crossing in the *correlated pattern the mechanism predicts*) > weak/heuristic (declared as
such). **Never evaluate against the same rule that generated the labels.** Output `S_baseline ∈ [0,1]`.

**LSTM autoencoder — temporal anomaly.** Trained on **normal** on-bottom sequences only; score is
reconstruction error. Sliding window (the draft used 60 samples — justify from mechanism τ_dev, not
convention). Output `S_LSTM ∈ [0,1]` after normalisation.

**DTW — shape matching.** Reference library must have **independent provenance**: templates derived from
the §2 mechanism physics (pack-off ECD/SPP/torque ramp; MSE↑/ROP↓ crossover) or from documented events.
**Never seed templates from LSTM-flagged anomalies** — that destroys ensemble independence and
double-counts the same evidence. Use a Sakoe–Chiba band (Sakoe & Chiba 1978,
`10.1109/tassp.1978.1163055`). Output `S_DTW ∈ [0,1]`.

**Fusion — coverage-aware, renormalised over active monitors:**

```
Risk(t) = 100 * Σ_{k active} w_k S_k(t) / Σ_{k active} w_k
w = {RF: 0.35, LSTM: 0.45, DTW: 0.20}
```
Full coverage reproduces the fixed 0.35/0.45/0.20 exactly. Reduced coverage renormalises (RF+LSTM →
0.437/0.562; LSTM+DTW → 0.692/0.308). Log which monitors were active at every timestep.

---

## STEP 5 — The experiment that produces Outcome 3

Outcome 3 is a **comparison**, so it needs an ablation grid. For each configuration, measure detection
latency, lead time, detection rate and false-alarm rate against the anchors from Step 0.

**Arm A — parameter coupling (single vs multivariate):**
1. one channel alone (e.g. ECD only)
2. two channels
3. full minimum observable set for the mechanism
4. all available channels

**Arm B — model fusion (single vs ensemble):**
1. RF only
2. LSTM only
3. DTW only
4. fused risk score

**Arm C — composability and coverage-aware degradation *(this arm proves Objectives 5 and 6)*:**

This is the arm that demonstrates the framework claim, and it is the one most easily omitted. For each of
several **customer-style parameter subsets**, verify that the system (i) correctly derives which mechanisms
are observable, (ii) **explicitly declares which are not**, and (iii) renormalises the fusion weights over
the monitors actually available.

Suggested subsets (state the observable/unobservable split *predicted* from the minimum observable sets
before running, then confirm the implementation agrees):

| Config | Parameters given | Predicted observable | Predicted **unobservable** |
|---|---|---|---|
| C1 | stick-slip only | stick-slip (self-diagnostic, MOS = 1) | all others |
| C2 | ECD only | none fully — ECD is *relational* | all (demonstrates a single relational channel is insufficient) |
| C3 | ECD + SPP + torque | pack-off (MOS = 3) | bit wear, kicks, sticking |
| C4 | WOB + RPM + torque + ROP | bit wear (MOS = 4) | pack-off, kicks, losses |
| C5 | full available suite | all mechanisms with MOS satisfied | those needing absent channels (e.g. wellbore instability — caliper/cavings absent from Volve) |

**The C1-vs-C2 contrast is the sharpest empirical test of Objective 2.** The physics predicts that
stick-slip is the *only* self-diagnostic channel — meaningful alone — whereas ECD, torque and standpipe
pressure are *relational* and near-meaningless in isolation. If single-channel ECD monitoring (C2) produces
a high false-alarm rate while single-channel stick-slip (C1) performs acceptably, the coupling claim is
empirically supported. **Report this contrast explicitly**; it is a result, not a diagnostic.

For each config also record: which monitors were active, the renormalised weights actually applied, and
whether performance degraded *gracefully* (monotonically with reduced coverage) or collapsed. Graceful
degradation is the property being claimed; a collapse would falsify it and must be reported.

**Definitions — fix these once and use them consistently:**
- **detection latency** = t(first alert at or above tier threshold) − t(anchor onset). Negative = warning
  *before* the event (good).
- **lead time** = −latency where negative.
- **false-alarm rate** = alerts in windows with no anchor, per unit drilling time (state the unit).
- **detection rate** = fraction of anchors detected within a stated horizon.

Hold the alert threshold *constant* across arms, or sweep it and compare ROC-style — otherwise the
comparison is confounded. Report a sensitivity sweep over the tier threshold; the headline number should
not depend on one arbitrary cut.

**Guard against leakage:** train/test split by **well or time block**, never random sample shuffling —
adjacent 10-second samples are near-duplicates and random splits inflate every metric.

---

## STEP 5b — Falsification test against the physics-predicted envelope

The physics foundation makes **advance predictions**. Testing measurements against them is what separates
this work from a tuning exercise, and a disagreement is a genuine finding either way — so record the
comparison rather than quietly adjusting the physics to match.

| Mechanism | Predicted class | Predicted lead time | What the data must show |
|---|---|---|---|
| Bit wear | predictable | hours | MSE trend leads dulling; alert well before failure |
| Pack-off / hole cleaning | predictable | ≈10 min – 3 h | correlated ECD/SPP/torque rise leads the event |
| Wellbore instability | partial | 30 min – 12 h (slow creep) | qualified — caliper/cavings absent from Volve |
| Lost circulation | mixed | ECD creep leads; sudden losses do not | bimodal latency distribution expected |
| Differential sticking | **risk-state** | **no lead time** | zero lead channels — condition builds, timing unsignalled |
| Mechanical sticking | **risk-state** | **no lead time** | zero lead channels |
| Kick / influx | **detection-only** | **no precursor** | all channel responses coincident; measure latency, not lead |
| Stick-slip | predictable | minutes | detectable from its single self-diagnostic channel |

Two specific falsifiable predictions to test directly:
1. **Zero-lead prediction.** No leading channel should be found for differential sticking, mechanical
   sticking, or kicks. If a genuine precursor *is* found, that is a publishable correction to the
   physics — report it, do not suppress it.
2. **Lead-channel identity.** For pack-off, the leading channels should be ECD, SPP and torque
   specifically. Compare measured lead per channel against the predicted lead/coincident coding in
   `step4_sensitivity_matrix.csv`, and report agreement as a confusion-style table.

---

## STEP 6 — What to bring back (exact schema)

Two compact CSVs. These drop straight into the analysis environment for the latency statistics and
publication figures.

**`ensemble_scores.csv`** — one row per timestep per well:

| column | meaning |
|---|---|
| `well` | well identifier (e.g. 15/9-F-11) |
| `timestamp` | ISO 8601 |
| `bit_depth_m`, `hole_depth_m` | depths |
| `on_bottom_circulating` | 0/1 gating mask |
| `S_baseline`, `S_LSTM`, `S_DTW` | per-model scores, 0–1 (blank if monitor inactive) |
| `active_monitors` | e.g. `RF|LSTM` |
| `risk_score` | fused 0–100 |
| `alert_tier` | Normal / Watch / Elevated / Action |
| `mse`, `ecd`, `d_c`, `transport_ratio`, … | the 12 features |
| `config_id` | ablation configuration label |

**`events_anchors.csv`** — one row per anchor:

| column | meaning |
|---|---|
| `well`, `anchor_id` | identifiers |
| `mechanism` | pack-off / bit wear / … |
| `onset_timestamp`, `event_timestamp` | onset and realisation |
| `anchor_type` | `documented` or `physics_derived` |
| `source` | file/report + verbatim quote if documented |

**`coverage_report.csv`** — one row per Arm C configuration. This table *is* the composability result:

| column | meaning |
|---|---|
| `config_id` | C1…C5 |
| `channels_given` | pipe-separated channel list |
| `mechanisms_observable` | derived from minimum observable sets |
| `mechanisms_unobservable` | **the declared blind spots — required, not optional** |
| `monitors_active` | which of RF / LSTM / DTW could run |
| `weights_applied` | renormalised weights actually used |
| `detection_rate`, `false_alarm_rate`, `median_latency_s`, `median_lead_s` | per config |
| `degradation` | `graceful` or `collapse`, with a one-line justification |

Also return: `data_inventory.csv`, `event_inventory.md`, and training logs / model configs for the
methods section.

---

## STEP 7 — Honesty checklist before reporting

- [ ] Label source stated; evaluation does **not** reuse the labelling rule
- [ ] DTW templates independent of LSTM output — provenance documented
- [ ] Train/test split by well or time block, not random shuffle
- [ ] Rig-state gating applied; duty cycle reported
- [ ] Anchors declared `documented` or `physics_derived`; framed as validation or demonstration accordingly
- [ ] Threshold sensitivity reported, not a single cherry-picked cut
- [ ] Out-of-range values flagged as sensor faults, not failures
- [ ] Per-model *and* fused metrics reported — including where fusion does **not** help
- [ ] **Unobservable** mechanisms declared for every Arm C configuration, not only observable ones
- [ ] Renormalised weights logged per configuration — coverage-aware fusion exercised, not just implemented
- [ ] C1 (self-diagnostic) vs C2 (single relational channel) contrast reported as a result
- [ ] Degradation characterised as graceful or collapse, with justification
- [ ] Physics predictions (Step 5b) tested and **disagreements reported**, not silently reconciled

The last point matters: a result showing fusion helps for pack-off but not for kicks is *stronger*
science than uniform improvement, and it is exactly what the physics predicts (kicks have no leading
precursor — all channel responses are coincident).

---

*Companion: `DrillGuard_Physical_Foundations.md` (physics, §§1–8), `drill_physics_features.py` (feature
implementation), `step4_capability_matrix.md` (minimum observable sets),
`step7_model_physics_alignment.md` (independence, labels, fusion).*
