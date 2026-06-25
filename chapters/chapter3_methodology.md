# CHAPTER THREE

# METHODOLOGY

## 3.1 Research Design

This study adopts an applied research approach combining system design, software engineering, and experimental validation. The research involves the design and implementation of a complete predictive analytics framework — DrillGuard — followed by empirical evaluation using real drilling data.

The system development follows an iterative methodology organized into four principal phases:

**Phase 1 — Data Engineering.** Acquisition, parsing, and preprocessing of drilling datasets into a format suitable for machine learning model training and real-time inference.

**Phase 2 — Model Development.** Design, training, and evaluation of three complementary machine learning models: a baseline deviation detector (Random Forest), a temporal anomaly detector (LSTM Autoencoder), and a historical pattern matcher (Dynamic Time Warping).

**Phase 3 — System Integration.** Development of the risk scoring engine, alert generation logic, API services, web dashboard, and mobile application, and their integration into a cohesive operational framework.

**Phase 4 — Validation.** End-to-end system validation using historical drilling data streamed in real-time simulation, with quantitative evaluation of prediction accuracy, false positive rates, alert latency, and comparative assessment against individual model baselines and traditional threshold-based detection.

## 3.2 System Architecture

DrillGuard is designed as a microservices architecture comprising six principal components that communicate through RESTful APIs and asynchronous message queues. Figure 3.1 presents the high-level system architecture.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DRILLGUARD ARCHITECTURE                       │
│                                                                      │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────┐            │
│  │  Sensor   │───▶│  Data        │───▶│  Intelligence    │            │
│  │  Data /   │    │  Ingestion   │    │  Engine          │            │
│  │  Files    │    │  Service     │    │  (ML Models)     │            │
│  └──────────┘    └──────────────┘    └────────┬────────┘            │
│                         │                      │                     │
│                         ▼                      ▼                     │
│                  ┌──────────────┐    ┌─────────────────┐            │
│                  │  TimescaleDB │    │  Risk Scoring    │            │
│                  │  (Time-Series│    │  Engine           │            │
│                  │   Database)  │    └────────┬────────┘            │
│                  └──────────────┘             │                     │
│                                               ▼                     │
│                                     ┌─────────────────┐            │
│                                     │  Alert &         │            │
│                                     │  Notification    │            │
│                                     │  Service         │            │
│                                     └────────┬────────┘            │
│                                              │                      │
│                              ┌───────────────┼───────────────┐      │
│                              ▼               ▼               ▼      │
│                      ┌────────────┐  ┌────────────┐  ┌──────────┐  │
│                      │ Web        │  │ Mobile     │  │ SMS /    │  │
│                      │ Dashboard  │  │ App        │  │ Email    │  │
│                      └────────────┘  └────────────┘  └──────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Supporting Infrastructure                                     │   │
│  │  PostgreSQL │ Redis │ RabbitMQ │ MLflow │ API Gateway         │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Figure 3.1: DrillGuard System Architecture**

The six principal components are:

**Data Ingestion Service** receives raw drilling data in multiple formats (CSV, LAS, DLIS, PDF), parses and validates the data, performs time alignment, and stores the processed data in a TimescaleDB time-series database.

**Intelligence Engine** hosts the trained machine learning models and performs real-time inference on incoming drilling data. It produces three model outputs: baseline deviation score, LSTM anomaly score, and DTW pattern similarity score.

**Risk Scoring Engine** receives the three model outputs and fuses them into a single normalized risk score (0 to 100) with estimated time-to-impact.

**Alert and Notification Service** monitors risk scores, generates alerts when thresholds are crossed, manages alert deduplication and escalation, and dispatches notifications through multiple channels.

**Web Dashboard** provides a browser-based interface for real-time monitoring, alert review, and historical analysis.

**Mobile Companion Application** provides a mobile interface for receiving push notifications, viewing condensed drilling status, and reviewing alert history.

### 3.2.1 Technology Stack

The technology stack is selected based on performance requirements, ecosystem maturity, and alignment with industry standards:

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Backend API Framework | FastAPI (Python 3.11+) | Async support, automatic API documentation, high performance |
| ML Frameworks | TensorFlow 2.x, Scikit-learn | Industry-standard, extensive documentation, production-ready |
| Time-Series Database | TimescaleDB | PostgreSQL extension optimized for time-series data, SQL-compatible |
| Operational Database | PostgreSQL 15 | ACID compliance, mature ecosystem, JSON support |
| Cache | Redis 7 | In-memory performance for real-time features, session management |
| Message Queue | RabbitMQ 3 | Reliable async messaging between microservices |
| Model Tracking | MLflow | Model versioning, experiment tracking, deployment management |
| Web Frontend | React 18 with TypeScript | Component-based architecture, strong typing, large ecosystem |
| Mobile Frontend | React Native | Cross-platform (iOS/Android) from single codebase |
| Push Notifications | Firebase Cloud Messaging | Cross-platform delivery, sub-second latency |
| SMS | Twilio | Reliable SMS delivery, global coverage |
| Email | SendGrid | Transactional email delivery with analytics |
| Containerization | Docker | Consistent environments, microservices isolation |
| Orchestration | Docker Compose (dev), Kubernetes (prod) | Local development and production scaling |

### 3.2.2 Data Flow

The end-to-end data flow proceeds as follows:

1. Drilling data enters the system through the Data Ingestion Service, either as batch file uploads (LAS, CSV, PDF) or as simulated real-time streams.
2. The Ingestion Service parses, validates, and normalizes the data, then stores it in TimescaleDB with proper time indexing.
3. At configurable intervals (default: every 10 seconds, matching the Volve dataset frequency), the Intelligence Engine retrieves the latest data window and performs inference using all three ML models.
4. The three model outputs are passed to the Risk Scoring Engine, which computes the fused risk score and estimated time-to-impact.
5. The risk score is passed to the Alert and Notification Service, which evaluates it against alert thresholds and, if warranted, generates an alert.
6. Alerts are dispatched through configured channels: WebSocket push to the web dashboard, Firebase Cloud Messaging to the mobile app, and SMS/email for elevated and critical alerts.
7. Engineers receive the alert, review the details (risk score, contributing factors, recommended actions), and respond accordingly.

## 3.3 Data Collection and Description

### 3.3.1 Primary Dataset: Equinor Volve Field

The primary dataset used for model training and system validation is the Equinor Volve field dataset, a publicly available dataset released by Equinor (formerly Statoil) in 2018 for research purposes. The Volve field is located in the Norwegian North Sea, approximately 200 kilometers west of Stavanger, Norway, at a water depth of approximately 80 meters.

The specific data used in this study comes from Well 31/5-7, drilled by the West Hercules semi-submersible drilling rig. The well has a total measured depth of 2,915 meters and a total vertical depth of 2,914.89 meters. The survey reference datum is the rotary kelly bushing (RKB), located 31 meters above sea level.

The dataset comprises 535 megabytes of data organized in three categories:

**Logging While Drilling (LWD) data** constitutes the primary analytical dataset, comprising 532 megabytes across 65 files in LAS, DLIS, and ASC formats. The LAS files contain time-indexed measurements at 10-second intervals, providing the following parameters:

| Parameter | Abbreviation | Unit | Description |
|-----------|-------------|------|-------------|
| Time | TIME | seconds | Measurement timestamp (10-second intervals) |
| Depth | DEPTH | meters | Measured depth at time of measurement |
| Gamma Ray | GR | gAPI | Natural gamma ray emission, formation indicator |
| Block Position | BLKP | meters | Traveling block height, indicates pipe movement |
| Collar RPM | CRPM | rev/min | Rotational speed near the bit |
| Stick-Slip | STICK | dimensionless | Torsional vibration severity indicator |
| Shock Peak | SHKPK | g | Lateral/axial vibration severity |
| Downhole Annular Pressure | DHAP | psi | Pressure in the annulus at sensor depth |
| Downhole Annular Temperature | DHAT | degF | Temperature in the annulus at sensor depth |
| Equivalent Circulating Density | ECD | ppg | Effective mud weight including frictional effects |

**Directional survey data** (2.3 megabytes) provides wellpath information including measured depth, inclination, azimuth, true vertical depth, and horizontal offsets, calculated using the minimum curvature method.

**Drilling and completion data** (640 kilobytes) includes coring reports and operational context documents.

### 3.3.2 Secondary Dataset: Nigerian Well Data

The secondary dataset consists of drilling data from two wells in the Niger Delta region of Nigeria:

**Well OKI_OZIENGBE SOUTH-5:** Two mud log reports covering depths from 500 to 12,870 feet (measured depth) and 500 to 11,911 feet (true vertical depth). Parameters include standpipe pressure, weight on bit, rotary speed, torque, rate of penetration, mud weight, plastic viscosity, yield point, and gas readings (methane through pentane).

**Well OKOS-10 ST:** One mud log report and one daily drilling activity report documenting an 8.5-inch section drilled on November 14, 2020.

The Nigerian well data is depth-indexed (not time-indexed) and serves as a secondary validation set for testing the generalizability of models developed on the Volve dataset to a different geological setting and data format.

## 3.4 Data Preprocessing

Data preprocessing is performed in a systematic pipeline to transform raw drilling data into features suitable for machine learning model training and inference.

### 3.4.1 Data Parsing

LAS files are parsed using the `lasio` Python library, which provides standardized access to header metadata and columnar data arrays. DLIS files are parsed using the `dlisio` library developed by Equinor. PDF mud logs are processed using the `pdfplumber` library for text extraction, with custom parsing logic to extract tabular parameter data from the standardized mud log format.

### 3.4.2 Data Cleaning

The following data cleaning procedures are applied:

**Missing value handling.** Sensor data frequently contains gaps due to tool malfunctions, communication interruptions, or tool off-bottom conditions. Gaps of 30 seconds or less (3 or fewer consecutive missing values at 10-second intervals) are filled using forward-fill interpolation, which propagates the last known valid value. Gaps exceeding 30 seconds are filled using linear interpolation between the last valid value before the gap and the first valid value after the gap. Gaps exceeding 5 minutes are flagged and excluded from model training windows.

**Outlier removal.** Physics-based constraints are applied to filter physically impossible values: negative values for rate of penetration, rotary speed, and mud flow rate; pressure values outside the range of 0 to 25,000 psi; temperature values outside the range of 32 to 500 degrees Fahrenheit; and ECD values outside the range of 6 to 22 ppg. Values outside these ranges are replaced with the nearest valid observation.

**Operational state classification.** Drilling data is segmented by operational state — drilling (bit on bottom, rotating), tripping (moving pipe in or out of hole without rotation), circulating (circulating mud without drilling), and connection (making or breaking drill pipe connections). Operational states are classified based on block position, rotary speed, and pump rate thresholds. This classification is critical because normal parameter ranges vary significantly across operational states.

### 3.4.3 Feature Engineering

Raw sensor measurements are augmented with engineered features designed to capture temporal dynamics and inter-parameter relationships:

**Rolling window statistics.** For each sensor parameter, the following statistics are computed over two window sizes — 5 minutes (30 data points) and 15 minutes (90 data points): mean, standard deviation, minimum, maximum, and range (max minus min). These features capture the short-term and medium-term variability of each parameter.

**Rate-of-change features.** First-order derivatives (rate of change) are computed for pressure, torque, rotary speed, and depth parameters using finite differences. Rapid changes in these parameters often precede failure events.

**Cross-parameter ratios.** Derived features capturing inter-parameter relationships include: torque divided by rotary speed (specific torque), standpipe pressure divided by flow rate (hydraulic resistance), and rate of penetration divided by weight on bit (drilling efficiency).

**Cumulative deviation features.** Cumulative sum (CUSUM) statistics are computed for each parameter relative to the operational state baseline, providing a measure of sustained deviation from expected values.

The complete feature vector for each time step comprises the raw sensor values, rolling window statistics at two scales, rate-of-change features, cross-parameter ratios, and cumulative deviation features. For the Volve dataset with 10 primary sensor channels, this yields approximately 130 features per time step.

### 3.4.4 Data Normalization

Two normalization schemes are applied depending on the downstream model:

**Min-Max normalization** (scaling to the range [0, 1]) is applied to features used as input to the LSTM Autoencoder, as neural networks are sensitive to feature scale.

**Standard normalization** (zero mean, unit variance) is applied to features used as input to the Random Forest and Isolation Forest models. While tree-based models are theoretically scale-invariant, standardization improves numerical stability and facilitates interpretability of feature importance scores.

Normalization parameters (min, max, mean, standard deviation) are computed exclusively on the training set and applied consistently to the test set to prevent data leakage.

### 3.4.5 Train-Test Split

The data is split into training (70 percent) and test (30 percent) sets using a temporal split — the first 70 percent of the time series forms the training set and the remaining 30 percent forms the test set. Random shuffling is not used, as it would violate the temporal ordering of the data and introduce look-ahead bias.

## 3.5 Machine Learning Models

The DrillGuard framework employs three complementary machine learning models, each designed to detect a different aspect of drilling anomalies. This section describes the architecture, training procedure, and output specification for each model.

### 3.5.1 Model 1: Baseline Deviation Detector (Random Forest)

**Purpose.** The baseline deviation detector learns the statistical relationships between drilling parameters under normal operating conditions and flags deviations that indicate abnormal drilling states.

**Algorithm.** Random Forest Classifier, an ensemble of decision trees trained on bootstrap samples of the data with random feature subsets at each split. The Random Forest is selected for its robustness to noise, resistance to overfitting, built-in feature importance estimation, and ability to handle mixed feature types without preprocessing.

**Training data.** The model is trained on the subset of the training data corresponding to normal drilling operations. Normal operation periods are identified as time windows where all sensor parameters remain within their expected ranges for the current operational state (drilling, tripping, or circulating), as determined by domain knowledge and statistical analysis.

**Input features.** All 130 engineered features described in Section 3.4.3, plus the operational state label.

**Hyperparameters.** The following hyperparameters are tuned using 5-fold cross-validation on the training set:

| Hyperparameter | Search Range | Selection Method |
|---------------|-------------|------------------|
| Number of estimators (n_estimators) | 100, 200, 300, 500 | Grid search |
| Maximum depth (max_depth) | 10, 20, 30, None | Grid search |
| Minimum samples per leaf (min_samples_leaf) | 1, 2, 5, 10 | Grid search |
| Maximum features per split (max_features) | sqrt, log2, 0.5 | Grid search |

**Output.** A baseline deviation score in the range [0, 1], computed as the proportion of trees in the ensemble that classify the current time step as anomalous. A score of 0 indicates full agreement with normal baseline; a score of 1 indicates complete deviation from all learned normal patterns.

**Evaluation metrics.** Accuracy, precision, recall, F1-score, and area under the receiver operating characteristic curve (AUC-ROC), evaluated on the temporal test set.

### 3.5.2 Model 2: Temporal Anomaly Detector (LSTM Autoencoder)

**Purpose.** The temporal anomaly detector identifies sequences of drilling parameters that deviate from the patterns learned during normal operations. Unlike the baseline deviation detector, which evaluates individual time steps, the LSTM Autoencoder considers the temporal dynamics of parameter evolution, enabling detection of anomalies that manifest as gradual trends, oscillations, or pattern shifts.

**Architecture.** The model follows an encoder-decoder architecture with LSTM layers:

```
Encoder:
  Input Layer: (batch_size, 60, n_features)
  LSTM Layer 1: 128 units, return_sequences=True
  LSTM Layer 2: 64 units, return_sequences=False

Bottleneck:
  Dense Layer: 32 units, activation=ReLU
  RepeatVector: 60 (restore sequence length)

Decoder:
  LSTM Layer 3: 64 units, return_sequences=True
  LSTM Layer 4: 128 units, return_sequences=True
  TimeDistributed Dense: n_features units (reconstruct input)
```

**Input.** Sliding windows of 60 consecutive time steps (10 minutes of data at 10-second intervals), using the Min-Max normalized sensor values. The sliding window advances by 1 time step, producing overlapping windows for continuous monitoring.

**Training procedure.** The autoencoder is trained exclusively on windows extracted from normal operating periods in the training set. The training objective is to minimize the mean squared error (MSE) between the input window and the reconstructed output. Training uses the Adam optimizer with an initial learning rate of 0.001, batch size of 32, and early stopping with patience of 10 epochs on a validation subset (20 percent of the training normal windows).

**Anomaly score computation.** For each input window, the anomaly score is the mean squared reconstruction error:

```
anomaly_score = (1/T) * (1/D) * Σ_t Σ_d (x_td - x̂_td)²
```

where T is the window length (60), D is the number of features, x_td is the input value, and x̂_td is the reconstructed value.

**Threshold determination.** The anomaly threshold is set at the 95th percentile of the reconstruction error distribution on the normal training data. Scores above this threshold indicate sequences that the autoencoder cannot reconstruct well, suggesting deviation from learned normal patterns. A secondary threshold at the 99th percentile indicates severe anomalies.

**Framework.** TensorFlow 2.x with Keras API.

### 3.5.3 Model 3: Historical Pattern Matcher (Dynamic Time Warping)

**Purpose.** The historical pattern matcher compares the current drilling sensor signature against a library of reference patterns extracted from known or suspected failure events. This approach is particularly effective when failure signatures are well-characterized, as it directly quantifies the similarity between the current state and known dangerous patterns.

**Reference pattern extraction.** Reference patterns are extracted from the training data by identifying periods of anomalous behavior using the LSTM Autoencoder anomaly scores (Section 3.5.2). Sequences with reconstruction error above the 99th percentile threshold are considered candidate anomalous events. Each candidate event is extended by 5 minutes in both directions to capture the onset and development of the anomaly. The resulting sequences form the reference pattern library.

**DTW distance computation.** For each new data window (60 time steps), the DTW distance is computed against each pattern in the reference library using the standard DTW algorithm with the following configuration:

- Distance metric: Euclidean distance between feature vectors at each time step
- Warping constraint: Sakoe-Chiba band with width equal to 20 percent of the window length, limiting the allowable warping to prevent degenerate alignments
- Normalization: DTW distances are normalized by window length to enable comparison across patterns of different durations

**Pattern similarity score.** The pattern similarity score is computed as:

```
pattern_score = 1 - (min_DTW_distance / max_reference_distance)
```

where min_DTW_distance is the minimum DTW distance between the current window and any reference pattern, and max_reference_distance is the maximum DTW distance observed between any normal window and the reference patterns. This yields a score in the range [0, 1], where values close to 1 indicate high similarity to a known failure pattern.

**Library.** The `dtw-python` library is used for DTW computation, with the FastDTW approximation employed for computational efficiency in real-time inference.

## 3.6 Risk Scoring Engine

The Risk Scoring Engine is the central integration component of DrillGuard, responsible for fusing the outputs from the three ML models into a single actionable risk assessment.

### 3.6.1 Score Fusion

The three model outputs — baseline deviation score (S_baseline), LSTM anomaly score (S_lstm), and DTW pattern similarity score (S_dtw) — are combined using a weighted sum:

```
Risk Score = 100 × (w₁ × S_baseline + w₂ × S_lstm + w₃ × S_dtw)
```

where w₁, w₂, and w₃ are learned weights satisfying w₁ + w₂ + w₃ = 1. The weights are determined by optimizing a composite objective on the validation set that maximizes detection rate while minimizing false positive rate. The optimization uses grid search over the weight space with a step size of 0.05.

The resulting Risk Score is in the range [0, 100], where 0 indicates completely normal operations and 100 indicates maximum confidence in an imminent failure.

### 3.6.2 Alert Threshold Classification

The Risk Score is classified into four severity levels:

| Risk Score Range | Severity Level | Color Code | Recommended Action |
|-----------------|---------------|------------|-------------------|
| 0 - 29 | NORMAL | Green | Routine monitoring |
| 30 - 50 | WATCH | Yellow | Increased monitoring frequency, prepare contingency |
| 51 - 70 | ELEVATED | Orange | Active investigation, prepare intervention equipment |
| 71 - 100 | ACTION | Red | Immediate intervention, execute contingency plan |

### 3.6.3 Time-to-Impact Estimation

When the Risk Score enters the WATCH range or above, the system estimates the time remaining before the risk is expected to reach the ACTION threshold. The estimation uses a linear extrapolation of the Risk Score trend over the preceding 15-minute window:

```
Time_to_impact = (71 - current_score) / rate_of_score_increase
```

where rate_of_score_increase is the slope of the linear regression fitted to the Risk Score values over the last 15 minutes. If the rate of increase is zero or negative (risk is stable or decreasing), the time-to-impact is reported as "stable" rather than a numerical value.

This estimate provides engineers with an indication of the urgency of the situation, supporting prioritization decisions when multiple issues are developing simultaneously.

## 3.7 Real-Time Alert System

The Alert and Notification Service manages the generation, processing, and delivery of alerts based on the risk scores produced by the Risk Scoring Engine.

### 3.7.1 Alert Generation

An alert is generated when any of the following conditions are met:

1. The Risk Score transitions from one severity level to a higher severity level (e.g., NORMAL to WATCH, or WATCH to ELEVATED).
2. The Risk Score has remained at WATCH or above for a configurable duration (default: 5 consecutive minutes) without previous alert acknowledgment.
3. The estimated time-to-impact falls below 30 minutes while the current severity is WATCH or ELEVATED.

### 3.7.2 Alert Deduplication

To prevent alert fatigue, the system suppresses duplicate alerts for the same well and failure type within a configurable deduplication window (default: 15 minutes). An alert is considered a duplicate if the following conditions are all true: the alert pertains to the same well, the primary contributing model is the same, and the severity level is equal to or lower than the previously issued alert.

### 3.7.3 Alert Escalation

If a WATCH-level alert escalates to ELEVATED within 10 minutes, or an ELEVATED alert escalates to ACTION within 10 minutes, the escalation is treated as a new alert requiring immediate notification, bypassing the deduplication window.

### 3.7.4 Multi-Channel Delivery

Alerts are delivered through channels selected based on severity level:

| Channel | WATCH | ELEVATED | ACTION |
|---------|-------|----------|--------|
| Web Dashboard (WebSocket) | Yes | Yes | Yes |
| Mobile Push (Firebase) | Yes | Yes | Yes |
| Email (SendGrid) | No | Yes | Yes |
| SMS (Twilio) | No | No | Yes |

### 3.7.5 Alert Payload

Each alert includes the following information:

- Alert identifier and timestamp
- Well identifier and current depth
- Severity level and Risk Score
- Primary contributing model (which of the three models contributed most to the risk score)
- Top three contributing features (identified from model feature importance or SHAP values)
- Estimated time-to-impact
- Recommended action based on the failure type indicated
- Links to similar historical events from the pattern library

## 3.8 Web Dashboard Design

The web dashboard serves as the primary operational interface for DrillGuard, providing engineers with real-time visibility into drilling conditions, risk status, and alert history.

### 3.8.1 Technology and Framework

The dashboard is built using React 18 with TypeScript, providing type safety and component-based architecture. The UI component library is Material-UI (MUI), selected for its comprehensive component set, responsive design support, and consistent styling. Charts and data visualizations are rendered using Recharts and D3.js. Real-time data updates are delivered via WebSocket connections using the Socket.IO library.

### 3.8.2 Dashboard Views

**Well List View.** Displays all monitored wells with their current risk level (color-coded), current depth, operational state, and time since last update. Wells are sorted by risk level (highest first) to direct attention to the most critical situations.

**Live Monitor View (Primary).** The central operational view, comprising:
- Real-time parameter time-series charts (scrolling) for all monitored sensor channels
- A risk score gauge displaying the current composite risk score with color-coded severity indication
- An alert timeline showing recent alerts with severity, time, and brief description
- Contributing factor indicators showing which model and which features are driving the current risk level
- Time-to-impact display when risk is above the WATCH threshold

**Historical Analysis View.** Provides access to past drilling sessions, historical alerts, and model performance metrics. Includes:
- Event history table with filtering and search capabilities
- Comparative charts showing parameter behavior during historical events
- Model accuracy statistics computed on historical predictions versus observed outcomes

### 3.8.3 Responsive Design

The dashboard supports desktop (1920 x 1080 and above), laptop (1366 x 768), and tablet (1024 x 768) form factors. Layout components adapt to viewport size using CSS Grid and Flexbox, with chart dimensions adjusting proportionally.

## 3.9 Mobile Application Design

The mobile companion application provides field engineers with access to DrillGuard alerts and status information on their mobile devices.

### 3.9.1 Technology and Framework

The mobile application is built using React Native, enabling deployment to both iOS and Android platforms from a single codebase. Firebase Cloud Messaging (FCM) provides push notification delivery with sub-second latency.

### 3.9.2 Application Features

**Push notification alerts.** Engineers receive real-time push notifications when alerts are generated. Notifications include the severity level, well identifier, risk score, and primary contributing factor. Tapping a notification opens the alert detail view.

**Condensed drilling dashboard.** A mobile-optimized view showing the current risk score, operational state, and key parameter values for each monitored well. The design prioritizes readability on small screens with large text, clear color coding, and minimal scrolling.

**Alert history and acknowledgment.** A chronological list of alerts received, with the ability to acknowledge alerts and add notes. Acknowledged alerts are reported back to the central system for tracking and audit purposes.

**AI-generated recommendations.** For each active alert, the application displays suggested parameter adjustments and operational actions generated by the Intelligence Engine based on the detected failure type and historical precedents.

**Offline capability.** Recent alert history and current well status are cached locally on the device, enabling access to the most recent information even when network connectivity is interrupted — a common scenario on remote rig sites.

## 3.10 API Design

The DrillGuard API provides programmatic access to all system capabilities through a RESTful interface built with FastAPI.

### 3.10.1 Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/data/ingest | Upload drilling data files (CSV, LAS) |
| GET | /api/v1/data/status/{job_id} | Check ingestion job status |
| GET | /api/v1/wells | List all monitored wells |
| GET | /api/v1/wells/{well_id}/status | Get current risk status for a well |
| GET | /api/v1/wells/{well_id}/parameters | Get latest drilling parameters |
| POST | /api/v1/predict | Run ML inference on provided data |
| GET | /api/v1/alerts | List active alerts (filterable by well, severity) |
| GET | /api/v1/alerts/{alert_id} | Get alert details |
| PATCH | /api/v1/alerts/{alert_id}/acknowledge | Acknowledge an alert |
| GET | /api/v1/recommendations/{well_id} | Get AI-generated recommendations |
| GET | /api/v1/models/performance | Get model performance metrics |

### 3.10.2 Authentication and Authorization

The API implements OAuth 2.0 authentication with JSON Web Tokens (JWT). Three role levels are defined:

- **Viewer**: Read-only access to well status, parameters, and alerts
- **Engineer**: Viewer permissions plus alert acknowledgment and data upload
- **Admin**: Full access including model management and system configuration

### 3.10.3 Performance Requirements

- API response time: less than 200 milliseconds for read operations
- ML inference response time: less than 5 seconds for prediction endpoints
- WebSocket message delivery: less than 1 second from event generation

## 3.11 System Validation Approach

The DrillGuard framework is validated through a multi-level evaluation strategy designed to assess both individual model performance and end-to-end system effectiveness.

### 3.11.1 Individual Model Evaluation

Each of the three ML models is evaluated independently on the temporal test set using the following metrics:

**For the Random Forest Baseline Detector:**
- Accuracy: overall proportion of correct classifications
- Precision: proportion of flagged anomalies that are true anomalies
- Recall (Sensitivity): proportion of true anomalies that are correctly flagged
- F1-Score: harmonic mean of precision and recall
- AUC-ROC: area under the receiver operating characteristic curve

**For the LSTM Autoencoder:**
- Reconstruction error distribution on normal versus anomalous windows
- Anomaly detection rate at the 95th and 99th percentile thresholds
- Precision-recall curve and area under the precision-recall curve (AUC-PR)

**For the DTW Pattern Matcher:**
- Pattern matching accuracy on known anomalous events
- False match rate on normal operating windows
- Computational latency per window

### 3.11.2 Ensemble Evaluation

The fused risk scoring system is evaluated against three baselines:

1. **Individual models**: Risk scoring using only the Random Forest, only the LSTM Autoencoder, or only the DTW matcher, to demonstrate the added value of the ensemble approach.
2. **Threshold-based detection**: A traditional approach using fixed thresholds on individual drilling parameters, representing current industry practice.
3. **Simple averaging**: An unweighted average of the three model scores, to demonstrate the value of learned fusion weights.

### 3.11.3 End-to-End System Validation

The complete system is validated by streaming the temporal test set data through the full pipeline — ingestion, preprocessing, ML inference, risk scoring, and alert generation — in real-time simulation. The following system-level metrics are measured:

- **Alert latency**: Time from data ingestion to alert delivery, measured end-to-end
- **Detection lead time**: Time between the first alert for an event and the event's occurrence
- **False positive rate**: Proportion of alerts that do not correspond to actual anomalous events
- **Alert actionability**: Proportion of alerts with clear severity classification and recommended actions
- **System throughput**: Data points processed per second under sustained load

### 3.11.4 Performance Benchmarks

The following performance targets are defined based on operational requirements:

| Metric | Target |
|--------|--------|
| Overall detection rate (recall) | Greater than 80% |
| False positive rate | Less than 15% |
| Alert latency (end-to-end) | Less than 10 seconds |
| ML inference time | Less than 5 seconds |
| Dashboard initial load time | Less than 3 seconds |
| Detection lead time | Greater than 30 minutes |
| System availability | Greater than 99.5% |
