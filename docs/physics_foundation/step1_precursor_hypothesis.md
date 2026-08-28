# Step 1 — The Precursor-Detectability Hypothesis

*Physical Foundations, §1. This section states DrillGuard's single load-bearing claim, then tests it
mode-by-mode against the governing timescale of each failure process. It fixes the honest boundary of
the whole thesis: which failures can be **predicted** with lead time, which can only be **monitored as
a risk-state**, and which can only be **detected** as they begin.*

---

## 1.1 The load-bearing claim

Everything in DrillGuard — the three detection paradigms, the fusion, the alerts — rests on one
physical hypothesis:

> **H₀ (Precursor Detectability).** A drilling failure is not an instantaneous event but the
> terminal point of a physical process. As that process develops, it perturbs a physically-determined
> set of surface- and near-surface-observable channels in a determined direction, producing a
> **measurable precursor signature** that appears with lead time τ_lead before the failure becomes
> irreversible.

The system is only meaningful where H₀ holds **and** τ_lead is long enough to act on. So H₀ is not a
single yes/no — it is a claim that must be **graded per failure mode by the characteristic timescale
of the underlying physics.** A failure whose precursor develops over hours (bit wear) is a genuine
prediction target; one whose precursor is coincident with the event (a kick) is a detection problem,
not a prediction problem. Conflating the two is the most common overclaim in the drilling-ML
literature, and the one a rigorous examiner will probe first.

### The governing principle: predictability = separation of timescales

A failure is **predictable** only when the precursor-development time τ_dev is long relative to the
sensing-and-response time. Formally, define:

- **τ_dev** — time over which the surface signature evolves from "normal" to "committed failure."
- **τ_resp** — time the crew needs to act (mud change, circulate, back-ream, control the well).
- **τ_sample** — sensor/sampling interval (Volve: 10 s).

Prediction with actionable lead time requires **τ_dev ≫ τ_resp ≫ τ_sample.** When τ_dev collapses to
the order of τ_resp (or below), no algorithm — however accurate — can create lead time that the
physics does not provide. **This is a statement about the process, not the model.** It is why the
honest scope of DrillGuard is set by drilling physics before a single model is chosen.

---

## 1.2 Per-mode classification

Each targeted failure mode is classified into one of three detectability classes by its τ_dev:

- **PREDICTABLE** — τ_dev on the order of tens of minutes to hours; a gradual, correlated signature
  precedes the event. Supports a 30–60 min prediction claim.
- **RISK-STATE** — the *predisposing condition* builds gradually and is monitorable, but the event
  itself is triggered by a discrete action (e.g. moving a stationary string) and has no leading
  surface trend of its own. The system reports **elevated susceptibility**, not a countdown.
- **MIXED** — predictability depends on the *cause*: a slow driver (creep) gives warning, a fast
  driver (induced fracture) does not.
- **DETECTION** — τ_dev on the order of seconds to a few minutes; precursors are *coincident* with the
  event. Supports near-real-time detection, not prediction.

![Failure modes ordered by precursor-development timescale. Only modes whose span reaches the shaded
>30 min band support an actionable prediction claim; kicks and induced fractures fall in the
seconds-to-minutes regime and are detection problems.]({{artifact:ccea6ba3-f8df-4f41-b603-ffb1e394d3a7}})

**Figure 1.1** places every mode on a logarithmic timescale axis by its characteristic
precursor-development time. Reaching the green band (>30 min) is a **necessary but not sufficient**
condition for a prediction claim: a mode carries genuine lead time only if its precursor is *both*
slow-developing *and* expressed as a **gradual leading surface trend**. The PREDICTABLE modes (bit
wear, pack-off, shale instability) satisfy both. Three modes reach the band on timescale yet still
fail the second test — differential sticking and mechanical sticking (RISK-STATE: the susceptibility
builds slowly but the event fires on the attempt to move, with no leading trend) and ECD-creep lost
circulation (MIXED: predictable only when the creep, not an induced fracture, drives it). The modes
clustered at the left (kick, induced fracture) fail the timescale test outright. Read the class column
of the table below, not bar length alone.

### Lead-time feasibility table

| Failure mode | Class | Precursor timescale | Governing process | Supports 30–60 min prediction? |
|---|---|---|---|---|
| Bit wear / dull | **PREDICTABLE** | hours | progressive abrasion → energy-to-cut rises | **Yes** — hours of lead |
| Pack-off / hole cleaning | **PREDICTABLE** | 10 min – 3 h | cuttings-bed mass imbalance narrows annulus | **Yes** — 30+ min typical |
| Wellbore instability (shale) | **PREDICTABLE** | 30 min – 12 h | time-dependent near-wellbore failure | Yes — but slow / diffuse |
| Lost circulation (ECD creep) | **MIXED** | 5 min – 1 h | ECD margin eroded by annular-friction creep | Sometimes — if creep-driven |
| Differential sticking | **RISK-STATE** | risk builds min–h; event ~instant | overbalance × mudcake × stationary pipe | **No** — risk-state, not event-time |
| Mechanical sticking | **RISK-STATE** | 2 min – 1 h | collapse / ledge / keyseat | Partially — state-dependent |
| Lost circulation (induced frac) | **MIXED** | 1–60 s | wellbore pressure > fracture gradient (sudden) | **No** — effectively sudden |
| Kick / influx | **DETECTION** | 5 s – 5 min | pore pressure > wellbore pressure (coincident) | **No** — near-real-time detection |

*(Full table with signatures and required channels: `step1_leadtime_feasibility.csv`.)*

---

## 1.3 What this fixes for the rest of the work

1. **The honest headline claim.** The 30–60 min lead-time promise is defended **only** for the
   PREDICTABLE modes — principally **bit wear** and **pack-off / hole cleaning**, with shale
   instability as a slower third. Differential sticking and kicks are explicitly re-scoped:
   differential sticking → **risk-state monitoring**; kicks → **detection**. This narrower claim is
   *stronger*, because every part of it is physically defensible.

2. **The mechanism nodes of the capability graph.** The modes in this table become the mechanism-side
   nodes of the bipartite mechanism↔channel graph (Conceptual Foundation §4). Each mechanism's
   "Channels it needs" column is the first draft of its edges — to be derived rigorously in Steps 2–4.

3. **The primary target.** Because its physics is both slow (long τ_dev) and richly multivariate
   (correlated ECD/SPP/torque/drag signature), **pack-off / hole cleaning is the strongest headline
   mechanism** for the prediction claim, with bit wear (via MSE) as the cleanest secondary. Steps 2–3
   derive both from first principles.

4. **A falsifiable frame.** H₀ is now testable: on the Volve well, for a PREDICTABLE mode, the
   correlated precursor signature should be visible in the channels ≥ τ_lead before the labelled
   event. If it is not, H₀ fails *for that mode* — and the system honestly excludes it. This is what
   makes the empirical chapter a real test rather than a demonstration.

---

*Status: Step 1 complete. Deliverables — this document, Figure 1.1
(`fig1_timescale_spectrum.png`), and the feasibility table (`step1_leadtime_feasibility.csv`).
Next: Step 2 — derive the per-mode physics from first principles, starting with the two PREDICTABLE
headline mechanisms (pack-off / hole cleaning, bit wear).*
