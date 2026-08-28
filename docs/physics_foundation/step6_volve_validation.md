# Step 6 — Volve Data-Physics Validation Report

*Physical Foundations, §6. This section validates that the physics of §§1–5 is compatible with the
*actual* Volve dataset — correcting the well-identity errors in the draft, fixing the channel-unit
conventions, and establishing the time-indexing and rig-state rules the features depend on. Because the
raw files were not available in this environment, validation is at the **specification level**: every
field-identity fact below was retrieved from public Volve sources (Equinor's Volve data-sharing pages,
the Norwegian Petroleum Directorate field record, and the Rigzone rig-contract report), with a runnable
checklist for the student to execute against the files. Facts should be re-confirmed against the primary
Equinor documentation before final submission.*

---

## 6.1 Well-identity correction (the draft is wrong on every count)

The draft states *"Well 31/5-7, West Hercules rig, TD 2,915 m."* Against public Volve records, each of
these is incorrect:

| Attribute | Draft (WRONG) | Verified (public Volve records) | Why the draft is wrong |
|---|---|---|---|
| Quadrant / block | 31/5 | **15/9 (licence PL 046)** | Quadrant 31 is the Troll area, northern North Sea — not Volve |
| Well series | 31/5-7 | **15/9-F series** (F-1B, F-4, F-5, F-7, F-11, F-12, F-14, F-15…) | Volve wells are all 15/9-F/-19 designations |
| Rig | West Hercules | **Mærsk Inspirer** (jack-up MODU) | West Hercules is a Seadrill *semisubmersible* — wrong rig and wrong class |
| Storage vessel | — | **Navion Saga** (FSO) | drilling + production ran simultaneously |
| Reservoir | — | **Hugin Fm**, Middle Jurassic sandstone, ~2700–3100 m TVD | capped by Draupne Fm shale |
| Field life | — | **Feb 2008 – Sep 2016**, ~63 MMbbl, ~80–91 m water | operator StatoilHydro → Equinor |

**This matters for defensibility.** A supervisor familiar with Norwegian Continental Shelf fields will
recognise "31/5-7, West Hercules" as belonging to a different field entirely; leaving it in the thesis
signals the student never opened the data headers. The correct identity — **Volve, block 15/9, PL 046,
Mærsk Inspirer** — must replace it throughout. The specific 15/9-F well used should be read directly
from the LAS/WITSML header and named explicitly (the open dataset includes ~24 wellbores; the
discovery well is 15/9-19).

> **Sources (retrieved via web search):** Equinor Volve data-sharing pages; Norwegian Petroleum
> Directorate field record; Rigzone (StatoilHydro rig contract: *Mærsk Inspirer* + *Navion Saga*). The
> University of Stavanger real-time Volve drilling-data release (WITSML→CSV; A. Tunkiel et al.) is the
> commonly-cited source for the time-indexed surface logs — confirm the exact author list and citation
> against the paper directly before citing it in the thesis.

---

## 6.2 Channel-unit conventions (correcting the ppg category error)

The unit correction from Step 3 §3.1 is confirmed against Volve field practice (metric/SI-dominant,
North Sea):

| Quantity | Draft unit | Correct unit (Volve/SI) | Feature |
|---|---|---|---|
| Downhole / annular pressure | **ppg** (density!) | **bar / kPa / psi** | overbalance, ECD margin |
| Mud weight, ECD | ppg or **sg (s.g.)** | **s.g. or kg/m³** (Volve metric) | ECD, transport |
| Depth (MD/TVD) | ft (draft) | **m** (Volve metric) | all depth-indexed features |
| ROP | ft/hr | **m/hr** (Volve metric) | MSE, d-exponent |
| WOB | klbf | **tonnes / kN** (Volve metric) | MSE |
| Torque | ft·lbf | **kN·m** (Volve metric) | MSE, pack-off |
| Flow | gpm | **L/min or m³/min** | hole cleaning, kick |

Volve is a metric-unit North Sea dataset, so the **SI feature forms in `drill_physics_features.py` are
the primary path**; the field-unit forms are for cross-checking. The feature module already carries
both and cross-verifies them (Step 3: MSE field/SI agree to 0.4 %), so the unit conversion is a
solved problem — the requirement is only to read each channel's header unit and route it to the SI form.

---

## 6.3 The time-indexing / rig-state trap (the important physics point)

Volve real-time data is **time-indexed** (regular sampling in *time*), not depth-indexed. This creates a
trap that a naive model will fall into:

![Data-physics trap. (a) A time-indexed ROP trace drops to zero at every connection — a rig-state
artifact, not a drilling anomaly. (b) In the same window bit depth is frozen: no new hole is made. The
rig-state channels (block position, flow) must gate which physics is active, or every connection
generates a false alarm.]({{artifact:f7649de9-1b7f-4ed5-a00d-5b748ffb8790}})

**The physics is only "on" when the bit is on bottom and circulating.** During connections, tripping,
and off-bottom time, ROP → 0, WOB → 0, and MSE is undefined (division by ROP → ∞). These are **not**
anomalies — they are routine operations. If the model is not gated by rig state, it will:

- fire false positives on every connection (ROP collapse looks like a "drilling break");
- compute garbage MSE / d-exponent when ROP ≈ 0;
- misread pumps-off pressure drops as losses or kicks.

This is exactly why **rig-state / geometry channels (block position, hookload, flow) are *context/gate*
nodes** in the capability graph (Step 4), not failure-signal nodes. Their physical job is to answer
*"which physics is valid right now?"* before any feature is computed. The operational rule:

> Compute drilling-mechanism features **only** on samples where the rig state is *"drilling on bottom,
> circulating"* (flow > threshold, off-bottom flag false, block moving down). Segment the time series by
> rig state first; apply the mechanism physics per segment.

This single rule prevents the most common false-alarm failure mode of drilling-ML systems and is a
direct consequence of the time-indexing.

---

## 6.4 Validation checklist (for the student to run on the files)

A runnable, physics-grounded QC checklist to execute against the actual LAS/WITSML/CSV:

1. **Identity:** read the well header; record the exact 15/9-F wellbore, rig (`Mærsk Inspirer`), MD/TVD,
   hole sections. Replace "31/5-7 / West Hercules" everywhere.
2. **Units:** for each channel, read the header unit; confirm depth in m, ROP in m/hr, pressures in
   bar/kPa, mud weight in s.g./kg/m³. Route each to the SI feature form.
3. **Sampling:** confirm the time interval per file (draft says 10 s — verify; WITSML exports vary).
   Check for gaps and resampling needs.
4. **Rig-state gating:** derive the "drilling on bottom & circulating" mask from flow + block position +
   bit-vs-hole depth. Confirm ROP→0 windows coincide with connections.
5. **Feature sanity:** compute MSE on the on-bottom mask; confirm efficient intervals fall at
   1.5–2×UCS (Hugin sandstone UCS ~ literature); confirm d_c behaves with depth.
6. **Physical-range gates:** apply each feature's valid range (Step 3) as a data-quality filter; flag
   out-of-range as sensor faults, not failures.
7. **Event ground truth:** locate any documented NPT events (daily drilling reports, if released) to
   time-anchor the precursor test of H₀ (Step 1). If none are available, the empirical chapter is a
   *demonstration* of physically-consistent risk, not a labelled *validation* — state which honestly.

---

## 6.5 What this fixes

- The **well-identity errors** (31/5-7, West Hercules) are corrected to the verified Volve identity
  (15/9, PL 046, Mærsk Inspirer) — removing an error a Volve-literate examiner would catch instantly.
- The **unit conventions** are pinned to Volve's metric/SI basis, confirming the Step 3 correction and
  designating the SI feature forms as primary.
- The **time-indexing / rig-state gating rule** is established as a first-class physical requirement —
  the single most important data-physics point, and the reason rig-state channels are gates in the
  graph.
- Open item (§6.4 step 7): whether timestamped NPT ground-truth exists for the chosen well decides
  whether the empirical chapter is framed as *validation* or *demonstration*.

---

*Status: Step 6 complete (specification-level; raw files not in environment). Deliverables — this
report, the identity-correction table (`step6_volve_identity.csv`), and Figure 6.1
(`fig8_timeindex_gating.png`). Next: Step 7 — resolve model-physics alignment (DTW–LSTM independence,
synthetic-label integrity) and coverage-aware fusion.*
