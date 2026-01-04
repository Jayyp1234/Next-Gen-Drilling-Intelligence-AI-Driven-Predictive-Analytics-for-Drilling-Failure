# EXECUTION-PHASE DRILLING INTELLIGENCE MODULE (EDIM)
## Enterprise MVP - 8-Week Build Roadmap

---

## EXECUTIVE SUMMARY

**Product:** Execution-phase intelligence module for early drilling risk detection  
**Timeline:** 8 weeks to enterprise-ready pilot  
**Target:** Drilling/Operations Engineers at enterprise oil & gas companies  
**Core Value:** Detect operational risks 30-60 minutes before escalation using ML-powered pattern recognition

---

## SYSTEM ARCHITECTURE

### 1. HIGH-LEVEL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Web Dashboard (React)     │    Mobile Companion (React Native) │
│  - Well Timeline View      │    - Critical Alerts Only          │
│  - Risk Status Dashboard   │    - Quick Status Check            │
│  - Historical Comparison   │    - Push Notifications            │
│  - Event Investigation     │                                    │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  FastAPI + Kong API Gateway                                      │
│  - Authentication (OAuth 2.0 / SAML)                            │
│  - Rate Limiting                                                │
│  - Request Routing                                              │
│  - Audit Logging                                                │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION SERVICES                          │
├──────────────────┬──────────────────┬──────────────────────────┤
│  Data Ingestion  │  Intelligence    │  Risk & Alerting         │
│  Service         │  Engine          │  Service                 │
│                  │                  │                          │
│  - CSV Parser    │  - Baseline      │  - Risk Scoring          │
│  - PDF Extract   │    Learning      │  - Alert Generation      │
│  - Time Align    │  - Anomaly Det.  │  - Notification Routing  │
│  - Validation    │  - Pattern Match │  - Event Logging         │
└──────────────────┴──────────────────┴──────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
├──────────────────┬──────────────────┬──────────────────────────┤
│  Operational DB  │  Time-Series DB  │  ML Model Store          │
│  (PostgreSQL)    │  (TimescaleDB)   │  (MLflow + S3)           │
│                  │                  │                          │
│  - Well Metadata │  - Sensor Data   │  - Trained Models        │
│  - Users/Roles   │  - Events        │  - Model Versions        │
│  - Alerts        │  - Predictions   │  - Training Metrics      │
│  - Audit Logs    │                  │                          │
└──────────────────┴──────────────────┴──────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL INTEGRATIONS                          │
├─────────────────────────────────────────────────────────────────┤
│  DrillPlan API  │  WITSML Server  │  Email/SMS  │  Slack/Teams │
└─────────────────────────────────────────────────────────────────┘
```

### 2. DETAILED COMPONENT ARCHITECTURE

#### 2.1 Data Ingestion Pipeline

```
Raw Data Sources → Ingestion Service → Validation → Time Alignment → Storage

Components:
- FileWatcher: Monitors S3/SFTP for new mud logs, DDAs
- Parser Engine: CSV/PDF extraction with schema validation
- Time Aligner: Synchronizes multi-source timestamps
- Data Lake: Raw file storage (S3)
- Processed Store: TimescaleDB for queryable time-series
```

**Tech Stack:**
- Apache Airflow (orchestration)
- Python 3.11+ (processing)
- Pandas/Polars (data manipulation)
- PyMuPDF/Tabula (PDF parsing)
- TimescaleDB (time-series storage)

#### 2.2 Intelligence Engine (ML Core)

```
Input: Real-time sensor streams
       ↓
Feature Engineering → Baseline Models → Anomaly Detection → Pattern Matching
       ↓                    ↓                  ↓                   ↓
   Processed         Normal Ranges      Anomaly Scores      Similar Events
   Features          Per Section        (0-100)             (Historical)
       ↓─────────────────────────────────────────────────────────↓
                            Risk Engine
                                ↓
                    Risk Score + Explanation + Time Window
```

**ML Components:**

1. **Baseline Learning Service**
   - Algorithms: Gaussian Process Regression, Moving Averages
   - Per-operation baselines (drilling, tripping, circulating)
   - Adaptive to operational context (hole section, formation)

2. **Anomaly Detection Service**
   - Algorithms: Isolation Forest, LSTM Autoencoders, Statistical Control Charts
   - Multi-channel analysis (SPP, torque, ROP, flow, pit volume)
   - Confidence scoring with uncertainty quantification

3. **Pattern Similarity Service**
   - Algorithms: Dynamic Time Warping (DTW), k-NN clustering
   - Event signature database (stuck pipe, loss circulation, kicks)
   - Distance-based explainability

4. **Risk Engine**
   - Rule-based fusion of ML outputs
   - Domain knowledge constraints
   - Time-to-impact estimation

**Tech Stack:**
- Scikit-learn, TensorFlow, PyTorch
- MLflow (model tracking)
- Ray Serve (model deployment)
- Redis (real-time feature cache)

#### 2.3 Risk & Alerting Service

```
Risk Engine Output → Alert Evaluator → Notification Router → Delivery
                           ↓
                    Deduplication
                    Prioritization
                    User Preferences
```

**Alert Levels:**
- **WATCH** (Score 30-50): Informational, logged only
- **ELEVATED** (Score 51-70): Dashboard notification
- **ACTION** (Score 71-100): Push notification + SMS + dashboard

**Tech Stack:**
- Celery (task queue)
- RabbitMQ (message broker)
- Twilio (SMS), SendGrid (email)
- Firebase Cloud Messaging (push notifications)

---

## 8-WEEK EXECUTION ROADMAP

### **WEEK 1: FOUNDATION & ARCHITECTURE**

**Objectives:**
- Finalize technical architecture
- Set up development infrastructure
- Define data schemas

**Deliverables:**

**Days 1-2: Infrastructure Setup**
- [x] Provision AWS/Azure resources (EC2, RDS, S3, TimescaleDB)
- [x] Set up CI/CD pipeline (GitHub Actions + Docker)
- [x] Configure development environments (local + staging)
- [x] Initialize Git monorepo structure:
  ```
  edim-platform/
  ├── services/
  │   ├── ingestion/
  │   ├── intelligence/
  │   ├── risk-alerting/
  │   └── api-gateway/
  ├── frontend/
  │   ├── web-dashboard/
  │   └── mobile-companion/
  ├── ml-pipeline/
  │   ├── training/
  │   ├── models/
  │   └── evaluation/
  ├── infrastructure/
  │   ├── terraform/
  │   ├── docker-compose/
  │   └── k8s/
  └── docs/
  ```

**Days 3-4: Database Design**
- [x] Design PostgreSQL schema:
  - `wells` (well metadata)
  - `users` (authentication)
  - `roles_permissions` (RBAC)
  - `alerts` (alert history)
  - `events` (labeled events)
  - `audit_logs` (compliance)
  
- [x] Design TimescaleDB hypertables:
  - `sensor_data` (SPP, torque, ROP, flow, pit volume, RPM)
  - `predictions` (anomaly scores, risk scores)
  - `baselines` (learned normal ranges)

- [x] Create migration scripts (Alembic)

**Days 5-7: Data Acquisition & Exploration**
- [x] Obtain sample drilling datasets (Volve, NLOG, internal data)
- [x] Exploratory data analysis:
  - Identify common failure signatures
  - Analyze normal operational patterns
  - Document data quality issues
- [x] Create synthetic data generator for testing
- [x] Label 50+ historical events (stuck pipe, losses, kicks)

**Success Criteria:**
✅ Infrastructure operational  
✅ Database schemas validated  
✅ 3+ wells of labeled training data ready  

---

### **WEEK 2: DATA INGESTION SERVICE**

**Objectives:**
- Build robust data ingestion pipeline
- Implement time alignment and validation
- Store processed data in TimescaleDB

**Deliverables:**

**Days 8-9: File Processing**
- [ ] CSV parser for mud logs:
  ```python
  def parse_mud_log(file_path: str) -> pd.DataFrame:
      # Standardize column names
      # Handle missing timestamps
      # Validate data types
      # Return normalized DataFrame
  ```
  
- [ ] PDF parser for daily drilling reports:
  ```python
  def extract_dda_sections(pdf_path: str) -> Dict:
      # Extract activity log
      # Parse NPT events
      # Extract formation tops
      # Return structured dict
  ```

- [ ] Real-time sensor data connector (CSV/API ingestion)

**Days 10-11: Time Alignment & Validation**
- [ ] Time synchronization module:
  - Handle timezone conversions
  - Interpolate missing timestamps
  - Detect and flag time jumps
  
- [ ] Data validation rules:
  - Range checks (SPP 0-10000 psi, ROP 0-500 ft/hr)
  - Consistency checks (flow-in ≈ flow-out)
  - Completeness checks (required fields present)
  
- [ ] Quality scoring system (0-100 per data point)

**Days 12-14: Pipeline Orchestration**
- [ ] Airflow DAG for batch processing:
  ```python
  ingest_dag = DAG('well_ingestion')
  
  scan_files >> parse >> validate >> align >> store >> notify
  ```
  
- [ ] Real-time streaming pipeline (Kafka/RabbitMQ for live data)
- [ ] Error handling and retry logic
- [ ] Data lineage tracking

**Testing:**
- [ ] Unit tests for parsers (10+ test cases each)
- [ ] Integration test: Ingest full well dataset (<5 min)
- [ ] Stress test: Handle 1000+ files in queue

**Success Criteria:**
✅ Successfully ingest 5+ wells end-to-end  
✅ Time alignment accuracy >99%  
✅ Data quality score visible per well  

---

### **WEEK 3: ML BASELINE LEARNING**

**Objectives:**
- Develop baseline models for normal operations
- Implement per-section adaptive learning
- Store learned baselines for inference

**Deliverables:**

**Days 15-16: Feature Engineering**
- [ ] Define feature set (30+ features):
  - Raw sensors: SPP, WOB, RPM, ROP, torque, flow_in, flow_out, pit_vol
  - Derived: dSPP/dt, torque_variance, ROP_efficiency, flow_balance
  - Context: depth, hole_section, operation_type, formation
  
- [ ] Feature computation pipeline:
  ```python
  class FeatureEngine:
      def compute_temporal_features(self, window: pd.DataFrame):
          # Rolling statistics (mean, std, min, max)
          # Rate of change
          # Frequency domain (FFT)
          
      def compute_operational_features(self, context: dict):
          # Bit type encoding
          # Mud weight normalization
          # Depth-based features
  ```
  
- [ ] Feature store (Redis + TimescaleDB)

**Days 17-18: Baseline Model Development**
- [ ] Per-operation baseline models:
  
  **Drilling Baseline:**
  ```python
  class DrillingBaseline:
      # Gaussian Process Regression for ROP vs depth
      # Moving average for SPP (window=50 samples)
      # Statistical control charts (mean ± 3σ)
  ```
  
  **Tripping Baseline:**
  ```python
  class TrippingBaseline:
      # Expected time per stand
      # Overpull/slack-off limits
      # Flow consistency during connections
  ```
  
  **Circulating Baseline:**
  ```python
  class CirculatingBaseline:
      # Pressure stability (SPP variance)
      # Flow balance (in vs out)
      # Pit volume stability
  ```

**Days 19-21: Training Pipeline**
- [ ] Model training orchestration:
  ```python
  for well in training_wells:
      for section in well.hole_sections:
          # Segment data by operation
          # Train section-specific baselines
          # Validate on holdout data
          # Store to MLflow
  ```
  
- [ ] Hyperparameter tuning (Optuna)
- [ ] Model versioning (MLflow tracking)
- [ ] Baseline validation:
  - Coverage: % of normal operations within baseline bands
  - Stability: Baseline convergence after N samples

**Testing:**
- [ ] Validate on 3 wells (should fit normal operations, reject anomalies)
- [ ] Measure baseline update latency (<30 seconds)

**Success Criteria:**
✅ Baselines cover 95%+ of normal operations within ±2σ  
✅ False positive rate <5% on normal operations  
✅ Models retrain automatically per hole section  

---

### **WEEK 4: ANOMALY DETECTION MODELS**

**Objectives:**
- Implement multi-algorithm anomaly detection
- Achieve >80% detection rate with <10% false positives
- Provide confidence scores and explanations

**Deliverables:**

**Days 22-23: Isolation Forest (Statistical Anomalies)**
- [ ] Implementation:
  ```python
  from sklearn.ensemble import IsolationForest
  
  class StatisticalAnomalyDetector:
      def __init__(self):
          self.model = IsolationForest(
              contamination=0.05,  # Expected anomaly rate
              n_estimators=100,
              random_state=42
          )
      
      def detect(self, features: np.ndarray) -> Tuple[float, str]:
          anomaly_score = self.model.decision_function(features)
          confidence = 1 - (anomaly_score + 0.5)  # Normalize to 0-1
          
          # Feature importance for explanation
          explanation = self._explain_anomaly(features)
          
          return confidence * 100, explanation
  ```
  
- [ ] Train on 10,000+ normal operation samples
- [ ] Tune contamination parameter per operation type

**Days 24-25: LSTM Autoencoder (Temporal Anomalies)**
- [ ] Architecture:
  ```python
  class LSTMAnomalyDetector:
      def build_model(self, sequence_length=50, n_features=8):
          # Encoder
          encoder = LSTM(64, return_sequences=True)
          encoder = LSTM(32)
          
          # Decoder
          decoder = RepeatVector(sequence_length)
          decoder = LSTM(32, return_sequences=True)
          decoder = LSTM(64, return_sequences=True)
          decoder = TimeDistributed(Dense(n_features))
          
          # Compile with MAE loss
          model.compile(optimizer='adam', loss='mae')
      
      def detect(self, sequence: np.ndarray) -> float:
          reconstruction = self.model.predict(sequence)
          mse = np.mean((sequence - reconstruction)**2)
          
          # Threshold-based anomaly scoring
          threshold = self.learned_threshold
          anomaly_score = min(100, (mse / threshold) * 100)
          
          return anomaly_score
  ```
  
- [ ] Train on 20+ wells of normal operations
- [ ] Define reconstruction error thresholds per operation

**Days 26-28: Ensemble & Explainability**
- [ ] Multi-model fusion:
  ```python
  class EnsembleAnomalyDetector:
      def __init__(self):
          self.isolation_forest = StatisticalAnomalyDetector()
          self.lstm_autoencoder = LSTMAnomalyDetector()
          self.control_charts = ControlChartDetector()
      
      def detect(self, data: pd.DataFrame) -> AnomalyResult:
          # Get scores from each detector
          if_score, if_explanation = self.isolation_forest.detect(data)
          lstm_score = self.lstm_autoencoder.detect(data)
          cc_score, violated_rules = self.control_charts.detect(data)
          
          # Weighted ensemble (can tune weights)
          final_score = (0.4 * if_score + 
                        0.4 * lstm_score + 
                        0.2 * cc_score)
          
          # Generate unified explanation
          explanation = self._build_explanation(
              if_explanation, 
              violated_rules, 
              data
          )
          
          return AnomalyResult(
              score=final_score,
              confidence=self._compute_confidence(),
              explanation=explanation,
              contributing_features=self._rank_features(data)
          )
  ```
  
- [ ] SHAP values for model interpretability
- [ ] Feature contribution ranking

**Testing:**
- [ ] Validate on labeled anomalies (50+ events)
- [ ] Measure: Precision, Recall, F1-score
- [ ] Time-to-detection: Should alert 30-60 min before escalation

**Success Criteria:**
✅ Detection rate >80% on known anomalies  
✅ False positive rate <10%  
✅ Explanation provided for every alert  
✅ Inference time <2 seconds  

---

### **WEEK 5: PATTERN MATCHING & RISK ENGINE**

**Objectives:**
- Build historical event similarity system
- Implement risk scoring and time-to-impact estimation
- Integrate all ML components

**Deliverables:**

**Days 29-30: Event Pattern Database**
- [ ] Event signature extraction:
  ```python
  class EventSignatureExtractor:
      def extract_signature(self, event: LabeledEvent) -> EventSignature:
          # Extract 60-min pre-event window
          pre_event_data = self.get_pre_event_window(
              event.timestamp, 
              minutes=60
          )
          
          # Compute signature features
          signature = {
              'spp_trend': self.compute_trend(pre_event_data.spp),
              'torque_variance': pre_event_data.torque.std(),
              'rop_degradation': self.compute_degradation(pre_event_data.rop),
              'pit_gain': pre_event_data.pit_volume.diff().sum(),
              'raw_timeseries': pre_event_data.to_numpy()
          }
          
          return EventSignature(
              event_type=event.type,
              signature=signature,
              well_id=event.well_id,
              depth=event.depth,
              outcome=event.outcome
          )
  ```
  
- [ ] Index 50+ labeled historical events
- [ ] Store in vector database (Pinecone/Weaviate) for fast retrieval

**Days 31-32: Similarity Matching Service**
- [ ] Dynamic Time Warping implementation:
  ```python
  from dtaidistance import dtw
  
  class PatternMatcher:
      def find_similar_events(
          self, 
          current_data: np.ndarray, 
          top_k: int = 3
      ) -> List[SimilarEvent]:
          
          distances = []
          for event in self.event_database:
              # Compute DTW distance
              distance = dtw.distance(
                  current_data, 
                  event.signature['raw_timeseries']
              )
              distances.append((distance, event))
          
          # Return top-k most similar
          similar_events = sorted(distances, key=lambda x: x[0])[:top_k]
          
          return [
              SimilarEvent(
                  event_type=e.event_type,
                  similarity=1 - (d / max_distance),  # Normalize
                  well_id=e.well_id,
                  outcome=e.outcome,
                  recommendation=e.mitigation_action
              )
              for d, e in similar_events
          ]
  ```
  
- [ ] Caching for frequently queried patterns

**Days 33-35: Risk Engine Integration**
- [ ] Risk scoring algorithm:
  ```python
  class RiskEngine:
      def compute_risk(
          self, 
          anomaly_result: AnomalyResult,
          similar_events: List[SimilarEvent],
          operational_context: dict
      ) -> RiskAssessment:
          
          # Base score from anomaly detector
          base_score = anomaly_result.score
          
          # Boost if similar to known failure
          pattern_boost = 0
          if similar_events:
              max_similarity = max(e.similarity for e in similar_events)
              if max_similarity > 0.7:  # High similarity threshold
                  pattern_boost = 20 * max_similarity
          
          # Context modifiers
          context_modifier = self._compute_context_factor(
              operational_context
          )
          
          # Final risk score (capped at 100)
          risk_score = min(100, base_score + pattern_boost + context_modifier)
          
          # Map to risk category
          risk_category = self._categorize_risk(risk_score)
          
          # Estimate time to impact
          time_to_impact = self._estimate_time_window(
              risk_score, 
              similar_events
          )
          
          return RiskAssessment(
              score=risk_score,
              category=risk_category,
              time_to_impact_minutes=time_to_impact,
              explanation=self._build_explanation(
                  anomaly_result,
                  similar_events,
                  operational_context
              ),
              recommended_actions=self._get_recommendations(
                  similar_events
              )
          )
  ```
  
- [ ] Time-to-impact estimation based on historical event progression
- [ ] Rule-based safety constraints (hard limits)

**Testing:**
- [ ] End-to-end ML pipeline test (ingestion → risk score)
- [ ] Validate risk scores against expert judgment (10 test cases)
- [ ] Latency test: Full inference in <5 seconds

**Success Criteria:**
✅ Risk scores align with domain expert assessment (80%+ agreement)  
✅ Similar events retrieved with >70% relevance  
✅ Time-to-impact estimates within ±30 minutes  

---

### **WEEK 6: API & ALERTING SERVICE**

**Objectives:**
- Build FastAPI backend
- Implement alert generation and routing
- Set up authentication and RBAC

**Deliverables:**

**Days 36-37: Core API Development**
- [ ] FastAPI application structure:
  ```python
  # main.py
  from fastapi import FastAPI, Depends
  from fastapi.middleware.cors import CORSMiddleware
  
  app = FastAPI(title="EDIM API", version="1.0.0")
  
  # Middleware
  app.add_middleware(CORSMiddleware, allow_origins=["*"])
  
  # Routers
  app.include_router(wells.router, prefix="/api/v1/wells")
  app.include_router(monitoring.router, prefix="/api/v1/monitoring")
  app.include_router(alerts.router, prefix="/api/v1/alerts")
  app.include_router(insights.router, prefix="/api/v1/insights")
  ```

- [ ] Key endpoints:
  ```python
  # Well Management
  GET    /api/v1/wells                    # List wells
  GET    /api/v1/wells/{well_id}          # Well details
  GET    /api/v1/wells/{well_id}/timeline # Unified timeline
  
  # Real-Time Monitoring
  GET    /api/v1/monitoring/{well_id}/status        # Current risk state
  GET    /api/v1/monitoring/{well_id}/live-data     # Latest sensor data
  POST   /api/v1/monitoring/{well_id}/data          # Ingest new data
  
  # Alerts
  GET    /api/v1/alerts                             # List alerts (filtered)
  GET    /api/v1/alerts/{alert_id}                  # Alert details
  PATCH  /api/v1/alerts/{alert_id}/acknowledge      # Mark acknowledged
  
  # Insights
  GET    /api/v1/insights/{well_id}/historical      # Historical events
  GET    /api/v1/insights/{well_id}/similar-wells   # Offset well analysis
  POST   /api/v1/insights/event-feedback            # Label event
  ```

**Days 38-39: Authentication & Authorization**
- [ ] OAuth 2.0 + JWT implementation:
  ```python
  from fastapi.security import OAuth2PasswordBearer
  from jose import JWTError, jwt
  
  oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
  
  def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
      # Decode JWT
      # Validate claims
      # Return user object
  
  @app.get("/api/v1/wells")
  async def list_wells(
      current_user: User = Depends(get_current_user)
  ):
      # Check user.role permissions
      # Filter wells by user.company_id
      # Return authorized wells only
  ```
  
- [ ] Role-Based Access Control:
  - **Viewer**: Read-only access
  - **Engineer**: View + acknowledge alerts
  - **Admin**: Full access + user management
  
- [ ] Multi-tenancy: Data isolation per company/client

**Days 40-42: Alerting Service**
- [ ] Alert generation pipeline:
  ```python
  class AlertService:
      async def process_risk_assessment(
          self, 
          risk: RiskAssessment, 
          well: Well
      ):
          # Check if alert already exists (deduplication)
          if self._is_duplicate(risk, well):
              return
          
          # Create alert
          alert = Alert(
              well_id=well.id,
              risk_score=risk.score,
              category=risk.category,
              explanation=risk.explanation,
              time_to_impact=risk.time_to_impact_minutes,
              recommended_actions=risk.recommended_actions,
              status='NEW'
          )
          
          # Save to database
          await self.db.save(alert)
          
          # Route notification
          await self._route_notification(alert, well)
  ```
  
- [ ] Notification routing:
  ```python
  async def _route_notification(self, alert: Alert, well: Well):
      # Get users watching this well
      subscribers = await self.get_subscribers(well.id)
      
      # Route based on alert severity
      if alert.category == 'ACTION':
          # Critical: SMS + Email + Push + Dashboard
          await asyncio.gather(
              self.sms_service.send(subscribers, alert),
              self.email_service.send(subscribers, alert),
              self.push_service.send(subscribers, alert),
              self.websocket_service.broadcast(well.id, alert)
          )
      elif alert.category == 'ELEVATED':
          # Medium: Email + Push + Dashboard
          await asyncio.gather(
              self.email_service.send(subscribers, alert),
              self.push_service.send(subscribers, alert),
              self.websocket_service.broadcast(well.id, alert)
          )
      else:
          # Low: Dashboard only
          await self.websocket_service.broadcast(well.id, alert)
  ```
  
- [ ] Alert deduplication (suppress similar alerts within 15 min window)
- [ ] Escalation logic (if alert not acknowledged within 30 min)

**Testing:**
- [ ] API integration tests (pytest + Postman collection)
- [ ] Authentication edge cases (expired tokens, invalid roles)
- [ ] Alert delivery end-to-end test (<10 seconds)

**Success Criteria:**
✅ All API endpoints functional and documented (Swagger)  
✅ Authentication working with RBAC enforcement  
✅ Alerts delivered via all channels within 10 seconds  

---

### **WEEK 7: FRONTEND DEVELOPMENT**

**Objectives:**
- Build responsive web dashboard
- Implement unified well timeline visualization
- Create real-time monitoring views

**Deliverables:**

**Days 43-44: Project Setup & Design System**
- [ ] React + TypeScript setup:
  ```bash
  npx create-react-app edim-dashboard --template typescript
  cd edim-dashboard
  npm install @mui/material @emotion/react @emotion/styled
  npm install axios recharts date-fns
  npm install socket.io-client
  ```
  
- [ ] Design system implementation:
  - Color palette (brand colors + risk state colors)
  - Typography (headers, body, monospace for data)
  - Component library (buttons, cards, modals)
  - Risk state visual language:
    - **Normal**: Green (#4CAF50)
    - **Watch**: Yellow (#FFC107)
    - **Elevated**: Orange (#FF9800)
    - **Action**: Red (#F44336)

**Days 45-47: Core Dashboard Views**

**1. Well List View**
```tsx
// WellListView.tsx
interface Well {
  id: string;
  name: string;
  status: 'DRILLING' | 'TRIPPING' | 'CIRCULATING' | 'IDLE';
  current_risk: RiskState;
  depth: number;
  last_update: Date;
}

const WellListView: React.FC = () => {
  const [wells, setWells] = useState<Well[]>([]);
  
  // Fetch wells
  useEffect(() => {
    api.getWells().then(setWells);
  }, []);
  
  return (
    <Grid container spacing={2}>
      {wells.map(well => (
        <Grid item xs={12} md={6} lg={4} key={well.id}>
          <WellCard 
            well={well} 
            onClick={() => navigate(`/wells/${well.id}`)}
          />
        </Grid>
      ))}
    </Grid>
  );
};
```

**2. Well Timeline View** (Primary View)
```tsx
// TimelineView.tsx
const WellTimelineView: React.FC<{wellId: string}> = ({wellId}) => {
  return (
    <Box>
      {/* Header: Well info + current status */}
      <WellHeader well={well} currentRisk={riskState} />
      
      {/* Main Timeline Chart */}
      <Paper sx={{height: '600px', p: 2}}>
        <TimeSeriesChart
          data={sensorData}
          events={events}
          alerts={alerts}
          baselines={baselines}
          selectedTimeRange={timeRange}
        />
      </Paper>
      
      {/* Side Panel: Current Readings */}
      <Grid container spacing={2} sx={{mt: 2}}>
        <Grid item xs={12} md={8}>
          <LiveParametersPanel 
            spp={liveData.spp}
            torque={liveData.torque}
            rop={liveData.rop}
            flow={liveData.flow}
            pitVolume={liveData.pit_volume}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <AlertPanel alerts={activeAlerts} />
        </Grid>
      </Grid>
      
      {/* Bottom: Event History */}
      <EventHistoryTable events={historicalEvents} />
    </Box>
  );
};
```

**3. Risk Dashboard**
```tsx
// RiskDashboard.tsx
const RiskDashboard: React.FC<{wellId: string}> = ({wellId}) => {
  return (
    <Grid container spacing={3}>
      {/* Risk Score Gauge */}
      <Grid item xs={12} md={6}>
        <RiskScoreGauge 
          score={riskScore} 
          category={riskCategory}
          timeToImpact={timeToImpact}
        />
      </Grid>
      
      {/* Anomaly Breakdown */}
      <Grid item xs={12} md={6}>
        <AnomalyContributionChart 
          features={contributingFeatures}
        />
      </Grid>
      
      {/* Similar Historical Events */}
      <Grid item xs={12}>
        <SimilarEventsPanel 
          events={similarEvents}
          onEventClick={handleEventClick}
        />
      </Grid>
      
      {/* Recommended Actions */}
      <Grid item xs={12}>
        <RecommendationsPanel 
          actions={recommendedActions}
        />
      </Grid>
    </Grid>
  );
};
```

**Days 48-49: Real-Time Features**
- [ ] WebSocket integration:
  ```tsx
  // useRealTimeData.ts
  import { useEffect, useState } from 'react';
  import io from 'socket.io-client';
  
  export const useRealTimeData = (wellId: string) => {
    const [socket, setSocket] = useState<any>(null);
    const [liveData, setLiveData] = useState<SensorData | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    
    useEffect(() => {
      const newSocket = io(process.env.REACT_APP_WS_URL);
      
      // Subscribe to well updates
      newSocket.emit('subscribe', {wellId});
      
      // Listen for sensor data
      newSocket.on('sensor_data', (data: SensorData) => {
        setLiveData(data);
      });
      
      // Listen for new alerts
      newSocket.on('new_alert', (alert: Alert) => {
        setAlerts(prev => [alert, ...prev]);
        
        // Trigger browser notification
        if (Notification.permission === 'granted') {
          new Notification(`EDIM Alert: ${alert.category}`, {
            body: alert.explanation,
            icon: '/logo.png'
          });
        }
      });
      
      setSocket(newSocket);
      
      return () => {
        newSocket.disconnect();
      };
    }, [wellId]);
    
    return { liveData, alerts, socket };
  };
  ```

- [ ] Browser notifications
- [ ] Auto-refresh with configurable intervals
- [ ] Connection status indicator

**Testing:**
- [ ] Responsive design test (desktop, tablet, mobile)
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari)
- [ ] Accessibility audit (WCAG 2.1 Level AA)
- [ ] Performance: Initial load <3 seconds

**Success Criteria:**
✅ All views functional and responsive  
✅ Real-time updates working (<2 second latency)  
✅ No console errors  
✅ Positive feedback from 2+ engineers  

---

### **WEEK 8: INTEGRATION, TESTING & DEPLOYMENT**

**Objectives:**
- End-to-end system integration
- Comprehensive testing
- Production deployment
- Documentation

**Deliverables:**

**Days 50-52: System Integration**
- [ ] Connect all services:
  ```
  Data Ingestion → Intelligence Engine → Risk Engine → API → Frontend
                                                        ↓
                                                  Alert Service
  ```
  
- [ ] Integration test scenarios:
  1. **Normal Operations**: Ingest data → Baselines learned → No alerts
  2. **Gradual Degradation**: ROP decreases → Anomaly detected → WATCH alert
  3. **Imminent Failure**: SPP spike + torque increase → ACTION alert + recommendations
  4. **Historical Match**: Pattern matches stuck pipe event → Similar events shown
  
- [ ] Data flow validation:
  - Raw data → Processed data → Features → Predictions → Alerts → UI
  - Verify data consistency at each stage
  - Check latency at each step (<30 seconds total)

**Days 53-54: Testing**

**Unit Tests** (target: 80%+ coverage)
```bash
# Backend
pytest services/ --cov=services --cov-report=html

# Frontend
npm test -- --coverage
```

**Integration Tests**
- [ ] API endpoint tests (Postman/pytest)
- [ ] ML pipeline tests (data in → risk out)
- [ ] Alert delivery tests (all channels)

**Load Testing** (Apache JMeter / Locust)
- [ ] Concurrent users: 50+ engineers monitoring 20+ wells
- [ ] Data ingestion rate: 1000+ data points/min
- [ ] API response time: <500ms for 95th percentile
- [ ] WebSocket stability: 1000+ concurrent connections

**User Acceptance Testing**
- [ ] 3+ drilling engineers test on real well data
- [ ] Collect feedback on UI/UX
- [ ] Validate alert relevance and explainability

**Days 55-56: Deployment**

**Infrastructure as Code** (Terraform)
```hcl
# main.tf
module "edim_platform" {
  source = "./modules/edim"
  
  environment = "production"
  region      = "us-west-2"
  
  # Compute
  api_instance_type = "t3.large"
  ml_instance_type  = "g4dn.xlarge"  # GPU for ML inference
  
  # Database
  db_instance_class = "db.r5.xlarge"
  timescale_storage = "500GB"
  
  # High Availability
  multi_az_enabled = true
  min_instances    = 2
  max_instances    = 10
}
```

**Deployment Steps:**
1. [ ] Set up production AWS account
2. [ ] Provision infrastructure (Terraform apply)
3. [ ] Deploy Docker containers (ECR + ECS/EKS)
4. [ ] Configure load balancers (ALB + SSL)
5. [ ] Set up monitoring (CloudWatch + Grafana)
6. [ ] Configure backups (RDS snapshots + S3)
7. [ ] Deploy frontend to CDN (CloudFront)
8. [ ] Configure DNS (Route 53)

**Deployment Architecture:**
```
                          ┌─────────────┐
                          │  Route 53   │
                          │    (DNS)    │
                          └──────┬──────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼──────┐          ┌──────▼──────┐
              │ CloudFront │          │     ALB     │
              │   (CDN)    │          │ (Load Bal.) │
              └─────┬──────┘          └──────┬──────┘
                    │                        │
              ┌─────▼──────┐          ┌──────▼──────────┐
              │   React    │          │  ECS Fargate    │
              │  (Static)  │          │  (API + ML)     │
              └────────────┘          └──────┬──────────┘
                                             │
                          ┌──────────────────┼──────────────────┐
                          │                  │                  │
                    ┌─────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
                    │ PostgreSQL │   │ TimescaleDB │   │     S3      │
                    │    (RDS)   │   │    (RDS)    │   │  (Storage)  │
                    └────────────┘   └─────────────┘   └─────────────┘
```

**Days 57-58: Documentation & Training**

**Technical Documentation:**
- [ ] API Reference (Swagger/OpenAPI spec)
- [ ] Architecture diagrams (draw.io/Lucidchart)
- [ ] Deployment guide (step-by-step runbook)
- [ ] ML model documentation (algorithms, performance, limitations)
- [ ] Database schema documentation

**User Documentation:**
- [ ] Quick Start Guide (PDF + video)
- [ ] User Manual (dashboard navigation, alert interpretation)
- [ ] Best Practices Guide (when to trust alerts, escalation procedures)
- [ ] FAQ

**Training Materials:**
- [ ] 30-minute demo video (narrated walkthrough)
- [ ] Interactive tutorial (built into dashboard)
- [ ] Troubleshooting guide
- [ ] Contact support information

**Days 59-60: Pilot Launch**
- [ ] Select 2-3 pilot wells for live monitoring
- [ ] Onboard 5+ engineers
- [ ] Shadow operations for first 48 hours
- [ ] Collect real-time feedback
- [ ] Monitor system health (uptime, latency, error rates)
- [ ] Document lessons learned

**Success Criteria:**
✅ System deployed to production  
✅ Zero critical bugs in first 48 hours  
✅ Positive feedback from pilot users  
✅ At least one risk detected early  

---

## USER JOURNEY FLOWS

### JOURNEY 1: DAILY MONITORING (PRIMARY USE CASE)

**Actor:** Operations Engineer (Sarah)  
**Goal:** Monitor active drilling operations and respond to alerts

**Morning Workflow:**

1. **Login & Dashboard**
   - Sarah arrives at office, opens EDIM dashboard
   - Sees list of 5 active wells her company is drilling
   - Well status indicators show:
     - 3 wells: GREEN (Normal)
     - 1 well: YELLOW (Watch - minor anomaly detected)
     - 1 well: ORANGE (Elevated Risk)

2. **Investigate Elevated Risk Well**
   - Clicks on "Eagle-3H" (elevated risk well)
   - Timeline view loads showing:
     - Current depth: 12,450 ft
     - Operation: Drilling ahead in shale formation
     - Risk score: 68/100 (Elevated)
   
3. **Analyze Risk Details**
   - **Risk Panel shows:**
     - **Primary Issue:** "ROP declining 40% below baseline"
     - **Contributing Factors:**
       - Torque variance increased 25%
       - SPP trending upward (200 psi above baseline)
     - **Time to Impact:** "30-45 minutes if trend continues"
     - **Confidence:** 75%
   
4. **Review Historical Context**
   - **Similar Events Panel:**
     - "Eagle-1H (2023): Similar pattern 8 hours before stuck pipe event"
     - "Falcon-4 (2022): ROP degradation led to bit damage"
   
5. **Take Action**
   - Sarah reviews recommendations:
     - "Consider reducing WOB by 2-3 klbs"
     - "Increase RPM by 10-15 to improve cuttings removal"
     - "Monitor torque closely - approaching stuck pipe threshold"
   
6. **Coordinate with Wellsite**
   - Sarah calls wellsite supervisor
   - Shares EDIM findings and recommendations
   - Wellsite adjusts parameters
   - Sarah sets alert to notify if risk score exceeds 75

7. **Outcome Tracking**
   - 20 minutes later: Risk score drops to 45 (Watch level)
   - ROP stabilizes at 80% of baseline
   - Sarah acknowledges alert in system
   - System logs event for future learning

**Time Saved:** 45 minutes (early detection prevented stuck pipe)  
**NPT Avoided:** 6-8 hours ($150,000+)

---

### JOURNEY 2: ALERT RESPONSE (CRITICAL SCENARIO)

**Actor:** Drilling Engineer (Mike)  
**Goal:** Respond to critical alert during off-hours

**Evening Emergency:**

1. **Alert Notification**
   - 11:30 PM: Mike's phone buzzes
   - **Push notification:**
     ```
     🚨 EDIM ALERT - ACTION REQUIRED
     Well: Thunder-5
     Risk: CRITICAL (Score: 87/100)
     Issue: Potential loss circulation detected
     Time to Impact: 15-20 minutes
     ```

2. **Mobile Quick View**
   - Mike opens EDIM mobile app
   - Sees live parameter dashboard:
     - **Pit Volume:** Increasing rapidly (+15 bbls in 5 min)
     - **Flow-Out:** 150 gpm below flow-in
     - **SPP:** Dropped 400 psi suddenly
   - **Alert Explanation:**
     "Loss circulation pattern detected. Current behavior matches 3 historical loss events in offset wells."

3. **Detailed Analysis (Laptop)**
   - Mike opens laptop, connects to EDIM
   - Reviews timeline:
     - 11:15 PM: Pit volume started increasing
     - 11:22 PM: Flow imbalance detected
     - 11:28 PM: SPP drop confirmed
   - **Similar Events:**
     - "Thunder-2 (2024): Lost 50 bbls, required LCM treatment"
     - "Thunder-4 (2023): Severe losses, had to set cement plug"

4. **Collaborative Decision**
   - Mike calls night-shift wellsite supervisor
   - Reviews EDIM recommendations together:
     - **Immediate:** Reduce pump rate to minimize losses
     - **Short-term:** Prepare LCM (lost circulation material)
     - **Monitor:** Watch for further SPP drops (may indicate formation breakdown)
   
5. **Action Execution**
   - Wellsite reduces pump rate from 600 gpm to 400 gpm
   - Losses stabilize at 20 bbls total
   - LCM pill mixed as precaution
   - Mike stays on call, monitoring EDIM dashboard

6. **Resolution & Learning**
   - 12:45 AM: Losses controlled, drilling resumes
   - Mike labels event in EDIM as "Loss Circulation - Minor - Controlled"
   - Adds notes: "Reducing pump rate early prevented severe losses"
   - System adds this event to pattern database

**Time Saved:** 2 hours (early intervention)  
**NPT Avoided:** 12+ hours ($300,000+)  
**Value:** System provided 15-minute advance warning before losses became severe

---

### JOURNEY 3: POST-WELL ANALYSIS (CONTINUOUS IMPROVEMENT)

**Actor:** Drilling Manager (Lisa)  
**Goal:** Review well performance and improve future operations

**Monthly Review:**

1. **Performance Dashboard**
   - Lisa accesses EDIM analytics module
   - Selects date range: Last 30 days
   - Views aggregate statistics:
     - Wells monitored: 12
     - Alerts generated: 47
     - High-risk events: 8
     - NPT incidents: 2 (vs. 5 previous month)

2. **Event Review**
   - Filters to "NPT Incidents"
   - Reviews 2 events where alerts were generated:
     - **Eagle-7:** Stuck pipe despite WATCH alert (risk score: 55)
       - **Analysis:** Alert generated, but crew busy with connection
       - **Lesson:** Need better alert prioritization
     - **Falcon-2:** Bit damage caught early (risk score: 72)
       - **Analysis:** Alert acted upon, bit changed before catastrophic failure
       - **Lesson:** Saved 18 hours NPT

3. **False Positive Analysis**
   - Reviews alerts that didn't result in NPT (39 alerts)
   - Identifies patterns:
     - 12 alerts during tripping operations (expected variations)
     - 8 alerts during formation changes (geological, not mechanical)
   - **Action:** Requests ML team to retrain models with these labeled as normal

4. **Offset Well Comparison**
   - Compares performance across similar wells:
     - Wells with EDIM monitoring: Average NPT = 2.5%
     - Historical average (pre-EDIM): Average NPT = 4.8%
     - **Improvement:** 48% reduction in NPT

5. **Budget Impact**
   - Calculates savings:
     - 12 wells x 30 days x 24 hrs = 8,640 well-hours
     - NPT avoided: ~200 hours
     - Cost savings: $5M+ (at $25k/hr rig cost)
     - EDIM subscription cost: $200k/year
     - **ROI:** 25x return on investment

6. **Share Best Practices**
   - Lisa exports report showing:
     - Most common failure precursors
     - Most effective interventions
     - Wells with best performance
   - Shares with drilling team in monthly meeting
   - Updates drilling procedures based on insights

**Value:** Quantifiable ROI + systematic knowledge capture

---

### JOURNEY 4: WELL PLANNING INTEGRATION (FUTURE USE CASE)

**Actor:** Well Planner (David)  
**Goal:** Use EDIM insights to improve future well plans

**Pre-Spud Planning:**

1. **Offset Well Analysis**
   - David is planning new well: "Eagle-8H"
   - Opens EDIM, searches for offset wells within 2-mile radius
   - Finds 4 offset wells with execution data

2. **Historical Event Review**
   - Filters events by hole section (8.5" section)
   - Identifies recurring issues:
     - Tight hole at 11,200-11,400 ft (3 of 4 wells)
     - Stuck pipe risk in shale interval (2 of 4 wells)
     - Elevated torque in curve section (all 4 wells)

3. **Plan Adjustments**
   - **Based on EDIM insights:**
     - Plans wiper trip at 11,400 ft (before historical tight hole zone)
     - Specifies higher-torque motor for curve section
     - Adds LCM to mud system before shale interval
     - Sets conservative ROP targets (80% of offset average)

4. **Risk Mitigation**
   - Exports EDIM report showing historical failure patterns
   - Includes in well program as "Lessons Learned" section
   - Briefs drilling team on specific risks to watch for

5. **Real-Time Validation**
   - During drilling, EDIM compares Eagle-8H to plan
   - When approaching 11,200 ft, system proactively alerts:
     - "Entering tight hole zone (historical risk area)"
     - "Monitor torque closely - 3 offset wells had issues here"
   - Crew is prepared, executes planned wiper trip
   - No stuck pipe incidents

**Value:** Proactive risk mitigation through historical learning

---

## TECHNICAL SPECIFICATIONS

### Data Requirements

**Minimum Data Inputs:**
- Standpipe Pressure (SPP): 1-second frequency
- Flow-in / Flow-out: 1-second frequency
- Pit Volume: 1-second frequency
- Torque: 1-second frequency
- ROP: 10-second frequency
- RPM: 1-second frequency
- Depth: Continuous

**Optional (Enhanced Detection):**
- WOB, Hookload, Block Height, Mud Weight, Mud Temperature
- Gamma Ray, Resistivity (from MWD/LWD)
- Surface RPM, Downhole RPM (if available)

**Data Quality Requirements:**
- Completeness: >95% (max 5% missing data)
- Timeliness: <5 minute delay from wellsite to cloud
- Accuracy: Calibrated sensors, validated ranges

---

### Performance SLAs

**Availability:** 99.5% uptime (excluding planned maintenance)  
**Latency:**
- Data ingestion to storage: <60 seconds
- ML inference: <5 seconds
- Alert delivery: <10 seconds
- Dashboard load time: <3 seconds

**Scalability:**
- Support 100+ concurrent wells
- 1M+ data points per day per well
- 1000+ concurrent users

---

### Security & Compliance

**Data Security:**
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Multi-tenant data isolation
- Regular security audits

**Compliance:**
- SOC 2 Type II
- GDPR compliance (EU data residency)
- ISO 27001 (information security)

**Access Control:**
- Role-Based Access Control (RBAC)
- Multi-Factor Authentication (MFA)
- Audit logging (all user actions)

---

## SUCCESS METRICS (POST-LAUNCH)

### Technical Metrics
- **System Uptime:** >99.5%
- **Alert Latency:** <10 seconds (95th percentile)
- **False Positive Rate:** <15%
- **Detection Rate:** >80% of labeled anomalies

### Business Metrics
- **NPT Reduction:** Target 30-40% reduction
- **Early Detection:** Alerts 30+ minutes before manual recognition
- **User Adoption:** 80%+ of engineers use daily
- **Alert Actionability:** 60%+ of ACTION alerts result in intervention

### User Satisfaction
- **NPS Score:** Target >50
- **Training Completion:** 90%+ of users
- **Feature Requests:** <10/month (system meets needs)

---

## RISKS & MITIGATION

### Technical Risks

**Risk 1: Model Accuracy Below Target**
- **Mitigation:**
  - Extensive training on diverse well data (20+ wells)
  - Ensemble approach (multiple algorithms)
  - Continuous retraining with labeled events
  - Confidence thresholds (only alert when >70% confidence)

**Risk 2: Data Quality Issues**
- **Mitigation:**
  - Robust validation at ingestion
  - Quality scoring per data source
  - Graceful degradation (operate with partial data)
  - Alert users when data quality drops below threshold

**Risk 3: Integration Complexity**
- **Mitigation:**
  - Standard APIs (REST + WebSocket)
  - Well-documented integration guides
  - Support for multiple data formats (CSV, WITSML)
  - Dedicated integration engineers for pilot customers

### Business Risks

**Risk 4: Low User Adoption**
- **Mitigation:**
  - Extensive user research before build
  - Involve engineers in design process
  - Comprehensive training program
  - Easy-to-use interface (minimal learning curve)

**Risk 5: Alert Fatigue**
- **Mitigation:**
  - Tune alert thresholds based on user feedback
  - Intelligent deduplication
  - Clear prioritization (Watch vs. Elevated vs. Action)
  - Explainable alerts (build trust)

**Risk 6: Liability Concerns**
- **Mitigation:**
  - Clear disclaimers (advisory system, not autonomous)
  - Human-in-the-loop decision making
  - Audit trails (all alerts logged)
  - Insurance coverage

---

## POST-MVP ROADMAP (WEEKS 9-16)

### Phase 2 Features (Weeks 9-12)
- [ ] Mobile app (React Native) for wellsite supervisors
- [ ] Predictive maintenance for BHA components
- [ ] Integration with DrillPlan (plan vs. actual comparison)
- [ ] Advanced analytics dashboard (trends, benchmarking)

### Phase 3 Features (Weeks 13-16)
- [ ] Multi-well comparison view
- [ ] Automated report generation (daily/weekly)
- [ ] API for third-party integrations
- [ ] Machine learning model marketplace (customer-specific models)

---

## APPENDICES

### A. Technology Stack Summary

**Backend:**
- Python 3.11+, FastAPI, Celery, Apache Airflow
- PostgreSQL, TimescaleDB, Redis
- TensorFlow, PyTorch, Scikit-learn
- Docker, Kubernetes

**Frontend:**
- React 18, TypeScript, Material-UI
- Recharts, D3.js
- Socket.IO client

**Infrastructure:**
- AWS (EC2, RDS, S3, ECS, CloudFront)
- Terraform, GitHub Actions
- CloudWatch, Grafana

**Integrations:**
- Twilio (SMS), SendGrid (email)
- Firebase Cloud Messaging (push)
- Slack/Teams webhooks

### B. Data Schema (Simplified)

**Wells Table:**
```sql
CREATE TABLE wells (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    company_id UUID NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    spud_date DATE,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Sensor Data (TimescaleDB Hypertable):**
```sql
CREATE TABLE sensor_data (
    time TIMESTAMPTZ NOT NULL,
    well_id UUID NOT NULL,
    depth DECIMAL(10, 2),
    spp DECIMAL(6, 1),
    torque DECIMAL(6, 1),
    rop DECIMAL(5, 2),
    flow_in DECIMAL(5, 1),
    flow_out DECIMAL(5, 1),
    pit_volume DECIMAL(6, 1),
    rpm INTEGER,
    FOREIGN KEY (well_id) REFERENCES wells(id)
);

SELECT create_hypertable('sensor_data', 'time');
```

**Alerts Table:**
```sql
CREATE TABLE alerts (
    id UUID PRIMARY KEY,
    well_id UUID NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
    category VARCHAR(20),
    explanation TEXT,
    time_to_impact_minutes INTEGER,
    recommended_actions JSONB,
    status VARCHAR(20) DEFAULT 'NEW',
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    FOREIGN KEY (well_id) REFERENCES wells(id)
);
```

### C. Key Deliverables Checklist

**Week 1:**
- [x] Infrastructure provisioned
- [x] Database schemas finalized
- [x] Training data acquired

**Week 2:**
- [ ] Data ingestion pipeline operational
- [ ] 5+ wells ingested successfully
- [ ] Data quality dashboard

**Week 3:**
- [ ] Baseline models trained (>95% normal operation coverage)
- [ ] Models exported to MLflow

**Week 4:**
- [ ] Anomaly detection models (>80% detection, <10% FP)
- [ ] Explainability module

**Week 5:**
- [ ] Pattern matching operational (>70% relevance)
- [ ] Risk engine integrated

**Week 6:**
- [ ] FastAPI fully functional
- [ ] Authentication + RBAC working
- [ ] Alert delivery (all channels)

**Week 7:**
- [ ] Web dashboard complete
- [ ] Real-time features operational
- [ ] Responsive design validated

**Week 8:**
- [ ] System deployed to production
- [ ] Documentation complete
- [ ] Pilot launched (2-3 wells)

---

## CONCLUSION

This 8-week roadmap delivers a production-ready, enterprise-grade execution-phase drilling intelligence platform. The system is designed to:

✅ Detect operational risks 30-60 minutes before escalation  
✅ Provide explainable, actionable alerts  
✅ Learn from historical failures  
✅ Integrate seamlessly with existing workflows  
✅ Scale to support 100+ wells  

**Next Steps:**
1. Secure executive approval and budget
2. Assemble development team (5-7 engineers)
3. Finalize data partnerships (access to training wells)
4. Kick off Week 1 activities

**Estimated Team:**
- 1 Product Manager
- 1 Tech Lead / Architect
- 2 Backend Engineers (Python, ML)
- 1 Frontend Engineer (React)
- 1 DevOps Engineer
- 1 ML Engineer / Data Scientist

**Budget Estimate:** $400k-$600k for 8-week MVP (team + infrastructure)

**Expected ROI:** 10-25x return (based on NPT reduction in pilot wells)

---

*Document Version: 1.0*  
*Last Updated: January 4, 2026*  
*Prepared for: SPE UNILAG / DrillPlan Integration*
