# DrillGuard — Master Dossier

### Execution-phase Drilling Intelligence Module (EDIM)
**Real-time machine-learning prediction of drilling failures — validated against documented field incidents across three basins, and running end-to-end as a working prototype.**

*Okeke Johnpaul Ebube · Petroleum & Gas Engineering, University of Lagos · Supervisor: Dr Etaje Darlington*
*Prepared for the PIDEC prototype commission pitch. Everything below is built and measured unless explicitly labelled a target or roadmap item.*

---

## 0. The 60-second version (read this first)

DrillGuard watches a rig's live drilling data and warns the crew **before** a failure — stuck pipe, pack-off, stick-slip — escalates into lost days and lost money.

Three things make it credible in a room full of engineers:

1. **It is a working system, not slides.** A live web dashboard, a native iOS app, a real database with real accounts, and a Python model service that **computes** the risk score on live data (it does not replay a pre-recorded number). You can drive it end-to-end today.
2. **The intelligence is validated, not asserted.** On a well the model had never seen, it raised a stuck-pipe warning **50 metres of hole (~2.4 hours) before a documented downhole incident, at a 0.8 % false-alarm rate.** That number was reproduced live, in the served model, bit-for-bit.
3. **The honesty is the moat.** Every claim is tied to a documented event, a held-out well, or an instrument channel. Where the data cannot support a claim, we say so and label it. Expert judges trust what survives that discipline.

**The one line for the judges:** *"We turn drilling telemetry that already exists on every rig into hours of warning before a stuck-pipe or pack-off event — and we've proven it on real North Sea and Niger Delta wells with a system you can run right now."*

---

## 1. The problem, and why it is worth money

Drilling a well is the single most expensive activity in getting oil and gas out of the ground, and a large fraction of that money is lost to **Non-Productive Time (NPT)** — the rig sitting idle while the crew fights a problem.

| Fact | Industry-reported figure | Source class |
|---|---|---|
| NPT as a share of well-construction cost | **~15–25 %** (some fields higher) | Widely cited across SPE/IADC literature |
| Stuck pipe as a share of NPT | One of the **single largest** NPT categories | Multiple operator studies |
| Cost of a single stuck-pipe / pack-off event | **tens of thousands to well over $1 M**; a severe one needing a sidetrack can exceed **$10 M** | Operator case histories |
| Rig time lost per serious sticking event | **days**, not hours | Daily drilling reports (incl. the ones in this project) |

> These are **industry context figures for the size of the problem**, not DrillGuard measurements. They establish the value of *warning*, which is what DrillGuard measures.

**The value logic (this is the sell):** every NPT event has a build-up. If a monitor can flag that build-up early enough for the driller to react — pick up off bottom, circulate, adjust weight — a *sticking event* becomes a *near-miss*. The entire value of the product is **lead time × probability of correct action × cost of the avoided event.** DrillGuard's contribution is the first term, and we **measure it in the units that matter: metres of hole and hours of warning.**

**Illustrative ROI (assumptions stated, not a measured claim):** one avoided stuck-pipe event that would have cost 2 rig-days at a conservative all-in ₦/$ day rate pays for the entire monitoring system many times over. DrillGuard runs on **telemetry the rig already records** and on **commodity hosting** — there is no new sensor to buy. The cost to deploy is software; the thing it protects is measured in millions.

**Why it is defensible as IP / why it can win a commission:**
- A **multi-basin validation** (North Sea + Niger Delta) that most drilling-ML papers never attempt.
- A **held-out-well evaluation protocol** — harder and more honest than the random splits that dominate the published literature.
- A **coverage-aware fusion engine** that degrades gracefully when a rig is missing a sensor, instead of failing silently.
- **Nigerian field relevance** baked in (the Bilabri Niger-Delta wells), which matters for a Nigerian commission and for local deployment.
- A **working prototype** — the hardest 20 % that most proposals never reach.

---

## 2. THE PROTOTYPE — what actually works right now

> This is a **prototyping competition**. This section is the centre of gravity. Everything here is built and runnable; none of it is a mock.

### 2.1 The full stack (four real services, all wired together)

```
┌──────────────┐        ┌────────────────────┐        ┌──────────────────────────┐
│  Next.js 16  │──HTTP──▶│  PHP 8 + MariaDB   │        │  Python FastAPI          │
│  web app     │        │  business API +    │        │  inference service       │
│  (24 routes) │        │  JWT auth + DB      │        │  (RF + LSTM-AE + DTW)     │
└──────┬───────┘        └────────────────────┘        └────────────┬─────────────┘
       │  also calls the model service directly for the live risk score ─────┘
┌──────┴───────┐
│  iOS app     │  same two backends
│  (Expo / RN) │
└──────────────┘
```

Four independently running pieces, each real:

1. **Web dashboard** — Next.js 16 / React / TypeScript / Tailwind. **24 routes** (below), Recharts with drag-zoom, dark/light themes.
2. **Business backend** — PHP 8 + MariaDB. **JWT authentication**, real SQL, migrations + seed scripts. Serves accounts, alerts, incidents, wells, and replay data.
3. **Inference service** — Python FastAPI. Loads the **three trained models from disk** and scores live windows. This is the piece that makes it a *prototype* and not a *replay*.
4. **Native mobile app** — Expo / React Native, verified running in the iOS Simulator, on the same two backends.

### 2.2 The web app — every screen (24 routes, verified in the repo)

**Onboarding & setup**
- `/welcome`, `/login` — real sign-in against the PHP JWT backend
- `/initialize` wizard — **5 steps**: well-information → data-connection → run-mode → configuration → review (the real "stand up a monitoring session" flow)

**Operating screens**
- `/dashboard` — fleet/well overview
- `/live-monitoring` — the core screen: live drilling parameters, the **0–100 risk gauge**, and the **Live Model panel** that POSTs the last 30 samples to the Python model and shows the computed risk (the panel itself states the number is model-computed, not read from a file)
- `/analyze` — **"Analyze a Well"**: upload any telemetry CSV (or use a bundled sample) and the model scores the whole run, returns peak risk, depth of peak, and every tier crossing. A **3-model selector** (Stuck Pipe / Stick-Slip / Pack-Off).
- `/alerts` — escalation ladder (Watch → Elevated → Action), plain-language cause, recommended actions, acknowledge + history
- `/incidents`, `/incidents/new`, `/incidents/[id]` — full incident lifecycle: raise → investigate → resolve, database-backed with a per-incident activity log
- `/performance` — measured ROP, MSE, depth profile
- `/well-history` — reconstructed daily drilling log
- `/reports` — exportable summaries
- `/sustainability` — diesel / CO₂e / waste view (estimated from activity today — labelled as such; see §8)
- `/settings`

**Components:** 12 React components across `charts/`, `layout/`, `live/`, `ui/`. **Libs:** live-inference client, replay provider, incident store, auth provider, onboarding, export.

### 2.3 The business backend — real endpoints (PHP 8 + MariaDB)

Verified REST surface (5 controllers, JWT-guarded):
- **Auth:** `POST /api/auth/register`, `/login`, `/logout`; `GET /api/auth/me`
- **Alerts:** `GET /api/alerts`, `/api/alerts/{id}`; `POST /api/alerts`, `/api/alerts/{id}/ack`
- **Incidents:** `GET /api/incidents`, `/api/incidents/{id}`; `POST /api/incidents`; `PATCH /api/incidents/{id}`
- **Wells:** `GET /api/wells`
- **Replay:** `GET /api/replay`, `/api/replay/{id}` (serves the historical field data as a live stream)
- **Health:** `GET /api/health`
- **Notifications:** `GET /api/notifications`, `/api/notifications/status`; `POST /api/notifications/test`; `PATCH /api/auth/me` (crew phone)
- Support layer: Router, JWT, Auth, Database, Config, Http, **Notifier** — **SMS is LIVE via Termii (sender "N-Alert", DND route)**: every Elevated/Action alert texts the crew phone and logs the delivery receipt; email path built, dry-run until SMTP credentials
- Ops scripts: `migrate.php`, `seed.php`, `export_replay.sh`

### 2.4 The inference service — this is why it is a prototype, not a demo reel

Location: `ml-pipeline/serving/`.

- **Three models are persisted to disk and served live:** `bilabri-d2` (stuck pipe), `eos-stick-slip`, `volve-packoff`. Each folder holds `rf.joblib` + `lstm_ae.pt` + `artifacts.joblib` (scaler, calibrators, DTW template bank, fusion weights, tier thresholds).
- **`app.py` (FastAPI):** `GET /health`, `GET /model`; `POST /score` (a window → a prediction), `POST /score-csv` (**bring your own well** → the whole run scored), `GET /score-sample` (bundled samples for the mobile app).
- **`infer.py`** is **recipe-driven** — it reconstructs the exact feature transform each model needs and runs RF (latest row) + LSTM-AE + DTW (over the standardised window), each CDF-calibrated, then **coverage-aware fused** into a risk score + tier.
- **Fidelity is proven:** `verify_live.py` streams the held-out well through the live service and reproduces the stored research result — **correlation 1.00000, max risk difference 0.0005** — and reproduces the headline **50 m lead @ 0.8 % FAR live**. The model you demo is the same model from the research, not a lookalike.
- **Fast enough to be live:** ~**20 ms per window**; the DTW core was rewritten to be **~12× faster (bit-identical)** and scoring batched, so a full 2,740-row well scores in **~0.5 s** (was ~20 s).

### 2.5 The 5-minute live demo path (for the pitch)

1. **Sign in** to the web app (real JWT auth). → *"real accounts, real database."*
2. Open **Live Monitoring**, start a **replay** of a real well (Volve / Bilabri / Eos). Watch the parameters stream and the **risk gauge** climb toward a documented event. → *"this is real field data replayed as if live."*
3. Point at the **Live Model panel**: the number is being POSTed to the Python model every ~0.9 s and computed on the last 30 samples. → *"the system is thinking, not playing back."*
4. Open **Analyze a Well**, pick **Pack-Off**, run the sample → peak risk ~98 at 1399 m, Watch + Elevated crossings **~17 m before the documented pack-off at 1416 m**. → *"upload any rig's CSV and it scores it."*
5. Show the same thing on the **iOS app**. → *"it's already on the phone the company man carries."*
6. Land on the honesty line: *"every one of those events is a real documented incident, and the well was held out of training."*

Backup: a recorded walkthrough (`chapters/demo_walkthrough_script.md`) exists so a network failure never kills the pitch.

---

## 3. THE VALIDATED INTELLIGENCE — the numbers, honestly framed

Every number below is measured. Where a result is a *demonstration* rather than a *validation*, it says so — that distinction is deliberate and defensible.

### 3.1 Headline results

| Task | Well / basin | Result | Operating point | Status |
|---|---|---|---|---|
| **Stuck pipe** | Bilabri D2 (Niger Delta), **held out** | **50 m lead (~2.4 h)** before a documented downhole incident | **0.8 % FAR** (RF @ 99th pct) | Validated vs documented event |
| **Pack-off** | Volve F-15 (North Sea), **held out** | **23.5 m lead** before a documented pack-off (F15-1416) | 3.75 % FAR (fused @ 90th pct); anchor-free control well 3.5 % | Validated, **partial sensor coverage** |
| **Stick-slip** | 31/5-7 Eos, fold MWD_9 (n=285) | **Fused AUC 0.839** vs the downhole instrument STICK channel | 3.5 alarms/hr at Action | Validated vs instrument ground truth |
| **Bit wear** | USROP F-14 / F-15S (~325 h) | Physics-consistent anomaly scoring | 0.22 / 0.00 Action alarms per hr | **Demonstration** (no documented anchor) |

### 3.2 The results that show scientific rigor (these impress experts)

- **Single sensor vs coupled sensors (the sharpest test).** On stick-slip, an **ECD-only** model scores **AUC exactly 0.500 by construction** — it outputs a *constant* score because a single non-self-diagnostic channel carries nothing to rank. The self-diagnostic stick-slip channel scores **0.839**. This is the empirical proof that *fusion earns its place only when a channel cannot see the mechanism alone.*
- **Channel-coupling ablation (Arm A).** The detection ladder is **non-monotonic** — more channels is *not* better. The **minimum coupled set wins**: adding one channel (WOB, which enables the torque/WOB friction ratio) converts a monitor that fires *at* the event into one with **50 m of warning at 0.3 % FAR**; piling on more channels only adds false alarms. This is a genuine finding, not a tuning artifact.
- **Full vs partial coverage, both on documented drilling-time events.** Full coupled set (Bilabri stuck pipe): **50 m @ 0.8 %.** Partial 2-of-3 set (Volve pack-off, missing the ECD channel): **23.5 m @ 3.7 %.** Partial coverage roughly *halves* the lead and needs a lower threshold at ~4× the FAR — **graceful degradation, measured.**
- **Label-robustness.** The stick-slip result holds (AUC 0.89) even when scored against a *different, independent* label definition — closing the one circularity objection a reviewer could raise.

### 3.3 Two rigor stories that will win the room

**A) We caught fabricated data in our own dataset — and it would have flattered us.**
The last 49 m of one Bilabri well (D4) contained **fabricated rows** (a spreadsheet formula fill: RPM/WOB pinned to exactly 99.0, pumps off while ROP still read positive — physically impossible). Because MSE ∝ RPM × torque, those rows produced a **~64× MSE spike that looked exactly like a textbook stuck-pipe precursor.** Before QC, D4 reported a "strong precursor." After building a physics-based QC filter (`qc.py`), the false precursor **vanished** and we **withdrew the MSE-elevation claim** — while the real generalization-gap result survived untouched. *We told on ourselves. That is what real validation looks like.*

**B) We proved a channel was underivable and reported the negative.**
Pack-off ideally needs ECD (equivalent circulating density), which the primary dataset lacks. We ran a full feasibility study (`ecd_feasibility.py`, `ecd_trend_test.py`) to derive it — and **proved it cannot be done honestly**: the assumption noise is ~5× the entire signal, and a derived ECD carries no independent information (it predicts itself at R²=1.0). So we **declared pack-off a partial-coverage mechanism** and stated exactly what one extra sensor (a downhole PWD/ECD channel — which the operator's own reports show *was* recorded on the rig) would unlock. *Knowing what you cannot claim is worth as much as what you can.*

---

## 4. THE DATA FOUNDATION — three real datasets, forensically audited

Each dataset has **one job**; they are never pooled (different fields, eras, basins, sensor sets).

| Dataset | What it is | Scale | Role |
|---|---|---|---|
| **USROP** (real Volve) | Equinor Volve WITSML, 15/9-F series, via Univ. of Stavanger. CC BY-NC-SA. | **7 wells**, 198,928 rows, **537 h** gated drilling, 12 channels incl. WOB/torque/SPP | **Primary** — latency + per-model results; held-out-well is genuinely possible |
| **Bilabri** | Nigerian proprietary field, Niger Delta, 2005–2006 | **4 wells**, 378 MB, **331 h** gated; 119 daily geology reports with documented incidents | **External validity + Nigerian relevance** — North Sea → Niger Delta transfer, the hardest generalization test |
| **31/5-7 Eos** | Equinor well 31/5-7, 10 runs on one wellbore | 84,757 rows, **62 h** gated; carries an **instrument-measured STICK channel** | **Downhole ground truth** — the only direct mechanism label anywhere in the project |

**Provenance rigor that examiners will check (and we got right):**
- The folder labelled "Volve" is **not Volve** — header-by-header audit proved it is well **31/5-7 (Eos)**, a different well entirely. We corrected the misattribution before it could embarrass us at defense. *We never cite it as Volve.*
- The **real** Volve data was sourced correctly (USROP, properly licensed and cited).
- **All 1,759 official Volve daily drilling reports** were obtained (public, no registration) and mined for events — yielding **six documented pack-off anchors** sitting inside the primary dataset's intervals. This is what turned pack-off from "no ground truth anywhere" into a validated result.
- **119 Bilabri geology reports** were text-mined for documented incidents (`extract_geol_events.py`), recovering not just failure events but **mud weight** (→ d-exponent computable) and **bit diameter** (→ MSE properly computable) as a by-product.

**Documented incidents we validate against** span *different physics* — differential sticking, pack-off, fault-induced sticking, lost circulation, well control — exactly the spread needed to show where sensor fusion helps and where it does not.

---

## 5. THE ENGINEERING & ML PIPELINE — reproducible, step by step

A disciplined 0→5 pipeline, every stage on disk, every output committed.

| Stage | What it does | Code | Key output |
|---|---|---|---|
| **Step 0** | Extract documented events from geology reports + Volve DDRs | `extract_geol_events.py`, `volve_ddr_step0.py` | `event_inventory.md`, `volve_events.csv` |
| **Step 1–2** | Data inventory + rig-state gating (isolate genuine on-bottom drilling) | `gating.py` | `data_inventory.csv`; honest gated-hour denominators |
| **Step 3** | Canonical physics features on gated data | `features_step3.py` + `drill_physics_features.py` | MSE, d-exponent, d_c, HHP, stick-slip index, ECD |
| **Step 4** | Three models + coverage-aware fusion | `run_step4.py`, `models_step4.py`, `dtw_bank.py` | `ensemble_scores.csv`, metrics logs |
| **Arm A** | Channel-coupling ablation | `run_arm_a.py` | `arm_a_ablation.csv` |
| **Arm C** | Composability / coverage-aware degradation | `coverage.py` | `coverage_report.csv` |
| **QC** | Physics-based data-quality filter | `qc.py` | `physical_qc_log.csv` |
| **Anchors** | Build event windows for validation | `build_anchors.py`, `build_volve_anchors.py` | `events_anchors.csv`, `volve_anchors.csv` |

**The physics engine (`drill_physics_features.py`)** is the canonical feature module — **8/8 symbolic dimensional checks pass**, and the pipeline reproduces its outputs **bit-exact (rel. err ≤ 4e-8)**. Feature #11 (stick-slip index) was **validated against the downhole instrument STICK channel at Spearman +0.64** (drilling-only) — a feature checked against physical ground truth, not just asserted.

**The models (per mechanism):**
- **Random Forest** — supervised, on the coupled physics features (refuses undeclared label tiers)
- **LSTM Autoencoder** — trains on *normal* windows only, per well/run, flags reconstruction anomalies
- **DTW template bank** — matches against physics-derived precursor shapes (templates carry provenance; leave-one-event-out so a template never sees its own test event)
- **Coverage-aware fusion** — weights renormalise when a sensor is missing (self-tested against published values), tiers are tail percentiles (Watch 90 / Elevated 97 / Action 99)

**Adversarial verification:** the Step-3 and Step-4 results were each put through **multi-agent adversarial review** (leakage hunt, independent metric recount, integrity audit). Real bugs were found and fixed — tie-biased AUC, a matched-filter DTW template, wrong FAR denominators, boundary-crossing labels. **The quotable numbers are the post-fix numbers.** This is the level of scrutiny a journal referee applies, done to ourselves before anyone else could.

**The `8` failure mechanisms and their observability** are formalised in a capability matrix with **minimum observable sets** (which sensors each mechanism *requires*). Every dataset fully observes exactly one of eight — and the system reports full / partial / dark state per mechanism rather than pretending to see what it cannot. The single highest-value missing sensor (ECD) is identified precisely, with the data request that would unlock four more mechanisms.

---

## 6. THE METHODOLOGY CONTRIBUTION — why this is research, not a demo

Three things here are genuine contributions worth stating at defense and to judges:

1. **Held-out-well evaluation.** Train on some wells, test on wells the model has *never seen*. Most published drilling-ML papers use random splits, which leak information and inflate scores. Our held-out-well generalization gap (R² +0.52 random → −0.48 held-out on the ROP task) is the honest number, and it is **robust to QC**.
2. **Coverage-aware graceful degradation.** A monitor that needs five sensors and silently fails when one is missing is useless on a real rig. DrillGuard renormalises and reports *what it can still see*, with measured degradation (the full-vs-partial 50 m vs 23.5 m result).
3. **Demonstration-vs-validation discipline.** A result is only called a *validation* when it is tied to a documented event on a held-out well. Otherwise it is a *demonstration*, and we say so. This vocabulary is enforced in the code (scripts refuse to score against their own label rules).

---

## 7. THE ACADEMIC BACKING — the written record

- **Thesis chapters 1–3** drafted (`chapters/`) and **revised against the physics foundation** (`docs/physics_foundation/Chapter{1,2,3}_Revised.md`, also `.tex` and `.docx`).
- **Physics Primer** — 5,847 words: sensor glossary, failure-mode signatures, physics-informed features.
- **Literature Benchmarks** — 4,441 words, **30 citations**: published F1/precision/recall targets per task, and the held-out-well methodology insight.
- **Physical Foundations** package — a full step 1–7 derivation set: precursor hypotheses, failure-mode physics, feature catalog, capability matrix, minimum observable sets, sensitivity matrix (16 channels × 8 mechanisms), model–physics alignment, plus **9 mechanism figures**.
- **PIDEC engineering-decisions log** and **demo walkthrough script** (`chapters/`).
- System architecture doc, data-request checklist, data-assessment reports (`docs/`).

*This is the depth that lets you answer any "but why did you…" question from an expert judge with a document, not a guess.*

---

## 8. HONEST ROADMAP — what is next and exactly what it needs

Stated plainly, because a credible roadmap is part of the sell. Each item is labelled by the single thing it needs.

| Next capability | Status | What it needs |
|---|---|---|
| **Kick / well-control detection** | Data in hand (Bilabri GASROP gas-chromatography channels), model not yet trained | Training + adjudicated gas-influx labels |
| **Lost-circulation detection** | Rule-based only | Flow-out / return-line data |
| **Crew notifications** | **SMS is LIVE** (Termii "N-Alert": model escalation → DB alert → real text to the crew phone, verified end-to-end) | Email needs SMTP credentials (dry-run) |
| **Measured sustainability** | **Estimated** from activity today (labelled in-product) | Metered fuel / emissions inputs |
| **Live rig integration** | Replays field data today | A live WITSML / sensor feed |
| **Enterprise access & audit** | Auth exists; roles/audit minimal | Role model + audit trail |
| **Pack-off full coverage** | Partial (2-of-3 sensors) | One downhole ECD/PWD channel — which operator reports show the rig already logs |

**Team messaging (Crew Channel) — BUILT (2026-08-28), verified cross-device.** One thread per
well, DB-backed, shared by web and mobile; DrillGuard posts a system line into the channel
automatically when an Elevated/Action alert fires, so incident coordination starts in the same
thread the crew talks in. Verified: phone → web and web → phone delivery in under 3 s (polling).

**Offline-resilient operation — BUILT (2026-08-28), verified by simulated outage.** The full
stack runs on one local machine with no internet (zero CDN dependencies at runtime); the one
online dependency, SMS, now has a **store-and-forward outbox**: while the link is down an alert
SMS is QUEUED (with the message body kept), and it re-sends automatically on the next alert or
via a retry endpoint / Settings chip when the link returns (48 h expiry so stale alerts are
never sent late). Verified: simulated link-down → alert queued → link restored → flushed →
real SMS delivered with receipt.

**What is genuinely NOT built yet (say it before a judge finds it):** cost/full-NPT analytics, message push-notifications (SMS covers alert push; in-app messages poll), and the store build of the mobile app. The sustainability and cost figures are *estimates from measured activity*, marked as such on screen.

---

## 9. The competitive summary — why DrillGuard wins this commission

| Most student / hackathon entries | DrillGuard |
|---|---|
| Slides and a mockup | A running four-service system you can drive live |
| One dataset, random split | Three datasets, two basins, held-out-well |
| "Our model gets 95 % accuracy" | "50 m / 2.4 h of warning before a *documented* event at 0.8 % false alarms" |
| Claims everything works | Labels every claim; reports its own negatives |
| Generic ML | Physics-grounded features validated against a downhole instrument |
| Foreign data only | Includes real Niger-Delta field data — local relevance |
| Ignores missing sensors | Degrades gracefully and says what it can still see |

**The close:** *DrillGuard already does the hard 20 % nobody else reaches — a validated model, on unseen real wells, inside a working system, honest about its own limits. Fund the commission and the roadmap items above are engineering, not research risk. The science is done and it holds up.*

---

### Appendix A — Quotable numbers (for slides, keep them exact)
- Stuck pipe: **50 m lead ≈ 2.4 h at 20.9 m/hr, 0.8 % FAR**, held-out well, leave-one-event-out
- Pack-off: **23.5 m lead, 3.75 % FAR** (control well 3.5 %), held-out, partial coverage
- Stick-slip: **fused AUC 0.839** vs instrument ground truth; **0.89** against an independent label
- Single-channel proof: **ECD-only AUC = 0.500 exactly** (uninformative by construction)
- Ablation: **minimum coupled set wins**; +WOB turns fire-at-event into **50 m @ 0.3 %**
- Live fidelity: served model matches research at **corr 1.00000, max diff 0.0005**
- Speed: **~20 ms/window**; DTW **12× faster**, bit-identical; full well in **~0.5 s**
- Feature validity: physics module **8/8 dimensional checks**; SSI vs STICK **Spearman +0.64**
- Data: **7 + 4 + 1 wells**, **537 + 331 + 62 h** gated drilling; **1,759** Volve DDRs; **119** Bilabri reports

### Appendix B — Repository map (where every claim lives)
- Prototype: `frontend/drillguard-web/` · `backend/` · `ml-pipeline/serving/` · `mobile/drillguard-mobile/`
- Pipeline: `ml-pipeline/etl/` · `ml-pipeline/training/step4/` · `ml-pipeline/physics/`
- Results: `ml-pipeline/artifacts/` (`ensemble_scores.csv`, `step4_log_*.json`, `arm_a_ablation.csv`, `coverage_report.csv`, `fig1–5*.png`)
- Physics/academic: `docs/physics_foundation/` (steps 1–7, MOS, sensitivity matrix, 9 figures) · `docs/PHYSICS_PRIMER.md` · `docs/LITERATURE_BENCHMARKS.md`
- Thesis: `chapters/` (chapters 1–3, revised set, demo script, engineering decisions)
- Deploy: `DEPLOY.md`

*Every number in this dossier is reproducible from the code and data in this repository. Nothing here is a mock.*
