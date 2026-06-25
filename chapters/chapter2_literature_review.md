# CHAPTER TWO

# LITERATURE REVIEW

## 2.1 Overview of Drilling Operations and Failure Modes

Rotary drilling is the predominant method used in the oil and gas industry to penetrate subsurface formations and access hydrocarbon reservoirs. The process involves rotating a drill bit at the bottom of a drill string while circulating drilling fluid (mud) through the system to cool the bit, transport cuttings to surface, maintain wellbore pressure, and stabilize the borehole wall. The drilling system operates under the simultaneous influence of mechanical forces (weight on bit, torque, vibration), hydraulic conditions (mud flow rate, pressure distribution, equivalent circulating density), geological factors (formation type, pore pressure, in-situ stress), and chemical interactions between the drilling fluid and formation rock.

This multifactorial complexity gives rise to several well-documented failure modes, each with distinct causal mechanisms and surface-observable signatures:

**Stuck pipe** is the most costly and common drilling failure, occurring when the drill string becomes immobilized in the wellbore. Three primary mechanisms are recognized: differential sticking, where the drill string is held against a permeable formation by differential pressure across a mud cake; mechanical sticking, caused by borehole collapse, ledges, or key-seating; and pack-off sticking, where cuttings or cavings accumulate around the drill string (Montes et al., 2025). Stuck pipe events typically manifest through elevated torque, increased drag on connections, erratic standpipe pressure, and loss of pipe rotation or reciprocation capability.

**Lost circulation** occurs when drilling fluid flows uncontrollably into the formation through natural fractures, induced fractures, or highly permeable zones. The consequences include loss of hydrostatic pressure control (potentially leading to kicks), increased drilling fluid costs, and formation damage. Surface indicators include decreasing mud pit levels, reduced return flow, and dropping standpipe pressure (Pang et al., 2021).

**Bit wear and damage** encompasses progressive degradation of the drill bit cutting structure through abrasion, impact, erosion, or thermal damage. Worn bits produce characteristic changes in drilling parameters: decreasing ROP at constant WOB, increasing torque fluctuations, and changes in vibration patterns. Continued drilling with a damaged bit leads to poor hole quality and potential downhole tool damage.

**Wellbore instability** is a broad category encompassing borehole enlargement (washout), borehole collapse, and formation sloughing. These conditions arise from imbalances between the in-situ stress field, pore pressure, and the pressure exerted by the drilling fluid column. Surface indicators include increasing torque and drag, poor hole cleaning, tight spots during tripping, and caliper log anomalies.

**Kicks and gas influx** occur when formation pore pressure exceeds the hydrostatic pressure of the drilling fluid column, allowing formation fluids to enter the wellbore. Early indicators include increased return flow rate, pit gain, decreased standpipe pressure, and drilling breaks. Uncontrolled kicks can escalate to blowouts — the most catastrophic failure in drilling operations.

Traditional detection of these failure modes relies on real-time monitoring of surface drilling parameters by rig-site personnel, supplemented by alarm systems that trigger when individual parameters exceed predefined thresholds. While this approach provides basic monitoring capability, it suffers from several limitations: threshold values are typically set conservatively to avoid missed detections, resulting in high false alarm rates; parameters are monitored independently without consideration of multivariate interactions; temporal patterns that develop over minutes to hours are difficult for human operators to detect; and the reactive nature of threshold monitoring provides minimal lead time for intervention (Noshi and Schubert, 2018).

## 2.2 Non-Productive Time in Drilling Operations

Non-productive time represents the aggregate of all time lost during drilling operations due to unplanned events, equipment failures, and operational complications. NPT is the industry standard metric for quantifying drilling inefficiency and is directly correlated with drilling cost overruns.

Industry-wide analyses consistently report that NPT accounts for 20 to 30 percent of total drilling time in conventional operations. A comprehensive analysis by the Society of Petroleum Engineers noted that complications and accidents account for 20 to 25 percent of total well construction time across global operations (SPE-200740, 2020). In the North Sea, Alharbi (2020) analyzed 93 wells drilled between 2006 and 2019 by a major drilling contractor, reporting that wellbore instability alone accounted for 10 percent of all drilling NPT, with an average cost of 2 million US dollars per affected well. The study noted that these costs were incurred despite the application of conventional monitoring and mitigation practices, highlighting the limitations of reactive approaches.

Alshaikh et al. (2020) proposed an integrated framework for incorporating risk management principles into NPT analysis. Their study, which examined drilling operations across multiple operators, identified stuck pipe, lost circulation, and well control events as the three leading causes of NPT. The authors argued that a systematic, data-driven approach to risk identification and quantification is essential for meaningful NPT reduction, noting that post-event analysis is inherently insufficient for prevention.

A study by the International Petroleum Technology Conference analyzed drilling data from 252 wells across 20 countries, developing an AI-based drilling risk prediction model that categorized wells by expected NPT risk profiles (IPTC-23550, 2024). The study demonstrated that machine learning models could effectively predict drilling risk categories before spud, enabling proactive planning and resource allocation. However, the study focused on pre-drill risk assessment rather than real-time failure prediction during operations.

The economic imperative for NPT reduction is clear. With deepwater rig spread rates exceeding one million US dollars per day, even small reductions in NPT translate to significant cost savings. A shift from reactive to predictive failure management, enabled by machine learning, offers the potential for step-change improvements in drilling efficiency.

## 2.3 Machine Learning in Drilling Operations: A General Review

The application of machine learning to drilling operations has expanded rapidly over the past decade, driven by increasing data availability from rig instrumentation, advances in computational capability, and the maturation of ML algorithms and frameworks.

Noshi and Schubert (2018) provided one of the earliest comprehensive reviews of machine learning applications in drilling operations. Their survey identified nine key areas where ML could enhance drilling performance: rate of penetration prediction, drillstring vibration analysis, lost circulation prediction, stuck pipe detection, gas influx detection, drillstring washout detection, abnormal drilling event identification, drilling fluid design optimization, and integrated drilling optimization. The review noted that while individual applications showed promise, the integration of ML predictions into operational decision-making workflows remained largely unexplored.

Machine learning approaches applied to drilling can be broadly categorized into three paradigms:

**Supervised learning** methods, including Random Forest, Gradient Boosting, Support Vector Machines, and neural networks, require labeled training data specifying both input features and desired output classifications or values. These methods have been widely applied to drilling parameter prediction and failure classification where historical labeled data is available (Agrawal et al., 2022).

**Unsupervised learning** methods, including clustering algorithms, Isolation Forest, and autoencoders, operate without labeled data, instead identifying patterns, structures, and anomalies within the data itself. These methods are particularly valuable in drilling applications where labeled failure events are scarce — a common challenge in the industry (Fernandes et al., 2024).

**Deep learning** methods, particularly recurrent neural networks and their variants (LSTM, GRU), excel at modeling sequential and temporal dependencies in time-series data. Their ability to capture long-range patterns in drilling sensor streams makes them well-suited for early failure detection, where anomalous patterns may develop gradually over extended time periods (Aranha et al., 2024).

## 2.4 Machine Learning for Stuck Pipe Prediction

Stuck pipe prediction has received significant attention in the drilling ML literature due to the high frequency and cost of these events.

Elahifar and Hosseini (2022) developed a machine learning model for stuck pipe prediction using statistical data from Middle East oil fields. Their study compared multiple algorithms — including logistic regression, decision trees, random forest, and support vector machines — applied to a dataset of drilling parameters including mud weight, plastic viscosity, yield point, and geological indicators. The Random Forest classifier achieved the highest accuracy, with the study demonstrating that readily available drilling parameters contain sufficient information for effective stuck pipe prediction. However, the study relied on static datasets and did not address real-time prediction or alert generation.

Elmousalami and Elaskary (2020) investigated stuck pipe classification and mitigation in the Gulf of Suez oil fields using artificial intelligence. Their study employed the Extra Trees algorithm, a variant of the Random Forest approach, to classify stuck pipe incidents based on drilling parameters. The model achieved 100 percent accuracy on the test dataset. While this result is impressive, the authors acknowledged that the study was conducted on a static, well-curated dataset and noted that real-time performance in operational environments would require additional engineering for data streaming, preprocessing, and alert integration.

Montes, Ashok, and van Oort (2025) published a comprehensive review of stuck pipe prediction methods in the SPE Journal, examining the landscape of ML-based, physics-based, and hybrid approaches. The review identified over 50 studies on stuck pipe prediction published between 2010 and 2024, noting a clear trend toward deep learning methods and ensemble approaches. The authors concluded that while individual model accuracy has improved significantly, the field lacks integrated frameworks that combine prediction with operational response systems. They specifically called for research on end-to-end systems that span data ingestion, model inference, risk quantification, and alert delivery.

An SPE study on extended-reach wells demonstrated that ensemble machine learning methods could predict stuck pipe events with greater than 94 percent accuracy using a combination of gradient boosting and random forest classifiers (SPE-206516-MS, 2021). The study processed data from multiple extended-reach wells and showed that ensemble methods consistently outperformed individual classifiers, supporting the case for multi-model approaches.

Al-Mamoori, Tian, and Ma (2025) applied deep learning autoencoders to stuck pipe anomaly detection in oil and gas drilling operations. Their study used autoencoder networks trained on normal drilling data to identify anomalous patterns indicative of impending stuck pipe conditions. The approach demonstrated the viability of unsupervised deep learning for stuck pipe prediction, eliminating the need for labeled failure data. This is a significant advantage in practical applications where documented stuck pipe events are often poorly labeled or entirely undocumented.

The review of stuck pipe prediction literature reveals a consistent gap: while individual models achieve high accuracy, no study has integrated stuck pipe prediction with other failure mode predictions into a comprehensive risk assessment framework with automated alert delivery.

## 2.5 Machine Learning for Lost Circulation Prediction

Lost circulation events represent another major source of NPT and drilling cost overruns, and have been the subject of several machine learning studies.

Pang et al. (2021) developed a machine learning model for lost circulation prediction using drilling parameters and geological data. The study evaluated multiple algorithms including Random Forest, Gradient Boosting, and Support Vector Machines on a dataset from multiple wells, identifying key predictive features including equivalent circulating density, rate of penetration, and formation characteristics. The Random Forest model demonstrated the best performance, achieving high precision and recall for lost circulation event prediction. The study made a valuable contribution in identifying the most informative features for lost circulation prediction but did not address real-time implementation or integration with monitoring systems.

Feng et al. (2024) published an interpretable lost circulation analysis in the SPE Journal that introduced a methodology for labeling, identifying, and analyzing lost circulation events in drilling operations. The study employed XGBoost for classification and incorporated Shapley Additive Explanations (SHAP) for model interpretability, enabling engineers to understand which factors contributed most to each prediction. The emphasis on interpretability represents an important advancement, as the ability to explain predictions builds trust among field personnel and supports informed decision-making. However, the study focused exclusively on lost circulation and did not integrate predictions with other failure mode assessments.

Hou et al. (2020) applied big data technology and machine learning to lost circulation prediction in the South China Sea. The study demonstrated the feasibility of processing large-scale drilling datasets for real-time prediction, with the machine learning model achieving significant improvements over conventional geomechanical prediction methods. The authors noted the importance of data quality and standardization for operational deployment of ML-based prediction systems.

Across the lost circulation prediction literature, a consistent finding is that machine learning models can effectively identify conditions conducive to fluid loss before the event occurs. However, existing studies treat lost circulation in isolation from other failure modes and do not address the engineering requirements for deploying predictions in real-time operational environments.

## 2.6 Time-Series Anomaly Detection in Drilling Using Deep Learning

The application of deep learning, particularly LSTM networks, to time-series anomaly detection in drilling operations has emerged as one of the most active areas of research in drilling intelligence.

Aranha et al. (2024) published a significant study in the SPE Journal describing a system for oilwell anomaly detection using a dual approach combining deep learning and decision diagrams. The system employed LSTM networks to detect temporal anomalies in drilling sensor data and used decision diagram logic to classify detected anomalies by type and severity. The dual approach achieved robust anomaly detection while maintaining interpretability — the decision diagram component provided clear explanations for each detection. The system was validated on data from multiple wells and demonstrated strong generalization performance. This study represents one of the most complete implementations of deep learning for drilling anomaly detection, though it focused on detection rather than integrated risk scoring and alerting.

The LSTM Autoencoder architecture has been specifically applied to stuck pipe prediction in two notable SPE papers. SPE-205677-MS (2021) presented an unsupervised learning model for pipe stuck predictions using an LSTM Autoencoder architecture. The study trained the autoencoder on sequences of normal drilling data and used reconstruction error as the anomaly score, with higher reconstruction errors indicating greater deviation from normal operating patterns. The unsupervised approach was particularly valuable given the scarcity of labeled stuck pipe events. SPE-207805-MS (2021) extended this work to real-time prediction, demonstrating that LSTM Autoencoder models could provide reliable stuck pipe risk assessments with sufficient lead time for operational response.

A study using the Petrobras 3W dataset — a publicly available benchmark for oil well anomaly detection — demonstrated that LSTM-based models could achieve F1-scores of 92 percent on multivariate anomaly detection tasks, outperforming conventional machine learning approaches including Random Forest and Support Vector Machines on the same dataset (LEMIGAS, 2024). The Petrobras 3W dataset includes labeled instances of multiple event types across numerous wells, providing a rigorous evaluation benchmark.

The advantages of LSTM-based approaches for drilling anomaly detection are well-established in the literature: they can capture long-range temporal dependencies; they can be trained in an unsupervised manner using reconstruction error as the anomaly signal; and they can process multivariate input, considering interactions between multiple drilling parameters simultaneously. However, LSTM models have known limitations: they require substantial computational resources for training and inference; they can be sensitive to hyperparameter selection; and their temporal anomaly scores may not directly translate into actionable risk assessments without additional processing.

## 2.7 Unsupervised Anomaly Detection Methods in Drilling

Unsupervised anomaly detection methods are of particular importance in drilling applications because labeled failure data is often unavailable or unreliable. Two approaches have received significant attention: Isolation Forest and autoencoder-based methods.

The Isolation Forest algorithm, introduced by Liu et al. (2008), detects anomalies by randomly partitioning data points using binary trees. The fundamental insight is that anomalous points, being rare and different from the majority of observations, are easier to isolate — they require fewer random partitions to separate from the rest of the data. This results in shorter average path lengths in the isolation trees for anomalous points, providing a natural anomaly score without requiring assumptions about data distribution.

Fernandes, Komati, and Gazolli (2024) conducted a comparative analysis of one-class classifiers for anomaly detection in oil-producing wells using a multivariate time series dataset. The study evaluated Isolation Forest, One-Class SVM, Local Outlier Factor, and autoencoder approaches on production data from multiple wells. Isolation Forest demonstrated competitive performance across multiple evaluation metrics while requiring significantly less computational overhead than deep learning approaches. The study concluded that Isolation Forest provides an effective balance of detection accuracy and computational efficiency for well monitoring applications.

A 2025 study in the SPE Journal presented a new workflow for drilling anomaly detection that combined prior domain knowledge with unsupervised learning methods. The approach used physics-based constraints to guide the unsupervised learning process, resulting in anomaly detections that were more aligned with known failure mechanisms. The integration of domain knowledge with data-driven methods represents a promising direction for improving the practical utility of unsupervised anomaly detection in drilling (SPE Journal, 2025).

Autoencoder-based anomaly detection operates on a different principle: a neural network is trained to reconstruct normal operating data through a compressed representation. When presented with anomalous input, the autoencoder produces high reconstruction error because the anomalous patterns were not present in the training data. This approach has been combined with LSTM architectures (as discussed in Section 2.6) to create sequence-aware anomaly detectors that consider both the statistical properties and temporal structure of drilling data.

The complementary strengths of Isolation Forest (statistical anomaly detection, low computational cost, no training required) and LSTM Autoencoders (temporal anomaly detection, sequence modeling, pattern complexity handling) motivate their combined use in ensemble frameworks.

## 2.8 Dynamic Time Warping for Pattern Matching in Drilling Data

Dynamic Time Warping is an algorithm for measuring the similarity between two temporal sequences that may vary in speed, phase, or local timing. Unlike Euclidean distance, which requires point-by-point alignment between sequences of equal length, DTW finds an optimal elastic alignment that minimizes the total distance between paired elements. This property makes DTW particularly valuable for comparing drilling sensor signatures, where similar failure events may develop at different rates or with different phase relationships across wells and operating conditions.

Kloska, Grmanova, and Rozinajova (2023) published a study on expert-enhanced Dynamic Time Warping for anomaly detection in industrial systems. Their approach combined DTW-based pattern matching with expert knowledge to improve anomaly detection performance in industrial sensor data. The study demonstrated that DTW could effectively match current sensor readings against a library of known anomaly patterns, with expert-enhanced thresholds reducing false positive rates compared to purely data-driven approaches. The methodology is directly applicable to drilling operations, where libraries of historical failure signatures can serve as reference patterns for real-time matching.

In the context of drilling failure prediction, DTW offers a unique capability that complements both statistical anomaly detection and temporal deep learning. While Isolation Forest detects points that are statistically unusual and LSTM Autoencoders detect sequences that deviate from learned normal patterns, DTW can directly compare current drilling signatures against templates extracted from known historical failure events. This template-matching approach provides an additional dimension of failure detection that is particularly effective when the failure signature is well-characterized — for example, the progressive torque increase and pressure oscillation pattern that commonly precedes differential sticking events.

The computational complexity of DTW is a practical consideration for real-time applications. The standard DTW algorithm has quadratic time complexity with respect to sequence length, which can be prohibitive for high-frequency sensor data. However, approximation methods such as FastDTW and constrained DTW (Sakoe-Chiba band, Itakura parallelogram) reduce computational requirements to near-linear complexity with minimal loss of accuracy, enabling real-time application in drilling monitoring contexts.

## 2.9 Ensemble Methods for Drilling Failure Prediction

The use of ensemble methods — approaches that combine multiple models to produce a superior prediction — has gained increasing traction in drilling applications.

Agrawal et al. (2022) conducted a comparative study of homogeneous ensemble methods with conventional ML classifiers for litho-facies detection using real-time drilling data. The study, which used field data from multiple wells, found that ensemble methods — particularly bagging and boosting approaches — consistently outperformed individual classifiers in terms of accuracy, robustness to noise, and generalization to unseen wells. The study provided empirical evidence that the combination of multiple weak learners produces a stronger predictor in the context of drilling data analysis.

Aziz et al. (2022) applied predictive analytics for oil and gas asset maintenance using the XGBoost algorithm, an advanced gradient boosting implementation. The study demonstrated a 6.43 percent improvement in classification accuracy compared to the Random Forest algorithm alone, illustrating the benefits of algorithmic advances within the ensemble learning paradigm. The study focused on equipment maintenance prediction, which shares structural similarities with drilling failure prediction in terms of feature types and data characteristics.

Elkatatny et al. (2023) combined Gradient Boosted Decision Trees with Bayesian optimization for drilling efficiency enhancement. Their approach used Bayesian optimization to tune the ensemble model hyperparameters, resulting in significant improvements in rate of penetration prediction accuracy. The study illustrated the importance of careful hyperparameter tuning in achieving optimal ensemble performance.

While these studies demonstrate the value of ensemble methods within a single model family (e.g., multiple decision trees), a less explored approach is the heterogeneous ensemble — combining fundamentally different model types to achieve complementary coverage. In the context of drilling failure prediction, a heterogeneous ensemble combining statistical methods (Isolation Forest), deep learning methods (LSTM Autoencoder), and similarity-based methods (DTW) can address different aspects of the failure detection problem: statistical outliers, temporal anomalies, and known failure pattern matching, respectively. This heterogeneous ensemble approach forms the core innovation of the DrillGuard framework.

## 2.10 Real-Time Monitoring Systems and Digital Twin Applications

The concept of the digital twin — a virtual representation of a physical system that is updated in real-time with sensor data — has been applied to drilling operations with increasing frequency.

SPE-199566-MS (2020) explored the optimization of drilling wells using digital twin technology. The study demonstrated that a digital twin of the drilling system could be used to simulate operational scenarios in real-time, enabling engineers to evaluate the consequences of parameter adjustments before implementing them on the rig. The digital twin approach showed promise for drilling optimization but focused primarily on performance improvement rather than failure prediction and prevention.

SPE-222587-MS (2024) presented recent work at ADIPEC on digital twins that integrate physics-informed AI for drilling optimization. The study reported a 40 percent improvement in average drilling performance when AI-enhanced digital twins were used to guide operational decisions. The physics-informed approach constrains the AI models to produce outputs consistent with known physical laws, improving reliability and interpretability. However, the study focused on optimization rather than anomaly detection and did not include an alerting component.

SPE-221003-MS (2024) described the conception of a smart twin for the automation of drilling operations, combining real-time data assimilation with automated control recommendations. The study envisioned a system that could progressively automate routine drilling decisions while maintaining human oversight for safety-critical situations.

The IPTC study on AI-based drilling risk prediction (IPTC-23550, 2024) represents one of the largest-scale applications of ML to drilling risk assessment, analyzing data from 252 wells across 20 countries. The study demonstrated that ML models could effectively categorize wells by risk profile and predict associated NPT. However, the study focused on pre-drill risk assessment — evaluating risk before the well is drilled — rather than real-time failure prediction during active operations.

Across the digital twin and real-time monitoring literature, a consistent observation is that existing systems prioritize optimization (maximizing ROP, minimizing cost) over failure prediction and alerting. This represents a significant gap, as the economic impact of failure prevention typically exceeds the impact of incremental performance optimization.

## 2.11 Mobile and Alert Systems in Industrial Applications

The delivery of real-time predictions and alerts to field personnel is a critical but underexplored component of drilling intelligence systems. While extensive research has addressed the ML modeling aspects of failure prediction, comparatively little attention has been paid to the engineering of alert delivery systems that ensure predictions reach the right personnel in a timely and actionable format.

Firebase Cloud Messaging (FCM), a cross-platform messaging solution developed by Google, has become a standard technology for real-time push notification delivery in mobile applications. FCM supports notification delivery to Android, iOS, and web applications with delivery latencies typically under one second. Industrial applications of FCM for safety-critical alerting have demonstrated its reliability for time-sensitive notification scenarios.

In the broader context of industrial IoT, alert systems must address several engineering challenges: alert deduplication (preventing multiple notifications for the same underlying event), alert escalation (increasing notification urgency if a condition persists or worsens), channel selection (delivering alerts through the most appropriate channel based on severity and recipient availability), and alert fatigue management (ensuring that the volume of notifications does not overwhelm recipients to the point where critical alerts are ignored).

The drilling industry has not yet developed standardized alert delivery frameworks that integrate ML-based predictions with multi-channel notification systems. This represents a significant gap between the capabilities of ML models (which can detect anomalies with increasing accuracy) and the ability of field organizations to act on those detections (which requires reliable, timely, and well-structured alert delivery).

## 2.12 Summary of Literature and Identification of Research Gap

The preceding review demonstrates that significant progress has been made in applying machine learning to individual aspects of drilling failure prediction. Table 2.1 summarizes the key studies reviewed, their focus areas, methods, reported accuracy, and identified limitations.

**Table 2.1: Summary of Reviewed Studies on ML for Drilling Failure Prediction**

| Study | Focus Area | Method | Key Result | Limitation |
|-------|-----------|--------|------------|------------|
| Elahifar & Hosseini (2022) | Stuck pipe prediction | Random Forest, SVM | High accuracy on Middle East data | Static dataset, no real-time capability |
| Elmousalami & Elaskary (2020) | Stuck pipe classification | Extra Trees | 100% accuracy on test data | Limited to static Gulf of Suez dataset |
| Montes et al. (2025) | Stuck pipe review | Survey of 50+ methods | Comprehensive landscape analysis | Identifies gap in integrated systems |
| SPE-206516-MS (2021) | Stuck pipe on ERD wells | Ensemble ML | >94% prediction accuracy | No alert integration |
| Al-Mamoori et al. (2025) | Stuck pipe anomaly | Deep learning autoencoder | Effective unsupervised detection | Single failure mode only |
| Pang et al. (2021) | Lost circulation | RF, GB, SVM | High precision/recall | No operational deployment |
| Feng et al. (2024) | Lost circulation analysis | XGBoost + SHAP | Interpretable predictions | Single failure mode only |
| Aranha et al. (2024) | Oilwell anomaly detection | LSTM + decision diagram | Robust multi-well detection | No risk scoring or alerting |
| SPE-205677-MS (2021) | Stuck pipe via LSTM | LSTM Autoencoder | Effective unsupervised detection | No integration with other models |
| Fernandes et al. (2024) | Well anomaly detection | Isolation Forest, One-Class SVM | Competitive accuracy, low compute | Production wells, not drilling |
| Kloska et al. (2023) | Industrial anomaly detection | Expert-enhanced DTW | Improved pattern matching | Not applied to drilling specifically |
| Agrawal et al. (2022) | Litho-facies detection | Ensemble methods | Outperforms single classifiers | Homogeneous ensemble only |
| IPTC-23550 (2024) | Drilling risk prediction | ML classification | Risk categories for 252 wells | Pre-drill assessment, not real-time |
| SPE-222587-MS (2024) | Digital twin for drilling | Physics-informed AI | 40% performance improvement | Optimization focus, not failure prevention |

Based on this review, five specific research gaps are identified:

**Gap 1: No integrated multi-model ensemble for drilling failure prediction.** Existing studies address individual failure modes using individual model types. No framework combines multiple complementary ML paradigms (statistical, temporal, pattern-based) into a unified prediction system that addresses stuck pipe, lost circulation, bit wear, and wellbore instability simultaneously.

**Gap 2: No unified risk scoring engine.** When multiple models are used, their outputs are heterogeneous — probability scores, reconstruction errors, distance metrics — with no standardized method for synthesizing these into a single, interpretable risk assessment that engineers can act upon.

**Gap 3: No end-to-end system from prediction to alert delivery.** Academic ML studies terminate at model evaluation metrics. The critical engineering pipeline from model output to actionable alert — including threshold management, alert deduplication, escalation logic, and multi-channel delivery — remains unaddressed.

**Gap 4: Limited use of unsupervised methods.** Most high-accuracy results are achieved with supervised methods that require labeled failure data. Given the scarcity of well-labeled failure datasets in the industry, there is a need for frameworks that leverage unsupervised and semi-supervised approaches capable of operating with unlabeled or minimally labeled data.

**Gap 5: No field-deployable framework with web and mobile interfaces.** Existing solutions lack the software engineering infrastructure required for operational deployment — user authentication, real-time dashboards, mobile applications, and integration with wellsite communication systems.

DrillGuard is designed to address all five gaps through an integrated framework that combines a heterogeneous ML ensemble (Gap 1), a fusion-based risk scoring engine (Gap 2), an automated multi-channel alert system (Gap 3), unsupervised and semi-supervised model architectures (Gap 4), and a microservices-based deployment with web dashboard and mobile application (Gap 5).
