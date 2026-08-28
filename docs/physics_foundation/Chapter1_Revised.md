# CHAPTER ONE — INTRODUCTION

*Revised to the narrowed, physics-first scope: the interaction of real-time drilling parameters and its
exploitation to reduce failure-alert latency, with three machine-learning models as the applied
instrument rather than the subject.*

---

## 1.1 Background to the Study

Drilling a well is the most capital-intensive and least predictable phase of hydrocarbon development.
A significant fraction of rig time is consumed not by making hole but by **non-productive time (NPT)** —
periods in which the drilling objective is suspended while a problem is diagnosed and remedied. Stuck
pipe, pack-off and poor hole cleaning, lost circulation, wellbore instability, premature bit failure and
well-control incidents account for the greater part of this lost time, and their cost is measured not only
in daily rig rate but in sidetracks, lost hole, fishing operations, and — in the limiting case — well
abandonment and personnel risk.

What makes these failures worth studying analytically is that most of them are **not instantaneous
events**. They are the terminal state of a physical process that develops over time. A cuttings bed does
not appear in an instant; it accumulates because the rate at which cuttings are generated at the bit
exceeds the rate at which the annular flow transports them away. A bit does not fail without warning; it
dulls progressively, and the energy required to remove a unit volume of rock rises as it does. A shale
does not always collapse abruptly; it can creep inward for hours when the mud weight sits below the
collapse pressure. In each of these cases the developing process perturbs the very quantities that are
already measured continuously at the rig floor and downhole — weight on bit, torque, rate of penetration,
standpipe pressure, equivalent circulating density, hookload, flow rates, vibration.

This is the physical basis for **precursor-based monitoring**: if the process that produces a failure
evolves gradually, and if that evolution leaves a measurable trace in the acquired data, then the failure
can in principle be anticipated rather than merely recorded. Modern rigs generate exactly the data this
requires. Real-time surface and downhole measurements are logged at intervals of seconds, producing dense
multichannel time series over the life of a well. The Equinor **Volve** dataset — the public release of a
complete field's subsurface and drilling data from the Norwegian Continental Shelf — makes such data
available for open research, and has already been used to show that machine-learning methods can predict
well quantities from it as a time series (Olamigoke & Onyeali, 2022).

A distinction of terms is useful here. **Predictive maintenance** infers the condition of equipment from
its operating signals so that intervention may be scheduled before failure; bit wear is its natural
drilling analogue, being a progressive deterioration in a component's condition, legible in the energy
required to do its work. The other mechanisms treated here — pack-off, sticking, losses, instability — are
more properly described as **failure prevention**, since what deteriorates is the wellbore rather than a
component. The diagnostic logic is common to both.

The difficulty is not data volume but **interpretation**. A single channel, read alone, is usually
ambiguous. Rising torque may indicate a developing pack-off, increased bit aggressiveness, a deviating
wellbore, or simply a change in formation. It acquires diagnostic meaning only in relation to the other
channels: torque interpreted together with weight on bit, rotary speed and rate of penetration is a
statement about drilling efficiency; interpreted together with standpipe pressure and equivalent
circulating density it is a statement about annular condition. The parameters are not independent
observations of separate phenomena — they are **coupled responses of one hydraulic-mechanical system**,
and a single physical cause typically perturbs several of them simultaneously and in a characteristic
pattern.

It is this structure — which parameters are physically coupled, which carry independent information, and
what pattern each failure mechanism imprints across them — that determines what can be detected, how
early, and how reliably. That structure is the subject of this study.

## 1.2 Statement of the Problem

Predictive systems for drilling failures are increasingly reported in the literature, and machine-learning
methods have been applied to stuck-pipe detection with encouraging results (Alshaikh et al., 2019; Mal et
al., 2022; Inoue et al., 2023; Al-Mamoori et al., 2025). Three limitations recur.

**First, the physics is frequently implicit.** Models are trained on raw channels or on generic
statistical features, with the physical mechanism of the failure left unexamined. Such a model may achieve
high accuracy on a particular dataset while offering no account of *why* its inputs are informative — and
consequently no basis for judging whether it will transfer to another well, another hole section, or
another rig. Where a model cannot explain the physical cause of its own alert, a drilling crew has little
reason to act on it.

**Second, the distinction between prediction and detection is often not drawn.** Failure modes differ
fundamentally in whether they admit early warning at all. Bit dulling develops over hours and can be
anticipated; a kick, by contrast, announces itself through flow and pit-volume changes *as the influx
begins*, not before. Reporting a single "prediction" capability across dissimilar modes conflates
mechanisms that provide genuine lead time with those for which only rapid detection is physically
possible, and thereby overstates what any system can deliver.

**Third, parameter interaction is rarely treated as the object of study, and the sensor suite is treated as
fixed.** Multivariate models exploit correlations between channels implicitly, in learned weights, without
establishing which correlations are physically meaningful, which channels are individually diagnostic, and
what the minimum set of measurements is that renders a given mechanism observable. Consequently such
systems are built around an assumed instrumentation set: the channels are taken as given, and the failures
addressed follow from that assumption. When a channel is unavailable — a routine occurrence, since sensors
fail, rigs differ in equipment, and operators monitor different subsets — the model either cannot run or
runs on degraded input without declaring that its diagnostic reach has narrowed. Neither behaviour is
acceptable in an operational setting, and both stem from the same omission: no explicit account of which
mechanisms a given set of parameters can and cannot observe.

The consequence is a gap between demonstrated statistical performance and defensible physical
understanding. **This study addresses that gap.** It treats the physical relationships among the monitored
drilling parameters as the primary object of investigation, establishes from those relationships what can
be predicted and on what timescale, and then applies machine-learning models as instruments to exploit
the relationships — with the specific goal of quantifying how coupling between parameters, and
combination of complementary models, reduces the **latency** with which a developing failure is announced.

## 1.3 Aim of the Study

To investigate the physical relationships among real-time drilling parameters — how they couple, how they
behave independently, and how those relationships can be exploited to reduce drilling-failure alert
latency — and, on that basis, to develop a **composable monitoring framework** in which the failure
mechanisms a system can observe are *derived from* the set of parameters it is given, instantiated using
three complementary machine-learning models (Random Forest, LSTM autoencoder, and Dynamic Time Warping)
fused into a single coverage-aware risk score.

The framing is deliberately two-layered. The **framework** establishes, from the physics, what any given
combination of monitored parameters can and cannot detect — so that a monitoring configuration may be
assembled from one parameter, from three, or from a full sensor suite, with its diagnostic reach known in
advance rather than assumed. The **three-model ensemble** is the instrument through which that framework is
realised and tested.

## 1.4 Specific Objectives

1. To characterise, from first principles, the physical mechanisms of the principal drilling-failure modes
   — bit wear, pack-off and poor hole cleaning, differential and mechanical sticking, lost circulation,
   wellbore instability, and kicks — and the measurable signature each produces.
2. To quantify the interactions between the monitored parameters (equivalent circulating density,
   standpipe pressure, torque, rate of penetration, weight on bit, mechanical specific energy, and
   others), establishing which are physically coupled and which carry independent diagnostic information.
3. To derive and dimensionally verify the physical features that translate raw channels into
   mechanism-relevant quantities, including mechanical specific energy, the drilling exponent, equivalent
   circulating density, the cuttings-transport ratio, and the differential-sticking force.
4. To map each parameter to the failure mechanisms it can observe, distinguishing *leading* (precursor)
   responses from *coincident* ones, and thereby establishing what may be predicted as against only
   detected.
5. To determine, for each failure mechanism, the **minimum observable set** of parameters that renders it
   detectable — and hence to establish a composable monitoring scheme in which an arbitrary selected
   subset of parameters yields a known, physically-derived set of observable mechanisms, together with an
   explicit statement of which mechanisms remain unobservable.
6. To apply three complementary machine-learning models — Random Forest for point classification, an LSTM
   autoencoder for temporal anomaly detection, and Dynamic Time Warping for shape matching — each
   targeting a distinct class of physical signature, and to fuse them into a single **coverage-aware** risk
   score whose weighting adjusts to the monitors actually available.
7. To determine the achievable lead time or detection latency for each failure mode from its physics, and
   to demonstrate how combining coupled parameters and the three models reduces alert latency relative to
   single-parameter, single-model monitoring.
8. To validate the parameter conventions, physical behaviours, and model outputs against the public
   Equinor Volve field data.

## 1.5 Scope and Delimitation of the Study

**Scope.** The study concerns the eight failure mechanisms named in Objective 1, analysed through
real-time surface and downhole drilling measurements. The empirical component uses the public Equinor
Volve dataset (block 15/9, licence PL 046, Norwegian Continental Shelf). Physical analysis proceeds from
established governing relations — Teale's specific-energy formulation, the Jorden–Shirley drilling
exponent with the Rehm–McClendon correction, cuttings-transport relations after the Azar-group
experimental work, and the equivalent-circulating-density pressure balance.

**Delimitation.** Three boundaries are drawn deliberately.

*On predictability.* The study does not claim uniform predictive capability across mechanisms. Prediction
with lead time is claimed only where the governing physics is dominated by gradual accumulation. Where a
mechanism builds a hazardous *condition* whose moment of realisation is not signalled in advance — notably
differential and mechanical sticking — the output is an evolving **risk state**, not a timed forecast.
Where the physical signature coincides with the event itself, as for kicks, the objective is **minimised
detection latency** — consistent with the well-control literature, in which the aim is early *detection* of
an influx already under way rather than its prediction (Olamigoke & James, 2022). This three-way
distinction is treated as a finding, not a limitation.

*On implementation.* The system's software realisation — alert delivery, user interface, deployment
architecture — proceeds alongside this research but is **not** the subject of the report. The report
concerns the scientific and analytical basis: the parameter physics, the observability structure, and the
latency result.

*On data.* Analysis is confined to channels present in the Volve release. Measurements that would
strengthen the treatment of wellbore instability in particular — caliper logs and cavings observations —
are not available, and conclusions on that mechanism are correspondingly qualified.

## 1.6 Significance of the Study

**To drilling practice.** Reduced alert latency has direct operational value: the earlier a developing
pack-off or a dulling bit is recognised, the wider the range of available remedies and the lower the
probability of escalation to stuck pipe or a lost hole section. By establishing the minimum set of
measurements that makes each mechanism observable, the study also offers guidance where instrumentation is
partial — an ordinary rather than exceptional condition on working rigs.

**To the analytical literature.** The study contributes a physics-derived map between measured parameters
and failure mechanisms, with each relation classified by direction and by whether it *leads* or merely
*accompanies* the failure. This provides a basis for interpreting model behaviour physically rather than
statistically, and for stating honestly which mechanisms admit prediction.

**To monitoring-system design.** The principal methodological contribution is the treatment of
**diagnostic capability as a derived quantity rather than a fixed property**. Conventional monitoring
systems are built around a fixed sensor suite: the channels are assumed, and the failures addressed follow
from that assumption. Reversing the dependency, this study derives from the physics the minimum set of
parameters required to observe each mechanism, so that an arbitrary selected subset of parameters yields a
*known* set of observable mechanisms — and, equally important, an explicit statement of which mechanisms
that subset cannot see. A monitoring configuration may therefore be assembled around one parameter or
around a full suite, with its diagnostic reach established in advance and its blind spots declared rather
than concealed. Because the risk score renormalises over the monitors actually available, the system
degrades gracefully as instrumentation is reduced instead of failing silently or reporting a
falsely-confident result. This matters in practice because complete instrumentation is the exception on
working rigs, and it matters scientifically because a system that reports its own coverage is one whose
alerts can be trusted proportionately.

**To indigenous capability.** The work is conducted within a Nigerian university on a problem that costs
Nigerian operators directly through downtime and safety exposure, contributing to local competence in the
digital-oilfield methods increasingly central to the industry.

## 1.7 Definition of Terms

**Non-productive time (NPT).** Rig time during which the drilling objective is suspended while a problem
is addressed.

**Equivalent circulating density (ECD).** The effective density exerted at a depth during circulation,
comprising the static mud weight plus the equivalent contribution of annular friction pressure.

**Mechanical specific energy (MSE).** The mechanical energy expended per unit volume of rock removed,
combining axial and rotary work; an indicator of drilling efficiency and of bit condition (Teale, 1965).

**Precursor.** A measurable change in one or more channels that *precedes* a failure and originates in the
physical process producing it — as distinguished from a change that coincides with the failure.

**Lead time.** The interval between the earliest defensible alert and the failure event.

**Detection latency.** The interval between the physical onset of a failure and the moment it is announced;
the quantity minimised for mechanisms without precursors.

**Pack-off.** Restriction of the annulus by accumulated cuttings or cavings, raising circulating pressure
and drag, and a common precursor to stuck pipe.

**Differential sticking.** Immobilisation of the drill string against a permeable formation by the
pressure differential between wellbore and pore fluid acting over the contact area.

**Risk state.** A monitored condition indicating elevated likelihood of failure without a defensible
prediction of its timing.

**Minimum observable set.** The smallest group of channels whose simultaneous availability makes a given
mechanism detectable.

## 1.8 Organisation of the Report

**Chapter One** introduces the problem, aim, objectives and scope. **Chapter Two** reviews the physics of
the failure mechanisms and the literature on data-driven drilling-failure detection, establishing the
governing relations on which the analysis rests and positioning the study against existing work.
**Chapter Three** presents the methodology: derivation and dimensional verification of the physical
features, construction of the parameter–mechanism sensitivity map and the minimum observable sets, the
treatment of rig state and data conventions, and the formulation of the three models and their
coverage-aware fusion. **Chapter Four** presents and discusses the results — the parameter-interaction
structure, the observable-mechanism sets obtained for selected parameter subsets, the per-mechanism latency
envelope, and the quantified reduction in alert latency. **Chapter Five** concludes and recommends further work.

---

## References cited in this chapter

Al-Mamoori, S.K., Tian, S. & Ma, T. (2025) *Stuck Pipe Detection in Oil and Gas Drilling Operations Using
Deep Learning.* Applied Sciences. DOI: 10.3390/app15095042

Alshaikh, A., Magana-Mora, A., Gharbi, S. & Al-Yami, A. (2019) *Machine Learning for Detecting Stuck Pipe
Incidents: Data Analytics.* IPTC. DOI: 10.2523/iptc-19394-ms

Inoue, K., Nakagawa, Y., Kaneko, T. & Wada, R. (2023) *Early Stuck Pipe Detection Using Graph Attention
Machine Learning.* OMAE. DOI: 10.1115/omae2023-101928

Jorden, J.R. & Shirley, O.J. (1966) *Application of Drilling Performance Data to Overpressure Detection.*
JPT. DOI: 10.2118/1407-pa

Mal, S., Ødegård, S., Helgeland, S. & Sinaga, Z. (2022) *Prediction of Stuck Pipe Incidents Using Models
Powered by Deep Learning.* SPE. DOI: 10.2118/208778-ms

Olamigoke, O. & James, I. (2022) *Advances in Well Control: Early Kick Detection and Automated Control
Systems.* IntechOpen. DOI: 10.5772/intechopen.106800

Olamigoke, O. & Onyeali, D.C. (2022) *Machine learning prediction of bottomhole flowing pressure as a time
series in the Volve field.* International Journal of Frontiers in Engineering and Technology Research, 2(2).
DOI: 10.53294/ijfetr.2022.2.2.0039


Rehm, B. & McClendon, R. (1971) *Measurement of Formation Pressure from Drilling Data.* SPE. DOI:
10.2118/3601-ms

Teale, R. (1965) *The concept of specific energy in rock drilling.* International Journal of Rock
Mechanics and Mining Sciences. DOI: 10.1016/0148-9062(65)90022-7

Tomren, P.H., Iyoho, A.W. & Azar, J.J. (1986) *Experimental Study of Cuttings Transport in Directional
Wells.* SPE Drilling Engineering. DOI: 10.2118/12123-pa

---

*Note on figures: Chapter One is deliberately figure-free; the timescale spectrum (`fig1`) and capability
graph (`fig7`) belong in Chapters Two and Three respectively, where they are derived.*
