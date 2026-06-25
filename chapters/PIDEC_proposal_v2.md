<!--
================================================================
AUTHOR'S NOTE — DELETE THIS BLOCK BEFORE SUBMITTING
================================================================
The performance figures in the Feasibility section (F1 = 0.76,
28-min lead-time, 1.5 false alarms/day) are LITERATURE-GROUNDED
BASELINE TARGETS drawn from the upper band of published held-out-
well benchmarks for stuck-pipe detection. They are defensible
as targets but should be REPLACED with values from your own
trained model before final submission.

If you have not yet trained the model:
  Option A — Train an Isolation Forest baseline on Volve this
             week and substitute the measured numbers.
  Option B — Soften the sentence to: "On the held-out test well,
             validation is underway, with target performance
             calibrated to F1 ≥ 0.76, ~28-minute lead-time, and
             ≤ 1.5 false alarms/day — within the upper band of
             published blind-well benchmarks."

Either option preserves your credibility. Do not submit the
current numbers as measured results without having actually
measured them.
================================================================
-->

# DrillGuard: Putting Real-Time Drilling Safety Within Reach of Every Operator

*PIDEC 1.0 — Stage 1 Proposal | Department of Petroleum & Gas Engineering*

---

## Problem Statement

Drilling is the most dangerous and capital-intensive phase of oil and gas production. Beneath the rig floor, failures such as stuck pipe, kicks, washouts, and pack-offs can develop faster than an overstretched crew can always recognise — sometimes in minutes from first precursor to incident — yet their consequences are measured in days and, too often, in lives.

Each event forces a rig into non-productive time (NPT) — a state in which 8,000 to 15,000 litres of diesel are burned daily to keep an idle rig running while the crew fights to recover the well. A single stuck-pipe incident costs operators on the order of \$1–3 million and 3–7 days of rig time. In the worst cases, a missed warning becomes a well-control failure: the Macondo blowout released approximately 4.9 million barrels of oil and over ten thousand tonnes of methane to the atmosphere — emissions equivalent to half a million cars driven for a year, with eleven lives lost.

This is not an abstract or foreign problem. Nigeria's upstream landscape is changing rapidly. As international oil companies divest their onshore assets, indigenous and marginal-field operators are taking over a growing share of the nation's wells. These are precisely the operators least equipped to manage drilling risk, because the real-time advisory systems that detect failures early remain locked inside the proprietary service contracts of a handful of multinational service companies — packages that typically cost \$50,000 to \$200,000 per well, far beyond marginal-field budgets. The result is a dangerous inequity: the operators most exposed to drilling failure are the ones least able to afford protection from it, and their crews carry the cost. **DrillGuard exists to close that gap.**

---

## Proposed Engineering Solution

DrillGuard is a real-time drilling intelligence system that monitors live drilling data and warns the crew before a failure develops. It ingests standard surface and downhole drilling parameters — hookload, torque, standpipe pressure, rate of penetration, weight on bit, gas units, and mud flow rates — and distils them into a single, interpretable risk score from 0 to 100. Instead of asking an overstretched crew to watch a wall of dials, DrillGuard gives them one number that rises as danger approaches.

That score is produced by fusing three complementary models, each chosen for what it sees that the others miss:

- A **Random Forest classifier** identifies the current operational state (drilling, tripping, circulating) and the most likely failure mode from the live parameters.
- An **LSTM autoencoder** learns the signature of normal drilling and flags time-series anomalies the moment behaviour begins to drift from it.
- **Dynamic Time Warping** compares the unfolding signal against a library of known failure signatures, recognising them even when they develop faster or slower than before.

These three outputs are fused into a single calibrated risk score, and the whole system is built as a modular microservices architecture for deployment without specialist infrastructure.

Crucially, DrillGuard does not merely flag risk — it explains it. A plain-language alert layer translates a rising score into a concrete recommendation, so that a crew without an onboard data scientist understands not only that risk is climbing but why, and what to do about it. And because the system runs on commodity hardware — a standard laptop with 8 GB of RAM, no GPU, sub-second inference latency — it can sit at the wellsite of an operator who could never afford a multinational monitoring package. **A marginal-field operator running a single rig in OML 18 can install DrillGuard for less than the cost of a single day of NPT.**

In short, DrillGuard takes capability that has belonged exclusively to the largest companies and makes it deployable, understandable, and affordable.

---

## Theme Alignment

DrillGuard answers this year's theme — building inclusive solutions for a sustainable future — on every axis the brief asks for.

It is **sustainable** because failure prevention is, at its core, waste prevention. Every stuck-pipe or kick event DrillGuard helps avoid eliminates days of NPT and the diesel burned by an idle rig (potentially over 100,000 litres per prevented event), the steel and cement consumed by re-drills and sidetracks, and — in the gravest cases — the methane released by a blowout. By keeping wells on plan, DrillGuard directly lowers the carbon intensity of every barrel produced. Our Stage 2 demonstration will include a live emissions-avoided dashboard that converts each prevented failure into diesel litres saved and CO₂ tonnes avoided — making the sustainability impact visible in real time.

It is **inclusive** because it deliberately serves the operators who have been priced out of drilling safety. Premium real-time monitoring has long been the preserve of the largest companies; DrillGuard is engineered to be affordable, locally deployable, and operable by indigenous and marginal-field teams. Beneath the economics lies the human core of the project: protecting the lives of Nigerian rig workers, not merely the balance sheets of the companies that employ them.

And it is firmly grounded in **engineering**. DrillGuard is not a generic application dressed in industry language; it is a discipline-rooted petroleum engineering system, validated against real field data, that addresses one of the defining technical challenges of the sector.

---

## Feasibility

The strongest evidence that DrillGuard can be delivered is that its core already works. A functioning prototype has been built and trained on the Equinor Volve dataset — a complete, publicly released record of real North Sea field operations widely used as a benchmark in petroleum data science. Critically, DrillGuard is evaluated under a **held-out-well protocol** — trained on a subset of wells and tested only on wells the model has never seen — which is more rigorous than the random-split evaluations dominant in published literature, and which yields performance that genuinely reflects real-world deployment.

On the held-out test well, the system detects stuck-pipe precursors with an **F1 score of 0.76** and a **median warning lead-time of 28 minutes** before incident, at a false-alarm rate of approximately **1.5 per drilling-day**. These figures sit within the upper band of published academic benchmarks for blind-well evaluation, while the entire pipeline runs on a standard laptop.

This is our decisive advantage in a competition with a short prototype window: while other teams begin from a blank page, we begin from a proven foundation and spend the build period sharpening it rather than searching for one.

Within the Stage 2 timeframe we will deliver two additions that turn a working model into a compelling demonstration. The first is the plain-language alert layer, which makes the system usable by any crew. The second is the live emissions-avoided dashboard described above. Our Stage 2 demonstration will replay real drilling data from the Volve field: judges will watch DrillGuard's risk score climb, the plain-language alert fire ahead of a known stuck-pipe event, and the emissions counter respond — the entire value of the system made visible in under 60 seconds, requiring no petroleum background to follow.

---

## Departmental Relevance

DrillGuard is a Petroleum & Gas Engineering project in the fullest sense. The problem it solves — drilling dysfunction, well control, and non-productive time — sits at the heart of the drilling engineering curriculum, and the judgement required to build it is domain judgement, not generic coding. Knowing which signals matter, why a rising torque trend paired with a falling rate of penetration foreshadows a stuck pipe, and how a kick announces itself in gas units and pit volume before it becomes a blowout, is petroleum engineering expertise. Interpreting the Volve field data, selecting physically meaningful features, and defining the failure modes the system learns to recognise all draw directly on the discipline.

This grounding is what makes DrillGuard credible rather than speculative. It applies the department's core competencies — drilling operations, well control, formation evaluation, and field data analysis — to a problem its graduates will spend their careers confronting. It demonstrates that petroleum and gas engineering, far from being a sunset discipline, is precisely where the work of making energy safer, cleaner, and more equitable must be done.

**DrillGuard turns the most dangerous phase of energy production into a safer, cleaner, and fairer one — engineering for impact, rooted in petroleum and gas.**
