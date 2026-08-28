# DrillGuard / EDIM — Project Context for Claude Code

This file is auto-loaded by every Claude Code session in this repo. Read it before suggesting actions.

---

## Who & What

- **Owner**: Okeke Johnpaul Ebube — final-year (500L) Petroleum & Gas Engineering, University of Lagos. Matric 180808058.
- **Supervisor**: Dr Etaje Darlington
- **Project**: DrillGuard (a.k.a. EDIM — Execution-phase Drilling Intelligence Module)
- **Goal**: Real-time ML system that predicts drilling failures (stuck pipe, kicks, lost circulation, ROP) and alerts the crew before incidents escalate
- **Submissions targeted**:
  - PIDEC 1.0 hackathon (Stage 1 proposal already drafted; Stage 2 demo pending)
  - CODET Zonal Engineering Competition — South-West Nigeria
  - Final-year capstone defense
- **Git user**: Okeke Johnpaul (`okekejohnpaul12@gmail.com`)
- **Main branch**: `main`

---

## How the User Likes to Work — READ THIS

1. **Understand BEFORE building.** The user explicitly rejected fast-build approaches. Sequence work as **Phase 0 (understand) → Phase 1 (design) → Phase 2 (build)**. Get sign-off at each transition. Skipping phases gets pushback.
2. **Demo must work end-to-end — no mocks.** When code is being written, the goal is a real working system: real auth, real DB queries, real ML inference, real alerts. Do not describe mocked things as working.
3. **Be brutally honest about state.** The codebase looks more complete than it is. Inflated progress claims get pushback. Verify before claiming.
4. **Numbers, not vibes.** Quantify everything in user-facing claims. Vague impact statements will be challenged.
5. **Match scope to one student, multi-month timeline.** The Enterprise Roadmap assumes a 6-7 person team with $400-600k. Do NOT propose that scope. Aim for capstone MVP.
6. **Domain framing, not generic CS.** The user is a petroleum engineer. Frame ML/system choices in physics + drilling-engineering terms.

---

## Current State (as of 2026-06-25)

### What's REAL
- `frontend/web-dashboard/` — React 18 + Vite + TS + Tailwind. 7 pages, 18 components, real Recharts with drag-zoom, dark/light theme. **All data is mocked via `mockData.ts`.** ~65% complete.
- `chapters/chapter1_introduction.md`, `chapter2_literature_review.md`, `chapter3_methodology.md` — thesis chapters drafted. Chapter 4 (Results) and 5 (Conclusion) **not started**.
- `chapters/synopsis.md` — university-facing project synopsis.
- `chapters/PIDEC_proposal_v2.md` — PIDEC Stage 1 hackathon proposal, rewritten with concrete numbers + held-out-well methodology. **Contains placeholder F1=0.76, lead=28min, FAR=1.5/day — these are LITERATURE-GROUNDED TARGETS, not measured. See HTML comment at top of file.**
- `docs/PHYSICS_PRIMER.md` — 5,847 words. Sensor glossary, failure-mode signatures, physics-informed features. **WRITTEN.**
- `docs/LITERATURE_BENCHMARKS.md` — 4,441 words, 30 citations. Published F1/precision/recall targets per task; includes the held-out-well methodology insight. **WRITTEN.**
- `docker-compose.yml` — production-grade local stack definition (Postgres + TimescaleDB + Redis + RabbitMQ + MLflow). Not yet stood up.
- `EDIM_Enterprise_Roadmap.md` — Aspirational. Useful context, NOT a delivery plan for one student.

### What is NOT real (despite folder structure suggesting otherwise)
- `services/*` — 5 microservice folders exist with Dockerfiles and READMEs, but Python files are empty `__init__.py`. **Zero working endpoints.**
- `ml-pipeline/` — empty folders with `.gitkeep`. **No trained models, no training scripts, no artifacts.**
- `database/migrations/` — empty. **No Alembic migrations, no SQL schemas.**
- `tests/` — empty. **Zero tests.**
- `.github/` — empty. **No CI.**
- `infrastructure/k8s/`, `terraform/`, `airflow/` — empty templates.
- `shared/`, `config/` — empty.

### Realistic overall completion: ~20–25%
| Layer | % |
|---|---|
| Thesis writing | 60% |
| Frontend | 65% (mocked) |
| Backend | 5% |
| ML pipeline | 0% |
| Tests / Infra | ~5% |

---

## The Data — KEY UNDERSTANDING

### 1. ⚠️ `Volve dataset/` IS NOT VOLVE — it is well 31/5-7 (Eos), 111 MB, Equinor

**Verified 2026-07-29 by reading every LAS/ASC header.** All files report
`WELL: 31/5-7`, `FIELD: EOS`, `COMPANY: Equinor Norway`, survey date 03.12.2019,
log dates Dec 2019. Volve is block 15/9, produced 2008–2016 — a different well entirely.
**Never cite this as "Volve"** in the thesis, proposals, or at defense; that is a
provenance misattribution an examiner will check. Call it **"31/5-7 (Eos)"**.

- **ONE wellbore, not 9 wells.** The 10 time-indexed LAS files are 10 runs/passes on the
  same wellbore: 84,757 rows @ 10 s ≈ 235 hours. **Held-out-well evaluation is
  IMPOSSIBLE on this dataset** — only Bilabri's 4 wells support that protocol.
- Actual channel set (complete): `TIME`, `DEPTH`, `GR`, `BLKP`, `STICK`, `CRPM`,
  `SHKRSK`, `SHKPK`, `ECD`, `DHAT`, `DHAP`, `TEMP_DNI`. Metric/SI units.
- **MISSING: WOB, torque, standpipe pressure, flow in/out, hookload, hole depth, pit
  volume, mud weight.** Therefore **MSE and d-exponent are NOT computable** on this data,
  and no minimum-observable-set is satisfied (pack-off 1/3, bit wear 1/4).
- **Unique value**: `STICK` is an *instrument-measured* stick-slip channel — a real
  mechanism label with provenance independent of ECD/torque. Plus ECD + DHAP downhole.
  This is the one thing Bilabri lacks. Use it for a **separate** downhole-signature study.
- Rig-state gating: MWD mud-pulse telemetry only transmits while pumps run, so telemetry
  arrival is the *circulating* proxy for the missing `flow_in`. ⚠️ **Measured 2026-07-30
  (`gating.py`): the proxy channels are the RT telemetry set (`STICK`/`CRPM`/`SHKRSK`/`SHKPK`),
  NOT ECD/DHAP** — those are `(RM)` memory channels recorded downhole and merged after the
  run, present even with pumps off. An earlier note here claimed ECD/DHAP nullness as the
  proxy; the first data row of MWD_1 (ECD present, all four RT channels null) falsifies it.
- Events: only `CORING_..._REPORT_1.PDF`. **No DDR, no NPT log, no end-of-well report** →
  anchors here can only be `physics_derived` → claim is **demonstration, not validation**.

### 2. ✅ USROP — the REAL Volve data (`ml-pipeline/data/usrop/`, 34 MB) — **PRIMARY**

Downloaded 2026-07-29 from `github.com/AndrzejTunkiel/USROP`. Equinor Volve real-time
WITSML converted to CSV by the University of Stavanger.
**Licence: CC BY-NC-SA 4.0 — attribution required, non-commercial only.**
Cite: Tunkiel, A.T., Sui, D., Wiktorski, T. (2020) *Reference dataset for rate of penetration
benchmarking*, J. Pet. Sci. Eng. **196**, 108069. doi:10.1016/j.petrol.2020.108069

- **7 wells** (15/9-F series: F-5, F-7, F-9, F-9A, F-14, F-15, F-15S) — **held-out-well is
  genuinely possible here.** 198,928 rows, **~537 h** reconstructed on-bottom drilling time
  (⚠️ a naive `dz/ROP` sum reads ~706 h, but 168 h of that comes from bridging the gaps left
  where off-bottom intervals were removed at dataset build time — single dz steps up to
  166 m charged at the post-gap ROP. `gating.py` excludes steps with dz > 1 m. **Never quote
  ~710 h.**)
- 12 channels: `Measured Depth`, `Weight on Bit`, `Average Standpipe Pressure`,
  `Average Surface Torque`, `Rate of Penetration`, `Average Rotary Speed`, `Mud Flow In`,
  `Mud Density In`, `Diameter` (bit), `Average Hookload`, `Hole Depth (TVD)`, `USROP Gamma`.
- **MSE and d-exponent ARE computable** (has WOB + torque + RPM + ROP + bit diameter +
  mud density). Bit-wear MOS **4/4**. Pack-off MOS **2/3** — **no ECD** is the one real gap.
- Missing: ECD, block position, hole depth (the `Hole Depth (TVD)` column is TVD, not hole
  depth — misleading name), flow out, pit volume, downhole pressure, timestamps.
- **Depth-indexed**, median dz ≈ 0.03–0.05 m. `dz/ROP` reconstruction gives
  **0.06–0.35 min/sample even at 5th-percentile ROP** — fine enough to defend latency and
  lead-time claims in minutes. This is its decisive advantage over Bilabri.
- ⚠️ The UiS mirror `ux.uis.no/~atunkiel/` named in the handoff brief returns a hard **403**.
  Don't retry it — use the GitHub repo.

### 3. Bilabri (`actual data/`, 378 MB, Nigerian proprietary, 2005–2006)
- 4 wells in same field (BILABRI DEEP-1, D2, D3, D4)
- **47 plain-text data files** in 5 categories:
  - **DRLPAR**: `Depth | TVD | ROP | WOB | RPM | Torque | Pump Pres | GPM | Temp In | Temp Out`. Tab-delimited. PARSE-READY.
  - **GASROP**: `Depth | TVD | ROP | Gas(units) | C1 | C2 | C3 | iC4 | nC4 | C5`. KICK INDICATORS.
  - **MWD ASCII**: formation evaluation (GR, resistivity, density, porosity) — for LITHOLOGY CONTEXT for the ROP model, NOT drilling mechanics.
  - **MWD LAS**: text-format LAS files readable by `lasio`.
  - **Surveys**: directional only, not useful for failure prediction.
- **61 .zip files** — DRLPAR/GASROP zips contain text (immediately usable); MUDLOG zips contain only PDFs (would need OCR).
- **`AM GEOL RPT` .xls daily reports — MINED 2026-07-29.** ✅ See below.

### ✅ STEP 0 RESOLVED — documented events EXIST → the claim is VALIDATION

Extractor: `ml-pipeline/etl/extract_geol_events.py` (needs `xlrd`; legacy OLE2 .xls,
label-driven parsing because column positions drift between wells).
Outputs → `ml-pipeline/artifacts/`: `event_inventory.md`, `geol_reports.csv`, `geol_reports.json`.

**119 reports parsed across all 4 wells, 0 failures.** 51 HIGH + 26 PRECURSOR candidates;
**37 event mentions fall inside depth ranges that have DRLPAR channel data.**

Per the handoff brief's STEP 0 branch table, this means anchors are **`documented`**, so the
empirical chapter claims **labelled validation — the strongest outcome** — not demonstration.
Say so plainly, and never describe a demonstration as a validation.

Documented incidents with channel coverage, by mechanism:
| Well | Date | Depth | Mechanism | Verbatim |
|---|---|---|---|---|
| D2 | 2006-08-17 | 1659 m | stuck pipe (fault) | "encountered fault with associated pipe stuck & **sudden increase in torque (f/3-41 Amps)**" |
| D2 | 2006-09-08 | 3129–3229 m | **pack-off** | "Backreamed f/3229 to 3129m & hole packed off" |
| D2 | 2006-09-10/11 | 3229 m | string severed | string shot → back-off → sidetrack |
| D3 | 2006-10-27 | 2541 m | fishing | "observed pressure increase of 850psi" |
| D4 | 2006-12-09 | 950 m | lost circulation | "Lost returns" → 3 LCM pills → "Still no returns" |
| D4 | 2006-12-31 | 2591 m | stuck pipe + well control | "Shut well in, stuck pipe" |
| D4 | 2007-01-04→11 | 2591 m | sustained kill ops | cumulative losses 341 → 656 → **984 bbls** |
| DEEP-1 | 2005-12-18→20 | 1529 m | **differential sticking** | "Casing differentially stuck" (3 days working it) |

Mechanism diversity is real: differential sticking, pack-off, fault-induced sticking, lost
circulation and well control are *different physics* with different signatures — exactly the
spread needed to show where fusion helps and where it does not.

**Two channels recovered as a by-product** (neither exists in DRLPAR):
- **mud weight** in 114 reports → d-exponent now computable on Bilabri
- **bit diameter** in 106 reports → **MSE now properly computable on Bilabri**
- plus **111 dated depth intervals** → an independent depth↔date calibration to cross-check
  the `dz/ROP` time reconstruction against recorded 24-hour drilling progress.

### ✅ ARM C DONE — composability / coverage-aware degradation (Objectives 5 & 6)

`ml-pipeline/etl/coverage.py` → `ml-pipeline/artifacts/coverage_report.csv`.
Both entry points work off one mapping: **parameter-in** (channels → observable mechanisms +
declared blind spots) and **mode-in** (mechanism → required channels). Weight renormalisation
**self-tests against the brief's published values** (0.4375/0.5625, 0.6923/0.3077) — so
coverage-aware fusion is *exercised*, not merely coded (a STEP 7 checklist item).

**Observability of the 8 mechanisms on real data — RECONCILED 2026-07-30 against the
authoritative `step4_capability_matrix.md` (now in-repo, see PHYSICS KIT below):**
| Dataset | FULL | notable partial (§4.4 three-state coverage) |
|---|---|---|
| USROP (Volve, 7 wells) | bit_wear | pack_off & wellbore_instability each missing **only ECD** |
| Bilabri (4 wells) | bit_wear | pack_off missing only ECD |
| 31/5-7 Eos | stick_slip | differential_sticking missing **only mud weight** |

**Every dataset fully observes exactly 1 of 8.** (Reconciliation revoked USROP's
mechanical_sticking — the authoritative MOS is {torque, hookload, **block_position**}, and
USROP has no block position; the provisional set had wrongly used wob/rop.) Pack-off — the
brief's flagship — is FULL on none. Per STEP 7 these blind spots are a required deliverable,
not a failure. `coverage.py` now reports the full/partial/dark state per mechanism, so
degradation is graceful rather than binary.

⚠️ Untested candidate worth one look: Eos needs only **mud weight** for differential-sticking
FULL, and its `(RM)` memory ECD during pumps-off stretches ≈ static mud density — a real
downhole measurement, unlike the rejected USROP ECD derivation. Not claimed; not tested.

**🎯 ECD is the single highest-value missing channel** — blocker for 4 of 8 mechanisms
(pack_off, lost_circulation, wellbore_instability, differential_sticking), and on USROP the
ONLY thing missing for pack-off.

**❌ TESTED AND CLOSED: ECD is NOT derivable from USROP.** `ml-pipeline/etl/ecd_feasibility.py`
→ `ecd_feasibility.txt`. Foundations §3 lists ECD as derived feature #4, so this was worth
trying. It fails for three independent reasons, any one of which is sufficient:

1. **4 of 9 inputs absent** — drillpipe OD, **plastic viscosity, yield point**, cuttings
   density. PV/YP are actively managed during drilling and cannot be inferred from density.
2. **Assumption noise swamps the signal.** Across 18 ordinary field assumption sets (DP OD
   5"/5-7/8", PV 15–35 cP, YP 8–25 lb/100ft²) ECD moves **0.491 ppg**, versus an ECD−MW
   signal of 0.662 ppg (±74%). Worse for pack-off specifically: the **cuttings-loading term
   is only 0.097 ppg**, so the assumption spread is **5× the entire signal** we would need to
   detect.
3. **It carries no independent information.** A derived ECD is a closed-form function of
   channels already held — predicting it from its own inputs gives **R² = 1.0000**. It is a
   re-encoding, not a new observable, and it never measures the annulus, so it cannot respond
   to a restriction it does not see. A MOS is about *independent evidence*; adding this would
   not satisfy pack-off.

**Pack-off stays a declared blind spot.** The data request that would fix it is small and
specific: **(a) a measured downhole ECD / annular pressure (PWD) channel** — best — or
**(b) mud rheology (PV, YP) + drillstring geometry**. Either turns pack-off observable on
USROP, which already holds the other two MOS channels (SPP, torque).

⚠️ Methodological note carried in that script: it uses a **random** split, deliberately —
the question is "is ECD a deterministic function of X", an interpolation test, not a
generalization test. A sequential split scored R² = −0.38 purely because the deepest 30% of
the well is a different hole section (8.5" vs 17.5"/12.25"). **Do not conflate this split
with `train_baseline.py`'s, where random splitting is the leak being warned against.**

**❌ RE-TESTED AND RE-CLOSED (2026-07-30, per the analysis environment's
`Handoff_Addendum_ECD_Derivation.md`): the RELATIVE ECD-TREND variant fails too.**
`ml-pipeline/etl/ecd_trend_test.py` → `ecd_derivation_report.md`. The addendum's
make-or-break criterion (trend-shape stability under OD ±0.5" / PV,YP ±30%) **PASSES
decisively — mean shape correlation 0.995 across 27 assumption sets** while the absolute
level swings ~7 ppg. But it passes **for the wrong reason**: the trend is a
near-deterministic re-encoding of its own measured inputs (predicted from flow/ROP/MW at
mean R² 0.93; in the friction-dominated 8.5" sections it correlates with the plain
FLOW-RATE trend at 0.998+). The model's annular gap is an assumed constant, so the derived
trend is structurally blind to the annulus narrowing that defines a pack-off — a stable
shape that cannot see the mechanism is stably uninformative. **Shape-stability is necessary
but NOT sufficient; had we used the addendum's criterion alone, pack-off would have been
wrongly green-lit.** Also corrected from the addendum: USROP DOES carry per-row TVD
(`Hole Depth (TVD) m`), and USROP holds NO documented pack-off anchor, so the addendum's
step-5 precursor test had no target either way. Pack-off stays a declared blind spot;
`coverage_report.csv` unchanged; **per the addendum's own decision rule, the thesis
framing pivots to the coupling result + mechanical-sticking lead.**

**C1 vs C2 (the sharpest test of Objective 2) — structurally confirmed:** stick-slip alone
observes stick-slip; ECD alone observes nothing. One channel suffices iff it is
self-diagnostic. The empirical half (does C2 spray false alarms?) needs the STEP 4 models.
⚠️ **31/5-7 Eos is the only dataset holding both `stick_slip` and `ecd`** — the only place
this contrast can run at all. Do not retire that well.

**C6-UNION — a documented counterexample, not a capability.** The first run defined C5 as the
union of all three datasets and reported pack-off observable, disagreeing with prediction.
The implementation was right; the config was wrong — the union pairs `ecd` from 31/5-7 with
`spp`/`torque` from other wells, fields and years. No rig ever had all three. Retained as a
flagged row (`realizable_on_one_well = NO`) because pooling channels across datasets
manufactures observability no well possesses. **Under the reconciled MOS the union now
"observes" 6 of 8** (adds differential_sticking, mechanical_sticking, wellbore_instability by
the same cross-dataset stitching) — the counterexample got starker. **Never quote that row.**

### ✅ PHYSICS KIT INSTALLED (2026-07-30) — STEPS 3–5 UNBLOCKED

The complete companion set arrived (`~/Downloads/DrillGuard_Physics/`) and is now in-repo:
- **`ml-pipeline/physics/drill_physics_features.py`** — the canonical feature module
  ("use as-is, do not re-derive"). Verified in the project venv: **8/8 symbolic dimensional
  checks pass** (needs `sympy`, installed), field-vs-SI MSE agreement exact.
- **`docs/physics_foundation/`** — Physical Foundations, handoff brief, steps 1–7 docs,
  `step4_minimum_observable_sets.json` / `step4_sensitivity_matrix.csv` (16 channels × 8
  mechanisms, signed, lead/coincident/context roles — the STEP 5b lead-channel identity
  test needs it), revised thesis chapters 1–3 (.md/.tex/.docx), and 9 figures.
- ⚠️ Repo `.gitignore` has a global `*.csv` rule — the foundation CSVs are small reference
  data and are currently untracked; `git add -f` them if they should be versioned.
- Note for the STEP 4 build: `train_baseline.py` still uses its own inline field-unit MSE
  with a fixed 12.25" bit — migrate to `mse_field()` + per-section bit diameters from the
  GEOL reports (DEEP-1's file spans the 17.5" section too, so the fixed diameter is wrong
  at the top of that well).

Performance columns (`detection_rate`, `false_alarm_rate`, latency, lead) are written as
`PENDING-STEP4` rather than blank, so absence is never read as zero.

✅ RESOLVED: all 8 MOS are now sourced from `step4_capability_matrix.md` (provenance
`step4`), reconciled 2026-07-30. Four of the five provisional sets changed in the process —
the notable revocation being USROP's mechanical_sticking (see table above). The `Hookload*`
in USROP satisfies the mechanical-sticking MOS's hookload term, but `block_position` remains
missing there.

### ✅ STEP 3 DONE — canonical features on gated data (adversarially verified)

`ml-pipeline/etl/features_step3.py` → `ml-pipeline/data/features/{usrop,bilabri,eos}/*.csv`
+ `ml-pipeline/artifacts/features_step3_report.md`. Routes through the canonical
`drill_physics_features.py` **as-is** (verified: recomputing its functions on pipeline inputs
reproduces stored values to rel. err ≤ 4e-8 — a 4-agent adversarial review confirmed units,
GEOL join, logic and sanity claims; all real findings fixed).

- **Computed:** MSE, d-exp, d_c, HHP on USROP (198,917 gated rows) + Bilabri (8,022);
  stick-slip index + measured ECD on Eos. **Declared NOT computed:** ECD/margin/overbalance/
  stick-force (inputs absent; derivation closed); stick-slip on USROP/Bilabri (surface RPM is
  topdrive-regulated); transport/slip/annular velocity carry `_assumed` suffix = context only.
- ⚠️ **Eos feature CSVs are ALL rows with the gate as a `gate` COLUMN** (stick-slip while
  reaming is real); USROP/Bilabri CSVs are gated rows only. Don't mix these up.
- **Bilabri upgrades:** per-interval bit diameter + mud weight joined from GEOL reports
  (100% coverage; era-aware latest-date tie-break for the D2 sidetrack overlap; 49 top-hole
  D2 rows backfilled to the correct 17.5" — the filename fallback had them 2× wrong in MSE).
  The GEOL "SOBM 107 PPG" typo (=10.7) is refused at extraction (plausibility band 6–20 ppg).
- **Fault filter:** ~71k values NaN'd, incl. F-15's ENTIRE mud-density column (sentinel fill →
  d_c honestly uncomputable there) and ~15k impossible RPM values on F-15S/F-5.
- **Sanity checks:** S1 MSE/UCS per hole section — 12.25"/17.5" in band (0.9–2.5×), all 8.5"
  sections high (surface-torque string friction, declared; NOT a unit error — verified).
  S2 dyn-vs-static ECD margin positive on 8/9 Eos runs and survives a same-depth 50 m-bin
  control (e.g. 14/15 bins positive on MWD_5); the one negative is MWD_2, the conditioning
  trip, which fails the binned control too. S3 d_c: F-5 and DEEP-1 are **FLAT against a
  rising MW (+0.85/+0.98) = compensated overpressure, textbook** — don't call it an anomaly.
  **S5 (unique result): stick_slip_index(CRPM) vs the instrument STICK channel — Spearman
  +0.71 pooled, +0.64 drilling-only (MWD_9)** — feature #11 validated against downhole
  ground truth; the drilling-only restriction is the defensible number.
- SSI has a telemetry-continuity guard (NaNs windows straddling >3× median frame-gap
  outages) mirroring the gate's span check.

### ✅ STEP 4 DONE — three models + coverage-aware fusion (adversarially verified)

`ml-pipeline/training/step4/` (common/dtw_bank/models/run) →
`ensemble_scores.csv` (9,826 rows, STEP 6 schema) + `step4_log_step4_metrics.json`.
RF refuses undeclared label tiers; DTW templates carry provenance (physics or the
documented D2-1659 shape — never model output); LSTM-AE trains on normal windows only,
built PER WELL/RUN (never across boundaries); scores CDF-calibrated vs training-normal;
tiers are TAIL percentiles (Watch 90 / Elevated 97 / Action 99) with an 8-point sweep.

A 3-agent adversarial review (leakage / independent metric recount / integrity audit)
found and fixed: midrank-less AUC (tie bias — a constant score read 0.462 instead of
0.500), the D2-fold DTW template being a matched filter informed by the test interval
(now leave-one-event-out), FAR/hr denominators assuming 10 s rows when eval rows arrive
every ~60 s, boundary-crossing rolling labels, an asymmetric train/test gate floor, and
a missing D2-PACKOFF exclusion in the LSTM normal mask. Post-fix numbers below are the
quotable ones; fusion arithmetic + calibrator/scaler isolation verified exact/clean.

**Task A — Eos stick-slip vs instrument labels (severity = STICK/(2·⟨CRPM⟩₅ₘᵢₙ) ≥ 0.5):**
| fold | RF | LSTM | DTW | fused |
|---|---|---|---|---|
| MWD_9 (n=285) | 0.795 | **0.867** | 0.578 | 0.839 |
| MWD_5 (n=1128, 66% pos — saturated run, weak contrast) | 0.641 | 0.523 | 0.586 | 0.644 |

**C1-vs-C2 EMPIRICALLY CONFIRMED, now exactly:** ECD-only RF/LSTM AUC = **0.500 by
construction** — the models output a CONSTANT score on ECD-only input (nothing to rank;
a flat score line in any plot is the expected appearance of an uninformative channel).
C1 fused 0.839 vs C2 fused 0.689 (MWD_9). **Label-robustness check passed:** fused AUC
vs raw-STICK-amplitude labels (independent of the shared 1/CRPM normaliser) is 0.89 —
HIGHER than vs the severity label, closing the one circularity objection available.
FAR at Action = 3.5/hr on MWD_9 (honest 60 s eval-row spacing; calibration is
in-sample-normal referenced = biased UP, declared).

**Task B — Bilabri vs documented anchors, D2 fold now LEAVE-ONE-EVENT-OUT (physics
template only; the D2-1659-informed template is excluded when D2 is the test well):**
- **Headline (survives template exclusion): RF@99th pct = 50 m lead (≈2.4 h at the
  stated 20.9 m/hr approach ROP) at 0.8% outside-row FAR.** DTW with physics-only
  template still peaks 0.996 in the approach (5 m @ 99th, 51 m @ 75th).
- **Fusion is two-sided (report BOTH):** fused@75 = 52 m lead at 0.097 FAR vs RF@75 =
  54 m at **0.502** (5× FAR suppression — LSTM veto); at the 99th pct fused detects
  nothing (max 85.9) while RF gets 50 m (LSTM 0.80 dilutes RF 0.998).
- D4 fold: no reliable detection (record stops 49 m short; 12 samples) — matches the
  anchor audit. **Do not quote D4 as detection.**
- ⚠️ Framing (per review): mechanical sticking is classed RISK-STATE with ZERO predicted
  lead — the D2 50 m lead is therefore a **STEP 5b falsification-test outcome** (a found
  precursor where physics predicted none; the report's own "sudden increase in torque"
  corroborates). Report it as a finding-vs-prediction, never as assumed-lead detection.

**Task C — USROP bit wear: DEMONSTRATION only** (physics-consistency labels; the script
refuses to score against its own label rule). Action rate 0.22/h (F-14), 0.00/h (F-15S)
over ~325 h held-out drilling. No detection-rate claims possible — no anchors exist.

### 🚨 GAME-CHANGER (2026-07-30) — VOLVE DDRs OBTAINED; DOCUMENTED PACK-OFFS ON USROP WELLS

The official Volve daily drilling reports (all 1,759, DDRS WITSML) are public WITHOUT
registration: `ml-pipeline/data/volve_ddr/volve_ddr_all.parquet` (2.2 MB, HF mirror
`bengsoon/volve_daily_drilling_report`; **cite "Equinor Volve data sharing", Equinor Open
Data Licence — non-commercial share-alike; the mirror's cc-by relabel is not
authoritative**). `volve_ddr_step0.py` → `volve_events.csv` + `volve_event_inventory.md`:
2,196 candidates, **202 with depths inside USROP-covered intervals**.

**Six documented PACK-OFF anchors on USROP wells, all fully assessable** (0–2 m gap to
event depth, 678–3,443 SPP+torque samples per 60 m approach — far denser than any Bilabri
anchor): F-15 @1368/1374/1416 m (2008-09-20..25 — *"sudden torque build up followed by
pack off - pump pressure peaked at 180 bar"*), F-15A(=USROP F-15S) @1532 & @2614 m
(*"35 bar pressure increase and WOB increased while TDS stationary (pack-off)"*),
F-5 @2927 m. Plus 65 lost-circulation / 34 well-control / 71 tight-hole candidates
inside intervals, unadjudicated.

**What this changes:** pack-off — previously "no anchor anywhere" — now has documented
anchors on the PRIMARY dataset. Pack-off stays MOS-PARTIAL (no ECD); the runnable
experiment is the **§4.4 partial-coverage detection test**. Identity note: DDR wellbore
mapping is BY NAME ONLY (USROP "F-15S" = registry/DDR "15/9-F-15 A", per Sodir KOP
1381/TD 4095); never map by depth overlap. Sodir FactPages hold NO narratives for
development wells — DDRs are the only public event source. Bilabri adjudication also
yielded 4 new anchor proposals (top: DEEP1-GASPEAK-2441 — GEOL "gas peak of 5270 units"
matches the GASROP channel max EXACTLY; needs a GASROP loader).

### ⚠️ TASK D AS FIRST RUN = WITHDRAWN; REBUILD PATH DEFINED (adversarially verified)

The first Task D run (partial-coverage pack-off, leads 15-39 m on 2-3 of 4 anchors)
was **invalidated by the DDR-context review — do not quote it**:
- **None of the 4 original anchors is a drilling-ahead pack-off**: F15-1381 = during
  remedial LCM circulation, string off bottom (the "34 m3" = LCM pill + chase), and its
  USROP window is the re-pass recorded **5 days AFTER the event** (USROP keeps ONE pass
  per depth — it kept the later one); F15A-1532 = during a 13-3/8" CASING RUN; F15A-2614
  = reaming re-pass (true onset 2008-12-27 @2594) with a **cross-run window** (17.5" baseline
  vs 8.5" approach); F5-2927 = rathole cleanout before new hole, cross-run window.
  `volve_anchors.csv` now carries `operation_at_event` + `window_valid=False` and the
  withdrawn ratios are labelled as such.
- **The Task D RF was structurally broken**: 5 training positives, degenerate calibration
  (90% exact zeros → thresholds <p95 meaningless), and it acted as a hole-section detector
  (F-15 FAR 0.32 = covariate shift; F-14-holdout control FAR 0.81 proves it structural).
  Discriminative signal came from DTW morphology + the fusion veto.
- **Lead-minutes via whole-approach mean ROP misprices up to 3.5×** — metres only.
- **NEW DATA DEFECT: USROP `Diameter` contradicts the DDR hole sections** on F-15
  (444.5 mm claimed to 2604 m; 12.25" actually from 1381) and F-15S (12.25" claimed over
  the 17.5" sidetrack; 8.5" from ~2591 not 2434.5) → `features_step3` MSE on those wells
  is up to 2× off in those stretches. Per-section diameters ARE in the DDR parquet
  (statusInfo diaHole/mdDiaHoleStart) — fix by joining them.
- Also: `volve_ddr_step0.py`'s inside_usrop misses depths stated only in activity TEXT
  (md field read 12/0 for the F-7@315/F-9@371 overpulls) — training-well claim survives
  but must be phrased with the off-bottom-overpull caveat.

**What survives:** no leakage (verified); metrics reproduce bit-for-bit; template
provenance clean; the claim SHAPE ("partial-coverage detection test") endorsed; fused
FARs at Action (0.0012/0.0005/0.0) are the honest operating point; and the review DRAFTED
the thesis sentences + the circularity caveat (all monitors and the anchors reduce to the
same SPP+torque rise under partial coverage — say the experiment shows the physics-
predicted pattern precedes documented events, not that events are "detected" independently
of the pattern). **REBUILD anchors (window_valid=True, drilling-time): F15-PACKOFF-1416**
(35 m fresh formation before it; measured SPP peak z=6.6, MSE 1.78×, ROP 0.35× on
verified same-day data; DDR: "205 to 220 bar... torque peaked at 25 kNm... 8 m3 losses")
**and F15A-PACKOFF-2594** (episode onset; baseline restricted to md ≥ 2591).

### ✅ TASK D v2 — THE VOLVE RESULT (quotable)

`run_task_d_v2.py` → `step4_log_task_d_v2.json`. All review fixes in: robust-z features
with a 0.5%-of-median MAD floor (telemetry quantization otherwise NaNs the z), well-wise
cross-fitted RF calibration (117 positives, active), provenance self-test per window
(flow band evidence-calibrated: USROP reads 4453/4409 lpm where the DDR setpoint is 4000
on BOTH intervals = systematic ~11% sensor-vs-setpoint offset; density unverifiable on
F-15 — STEP 3 refused the sentinel column — declared, not failed), metres-only leads,
coverage_state + circularity caveat on every record.

**Result: on the one provenance-clean drilling-time pack-off anchor (F15-1416, held-out
well), the fused partial-coverage monitor detects at the fixed Watch (90th-pct) threshold
with 23.5 m depth-domain lead at 3.75% outside-row FAR — and the anchor-free control
well F-5 reads 3.5% at the same threshold** (false-alarm structure = background, not
event-well spray; FAR@97/99 = 0 on both). F15A-2594 (detection-only, 3-bin approach)
honestly missed (max 73.1). Nothing fires at Action (max 97.7).

**The full-vs-partial coverage story, both on documented drilling-time anchors:**
full coupled set (Bilabri stuck pipe, RF@99): 50 m @ 0.8% — partial 2-of-3 set (Volve
pack-off, fused@90): 23.5 m @ 3.7%. Partial coverage roughly halves the lead and needs a
lower operating threshold at ~4× the FAR — graceful degradation, measured, n=1 anchor
each, different mechanisms/basins (state both caveats; never present as a controlled
ablation). ⚠️ ALSO: the DDR text reports per-interval MWD **ECD** (e.g. "ECD 1,43") —
the missing channel EXISTED on the rig; it just isn't in USROP's columns. That sharpens
the data request into "the operator already logs this."

### ✅ ARM A DONE — channel-coupling ablation (`run_arm_a.py` → `arm_a_ablation.csv`)

**The ladder is NON-MONOTONIC in both directions — the minimum COUPLED set wins, not
channel count.** Bilabri (held-out D2, leave-one-event-out, USROP excluded: no anchors):
| rung | channels | RF@99 lead | fused@75 lead | FAR |
|---|---|---|---|---|
| B1 single | torque | **none** | 1 m (fires AT event) | 0.029 |
| **B2 pair** | torque+wob (→ torque/WOB) | **50 m @ 0.3%** | 50 m @ 0.062 | **best** |
| B-MOS | torque+hookload+block_pos | **STRUCTURALLY ABSENT** (no block position in DRLPAR — the Arm C blind spot surfacing inside Arm A) | | |
| B3 +hydraulics | +spp+gpm | none @ 0.7% | 13 m @ 0.114 | worse |
| B4 all | +rop, MSE | 50 m @ 1.0% | 53 m @ 0.136 | noisy |

One added channel (WOB, enabling the friction ratio) converts a monitor that fires AT the
event into one with 50 m of warning; further channels only add false alarms. Eos mirror:
E1 (SSI alone = the self-diagnostic MOS) AUC 0.839 @ 3.5 FAR/hr beats E2/E3 (+shocks:
0.804 @ 16.8/hr — sparse shock channels also deactivate the sequence monitors, itself a
real mud-pulse deployment property) and E0 (ECD-only: ≤ chance; fused 0.333 on a small
effective sample — report as "at or below chance", never as "anti-detection"). E4
declared insufficient-training-data. **Caveats: Bilabri ladder rests on n=1 documented
anchor; Eos fold n=285.** Labels are generated from full training channels on every rung
(supervision ≠ observation; declared in-file); evaluation is anchors/instrument only.

### ✅ STEP 1 + STEP 2 DONE — data_inventory.csv + rig-state gating (adversarially verified)

`ml-pipeline/etl/gating.py` → `ml-pipeline/artifacts/data_inventory.csv`: 21 files
(7 USROP + 4 Bilabri + 10 Eos), each with row count, index range, sampling, full channel
list **with header units**, gate definition, duty cycle + per-component duty cycles, and a
per-run proxy self-test. Verified by an independent 4-agent review (recount ✅ 14/14 numbers;
proxy attack ✅; logic review found 3 real bugs, all fixed; brief-compliance ✅ — the only
literal deviation, no timestamps on depth-indexed files, is declared in-file).

**Gated drilling hours (the honest denominators for FAR-per-hour claims):**
| Dataset | gated drilling | note |
|---|---|---|
| USROP | **537.4 h** | +168.5 h *excluded* as gap-bridged (see USROP section) |
| Bilabri | **331.1 h** | dz computed pre-gate, capped 3 m |
| 31/5-7 Eos | **62.1 h** | of a ~235 h record — the only real rig-time duty cycle |

Key findings baked into the module (each measured, not assumed):
- **Eos circulating proxy = RT telemetry channels smoothed over ~3× the per-file median
  frame gap** (40–80 s cadence in a 10 s file; per-row nullness undercounts ~3×). ECD/DHAP
  are (RM) memory channels — present through 8.1 h/3.9 h pumps-off trips; **not** a proxy,
  and ECD *absence* doesn't mean pumps off either (memory record can start late).
- **Eos on-bottom test is seeded with the prior runs' TD** (chronological order — file
  numbering is not chronological; GR-MECH_1 is earliest). The seed exposed **MWD_2 and
  MWD_4 as hole-conditioning trips** (top out just short of the prior run's sustained TD;
  ~0 m new hole, 0 gated h). Without the seed they'd contribute 27 fake drilling hours.
- Eos gate deliberately does NOT require rotation (would cut 50.8% of gated rows = slide
  drilling); advance floor 0.01 m/min (~0.6 m/hr) keeps the low-ROP stuck-pipe regime.
- Per-run self-test: no sustained making-hole without telemetry. 9/10 PASS; GR-MECH_1
  (first run, unseedable) carries an honest FLAG — error direction is conservative.
- Bilabri units are NOT in the file headers — inventory flags every unit `(inferred)`.

### ⚠️ ANCHOR REALITY CHECK — 1 of 5 anchors actually supports a detection claim

`ml-pipeline/etl/build_anchors.py` → `events_anchors.csv`, `anchor_windows/*.csv`,
`fig5_anchor_signatures.png`. **Having a documented event is not the same as having
detectable data underneath it.** Measured verdicts:

| Anchor | Verdict | Evidence |
|---|---|---|
| D2-STUCK-1659 | ✅ **precursor visible** | SPP/GPM climbs z≈1→6 over the final 60 m; torque/WOB ×1.59 |
| D2-PACKOFF-3129 | ❌ no precursor | flat/noisy; packed off while **backreaming up** |
| D4-STUCK-2591 | ⚠️ **cannot assess** | record stops **49 m short**; only 12 valid approach samples |
| DEEP1-DIFFSTUCK-1529 | ❌ no precursor | flat before, signal only **after** — casing stuck, not drilling |
| D3-FISH-2541 | ❌ no data | D3 file is **378 m shorter than its filename claims** |

**The structural reason, and it matters more than the individual verdicts:** DRLPAR only
records *while drilling ahead*. Every one of these failures developed during **tripping,
backreaming, or running casing** — the operations DRLPAR is blind to. Depth-indexed mudlog
data cannot see failures that develop when the bit is off bottom. State this as a limitation;
it is also the strongest argument for USROP (finer sampling, and **hookload**, the channel
that actually shows overpull/drag during tripping).

### 🚨 DATA CORRUPTION — Bilabri D4, 2543–2591 m

The last 49 m of the D4 DRLPAR file is **fabricated, not measured**:
`RPM / WOB == 99.0 exactly` on every row, RPM 1485–2002 (a drillstring cannot turn at 2000
rpm), and SPP = GPM = temperatures = 0 while ROP still reads 11–35 m/hr (you cannot drill
with the pumps off). It is a spreadsheet formula fill.

Because MSE ∝ RPM × torque, those rows produced a **~64× MSE spike that reads exactly like a
stuck-pipe precursor**. Before QC, D4 reported MSE ×2.14 / torque-WOB ×2.12 — a "strong
precursor" that was pure artifact. After QC: ×1.83 / ×1.38, on only 12 valid samples.

**RESOLVED.** QC lives in `ml-pipeline/etl/qc.py` and is applied by both `build_anchors.py`
and `train_baseline.py`. Pre-QC values preserved in `baseline_metrics_PRE_QC.json`.

Measured impact on the anomaly signature (unseen well D4):

| | pre-QC | post-QC | verdict |
|---|---|---|---|
| torque/WOB | 7.06× | **3.87×** | −45%, still supported |
| **MSE** | 1.61× | **0.95×** | **FLAT — claim withdrawn** |
| torque | 1.29× | **0.57×** | sign flip |
| ROP | 0.65× | 0.54× | supported |
| WOB | 0.30× | 0.21× | supported |

**3 of 4 components survive; the MSE-elevation claim does not.** Corrected physical reading:
WOB collapses ~5× while torque only halves, so torque/WOB rises with MSE flat — this is a
**hole-drag / weight-transfer failure** (tight hole, differential-sticking tendency), not
energy dissipation. More specific and more defensible than "the bit is working harder", but
**never claim elevated MSE**. `train_baseline.py` now checks this expectation
**programmatically** rather than asserting it in prose.

**Task 1 was essentially unaffected** — random-split R² +0.531→**+0.516**, held-out-well
−0.454→**−0.481**. The generalization-gap headline is robust to QC.

⚠️ The submitted PIDEC Stage 2 package still carries the pre-QC numbers (its 28 Jun 2026
deadline had passed). Correct them for the thesis and CODET.

⚠️ **The GEOL events are keyword CANDIDATES, not labels.** Two false-positive classes were found and
fixed by reading the actual quotes — `"kick-off"` (a sidetrack op, was inflating well-control
~5×) and `"flow check"` / `"swab on mud pump"` (routine op; pump component). Others may
remain. Every row in `event_inventory.md` carries its verbatim sentence. **Adjudicate by hand
before training on them.**

### Failure-mode trainability (verified by opening real files)
| Mode | Verdict | Source |
|---|---|---|
| Stuck pipe | **STRONG** | DRLPAR + 31/5-7 `STICK` + GEOL RPT event labels |
| ROP optimization | **STRONGEST** | DRLPAR + MWD ASCII (formation context) |
| Kick detection | **STRONG** | GASROP files (real gas chromatography) + mud weight from GEOL RPT |
| Lost circulation | **WEAK** | No flow-out data; rule-based indicator only |

### Minimum observable sets — which dataset satisfies what
| Mechanism | Channels needed | USROP (Volve) | Bilabri DRLPAR | 31/5-7 Eos |
|---|---|---|---|---|
| Pack-off (MOS=3) | ECD, standpipe pressure, torque | 2/3 (no ECD) | 2/3 (no ECD) | 1/3 (ECD only) |
| Bit wear (MOS=4) | WOB, RPM, torque, ROP | **4/4 ✅** | **4/4 ✅** | 1/4 (CRPM only) |
| MSE / d-exponent | + bit dia, mud weight | **✅ computable** | **✅** via GEOL rpts | ❌ |
| Wells (held-out-well) | ≥3 | **7 ✅** | 4 ✅ | **1 ❌** |
| Time resolution | for latency claims | **0.06–0.35 min** | 2.6 min (→35 worst) | 10 s native ✅ |

**Each dataset has one job — never pool them** (different fields, eras, basins, sensor sets):
1. **USROP = PRIMARY.** Outcome 3 (latency) + Outcome 6 (per-model/fused). Full MOS, 7 wells,
   fine time resolution, and it is the handoff brief's actual intended target.
2. **Bilabri = external validity + local relevance.** A *different basin* (Niger Delta vs
   North Sea). North Sea → Niger Delta transfer is a harder and more interesting
   generalization test than held-out-well within one field — and it carries the Nigerian
   relevance story for PIDEC/CODET.
3. **31/5-7 Eos = downhole-signature study.** Its instrument-measured `STICK` channel plus
   ECD/DHAP is the only direct mechanism ground truth available anywhere in the project.

### Bilabri time axis — depth-indexed, reconstructable
DRLPAR is 1 row per metre with **no timestamp**. Integrating `dz/ROP` recovers on-bottom
drilling time — verified on DX1 460–2860 m: **104.3 h over 2401 samples, mean 2.61 min/sample**.
⚠️ **Resolution scales inversely with ROP**: 0.34 min/sample at 175 m/hr, but **~35 min/sample
at 1.7 m/hr** — precisely the low-ROP stuck-pipe regime of interest. So **report lead time in
metres drilled (exact), then convert to minutes with stated ROP and error bars.** A bare
"28-minute lead time" claim from this data would rest on roughly one sample.

### Important non-presence
- **No production-phase data** in this dataset (no oil/gas/water rates, no PLT, no IPR). The project deliberately stays in the drilling phase. Do NOT pivot to production optimization.

---

## Methodology Decision — Locked In

**Held-out-well evaluation protocol**: train on a subset of wells, test on wells the model has never seen. This is more rigorous than the random-split evaluations dominant in published drilling-ML papers. It is a genuine methodological contribution worth highlighting in the thesis and at hackathon judging.

Reference: `docs/LITERATURE_BENCHMARKS.md` — Section 7, "Key Methodology Insights."

---

## Roadmap

### Phase 0 — UNDERSTAND ✅ COMPLETE
- 0.1 ✅ Physics primer (`docs/PHYSICS_PRIMER.md`)
- 0.2 ✅ Data inventory across 31/5-7 Eos + actual data + raw_data (real files opened and confirmed)
- 0.2b ✅ **Provenance + channel audit (2026-07-29)** — corrected the "Volve"/"9 wells" errors;
  established Bilabri as primary modelling dataset (see The Data section)
- 0.3 ✅ Failure-mode suitability matrix
- 0.4 ✅ Literature benchmark scan (`docs/LITERATURE_BENCHMARKS.md`)
- 0.5 ⏸ User sign-off on scope + held-out-well protocol — **PENDING**

### Phase 1 — DESIGN (not yet started)
- 1.1 Canonical schema (DB tables + Parquet columns)
- 1.2 Physics-informed feature engineering plan
- 1.3 Model architectures per task (with justification)
- 1.4 Evaluation plan with metric targets

### Phase 2 — BUILD (only after Phase 1 sign-off)
- ETL: Volve LAS → Parquet; Bilabri DRLPAR/GASROP parsing
- Event labeling: manual on Volve STICK + text-mine AM GEOL RPT for Bilabri
- DB migrations (Postgres + TimescaleDB hypertables)
- Train models: Isolation Forest baseline → Random Forest → LSTM AE (if time)
- Risk-scoring fusion
- FastAPI intelligence service (real endpoints)
- Replay worker (stream historical data as if live)
- Wire frontend to real backend (replace `mockData.ts`)
- Email alerting via SMTP
- `make demo` end-to-end smoke test
- Backup demo video

---

## Anti-Patterns — Things NOT to Do

- ❌ Don't jump to code without Phase 0/1 sign-off
- ❌ Don't claim something works when it's mocked
- ❌ Don't run agents that write code without explicit authorization
- ❌ Don't propose enterprise-scope deliverables (K8s, multi-tenant SaaS, mobile React Native, Twilio SMS, Firebase, Airflow)
- ❌ Don't fabricate metrics — if numbers aren't measured, label them as targets
- ❌ Don't extend to production-phase analytics (no data for it)
- ❌ Don't try to OCR mud-log PDFs for lost-circulation data — high effort, low payoff
- ❌ Don't dismiss the Bilabri dataset on first inspection — earlier audits underestimated it; the actual usable data is much richer than initial scans suggest

---

## Key Documents (in this repo)

- `docs/PHYSICS_PRIMER.md` — sensor + failure-mode primer
- `docs/LITERATURE_BENCHMARKS.md` — F1/precision/recall targets + held-out-well insight
- `chapters/synopsis.md` — university-facing synopsis
- `chapters/chapter1_introduction.md`, `chapter2_literature_review.md`, `chapter3_methodology.md` — thesis chapters
- `chapters/PIDEC_proposal_v2.md` — hackathon Stage 1 proposal (delete the author's-note HTML comment at top before submitting)
- `EDIM_Enterprise_Roadmap.md` — aspirational; out of scope for one student

Older docs that may be partly stale:
- `docs/DATA_ASSESSMENT_EXECUTIVE_SUMMARY.md` (Jan 2026 — superseded by 2026-06-25 file-opening exercise)
- `SETUP_COMPLETE.md` (overstates what's actually built)
