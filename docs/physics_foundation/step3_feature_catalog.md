# Step 3 — Unit-Checked Feature-Derivation Catalog

*Physical Foundations, §3. Every quantity that can become a model input is derived here from the
governing physics of Step 2, given in both **field** and **SI** forms, **symbolically dimension-checked**
in sympy, assigned a valid range, and tied to the failure mechanism it informs. All functions live in
`drill_physics_features.py` with an import-time self-test. This is the layer where each edge of the
mechanism↔channel graph acquires an exact equation — and where the three errors in the original draft
are formally corrected.*

---

## 3.1 The three draft errors, corrected

| # | Draft (original thesis) | Problem | Corrected form (this catalog) |
|---|---|---|---|
| 1 | Table 3.2: "Downhole Pressure — **Pounds/gallon**" | ppg is a **density**, not a pressure — category error | Pressure in **psi / bar / Pa**; ppg reserved for mud weight & ECD (equivalent *density*) |
| 2 | d-exponent: `log(ROW/60N)/log(12W/106D)` | "ROW"→ROP, "106"→10⁶ garbled | $d=\dfrac{\log_{10}\!\big(ROP/(60N)\big)}{\log_{10}\!\big(12\,WOB/(10^{6}D)\big)}$ (Jorden–Shirley) |
| 3 | MSE: `(2p NT + Wv)/(Av)` | terms scrambled, area undefined | $MSE=\dfrac{WOB}{A_b}+\dfrac{120\pi NT}{A_b\,ROP}$ (Teale) |

---

## 3.2 Verification method

Each feature's governing expression is reduced to base dimensions {M, L, T} in sympy and asserted
against its expected dimension. The import-time self-test prints one line per check:

```
[PASS] MSE axial WOB/A            [PASS] MSE rotary 2piNT/(A ROP)
[PASS] d-exp ROP/(60N) ratio      [PASS] d_c dimensionless
[PASS] ECD annular term -> density [PASS] transport ratio
[PASS] Stokes slip velocity       [PASS] stick force dP*A
```

Numerical cross-checks confirm the field and SI forms agree and that outputs land in physical ranges:
- **MSE field vs SI cross-check: 106,738 vs 106,281 psi — agree to 0.4 %** (independent unit paths).
- Efficient-drilling MSE = 25,354 psi = **1.69 × UCS** (theory: 1.5–2 × UCS) ✓
- d_c = 1.64 in normal shale (typical 1.0–1.6) ✓; ECD 12.0 → 12.53 ppg ✓; transport ratio 0.77 ✓;
  stick-slip index and overbalance force in range ✓.

---

## 3.3 The catalog

Legend — **Mode:** BW bit-wear, PO pack-off/hole-cleaning, LC lost circulation, DS differential
sticking, WI wellbore instability, KI kick, SS stick-slip. **Type:** *self-diagnostic* (meaningful
alone) vs *relational* (needs its cluster).

| # | Feature | Field form | SI form | Dim check | Range (typical) | Informs | Type |
|---|---|---|---|---|---|---|---|
| 1 | **MSE** (mechanical specific energy) | $WOB/A_b + 120\pi NT/(A_b\,ROP)$ | $WOB/A_b + 2\pi(N/60)T/(A_b\,ROP)$ | pressure ✓ | 1.5–2×UCS efficient; ↑ on wear | BW, PO | relational |
| 2 | **d-exponent** | $\log(ROP/60N)/\log(12\,WOB/10^6D)$ | dimensionless correlation | dimensionless ✓ | 1.0–1.6 normal | WI, KI (pore press) | relational |
| 3 | **d_c** (corrected d-exp) | $d\cdot(MW_{norm}/MW)$ | same | dimensionless ✓ | ↓ into overpressure | WI, KI | relational |
| 4 | **ECD** | $MW + \Delta p_{ann}/(0.052\,TVD)$ | $MW + \Delta p_{ann}/(g\,TVD)$ | density ✓ | slightly > MW | LC, PO | relational |
| 5 | **ECD margin** | $FG - ECD$ | same | density ✓ | →0 = loss risk | LC | relational |
| 6 | **Cuttings transport ratio** $R_t$ | $(v_{ann}-v_{slip})/v_{ann}$ | same | dimensionless ✓ | 0.6–0.9 good; →0 bed | PO | relational |
| 7 | **Slip velocity** (Stokes) | — | $g d_p^2(\rho_s-\rho_f)/(18\mu)$ | velocity ✓ | ~0.1–0.3 m/s | PO | relational |
| 8 | **Annular velocity** | $24.5\,Q/(D_h^2-D_p^2)$ | $Q/A_{ann}$ | velocity ✓ | >~100 ft/min | PO | relational |
| 9 | **Overbalance** $\Delta P$ | $P_{mud}-P_{pore}$ | same | pressure ✓ | 100–500 psi typical | DS, LC, KI | relational |
| 10 | **Stick force** | $\Delta P\cdot A_{contact}\cdot f$ | same | force ✓ | rises with ΔP, contact | DS | relational |
| 11 | **Stick-slip index** | $(N_{max}-N_{min})/(2N_{mean})$ | same | dimensionless ✓ | >1 = full stick-slip | SS | **self-diagnostic** |
| 12 | **Hydraulic power (HHP)** | $P\,Q/1714$ | $P\,Q$ | power ✓ | bit-cleaning energy | PO | relational |

*(Derivative, statistical-rolling, and temporal-aggregation transforms — rate-of-change, rolling σ,
EWMA, CUSUM — are operators applied on top of these physical features; they inherit the base feature's
units and are catalogued in the implementation, not re-derived here.)*

---

## 3.4 Worked example — features respond to the physics

![Worked example. (a) MSE rises past the 2×UCS efficiency ceiling as the bit dulls at constant WOB and
RPM. (b) d_c rises with depth under normal compaction, then drops sharply on entry into an overpressured
zone — the classic Jorden–Shirley overpressure indicator.]({{artifact:87c461eb-9733-4a20-b576-a3e7600742b8}})

**Figure 3.1** drives two of the catalog features with simulated physical ramps to confirm they respond
in the textbook direction: MSE climbs monotonically through the 2×UCS ceiling as bit efficiency falls
(panel a), and d_c reverses its normal-compaction rise (1.56→1.58) into a sharp drop (1.58→1.48) on
overpressure entry (panel b). These are illustrative of the physics, not fitted to Volve.

---

## 3.5 The self-diagnostic vs relational split (feeds the coverage model)

Only **stick-slip index** (#11) is *self-diagnostic* — it is a normalized ratio of a single channel's
own statistics and means something with no neighbours. Every other physical feature is **relational**:
it is a *combination* of channels (MSE needs WOB+RPM+torque+ROP; ECD needs MW+Δp_ann+TVD; transport
ratio needs annular + slip velocities). This is the quantitative basis for the coverage tiers
(Conceptual Foundation §5): a customer supplying one relational channel cannot compute the feature that
diagnoses the mechanism — they get univariate anomaly detection on that channel only; supplying the
full cluster unlocks the derived feature and the mechanism-level diagnosis. **The catalog's "channels
required" per feature is therefore the exact edge set of the mechanism↔channel graph**, built next.

---

*Status: Step 3 complete. Deliverables — this catalog, `drill_physics_features.py` (12 unit-checked
features + self-test), and Figure 3.1 (`fig5_feature_worked_example.png`). All checks PASS; field/SI
forms cross-verified. Next: Step 4 — assemble the parameter-mechanism sensitivity matrix and the
bidirectional capability graph from these edges.*
