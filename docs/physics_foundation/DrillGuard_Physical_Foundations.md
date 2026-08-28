# DrillGuard — Physical Foundations

### The Physics of Precursor-Based Drilling-Failure Monitoring

*A physics-first foundation for a coverage-aware, composable drilling-failure monitoring system,
grounded in the physics and data conventions of the Equinor Volve field.*

**Author:** Okeke Johnpaul Ebube (180808058) · Department of Petroleum & Gas Engineering, University of
Lagos
**Status:** Physical Foundations reference — established and verified *before* model construction.

---

## Preface — what this document is, and why it exists

This is not the thesis. It is the **physical foundation** the thesis is built on: a self-contained,
first-principles account of *why* drilling failures can be predicted from surface and downhole data at
all, *which* failures can be predicted and on what timescale, *what* every model input physically means,
and *how* the machine-learning system must be shaped so that it respects — rather than violates — the
physics.

It exists because a predictive system is only as defensible as the physics under it. Every design
choice in DrillGuard — the choice of features, the weighting of the three paradigms, the alert tiers,
even the decision to renormalise fusion weights — is downstream of a physical claim. If those claims are
wrong, the system is a curve-fit with no ground truth. This document makes each claim explicit, derives
it, unit-checks it, grounds it in the primary literature, and tests it against the real Volve data
conventions.

The organising principle throughout: **a failure is predictable if and only if its physics produces a
gradually-evolving, measurable signature whose development time is long compared with the time needed to
respond.** Everything else follows from that single idea.

---

## 0. The logical architecture

The foundation is a chain of eight linked results. Each depends on the one before it; break any link and
the system's claims weaken at that point.

| § | Result | Establishes |
|---|---|---|
| 1 | **Precursor-detectability hypothesis** | *That* prediction is possible — and its necessary condition (separation of timescales) |
| 2 | **Failure-mode physics** | *Why* each failure evolves as it does — the governing balances |
| 3 | **Feature catalog** | *What* every model input physically measures — unit-checked |
| 4 | **Sensitivity matrix & capability graph** | *Which* channel sees which mechanism — the observability map |
| 5 | **Literature grounding** | *That* every equation is a real, cited result — not invented |
| 6 | **Volve data-physics validation** | *That* the physics matches the real data — units, identity, gating |
| 7 | **Model–physics alignment** | *How* the ML respects the physics — independence, labels, fusion |
| 8 | **Scope & novelty reconciliation** | *What* may honestly be claimed — lead-time, scope, contribution |

The single sentence that the whole chain serves:

> **DrillGuard is a coverage-aware, composable framework in which the set of observable failure
> mechanisms is a derived function of the sensor channels available — instantiated as a weighted
> ensemble of three heterogeneous detection paradigms fused into one renormalisable risk score.**

---

## 1. The precursor-detectability hypothesis

**Hypothesis H₀ (Precursor Detectability).** *A drilling failure is predictable from measured data if,
and only if, the physical process that produces it evolves through intermediate states that (i) leave a
measurable signature in the available channels, and (ii) develop over a time long compared with both the
response time and the sampling interval.*

Formally, prediction requires a **separation of timescales**:

$$\tau_{\text{dev}} \;\gg\; \tau_{\text{resp}} \;\gg\; \tau_{\text{sample}}$$

where $\tau_{\text{dev}}$ is the time over which the failure precursor develops, $\tau_{\text{resp}}$ is
the time needed to act on a warning (mud change, circulation, controlled trip), and
$\tau_{\text{sample}}$ is the data sampling interval (Volve real-time: ~10 s). When
$\tau_{\text{dev}} \gtrsim$ tens of minutes, there is room for an actionable warning; when
$\tau_{\text{dev}} \to \tau_{\text{sample}}$, the "prediction" collapses into "detection."

This is a **necessary, not sufficient** condition. Reaching the actionable band (>30 min) is required,
but so is a *gradual, leading* signature: a mechanism can build a dangerous condition over hours yet
provide no waveform that leads the event (differential sticking is the canonical example). Both
conditions must hold.

Applying H₀ to the eight drilling failure modes places each on a timescale spectrum:

![**Figure 1.1 — Failure-mode timescale spectrum.** Each mode on a logarithmic development-time axis,
coloured by detectability class. The shaded band (>30 min) is where actionable lead time is physically
available. Reaching the band is necessary but not sufficient — a gradual leading signature is also
required, which is why differential sticking (in the band) is nonetheless a risk-state, not a
prediction, mode.]({{artifact:ccea6ba3-f8df-4f41-b603-ffb1e394d3a7}})

The classification that results — and governs every scope claim downstream:

| Class | Modes | Basis |
|---|---|---|
| **Predictable (lead time)** | Bit wear (hours), pack-off/hole cleaning (10 min–3 h), slow shale instability (30 min–12 h) | gradual accumulation, leading signature |
| **Mixed** | Lost circulation | ECD creep leads; sudden losses do not |
| **Risk-state (no countdown)** | Differential sticking, mechanical sticking | condition builds; realisation timing not signalled |
| **Detection (minimise latency)** | Kick/influx | signature coincides with event |

**Headline mechanism: pack-off / poor hole cleaning.** It is slow enough to predict (cuttings beds
build over 10 min–3 h) *and* multivariate (it lights up ECD, standpipe pressure, torque, and drag
together), making it the strongest demonstration of both the lead-time claim and the coverage-aware
confidence principle.

---

## 2. Failure-mode physics from first principles

Each mechanism's governing balance is derived below and dimensionally verified (§2.7, and independently
in the feature module, §3). These balances are the ground truth from which all features and the
sensitivity map are derived.

### 2.1 Pack-off / hole cleaning — cuttings mass balance

Cuttings are generated at the bit and transported up the annulus by the mud. A cuttings bed forms — and
pack-off develops — when generation outpaces transport. The mass balance:

$$Q_{\text{gen}} = \text{ROP}\cdot A_{\text{hole}}, \qquad Q_{\text{trans}} = (v_{\text{ann}} - v_{\text{slip}})\cdot A_{\text{ann}}\cdot C$$

with the dimensionless **transport ratio** $R_t = Q_{\text{trans}}/Q_{\text{gen}}$; $R_t < 1$ means beds
accumulate. The particle **slip velocity** (Stokes regime) is

$$v_{\text{slip}} = \frac{g\,d_p^2\,(\rho_s - \rho_f)}{18\,\mu}$$

Cuttings transport is strongly **inclination-dependent** (Tomren, Iyoho & Azar 1986): in deviated
sections beds slump and accumulate on the low side, so the same $R_t$ is more dangerous at high angle.
Pack-off is the physical origin of the correlated ECD↑/SPP↑/torque↑/drag↑ signature — one cause, many
channels:

![**Figure 2.1 — Pack-off mechanism.** (Left) cuttings mass balance: when generation exceeds transport,
a bed grows. (Right) the one-cause→correlated-signature cascade — a single physical event (restricted
annulus) drives ECD, standpipe pressure, torque and drag together. This is the physical basis of
coverage-aware confidence: more channels seeing the same mechanism = higher confidence.]({{artifact:bd87477a-0cf6-4142-a3aa-bf96bade57f3}})

### 2.2 Bit wear — mechanical specific energy

The energy to remove a unit volume of rock — **mechanical specific energy** (Teale 1965) — combines the
axial and rotary work:

$$\text{MSE} = \underbrace{\frac{WOB}{A_b}}_{\text{axial}} + \underbrace{\frac{120\pi\,N\,T}{A_b\,\text{ROP}}}_{\text{rotary}}$$

An efficient bit drills at MSE ≈ 1.5–2× the rock's confined compressive strength. As the bit dulls, the
same rock demands more energy: **MSE rises while ROP falls**. This crossover is the predictive
signature, and it is one of the longest-developing (hours), comparable to slow shale instability
(§2.5). Real-time MSE surveillance (Dupriest & Koederitz 2005) is the established field practice this
feature encodes.

![**Figure 2.2 — Bit wear via MSE.** As the bit dulls, MSE climbs past the efficient 1.5–2×UCS band
while ROP declines — a slow, monotonic crossover that provides hours of lead time.]({{artifact:d518de9d-bd79-4662-8ee9-3cbf888f44e5}})

### 2.3 Formation pressure — the d-exponent

Drilling rate responds to the balance between mud and pore pressure. The **d-exponent** (Jorden &
Shirley 1966) normalises ROP for WOB, RPM and bit size; the mud-weight-corrected form
$d_c$ (Rehm & McClendon 1971) isolates the pore-pressure signal:

$$d = \frac{\log_{10}\!\big(\text{ROP}/(60N)\big)}{\log_{10}\!\big(12\,WOB/(10^6 D)\big)}, \qquad d_c = d\cdot\frac{MW_{\text{normal}}}{MW_{\text{actual}}}$$

Under normal compaction $d_c$ rises with depth; entering overpressure, it **falls** — the classic
overpressure precursor.

### 2.4 Differential sticking — overbalance force (risk-state)

When pipe lies stationary against a permeable formation with an overbalanced mud column, filter cake and
the pressure differential pin it:

$$F_{\text{stick}} = \Delta P \cdot A_{\text{contact}} \cdot f$$

The force builds while the pipe is stationary, but **no measurable channel leads the event** — the stick
is discovered when the pipe won't move. This is why differential sticking is a **risk-state** mode: the
physics justifies a rising risk level (overbalance × stationary time), not a timed prediction.

![**Figure 2.3 — Differential sticking.** (Left) the overbalance force balance pinning stationary pipe.
(Right) risk-state timing: the risk *condition* accumulates measurably, but the *event* is not preceded
by a leading waveform — so the correct output is a risk level, not a countdown.]({{artifact:69081221-c4b5-4d4e-9dce-25470a9eabde}})

### 2.5 Wellbore instability — ECD window and rock failure

The mud weight (as ECD) must sit inside the safe window: above pore/collapse pressure, below fracture
gradient. The annular ECD is

$$\text{ECD} = MW + \frac{\Delta P_{\text{ann}}}{g\cdot \text{TVD}}$$

Rock failure at the wall follows the Kirsch stress solution with a Mohr–Coulomb criterion. Shale
instability can be slow (creep over 30 min–12 h — predictable) or fast (brittle collapse). **Lost
circulation** (§lost) is the ECD > fracture-gradient regime: gradual ECD creep leads, but a sudden loss
into a natural fracture does not — hence *mixed*.

### 2.6 Kicks — influx detection (detection-only)

A kick begins when $P_{\text{pore}} > P_{\text{wellbore}}$ and formation fluid enters the well. The
classic indicators — flow-out > flow-in, pit gain, drilling break, standpipe pressure drop, gas units up
— appear *as the influx starts*, not before it. There is **no precursor waveform** that leads the event
by tens of minutes; the defensible contribution is minimising detection latency $\tau_{\text{detect}}$,
not prediction. (This is why, in §4, kick channels carry **zero lead codes** — all coincident.)

### 2.7 Dimensional verification

Every balance above was verified symbolically (SymPy, base dimensions M, L, T). All pass:

| Relation | Result | Expected |
|---|---|---|
| $Q_{\text{gen}}, Q_{\text{trans}}$ | L³/T | volume flow ✓ |
| Transport ratio $R_t$ | dimensionless | ✓ |
| Slip velocity | L/T | velocity ✓ |
| ECD annular term | M/L³ | density ✓ |
| $F_{\text{stick}}$ | M·L/T² | force ✓ |
| MSE (both terms) | M/(L·T²) | pressure ✓ |

---

## 3. The feature catalog — every input, unit-checked

Twelve physical features translate raw channels into mechanism-relevant quantities. Each is implemented
in `drill_physics_features.py` with **both field and SI forms**, an import-time symbolic dimensional
check, a valid physical range, and the mechanism it serves. All eight symbolic checks pass; the
field-vs-SI MSE cross-check agrees to **0.4 %** (106,738 vs 106,281 psi), confirming the unit
conversions are correct.

| # | Feature | Governs | Self-diagnostic? |
|---|---|---|---|
| 1 | MSE | bit wear, founder | no (relational) |
| 2 | d-exponent | pore pressure | no |
| 3 | $d_c$ (corrected) | overpressure | no |
| 4 | ECD | pressure window | no |
| 5 | ECD margin | losses / instability | no |
| 6 | Transport ratio $R_t$ | hole cleaning | no |
| 7 | Slip velocity | hole cleaning | no |
| 8 | Annular velocity | hole cleaning | no |
| 9 | Overbalance | differential sticking | no |
| 10 | Stick force | differential sticking | no |
| 11 | **Stick-slip index** | torsional vibration | **yes** |
| 12 | Hydraulic horsepower | bit hydraulics | no |

**Three draft errors were corrected here** (see §6 for the unit rationale):
1. Downhole pressure listed in **ppg** (a density unit — a category error) → corrected to psi/bar/Pa.
2. The d-exponent was garbled (`log(ROW/60N)/log(12W/106D)`) → corrected to the proper Jorden–Shirley
   form with `10⁶` and ROP.
3. MSE was garbled (`(2πNT+Wv)/(Av)`) → corrected to the Teale form.

**Only the stick-slip index is self-diagnostic** — meaningful from a single channel. Every other feature
is *relational*: it requires two or more channels to be interpretable (torque means nothing without WOB,
RPM and ROP). This distinction is the basis of the coverage tiers in §4 and §7.

![**Figure 3.1 — Worked feature example.** (Left) MSE rising past the 2×UCS ceiling as the bit dulls.
(Right) $d_c$ rising with depth under normal compaction (mean 1.562) then dropping on entry to
overpressure (1.483) — the textbook precursor, reproduced by the feature code.]({{artifact:87c461eb-9733-4a20-b576-a3e7600742b8}})

---

## 4. The sensitivity matrix & capability graph — the observability map

The core object of the framework: a signed map of **which channel responds to which mechanism**, derived
directly from the §2 balances. Sixteen channels × eight mechanisms, each entry encoding *direction*
(↑/↓/↕), *role* (leads / coincident / context-gate).

![**Figure 4.1 — Parameter–mechanism sensitivity matrix.** Each cell shows how a channel responds to a
mechanism. Green = leading precursor, orange = coincident, lilac = context/gate. The predictable
mechanisms carry multiple green (lead) cells; the risk-state modes and kicks carry none — their
responses are entirely coincident, which is exactly why they support detection or risk-state monitoring
but not prediction.]({{artifact:17e9b0d0-880f-44c3-abe5-85554776ae04}})

Counting lead channels directly from the matrix **verifies the Step 1 classification**:

| Mechanism | Responsive | Lead channels | Class (verified) |
|---|---|---|---|
| Bit wear | 5 | **5** | Predictable ✓ |
| Pack-off / hole cleaning | 5 | **5** | Predictable ✓ |
| Wellbore instability | 3 | **3** | Predictable ✓ |
| Stick-slip | 4 | **4** | (self-diagnostic) ✓ |
| Lost circulation | 5 | 1 (ECD creep) | Mixed ✓ |
| Kick / influx | 6 | **0** (all coincident) | Detection ✓ |
| Differential sticking | 2 | **0** | Risk-state ✓ |
| Mechanical sticking | 4 | **0** | Risk-state ✓ |

The same information as a bipartite graph — the single mental picture of the product:

![**Figure 4.2 — The mechanism↔channel capability graph.** Sensor channels (left, coloured by physical
cluster: mechanical / hydraulic / formation / rig-state) connect to failure mechanisms (right, coloured
by detectability class) via physics-derived edges (solid = leading precursor, dashed = coincident). A
customer's available channels illuminate the mechanisms they intersect — observability is the
intersection.]({{artifact:fe78a95b-cc4a-47f6-92f2-e776dd508074}})

**This graph is the framework.** It makes observability a *derived* quantity: given a customer's channel
set, the mechanisms they can monitor are exactly those whose minimum observable set is covered.
Rig-state channels (block position, hookload, flow) are **context/gate** nodes — they answer "which
physics is valid right now?" before any feature is computed (§6). This is what makes the system
composable: it supports both **parameter-in** (monitor a chosen channel) and **mode-in** (monitor a
chosen failure mode) entry, and it reports its own blind spots.

---

## 5. Literature grounding — every equation is a real, cited result

Every governing equation above traces to a primary source verified by live query to OpenAlex and
Crossref, each with a resolving DOI. Nothing is cited from memory.

| Physics claim | Source | DOI | Verification |
|---|---|---|---|
| MSE | **Teale (1965)** | 10.1016/0148-9062(65)90022-7 | exact, 986 cites |
| Real-time MSE surveillance | **Dupriest & Koederitz (2005)** | 10.2523/92194-ms | exact, 173 cites |
| d-exponent | **Jorden & Shirley (1966)** | 10.2118/1407-pa | exact, 196 cites |
| $d_c$ correction | **Rehm & McClendon (1971)** | 10.2118/3601-ms | exact, 100 cites |
| Cuttings transport (deviated) | **Tomren, Iyoho & Azar (1986)** | 10.2118/12123-pa | exact, 220 cites |
| Cuttings transport (vertical) | **Sifferman et al. (1974)** | 10.2118/4514-pa | exact, 109 cites |
| DTW + Sakoe–Chiba band | **Sakoe & Chiba (1978)** | 10.1109/tassp.1978.1163055 | exact, 6560 cites |
| LSTM-autoencoder anomaly | **Nguyen, Tran & Thomassey (2020)** | 10.1016/j.ijinfomgt.2020.102282 | exact, 480 cites |

**Domain ML prior art (verified):** Al-Mamoori, Tian & Ma (2025) `10.3390/app15095042`; Inoue, Nakagawa,
Kaneko & Wada (2023) `10.1115/omae2023-101928`; Wada & Kaneko (2025) `10.1627/jpi.69.1`; Bimastianto et
al. (2021) `10.2118/202121-ms`; Alshaikh et al. (2019) `10.2523/iptc-19394-ms`; Mal et al. (2022)
`10.2118/208778-ms`.

**Honesty note.** The foundational physics references all resolve exactly. The brief-named ML references
were traced to real authors; Al-Mamoori (2025) resolves exactly. The database query confirmed
*Bimastianto* as a real author of SPE drilling-analytics papers, but did **not** independently verify the
ADNOC affiliation — that detail comes from the project brief and should be confirmed on the paper itself.
SPE OnePetro conference papers are under-indexed in open databases, so the exact conference-paper DOIs
should be confirmed on SPE OnePetro directly before final submission — the authors and research lines are
real; the specific identifiers are the only open item. Full set with grounding: `step5_references.csv`
(14 DOI-verified entries).

---

## 6. Volve data-physics validation

**Well-identity correction.** The draft's *"Well 31/5-7, West Hercules rig, TD 2,915 m"* is incorrect on
every count. Against public Volve records:

| Attribute | Draft (wrong) | Verified |
|---|---|---|
| Block / quadrant | 31/5 | **15/9 (PL 046)** — quadrant 31 is Troll, a different field |
| Well series | 31/5-7 | **15/9-F series** (F-1B, F-4, F-5, F-11, F-12…) |
| Rig | West Hercules (semisub) | **Mærsk Inspirer** (jack-up MODU) |
| Reservoir | — | **Hugin Fm**, Jurassic sandstone, ~2700–3100 m TVD |
| Field life | — | Feb 2008 – Sep 2016, ~63 MMbbl |

The specific 15/9-F wellbore used must be read from the LAS/WITSML header and named. Full table:
`step6_volve_identity.csv`.

**Unit conventions.** Volve is a metric/SI North Sea dataset: depth in m, ROP in m/hr, pressures in
bar/kPa, mud weight in s.g./kg/m³. The **SI feature forms are therefore primary**; the field forms are
for cross-checking. This confirms the §3 unit corrections.

**The time-indexing / rig-state trap — the most important data-physics point.** Volve data is
time-indexed. At every pipe connection ROP drops to zero and depth freezes — a **rig-state artifact, not
a drilling anomaly**. A model not gated by rig state will fire false alarms on every connection and
compute garbage MSE when ROP ≈ 0.

![**Figure 6.1 — The time-indexing trap.** (a) Time-indexed ROP falls to zero at a connection; (b) in
the same window bit depth is frozen — no hole is made. Rig-state channels (block position, flow) must
gate which physics is active, or every connection is a false positive. This is why rig-state channels
are context/gate nodes in Figure 4.2.]({{artifact:f7649de9-1b7f-4ed5-a00d-5b748ffb8790}})

**Operational rule:** compute drilling-mechanism features only on samples flagged *"on bottom &
circulating"*; segment the series by rig state first.

**Open item.** Whether timestamped NPT ground-truth events exist for the chosen well decides whether the
empirical chapter is a labelled *validation* or a *demonstration* of physically-consistent risk — state
which honestly.

---

## 7. Model–physics alignment

**Each paradigm detects a distinct physical signature class** — the physical justification for combining
them:

| Paradigm | Detects | Competent for |
|---|---|---|
| Random Forest (S_base) | *point* deviation | instantaneous operating point out of range |
| LSTM-autoencoder (S_LSTM) | *temporal* deviation | a **trend** departing from learned dynamics |
| DTW (S_DTW) | *shape* match | a characteristic waveform morphology |

The LSTM carries the largest weight (0.45) because the headline mechanisms (pack-off, bit wear) are
fundamentally *trend* problems — gradual correlated drift — exactly what a sequence reconstruction error
captures. **Weight follows the dominant precursor type**; it is a physical statement, not a tuned
constant.

**Integrity threat 1 — paradigm independence.** If the DTW pattern library is built from LSTM-flagged
anomalies, S_DTW is not independent evidence and fusion double-counts. *Resolution:* DTW templates must
come from **physics-defined waveforms** (the §2 mechanism signatures) or **documented NPT events** —
never from LSTM output. This gives the three paradigms independent evidential provenance.

**Integrity threat 2 — label circularity.** If "anomalous" labels come from a threshold rule and the
system is evaluated against that same rule, it learns nothing beyond the threshold. *Resolution:* a
labelling hierarchy — documented ground truth > physics-consistency labels (multiple features crossing
in the correlated pattern the mechanism predicts) > weak/heuristic (declared as such) — with the rule
that evaluation never reuses the labelling rule.

**Coverage-aware fusion.** The thesis's fixed weighting generalises to fuse only the *active* monitors,
renormalised over the available set:

$$\text{Risk}(t) = 100 \cdot \frac{\sum_{k \in \mathcal{A}(t)} w_k\, S_k(t)}{\sum_{k \in \mathcal{A}(t)} w_k}$$

![**Figure 7.1 — Coverage-aware fusion.** The fixed-weight fusion (0.35/0.45/0.20) is recovered exactly
in the full-coverage case (left). As paradigms or channels drop out, weights renormalise over the
available set so the risk score stays on 0–100 and interpretable — and the system reports which monitors
were active.]({{artifact:03bf52a4-7e48-4d17-be7c-b8be8586f9b8}})

**The fixed weighting is exactly the full-coverage special case.** This is the precise sense in which
the framework (Layer 1) subsumes the three-paradigm instantiation (Layer 2): the thesis's headline
equation is one point in a family, recovered when every monitor is available.

---

## 8. Scope & novelty — what may honestly be claimed

**Lead-time (per mechanism, not blanket).** Prediction is claimed only where the physics guarantees it:
bit wear (hours), pack-off (10 min–3 h), slow shale (30 min–12 h). Differential and mechanical sticking
are reported as **risk-state** (no countdown); kicks as **detection** (minimise latency). The blanket
">30 min for all failures" is replaced by a mechanism-conditioned claim.

**Scope (three honest tiers).** Prediction / risk-state / detection, each with its own success metric
(lead time / risk calibration / detection latency). Claiming tier-1 for all modes is the error;
presenting the three tiers is the defensible and more sophisticated position.

**Novelty (bounded against verified prior art).**

> *To our knowledge, no published drilling-failure system fuses three heterogeneous detection paradigms —
> supervised point classification, unsupervised temporal (sequence-reconstruction) anomaly detection,
> and shape-based pattern matching — into a single weighted, coverage-aware risk score with tiered
> multi-channel alerting. Prior ML systems for drilling failure (Al-Mamoori 2025; Kaneko/Inoue 2023;
> Mal 2022; Alshaikh 2019) apply a single paradigm, typically to one failure mode on a fixed sensor
> set.*

**Guardrails:** do *not* claim novelty of the individual paradigms (each is decades-old and cited); do
*not* claim "first ML for drilling failure" (the verified prior art disproves it); *do* claim the
novelty of the *combination* — heterogeneous-paradigm fusion + coverage-aware scoring + physics-derived
observability + tiered alerting. The strongest, most durable contribution is the **framework layer**: a
monitoring system whose observable scope is a derived function of its sensor channels, reporting risk
conditioned on its own coverage.

---

## 9. The reconciled contribution statement

> *DrillGuard is a coverage-aware, composable framework for drilling-failure monitoring in which the set
> of observable failure mechanisms is derived from the sensor channels available, via a physics-grounded
> mechanism↔channel map. It is instantiated as a weighted ensemble of three heterogeneous paradigms —
> supervised point classification (Random Forest), unsupervised temporal anomaly detection (LSTM
> autoencoder), and shape-based matching (DTW) — fused into a single renormalisable risk score with
> tiered, multi-channel alerting. Lead-time prediction is claimed only for mechanisms whose physics is
> dominated by gradual accumulation (bit wear, pack-off); risk-state and detection modes are reported as
> such. The three-paradigm, coverage-aware composition is, to our knowledge, not present in the prior
> literature.*

---

## Appendix — supporting artifacts

| Artifact | Contents |
|---|---|
| `step1_precursor_hypothesis.md` | H₀ formalisation, timescale classification |
| `step2_failure_mode_physics.md` | Full derivations, all 8 mechanisms |
| `drill_physics_features.py` | 12 unit-checked features (field + SI, symbolic checks) |
| `step3_feature_catalog.md` | Feature reference |
| `step4_capability_matrix.md` | Sensitivity matrix + minimum observable sets |
| `step5_references.csv` | 14 DOI-verified references |
| `step6_volve_validation.md` | Well identity, units, gating, QC checklist |
| `step7_model_physics_alignment.md` | Independence, labels, coverage-aware fusion |
| `step8_scope_novelty_reconciliation.md` | Lead-time, scope, novelty boundary |
| `DrillGuard_Conceptual_Foundation.md` | The composable-framework mental model |

*All governing equations dimensionally verified in SymPy; all references verified via OpenAlex +
Crossref with resolving DOIs; all figures generated from the derived physics. This foundation is
established and verified prior to model construction, as required.*

