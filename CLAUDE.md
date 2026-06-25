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

### 1. Volve (`Volve dataset/`, 111 MB, public Equinor)
- 9 wells × ~180 hours time-indexed MWD at 8–10 sec sampling
- `.LAS` / `.ASC` / `.DLIS` formats under `05.LWD_Log_data/`
- Includes a **`STICK` curve** — pre-labeled stuck-pipe indicator. Rare and valuable.
- Plus ECD, SHKPK/SHKRSK shock indicators, gamma ray, calculated RPM

### 2. Bilabri (`actual data/`, 378 MB, Nigerian proprietary, 2005–2006)
- 4 wells in same field (BILABRI DEEP-1, D2, D3, D4)
- **47 plain-text data files** in 5 categories:
  - **DRLPAR**: `Depth | TVD | ROP | WOB | RPM | Torque | Pump Pres | GPM | Temp In | Temp Out`. Tab-delimited. PARSE-READY.
  - **GASROP**: `Depth | TVD | ROP | Gas(units) | C1 | C2 | C3 | iC4 | nC4 | C5`. KICK INDICATORS.
  - **MWD ASCII**: formation evaluation (GR, resistivity, density, porosity) — for LITHOLOGY CONTEXT for the ROP model, NOT drilling mechanics.
  - **MWD LAS**: text-format LAS files readable by `lasio`.
  - **Surveys**: directional only, not useful for failure prediction.
- **61 .zip files** — DRLPAR/GASROP zips contain text (immediately usable); MUDLOG zips contain only PDFs (would need OCR).
- **30+ `AM GEOL RPT` .xls files per well** = structured daily reports with operational event narratives. TEXT-MINEABLE EVENT-LABEL SOURCE.

### Failure-mode trainability (verified by opening real files)
| Mode | Verdict | Source |
|---|---|---|
| Stuck pipe | **STRONG** | DRLPAR + Volve STICK + GEOL RPT event labels |
| ROP optimization | **STRONGEST** | DRLPAR + MWD ASCII (formation context) |
| Kick detection | **STRONG** | GASROP files (real gas chromatography) + mud weight from GEOL RPT |
| Lost circulation | **WEAK** | No flow-out data; rule-based indicator only |

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
- 0.2 ✅ Data inventory across Volve + actual data + raw_data (real files opened and confirmed)
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
