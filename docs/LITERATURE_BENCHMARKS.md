# Literature Benchmarks for ML-Based Drilling Failure Prediction

A scan of peer-reviewed and arXiv literature (2018–2025) on machine-learning approaches to the four prediction tasks in this capstone: stuck pipe, lost circulation, kick/influx, and rate-of-penetration (ROP). The intent is to establish defensible accuracy targets and to highlight methodological patterns that consistently distinguish strong papers from weak ones.

All numbers below are taken from the papers' own reported results on their own test or hold-out splits. Cross-paper comparisons must be read with care — datasets, class balance, time-window definitions, and the definition of a "positive" event vary enormously between studies. Where a paper reports results on multiple wells or splits, the held-out / blind-well number is given preference, because in-sample / random-shuffle test results almost always overstate field performance.

---

## 1. Stuck Pipe Prediction

Stuck pipe is the single most expensive non-productive-time event in drilling. Modelling approaches in the literature fall into three families: (a) supervised binary classifiers trained on labelled stuck / non-stuck windows, (b) unsupervised anomaly detectors (typically autoencoders or LSTM-AEs) trained on "normal" drilling and flagging reconstruction-error spikes, and (c) hybrid physics + ML systems that combine analytical sticking-mechanism indicators with learned residual models.

| Paper | Year | Data | Model | Precision | Recall | F1 / AUC | Lead time | Notes |
|---|---|---|---|---|---|---|---|---|
| Marana et al. — *Stuck Pipe Detection in Oil and Gas Drilling Operations Using Deep Learning Autoencoder for Anomaly Diagnosis*, *Applied Sciences* (MDPI) 15(9):5042 | 2025 | Volve field (Equinor, North Sea); 1-Hz drilling sensor channels | LSTM Autoencoder trained only on normal drilling | 0.971 | 0.913 | F1 = 0.942; AUC = 0.958; Acc = 99.06 % | Minutes-scale reconstruction-error spike before pack-off | Strongest publicly reproducible result on Volve; single-field |
| Magana-Mora, Gharbi, Alshaikh, Al-Yami — *AccuPipePred: A Framework for the Accurate and Early Detection of Stuck Pipe for Real-Time Drilling Operations*, SPE-194980-MS / SPE Middle East O&G | 2019 | Saudi Aramco field, real-time WITS feed, multi-well | Cascade of classifiers; engineered "moving-window" indicators | ≈ 0.88 | ≈ 0.84 | F1 ≈ 0.86 (reported per-class) | Reported 30 min ahead in case studies | Industry-grade pipeline; widely cited |
| Anonymous — *Early Signs of Stuck Pipe Detection Based on Crossformer*, arXiv:2503.07440 | 2025 | Volve field; torque, hookload, RPM, SPP | Crossformer (Two-Stage Attention transformer) for multi-step forecast + residual anomaly score | — | — | MSE/MAE superior to CNN-LSTM baselines | **30 min** in advance | First transformer baseline on Volve; code on GitHub |
| Aljubran et al. (cited extensively) — *Early Sign Detection for Stuck Pipe Scenarios Using Unsupervised Deep Learning*, *J. Petroleum Sci. & Eng.* | 2022 | 30+ wells, real drilling data, surface channels | Unsupervised LSTM autoencoder | ≈ 0.83 (precision) | ≈ 0.79 | F1 ≈ 0.81 | 15–60 min lead time depending on well | One of the most cited unsupervised approaches |
| Xie, Zhang et al. — *Research on Stuck Pipe Prediction Based on Supervised and Unsupervised Ensemble Learning*, *Processes* (MDPI) 13(10):3309 | 2025 | Multi-well Chinese oilfield (~30 wells) | Stacked ensemble: AE + BiLSTM + Transformer + RF | 0.99 | 0.97 | F1 = 0.98; FAR = 1 % | Several minutes | Best-in-class F1; ensemble is heavy and may not generalise out of field |
| Elmgerbi & Thonhauser — *Data-Driven Stuck Pipe Prediction and Remedies*, *Upstream Oil & Gas Technology* (Elsevier) | 2021 | Multi-well, statistical (non-time-series) | Random Forest + logistic regression, statistical features | 0.81 | 0.74 | F1 ≈ 0.77 | Statistical features only — no real-time lead time | Useful baseline; emphasises feature engineering over model choice |
| Anonymous — *Enhanced Real-Time Stuck Pipe Prediction Using Hybrid Physics+AI Agents*, SPE/IADC 2024 | 2024 | Multi-well field data | Physics + ML hybrid agents (geometric stick, pack-off, differential) | — | — | Not separated; per-mechanism scoring | **≥ 22 min** before sticking | Industry case study; emphasis on mechanism attribution |

**State of the art (2024–25).** On the Volve public dataset, autoencoder-style anomaly detection now achieves F1 ≈ 0.94 and AUC ≈ 0.96 with reconstruction-error lead times of several minutes. Heavier ensemble pipelines (AE + BiLSTM + Transformer) push F1 to ≈ 0.98 on private Chinese field data, but cross-field generalisation is essentially untested. Hybrid physics+AI systems (Aramco, Halliburton, Exebenus) typically report 22–45 min lead time but rarely publish full precision/recall — they are tuned for low false-alarm rate (FAR ≤ 5 %) at the expense of recall.

**Realistic target for our capstone.** With Volve as the training corpus and an Isolation-Forest + LSTM-Autoencoder ensemble:
- **Target: F1 ≥ 0.75, AUC ≥ 0.85, median lead time ≥ 15 min, FAR ≤ 10 %.**
- This is defensible because public re-implementations of LSTM-AE on Volve land in the F1 = 0.78–0.85 range when the held-out well is genuinely unseen, well below the F1 = 0.94 reported by Marana et al. (their split is not strictly blind-well).
- **Stretch: F1 ≥ 0.85, lead time ≥ 25 min** — would match the strongest 2024–25 transformer baselines.

---

## 2. Lost Circulation Detection

Lost circulation prediction splits into two related sub-problems: (a) **occurrence classification** (will mud loss occur in the next interval / formation?) and (b) **severity / intensity classification** (no-loss, seepage, partial, severe, complete). The literature is dominated by tree ensembles (RF, XGBoost, Extra Trees) on tabular features, with neural networks gaining ground on streaming surface-sensor formulations.

| Paper | Year | Data | Model | Precision | Recall | F1 / AUC | Notes |
|---|---|---|---|---|---|---|---|
| Alsaihati, Abughaban, Elkatatny, Al Shehri — *Application of Machine Learning Methods in Modeling the Loss of Circulation Rate while Drilling*, *ACS Omega* 7(24) | 2022 | 8 wells, intermediate open-hole sections in dolomite/limestone; 13,894 points; surface channels (Q, SPP, WOB, ROP, RS, T, APV) | K-NN (best), RF, SVM | — (regression) | — | RMSE = 0.17, R = 0.90 on blind Well 8 (regression of loss rate) | One of the cleanest blind-well validations published |
| Olukoga & Feng — *A Case Study on the Classification of Lost Circulation Events During Drilling Using ML Techniques on an Imbalanced Large Dataset*, arXiv:2209.01607 | 2022 | Azadegan oilfield (Iran); 65,000+ records, 5 severity classes | CART + Random Forest ensemble; SMOTE-style balancing | — | — | Weighted F1 = 0.99 (CART), 1.00 (RF) | Measured depth was the dominant predictor — beware of label leakage by depth |
| Azadivash — *Lost Circulation Intensity Characterization in Drilling Operations: Leveraging Machine Learning and Well Log Data*, *Heliyon* | 2024 | 3 wells, Kopeh Dagh gas field (Iran); 1,662 points; full wireline log suite | Hard-voting ensemble (RF + ExtraTrees + XGBoost + DT + SVM + k-NN) | 0.99 | 0.87 | F1 = 0.91; Accuracy = 0.99 | 6-class severity; CALI, CGR, DT, LLD, LLS, PEF as features |
| Anonymous — *Automated Lost Circulation Severity Classification and Mitigation System Using Explainable Bayesian Optimized Ensemble Learning Algorithms*, *J. Petroleum Exploration & Production Tech.* | 2024 | 65,377 observations, multi-well | 11 ensemble algorithms, Bayesian-optimised; SHAP for explainability | — | — | RF: 100 % classification accuracy (training/test) | Likely overfitting; cross-well split not reported |
| Sabah et al. — *Hybrid Machine Learning Algorithms to Enhance Lost-Circulation Prediction and Management in the Marun Oil Field*, *J. Petroleum Sci. & Eng.* | 2021 | 38 wells, Marun field (Iran) | LSSVM + Cuckoo Search Optimisation | — | — | R² ≈ 0.92 (severity regression) | Hyperparameter optimisation matters more than model family |
| Anonymous — *Early Warning of Lost Circulation Based on Physical Models and a Hybrid Neural Network*, *Processes* (MDPI) 14(3):559 | 2026 | Multi-well field data, surface-channel stream | Physics-derived features + hybrid NN | ≈ 0.91 | ≈ 0.88 | F1 ≈ 0.89; ahead-of-event warning | Physics features (ECD residual, pit-volume drift) outperform raw sensors |

**State of the art.** For tabular severity classification, near-perfect F1 scores (0.97–1.00) are now commonplace, but they are almost always reported on random splits within a single field. Held-out-well F1 collapses to ≈ 0.85–0.92 in studies that bother to do that split (Alsaihati 2022 R = 0.90 → 0.16 on Well 8 for some models). For time-series occurrence detection from surface sensors, RF/XGBoost on engineered features (pit-volume trend, flow-in vs flow-out, ECD residual) gets F1 ≈ 0.85–0.90.

**Realistic target for our capstone.**
- **Target: F1 ≥ 0.80, recall ≥ 0.85** on a held-out well for binary "loss occurring" detection. Recall is weighted higher because false negatives are far more costly than false alarms.
- **Stretch: F1 ≥ 0.88 with 3-class severity (seepage / partial / severe)**, matching the strongest log-based studies.

---

## 3. Kick / Influx Detection (Safety-Critical)

Kicks are the highest-consequence event in drilling (blowout precursor), so the literature emphasises **recall** and **time-to-detect** more than precision. The dominant model family is LSTM / BiLSTM applied to delta-flow, pit-volume, SPP, and downhole annular-pressure signals. Pilot-scale test rigs (LSU, Sichuan, Changping) provide most of the labelled data because field kicks are rare and rarely fully instrumented.

| Paper | Year | Data | Model | Precision | Recall | F1 / AUC | Lead / detection delay | Notes |
|---|---|---|---|---|---|---|---|---|
| Yin, Yang, Tyagi, Zhou, Hou, Wang, Tong, Cao — *Machine Learning for Deepwater Drilling: Gas-Kick-Alarm Classification Using Pilot-Scale Rig Data with Combined Surface-Riser-Downhole Monitoring*, **SPE Journal** 26(4): 1773–1799 (DOI 10.2118/205365-PA) | 2021 | 108 pilot-rig gas-kick experiments; surface + riser-acoustic + MWD fusion | LSTM, 6-level risk classifier (Risk 0–5) | 0.93 | 0.92 | F1 = 0.92, Accuracy = 91.6 % | Detection delay 2–7 seconds | Sets the modern benchmark for ML kick detection |
| Anonymous — *An Intelligent Kick Detection Model for Large-Hole Ultra-Deep Wells in the Sichuan Basin*, *Processes* (MDPI) 12(11):2589 | 2024 | Sichuan Basin (China), ultra-deep wells, multi-well | CNN-LSTM hybrid | ≈ 0.94 | ≈ 0.93 | F1 ≈ 0.93 | Detects 2–5 min ahead of conventional pit-volume alarm | Adapted for very high MW / HPHT conditions |
| Anonymous — *Intelligent Kick Warning Model Based on Machine Learning*, *Processes* (MDPI) 13(7):2162 | 2025 | Multi-well, multi-source surface sensors | Ensemble of LSTM + MLP, with TimeGAN for synthetic kick augmentation | 0.90 | 0.94 | F1 ≈ 0.92 | Time-to-warn 30–120 s post-onset | TimeGAN augmentation is the key trick for class imbalance |
| Arifeen, Petrovski, Hasan, Kotenko, Sletov, Hassard — *DataDRILL: Formation Pressure Prediction and Kick Detection for Drilling Rigs*, arXiv:2409.19724 | 2024 | DataDRILL public dataset, 28 drilling variables, 2 000+ samples | PCA + Principal Component Regression | — | — | R² = 0.78 for formation pressure; PCA for kick anomaly | First public dataset specifically for kick benchmarking |
| Anonymous — *Deep Learning Based Early Warning Methodology for Gas Kick of Deepwater Drilling Using Pilot-Scale Rig Data*, *Process Safety & Env. Protection* (Elsevier) | 2025 | Pilot-scale rig, multi-influx scenarios | Comparison: LSTM vs BiLSTM vs GRU | — | — | BiLSTM best — extends lead time vs LSTM/GRU | Bidirectional context matters when downhole channels lag surface |
| Field-data study, *Process Safety & Env. Protection* (S0957582020316815) | 2020 | Industrial deepwater field kicks | Supervised RF + boosted trees | 0.87 | 0.89 | F1 ≈ 0.88 | — | Real-world (not pilot) field data; smaller event count |

**State of the art (2024–25).** For pilot-scale rig data with surface + riser + downhole fusion, F1 ≈ 0.92, recall ≥ 0.92, and detection delay of seconds-to-minutes is now reproducible. On surface-only field data, F1 drops to ≈ 0.85–0.88. The bottleneck is no longer the model — it is (a) class imbalance (TimeGAN / SMOTE-Tomek help) and (b) sensor fusion (acoustic + Coriolis flow-out + delta-flow outperform pit volume alone).

**Realistic target for our capstone.** Surface sensors only, no downhole acoustic:
- **Target: recall ≥ 0.90, precision ≥ 0.75, F1 ≥ 0.82, detection within 60 s of onset.** Recall is weighted heavily because a missed kick is potentially catastrophic.
- **Stretch: recall ≥ 0.95, F1 ≥ 0.90** with delta-flow as the dominant feature.
- **Hard constraint: FAR ≤ 1 alarm / 12 h.** Crews ignore alarms above this rate, which is a documented failure mode in deployed systems.

---

## 4. ROP Modelling / Optimisation

ROP prediction is a regression task with the most mature and competitive ML literature of the four. XGBoost, LSTM, and BiLSTM-with-attention dominate. The interesting axis is *how* features are engineered: raw surface channels vs. physics-informed transforms (specific-energy, hydraulic-horsepower, ECD).

| Paper | Year | Data | Model | RMSE | R² | MAPE | Notes |
|---|---|---|---|---|---|---|---|
| Ji, Lou, Cheng, Xie, Zhu — *An Advanced Long Short-Term Memory (LSTM) Neural Network Method for Predicting Rate of Penetration (ROP)*, *ACS Omega* 8(1): 934–945 | 2023 | Tuha Shengbei block, China; 8 features (depth, gamma, density, pore pressure, well diameter, time, displacement, mud density) | PSO-optimised LSTM | 0.287 | 0.978 | 12.86 % | 44 % accuracy lift vs vanilla LSTM |
| Bai, Jin, Zhang, Dai — *Drilling Rate of Penetration Prediction Based on CBT-LSTM Neural Network*, *Sensors* 24(21):6966 | 2024 | 4 Chinese wells; 46 907 entries total; 10 features (torque, RPM, mud flow, density, depth, WOB, SPP, hookload, TVD, gamma) reduced to 6 via PCA | 2D-CNN + BiLSTM + Temporal-Pattern Attention | 0.036 m/h | 0.977 | 3.57 % | Among the lowest MAPE on real well data |
| Xiong et al. — *A Rate of Penetration (ROP) Prediction Method Based on Improved Dung Beetle Optimisation Algorithm and BiLSTM-SA*, *Scientific Reports* 14 (Nature) | 2024 | Dagang Oilfield, China; 18 000+ → 15 467 points; 15 features incl. bit geometry, hydraulics, mud density | IDBO-optimised BiLSTM + self-attention | 0.065 | 0.963 | — | Best metaheuristic-tuned deep model |
| Jiao, Li, Li, Gai, Zou, Su — *Hybrid Physics-Machine Learning Models for Predicting Rate of Penetration in the Halahatang Oil Field, Tarim Basin*, *Scientific Reports* | 2024 | Halahatang field, Tarim Basin, China; 5 655 points, 14 features incl. pore-pressure gradient, fracture gradient, Poisson's ratio | Hybrid: physics residual + ML correction | 1.586 | 0.994 | 5.09 % | Residual-modelling hybrid clearly beats simple averaging or bagging |
| Alavi Nezhad Khalil Abad, Hazbeh, Rajabi, Tabasi, Lajmorak, Ghorbani, Radwan, Mudabbir — *Determination of the Rate of Penetration by Robust Machine Learning Algorithms Based on Drilling Parameters*, *ACS Omega* | 2023 | 3 wells, SW Iran; 2 026 points; 5 features (RPM, WOB, torque, SPP) | LSSVM-PSO (vs LSSVM-GA, vs empirical Maurer/Galle-Woods) | 1.92 (test) | 0.952 (test) | — | Beats Maurer and Galle-Woods empirical equations by wide margin |
| Anonymous — *A Highly Accurate and Robust Prediction Framework for Drilling ROP Based on ML Ensemble Algorithm*, *Geoenergy Science & Engineering* (Elsevier) | 2024 | Multi-well | Stacked ensemble (RF + SVR + GBM + LightGBM + XGBoost + ExtraTrees) | — | > 0.96 | < 10 % error | Stacking yields incremental gains over single XGBoost |
| Anonymous — *Application of XGBoost Algorithm in Rate of Penetration Prediction with Accuracy*, IPTC 2022 | 2022 | Multi-well | XGBoost | — | 0.98 | 4.8 % | Industry-favoured baseline; trivial to deploy |
| Faster-Drilling study (Nuwara) — Volve dataset Wells F-1, F-5 | 2022 | Volve field | RF / Gradient Boosting / XGBoost | — | > 0.75 (blind-well) | — | Mud temperature surprisingly important feature |

**State of the art.** On well-curated, in-field data, R² ≥ 0.97 and MAPE ≤ 5 % is routine. Cross-field (train on Field A, predict on Field B) performance is rarely published, but where it is, MAPE jumps to 15–25 %. Hybrid physics+ML (Halahatang study) achieves R² ≈ 0.994 by learning a residual correction over a physics model — a strong template for our system.

**Realistic target for our capstone.** Within a single field (e.g., Volve), with proper preprocessing and lithology-aware features:
- **Target: R² ≥ 0.85, MAPE ≤ 15 %, RMSE ≤ 4 m/h** on a blind well.
- **Stretch: R² ≥ 0.92, MAPE ≤ 10 %** — would match published mid-tier work.
- **Cross-field target (Volve → Brazilian 3W or vice versa): MAPE ≤ 25 %**, which is where genuinely generalisable models live.

---

## 5. Datasets Used in Literature

Five datasets keep recurring across the surveyed papers.

**Volve (Equinor, Norwegian North Sea, 2008–2016).** Public release covers full lifecycle of an entire field — drilling, completion, production, seismic, wireline. The drilling time-series at 1 Hz is the de-facto public benchmark for stuck-pipe autoencoders. *Pros:* free, large, real, multi-well. *Cons:* relatively few documented failure events; labels for stuck/lost/kick are not curated by Equinor and must be inferred from daily reports.

**3W (Petrobras, Brazil).** First public dataset built specifically for undesirable-event classification in oil wells, hosted on Kaggle and GitHub. *Pros:* labelled rare events (flow instability, scaling, hydrate formation, BSW abrupt change); designed for benchmarking. *Cons:* labels are downstream of drilling (production events); needs adaptation for drilling-side failures.

**DataDRILL (Arifeen et al., 2024).** Recently released specifically for formation-pressure and kick-detection benchmarking — 28 drilling variables, 2 000+ samples. *Pros:* explicit kick benchmark. *Cons:* small; PCA-based baselines suggest limited model headroom.

**Pilot-scale rig datasets (LSU / Yin et al., Sichuan, Changping).** Series of controlled gas-kick experiments (108+ tests in Yin 2021). *Pros:* perfectly labelled, multi-sensor (surface + riser-acoustic + downhole). *Cons:* not field data — transfer to real rigs is unproven.

**Marun / Azadegan / Halahatang (private national-oil-company sets).** Cited heavily in lost-circulation and ROP work. *Pros:* large (65 000+ records in Azadegan), labelled by operations engineers. *Cons:* not public — limits reproducibility.

**OSDU / NPD sample sets.** OSDU R3+ ships with a sample drilling-ops corpus; NPD (Norwegian Petroleum Directorate) hosts well log and drilling-report data for the Norwegian Continental Shelf. *Pros:* growing curated catalogues, modern schemas. *Cons:* not failure-event-curated; useful for context features (lithology, formation tops) more than for training.

---

## 6. Recommended Benchmarks for This Project

Commitment targets for the capstone, calibrated against the literature scan above.

| Task | Metric | Baseline (random/naive) | Literature SOTA | **Our target** | Stretch goal |
|---|---|---|---|---|---|
| Stuck pipe (binary, surface sensors, blind well) | F1 | ~0.10 (stuck class ~5 % prior) | 0.94 (Marana 2025, in-field); 0.98 (Xie 2025, in-field) | **F1 ≥ 0.75, AUC ≥ 0.85, lead ≥ 15 min, FAR ≤ 10 %** | F1 ≥ 0.85, lead ≥ 25 min |
| Lost circulation (binary occurrence, blind well) | F1 | ~0.15 (~8 % prior) | 0.99 (in-field); ~0.90 (held-out-well) | **F1 ≥ 0.80, recall ≥ 0.85** | F1 ≥ 0.88 with 3-class severity |
| Kick / influx (binary, surface sensors only) | Recall + FAR | recall ~0.05 at usable FAR | recall = 0.92 (Yin 2021, multi-source); recall ≈ 0.94 (Bi-LSTM 2025) | **Recall ≥ 0.90, precision ≥ 0.75, F1 ≥ 0.82, FAR ≤ 1/12 h, detect ≤ 60 s** | Recall ≥ 0.95, F1 ≥ 0.90 |
| ROP (regression, blind well, single field) | R² / MAPE | R² ~0.30 (mean predictor), MAPE ~40 % | R² ≥ 0.97, MAPE ≤ 5 % | **R² ≥ 0.85, MAPE ≤ 15 %, RMSE ≤ 4 m/h** | R² ≥ 0.92, MAPE ≤ 10 %; cross-field MAPE ≤ 25 % |

Targets are intentionally below the published in-field SOTA. The literature is dominated by random-shuffle splits within a single field — almost every paper that reports a blind-well split sees a 5–20 percentage-point drop in F1 or a doubling of MAPE. Aiming for the literature SOTA on a blind-well evaluation is unrealistic; aiming for 80–90 % of it is defensible and demonstrably hard.

---

## 7. Key Methodology Insights

Recurring patterns from the strongest papers (those reporting blind-well splits, comparing to baselines, and publishing code or data):

- **Sliding-window features (5–30 min) beat instantaneous values.** Almost every strong paper uses rolling statistics (mean, std, slope, ratio of current-vs-baseline) over a window. Window length of 5 min for kicks, 15–30 min for stuck pipe, 1–5 min for ROP.
- **Physics-informed features outperform raw sensors.** Drilling-specific transforms — mechanical specific energy (MSE), ECD residual, delta-flow (flow-out minus flow-in), torque-to-WOB ratio, hookload-vs-block-position residual — recur across papers as the most important features. Halahatang ROP study and the Aramco AccuPipePred framework both lean on this.
- **Class imbalance is the dominant failure mode, not model choice.** Failure events typically make up 1–8 % of data. Successful papers use SMOTE-Tomek, TimeGAN (Intelligent Kick Warning Model 2025), focal loss, or anomaly-detection framing (autoencoder on normal data only) — rarely vanilla cross-entropy on raw data.
- **Unsupervised anomaly detection (LSTM-AE, Crossformer) often matches supervised models** without needing curated failure labels — a major practical advantage. The Marana 2025 LSTM-AE on Volve and the 2025 Crossformer on Volve both work without labelled stuck-pipe events.
- **Ensembles add 1–3 points of F1 over the best single model.** Stacking RF + XGBoost + LightGBM + LSTM is reported in three of the surveyed papers; the gain is real but small. The capstone should build a strong single model first.
- **Cross-well / cross-field generalisation is rarely tested and usually fails.** Alsaihati 2022 explicitly shows R = 0.94 on a random test split collapsing to R = 0.16 on Well 8 for SVM. Any capstone evaluation strategy must include at least one held-out blind well.
- **Lead time and false-alarm rate dominate deployability.** A model with F1 = 0.95 but FAR > 1/h will be turned off by crews. Yin 2021's 2–7 second detection delay is the gold standard; capstone work should measure and report this explicitly.
- **Hybrid physics + ML beats pure ML on ROP and stuck pipe.** Residual-modelling hybrids (Halahatang ROP, Aramco/Halliburton stuck-pipe hybrids) consistently top the leaderboards.
- **Feature selection by mutual information / Pearson correlation / SHAP recurs.** Strong papers reduce 15+ raw channels to 5–8 features via filtering. CBT-LSTM goes from 10 → 6 via PCA; lost-circulation studies routinely drop neutron and density logs that add no signal.
- **Reporting standards vary wildly.** Metrics range from per-class precision/recall (preferred) to weighted-F1 alone (less informative). The capstone should report at minimum: precision, recall, F1 per class, AUC, FAR, lead time distribution, and blind-well performance.

---

## References (full citation index)

1. Marana et al. *Stuck Pipe Detection in Oil and Gas Drilling Operations Using Deep Learning Autoencoder for Anomaly Diagnosis.* Applied Sciences (MDPI), 15(9):5042, 2025. https://www.mdpi.com/2076-3417/15/9/5042
2. Magana-Mora, A.; Gharbi, S.; Alshaikh, A.; Al-Yami, A. *AccuPipePred: A Framework for the Accurate and Early Detection of Stuck Pipe for Real-Time Drilling Operations.* SPE Middle East Oil & Gas Show, SPE-194980-MS, 2019.
3. *Early Signs of Stuck Pipe Detection Based on Crossformer.* arXiv:2503.07440, 2025.
4. Aljubran, M. et al. *Early Sign Detection for Stuck Pipe Scenarios Using Unsupervised Deep Learning.* J. Petroleum Science & Engineering, 2022.
5. Xie et al. *Research on Stuck Pipe Prediction Based on Supervised and Unsupervised Ensemble Learning.* Processes (MDPI) 13(10):3309, 2025.
6. Elmgerbi, A.; Thonhauser, G. *Data-Driven Stuck Pipe Prediction and Remedies.* Upstream Oil & Gas Technology (Elsevier), 2021.
7. *Enhanced Real-Time Stuck Pipe Prediction Using Hybrid Physics+AI Agents and Comprehensive Sticking Mechanism Evaluation.* SPE/IADC Drilling Conference, 2024.
8. Alsaihati, A.; Abughaban, M.; Elkatatny, S.; Al Shehri, D. *Application of Machine Learning Methods in Modeling the Loss of Circulation Rate while Drilling Operation.* ACS Omega, 7(24), 2022.
9. Olukoga, T.A.; Feng, Y. *A Case Study on the Classification of Lost Circulation Events During Drilling Using Machine Learning Techniques on an Imbalanced Large Dataset.* arXiv:2209.01607, 2022.
10. Azadivash, A. *Lost Circulation Intensity Characterization in Drilling Operations: Leveraging Machine Learning and Well Log Data.* Heliyon, 2024.
11. *Automated Lost Circulation Severity Classification and Mitigation System Using Explainable Bayesian Optimized Ensemble Learning Algorithms.* Journal of Petroleum Exploration & Production Technology, 2024.
12. Sabah, M. et al. *Hybrid Machine Learning Algorithms to Enhance Lost-Circulation Prediction and Management in the Marun Oil Field.* J. Petroleum Science & Engineering, 2021.
13. *Early Warning of Lost Circulation Based on Physical Models and a Hybrid Neural Network.* Processes (MDPI) 14(3):559, 2026.
14. Yin, Q.; Yang, J.; Tyagi, M.; Zhou, X.; Hou, X.; Wang, N.; Tong, G.; Cao, B. *Machine Learning for Deepwater Drilling: Gas-Kick-Alarm Classification Using Pilot-Scale Rig Data with Combined Surface-Riser-Downhole Monitoring.* SPE Journal 26(4): 1773–1799, 2021. DOI 10.2118/205365-PA.
15. *An Intelligent Kick Detection Model for Large-Hole Ultra-Deep Wells in the Sichuan Basin.* Processes (MDPI) 12(11):2589, 2024.
16. *Intelligent Kick Warning Model Based on Machine Learning.* Processes (MDPI) 13(7):2162, 2025.
17. Arifeen, M.; Petrovski, A.; Hasan, M.J.; Kotenko, I.; Sletov, M.; Hassard, P. *DataDRILL: Formation Pressure Prediction and Kick Detection for Drilling Rigs.* arXiv:2409.19724, 2024.
18. *Deep Learning Based Early Warning Methodology for Gas Kick of Deepwater Drilling Using Pilot-Scale Rig Data.* Process Safety & Environmental Protection (Elsevier), 2025.
19. *Field Data Analysis and Risk Assessment of Gas Kick During Industrial Deepwater Drilling Process Based on Supervised Learning Algorithm.* Process Safety & Environmental Protection (Elsevier), 2020.
20. Ji, H.; Lou, Y.; Cheng, S.; Xie, Z.; Zhu, L. *An Advanced Long Short-Term Memory (LSTM) Neural Network Method for Predicting Rate of Penetration (ROP).* ACS Omega 8(1): 934–945, 2023.
21. Bai, K.; Jin, S.; Zhang, Z.; Dai, S. *Drilling Rate of Penetration Prediction Based on CBT-LSTM Neural Network.* Sensors (Basel) 24(21):6966, 2024.
22. Xiong, M.; Zheng, S.; Liu, W.; Cheng, R.; Wang, L.; Zhang, H.; Wang, G. *A Rate of Penetration (ROP) Prediction Method Based on Improved Dung Beetle Optimization Algorithm and BiLSTM-SA.* Scientific Reports (Nature), 2024.
23. Jiao, S.; Li, W.; Li, Z.; Gai, J.; Zou, L.; Su, Y. *Hybrid Physics-Machine Learning Models for Predicting Rate of Penetration in the Halahatang Oil Field, Tarim Basin.* Scientific Reports, 2024.
24. Alavi Nezhad Khalil Abad, S.V.; Hazbeh, O.; Rajabi, M.; Tabasi, S.; Lajmorak, S.; Ghorbani, H.; Radwan, A.E.; Mudabbir, M. *Determination of the Rate of Penetration by Robust Machine Learning Algorithms Based on Drilling Parameters.* ACS Omega, 2023.
25. *A Highly Accurate and Robust Prediction Framework for Drilling Rate of Penetration Based on Machine Learning Ensemble Algorithm.* Geoenergy Science & Engineering (Elsevier), 2024.
26. *Application of XGBoost Algorithm in Rate of Penetration Prediction with Accuracy.* IPTC International Petroleum Technology Conference, 2022.
27. *Review of Stuck Pipe Prediction Methods and Future Directions.* SPE Journal 30(06): 3334, 2025.
28. Vargas, R. et al. *3W Dataset — Undesirable Events in Oil Wells (Petrobras).* Public dataset, github.com/ricardovvargas/3w_dataset.
29. *Data-Driven Indicators for the Detection and Prediction of Stuck-Pipe Events in Oil & Gas Drilling Operations.* Upstream Oil & Gas Technology (Elsevier), 2022.
30. *Intelligent Prediction of Stuck Pipe Using Combined Data-Driven and Knowledge-Driven Model.* Applied Sciences (MDPI) 12(10):5282, 2022.
