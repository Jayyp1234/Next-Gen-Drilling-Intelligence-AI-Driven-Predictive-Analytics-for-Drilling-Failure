# Step 2 — Failure-Mode Physics from First Principles

*Physical Foundations, §2. For each targeted failure mode this section writes the governing balance
(mass, force, pressure, or energy), derives the surface-observable signature it produces, and states
the direction of each channel's response. Every governing relation here has been **dimensionally
verified in sympy** (§2.7); the numbers used in figures are illustrative of the physics, not fitted to
Volve. This section produces the **edges** of the mechanism↔channel graph.*

---

## 2.1 Pack-off / hole cleaning — the headline PREDICTABLE mechanism

### Governing balance — cuttings mass conservation in the annulus

Cuttings are generated at the bit and transported up the annulus by the mud. Conservation of cuttings
volume in the annular control volume gives:

$$\frac{dV_{bed}}{dt} = Q_{gen} - Q_{trans}$$

- **Generation:** $Q_{gen} = ROP \cdot A_{hole}$ — rock volume cut per unit time
  [L/T · L² = **L³/T**, verified].
- **Transport:** $Q_{trans} = (v_{ann} - v_{slip}) \cdot A_{ann} \cdot C$ — net upward cuttings flux,
  where $v_{ann}$ is annular fluid velocity, $v_{slip}$ the particle slip (settling) velocity, $A_{ann}$
  the annular area, $C$ the transported cuttings concentration [L/T · L² = **L³/T**, verified].

A **cuttings bed accumulates whenever $Q_{gen} > Q_{trans}$** — i.e. when cuttings are cut faster than
the mud can carry them out. The compact diagnostic is the **cuttings transport ratio**:

$$R_t = \frac{v_{ann} - v_{slip}}{v_{ann}} \quad (\text{dimensionless; } R_t \to 1 \text{ good, } R_t \to 0 \text{ bed forming})$$

### Slip velocity

$v_{slip}$ sets whether particles settle. In the Stokes (low-Reynolds) regime,

$$v_{slip} = \frac{g\,d_p^2\,(\rho_s - \rho_f)}{18\,\mu}$$

[verified → **L/T**], with $d_p$ particle diameter, $\rho_s,\rho_f$ solid/fluid densities, $\mu$
plastic viscosity. Field cuttings are usually turbulent-regime, so the operational system uses an
empirical correlation (Moore / Chien) — but the Stokes form fixes the physics and the dimensional
anchor. **Inclination matters:** beds are worst at 30–60° where gravity has both a settling and a
sliding component; the near-vertical Volve F-wells are a comparatively *favourable* case, which must
be stated when transferring the claim to deviated wells.

### Signature — one cause, a correlated fan of channels

As the bed grows, the annular cross-section shrinks. This single geometric change drives a
**coordinated** response:

- annulus narrows → annular frictional pressure loss $\Delta p_{ann} \uparrow$ → **ECD ↑** and
  **standpipe pressure ↑**;
- mechanical interference of string with bed → **torque ↑**, **drag / overpull on connections ↑**;
- ultimately restricted circulation.

![Pack-off physics. (a) Cuttings mass balance: a bed forms when generation exceeds transport. (b) The
single geometric cause (annulus narrowing) produces a correlated rise across ECD, standpipe pressure,
torque and drag — a correlated multichannel move is the signature of a real mechanism, and confidence
scales with the number of confirming channels.]({{artifact:bd87477a-0cf6-4142-a3aa-bf96bade57f3}})

**This is the physical basis of the whole coverage-aware idea** (Figure 2.1b): the mechanism writes
itself onto *several* channels at once, so a customer with more of that cluster gets correlated
confirmation, and a customer with only one still sees *something*. τ_dev is 10 min–3 h → genuine
30 min+ lead time.

---

## 2.2 Bit wear — the cleanest secondary PREDICTABLE mechanism

### Governing balance — Mechanical Specific Energy (Teale, 1965)

MSE is the energy required to remove a unit volume of rock — an energy-conservation statement for the
bit:

$$MSE = \underbrace{\frac{WOB}{A_b}}_{\text{axial}} + \underbrace{\frac{120\,\pi\,N\,T}{A_b\,ROP}}_{\text{rotary}}$$

with $A_b$ bit cross-sectional area, $N$ rotary speed (rpm), $T$ torque, $WOB$ weight on bit, $ROP$
rate of penetration. **Both terms are dimensionally pressure** = energy/volume [M/(L·T²), verified].
The constant 120π carries the field-unit conversion (rpm·ft·lbf → psi-consistent); the SI form drops
it (§2.7 / Step 3).

### Signature

For efficient drilling $MSE \approx 1.5\text{–}2 \times UCS$ (rock unconfined compressive strength). As
the cutting structure dulls, more energy is needed for the same rock: **MSE drifts up**, and at
constant WOB/RPM the **ROP falls**. The crossover — energy-to-cut rising while penetration falls — is
the bit-wear precursor, and it develops over hours (one of the longest τ_dev among the targeted modes,
comparable to slow shale instability, §2.5).

![Bit-wear signature. As the cutting structure dulls over a bit run, MSE (energy to cut) rises while
ROP falls at constant WOB and RPM — the diagnostic crossover of bit wear.]({{artifact:d518de9d-bd79-4662-8ee9-3cbf888f44e5}})

A confounder to respect: MSE also rises on a **formation hardness increase** (higher UCS). Separating
"dull bit" from "harder rock" requires the **gamma-ray / lithology context channel** — which is
exactly why formation channels are *context nodes* in the graph (Step 4), not failure nodes.

---

## 2.3 Differential sticking — RISK-STATE, not event-time

### Governing balance — overbalance pinning force

When the string rests against the mudcake on a permeable zone, the mud–pore pressure difference presses
it into the cake over the contact area:

$$F_{stick} = \Delta P \cdot A_{contact} \cdot f, \qquad \Delta P = P_{mud} - P_{pore}$$

[verified → force, M·L/T²], with $f$ a friction/adhesion coefficient. The pull needed to free the
string scales with $F_{stick}$.

### Why it is not a 30-min prediction

The three ingredients — **overbalance** ($\Delta P>0$), a **permeable zone with mudcake**, and a
**stationary string** — define a *susceptibility state*, and the state can build over minutes to hours.
But the **event** is triggered the instant the crew tries to move a string that has been sitting
(typically during a connection). There is **no gradual leading surface trend** — torque/drag jump *on
the attempt to move*. So the physically honest output is **elevated susceptibility**, not a countdown.

![Differential sticking. (a) Overbalance force balance pinning the string to the mudcake. (b) The
susceptibility builds gradually but the event is near-instant on the attempt to move a stationary
string — a risk-state to be monitored, not an event to be timed.]({{artifact:69081221-c4b5-4d4e-9dce-25470a9eabde}})

This is the physical justification for re-scoping differential sticking from "prediction" to
"risk-state monitoring" (Step 1) — and its inputs are a *state* triple (ΔP, permeability flag,
stationary time), not a waveform.

---

## 2.4 Lost circulation — MIXED (cause-dependent)

### Governing balance — ECD vs fracture gradient

Losses occur when the wellbore pressure meets or exceeds the formation's fracture resistance. The
controlling quantity is the **ECD margin**:

$$\text{margin} = FG - ECD, \qquad ECD = MW + \frac{\Delta p_{ann}}{g\cdot TVD}$$

where $FG$ is the fracture gradient (as an equivalent density), $MW$ static mud weight, and the second
term the annular-friction contribution [$\Delta p_{ann}/(g\,TVD)$ verified → density M/L³, matching
$MW$]. Losses begin when margin → 0.

### Two regimes, two predictabilities

- **ECD creep (PREDICTABLE-ish):** if the margin erodes because $\Delta p_{ann}$ rises slowly (e.g.
  pack-off raising annular friction, or drilling into a weaker zone), ECD climbs toward $FG$ over
  minutes and the loss is *foreseeable*.
- **Induced fracture (NOT predictable):** if an ECD spike (surge, pressure ramp) exceeds $FG$, the
  formation fractures in seconds — effectively sudden.

Hence "MIXED": the same mode is predictable or not depending on which term moves and how fast.
Signature of onset: **pit volume ↓, flow-out ↓, SPP change**; for creep, a **rising ECD toward FG**
beforehand.

---

## 2.5 Wellbore instability (shale) — PREDICTABLE but diffuse

Near-wellbore rock fails when the stress concentration around the hole exceeds rock strength and the
mud pressure no longer supports the wall. The elastic stress concentration (Kirsch solution) gives a
hoop stress at the wall that, for a vertical hole, ranges to $3\sigma_H - \sigma_h - P_w$; failure
onsets when this violates a Mohr–Coulomb criterion. In shales the process is **time-dependent** (creep,
fluid invasion, chemical weakening), so τ_dev spans 30 min–12 h. Signature: **cavings at shakers,
torque/drag ↑, hole fill on connections, tight spots on tripping.** Predictable but *diffuse* — the
signal is spread across mechanical channels and cuttings observations rather than a sharp waveform, and
several of its best indicators (caliper, caving morphology) are not in the Volve surface channel set —
a coverage limitation to record honestly in Step 4.

---

## 2.6 Kicks / influx — DETECTION only

An influx begins when formation pore pressure exceeds wellbore pressure: $P_{pore} > P_{wellbore}$.
The classic indicators — **flow-out > flow-in, pit gain, drilling break, SPP ↓, gas units ↑** — appear
*as the influx starts*, not before it. There is no precursor waveform that leads the event by tens of
minutes; the value of a system here is **fast, reliable detection** (seconds) and reduction of
detection latency, not prediction. Listing kicks as a "30–60 min prediction" target is the overclaim
Step 1 removed; the defensible contribution is minimizing $\tau_{detect}$.

---

## 2.7 Dimensional verification record

All governing relations were checked in sympy by reducing each side to base dimensions {M, L, T}:

| Relation | Check | Result |
|---|---|---|
| Cuttings generation $Q_{gen}=ROP\,A_{hole}$ | volumetric flow | L³/T ✓ |
| Cuttings transport $Q_{trans}=(v_{ann}-v_{slip})A_{ann}C$ | volumetric flow | L³/T ✓ (matches $Q_{gen}$) |
| Transport ratio $R_t$ | dimensionless | ✓ |
| Slip velocity (Stokes) | velocity | L/T ✓ |
| ECD annular term $\Delta p_{ann}/(g\,TVD)$ | density (to add to MW) | M/L³ ✓ |
| Differential-stick force $\Delta P\,A\,f$ | force | M·L/T² ✓ |
| MSE axial term $WOB/A_b$ | pressure = energy/vol | M/(L·T²) ✓ |
| MSE rotary term $NT/(A_b\,ROP)$ | pressure = energy/vol | M/(L·T²) ✓ (matches axial) |

No governing relation entered this document without passing its dimensional check. The full
feature-level equations (field-unit constants, SI forms, valid ranges) are derived and re-verified in
Step 3.

---

*Status: Step 2 complete. Deliverables — this document and Figures 2.1–2.3
(`fig2_packoff_mechanism.png`, `fig3_diffstick_mechanism.png`, `fig4_mse_bitwear.png`).
Next: Step 3 — derive and symbolically unit-check every model input feature (MSE, d-exponent, ECD,
transport ratio, hole-cleaning index, stick-slip severity, hydraulics), correcting the three draft
errors.*
