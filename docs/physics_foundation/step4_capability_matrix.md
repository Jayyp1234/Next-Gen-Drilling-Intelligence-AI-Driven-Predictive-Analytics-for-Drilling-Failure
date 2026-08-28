# Step 4 — Parameter–Mechanism Sensitivity Matrix & Capability Graph

*Physical Foundations, §4. This section assembles the derivations of §2–§3 into the central object of
the coverage-aware system: the physics-derived map from **sensor channels** to **failure mechanisms**.
It is presented three ways — a signed sensitivity matrix, a bipartite capability graph, and a
minimum-observable-set per mechanism — and then read in both directions (parameter-in and mode-in) to
define the dynamic, bring-your-own-channels product behaviour.*

---

## 4.1 The sensitivity matrix

Each cell records how a channel responds to a mechanism, with **direction** (↑ rises, ↓ falls, ↕
erratic) and **role**: **lead/precursor (L)** — moves *before* the event, the basis of prediction;
**coincident (C)** — moves *with* the event, the basis of detection; **context/gate** — sets the
expectation or the rig-state, does not itself signal failure. Every entry is grounded in the §2
governing balances, not assigned by intuition.

![Parameter–mechanism sensitivity matrix. Green cells are lead/precursor responses, orange coincident,
lavender context/gate; glyphs give the direction of change. Precursor (green) responses cluster on the
PREDICTABLE mechanisms (bit wear, pack-off, wellbore instability, stick-slip); the RISK-STATE
mechanisms (differential and mechanical sticking) show only coincident responses — the visual
confirmation of their Step 1 classification.]({{artifact:652704d5-d1a3-4620-8b4e-59d975666937}})

**The matrix is self-verifying against Step 1.** The mechanisms classified PREDICTABLE carry multiple
*lead* channels; the RISK-STATE mechanisms *and* the DETECTION mode (kicks) carry **zero lead
channels** — their responses are entirely coincident with the event, which is exactly why they support
detection or risk-state monitoring but not prediction. Counted directly from the matrix:

| Mechanism | Responsive channels | Lead/precursor channels | Consistent with Step 1 class |
|---|---|---|---|
| Bit wear | 5 | **5** | PREDICTABLE ✓ |
| Pack-off / hole cleaning | 5 | **5** | PREDICTABLE ✓ |
| Wellbore instability | 3 | **3** | PREDICTABLE ✓ |
| Stick-slip | 4 | **4** | (self-diagnostic) ✓ |
| Lost circulation | 5 | 1 (ECD creep) | MIXED ✓ |
| Kick / influx | 6 | **0** (all coincident) | DETECTION ✓ |
| Differential sticking | 2 | **0** | RISK-STATE ✓ |
| Mechanical sticking | 4 | **0** | RISK-STATE ✓ |

*(Full signed matrix: `step4_sensitivity_matrix.csv`.)*

---

## 4.2 The capability graph

The same information as a **bipartite graph** — the single mental picture of the product. Channels
(left, coloured by physical cluster) connect to mechanisms (right, coloured by detectability class) via
physics-derived edges (solid = precursor, dashed = coincident).

![The mechanism↔channel capability graph. A customer's available channels (left) illuminate the
mechanisms (right) they can observe; solid edges carry lead time, dashed edges only coincident
detection. The four channel clusters — mechanical, hydraulic, formation, rig-state — are the sparse,
physically-grounded structure that makes modular monitoring possible.]({{artifact:617936b8-7401-4e8b-a237-bd75d3c46e59}})

The graph makes two structural facts visible:

1. **Couplings are sparse and clustered, not all-to-all.** Channels fall into four physical families —
   **mechanical** (RPM, torque, WOB, ROP, stick-slip, shock), **hydraulic** (ECD, SPP, downhole
   pressure, flow, pit, mud weight), **formation** (gamma ray, temperature), **rig-state** (block
   position, hookload). Mechanisms draw their edges predominantly from *within* a cluster (pack-off is
   hydraulic + the mechanical torque bridge; bit wear is mechanical). This sparsity is what makes the
   system decomposable into independent monitors.
2. **Predictability is legible in the edges.** Bit wear and pack-off are connected by many *solid*
   (precursor) edges; differential and mechanical sticking connect only by *dashed* (coincident) ones.
   The graph *shows* why the first two support prediction and the last two do not.

---

## 4.3 Minimum-observable-sets (the coverage layer)

For each mechanism, the **minimum-observable-set (MOS)** is the smallest channel set that lets its
*primary derived feature* be computed — i.e. that unlocks **mechanism-level diagnosis**, not just
univariate anomaly detection. Adding the **enhanced** channels raises confidence through correlated
confirmation.

| Mechanism | Primary derived feature | # min channels | Minimum observable set |
|---|---|---|---|
| Bit wear | MSE + ROP trend | 4 | WOB, Collar RPM, Torque, ROP |
| Pack-off / hole cleaning | ECD trend + transport ratio | 3 | ECD, Standpipe pressure, Torque |
| Differential sticking | overbalance ΔP + stationary time | 3 | Downhole pressure, Mud weight, Block position |
| Mechanical sticking | erratic torque/drag + restricted movement | 3 | Torque, Hookload, Block position |
| Lost circulation | ECD margin + pit/flow deficit | 3 | ECD, Pit volume, Flow-in/out |
| Wellbore instability | torque/drag + ECD, cavings | 3 | Torque, ECD, ROP |
| Kick / influx | flow / pit gain (detection) | 2 | Flow-in/out, Pit volume |
| **Stick-slip** | **stick-slip index (self-diagnostic)** | **1** | **Stick-slip** |

**Stick-slip is the only single-channel mechanism** — the physical reason a customer *can* legitimately
monitor "just one parameter" and get a real mechanism read. Every other mechanism needs its cluster.
*(Full detail incl. enhanced/context sets: `step4_minimum_observable_sets.json`.)*

> **Honest coverage limit recorded:** wellbore instability's best physical indicators (caliper,
> caving morphology) are **not** in the Volve surface channel set. Its MOS here is a *proxy* (torque/drag
> + ECD); the system must report instability coverage as **partial** on Volve-class data.

---

## 4.4 Reading the matrix in both directions (the product behaviour)

Because the matrix is a relation, it answers both customer entry points from one object:

**Parameter-in** (customer declares sensors → system lights up observable mechanisms):

| Customer provides | Mechanisms unlocked (diagnosis) | Mechanisms dark |
|---|---|---|
| Stick-slip only | Stick-slip (self-diagnostic) | all hydraulic & sticking modes |
| ECD + SPP + Torque | **Pack-off / hole cleaning** (full) | bit wear (no WOB/RPM), kicks (no flow/pit) |
| WOB + RPM + Torque + ROP | **Bit wear** (full), stick-slip (partial) | all hydraulic modes |
| Hydraulic cluster (ECD, SPP, flow, pit) | Lost circulation, kicks, pack-off (partial) | bit wear, sticking |
| Full canonical + hydraulic | all targeted modes (instability partial) | — |

**Mode-in** (customer names feared failures → system requires channels): invert the MOS table — the
customer is told exactly which channels each chosen mechanism needs, and which of theirs are missing.

**Graceful degradation.** Because one physical cause perturbs several channels (§2.1), a mechanism
whose MOS is only *partially* met is often still *partially* observable through the channels present —
at reduced confidence — rather than going fully dark. The system reports this as a **coverage state**
(full / partial / dark) per mechanism, never a silent gap.

---

## 4.5 What this fixes for the architecture

- The matrix/graph **is** the coverage-aware system's core data object — one physics-derived relation,
  queried forward (parameter-in) or backward (mode-in).
- The MOS defines **when a monitor may activate** — a monitor turns on only if its minimum set is
  present, guaranteeing no mechanism is scored on inadequate inputs.
- The per-mechanism **coverage state** is the input to the coverage-aware fusion of Steps 7–8: the risk
  score aggregates only *active* monitors and carries its own coverage, and the fixed-weight fusion
  (0.35/0.45/0.20) is recovered only in the full-coverage case.

---

*Status: Step 4 complete. Deliverables — this document, the sensitivity matrix
(`fig6_sensitivity_matrix.png`, `step4_sensitivity_matrix.csv`), the capability graph
(`fig7_capability_graph.png`), and the minimum-observable-sets (`step4_minimum_observable_sets.json`,
`step4_mos_table.csv`). Next: Step 5 — ground every physical claim and governing equation in real,
retrieved literature.*
