export type RiskLevel = 'NORMAL' | 'WATCH' | 'ELEVATED' | 'ACTION';
export type OperationalState = 'drilling' | 'tripping' | 'circulating' | 'idle';
export type AlertSeverity = 'WATCH' | 'ELEVATED' | 'ACTION';
export type AlertStatus = 'new' | 'acknowledged' | 'resolved' | 'false_positive';
export type ContributingModel = 'RF' | 'LSTM' | 'DTW';

export interface Well {
  id: string;
  name: string;
  operational_state: OperationalState;
  depth: number;
  risk_score: number;
  risk_level: RiskLevel;
  tti_minutes: number | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface SensorReading {
  id: string;
  well_id: string;
  timestamp: string;
  gamma_ray: number | null;
  block_position: number | null;
  collar_rpm: number | null;
  stick_slip: number | null;
  shock_peak: number | null;
  ecd: number | null;
  temperature: number | null;
  pressure: number | null;
  risk_score: number | null;
}

export interface Alert {
  id: string;
  well_id: string;
  severity: AlertSeverity;
  risk_score: number;
  tti_minutes: number | null;
  description: string;
  contributing_features: ContributingFeature[];
  contributing_model: ContributingModel | null;
  status: AlertStatus;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  false_positive_reason: string | null;
  created_at: string;
  well_name?: string;
}

export interface ContributingFeature {
  name: string;
  deviation: number;
  direction: 'above' | 'below';
}

export interface Recommendation {
  id: string;
  alert_id: string | null;
  well_id: string;
  text: string;
  confidence: number;
  source_model: ContributingModel | null;
  feedback: 'positive' | 'negative' | null;
  created_at: string;
}

export interface ModelOutput {
  id: string;
  well_id: string;
  timestamp: string;
  random_forest_score: number;
  lstm_score: number;
  dtw_score: number;
  fused_score: number;
  feature_importance: FeatureImportance[];
}

export interface FeatureImportance {
  name: string;
  importance: number;
}

export interface HistoricalEvent {
  id: string;
  well_id: string;
  event_type: string;
  severity: string;
  start_time: string;
  end_time: string | null;
  max_risk_score: number | null;
  outcome: string | null;
  similarity_score: number | null;
  description: string | null;
  well_name?: string;
}

export interface SensorParameter {
  key: keyof Pick<SensorReading, 'gamma_ray' | 'block_position' | 'collar_rpm' | 'stick_slip' | 'shock_peak' | 'ecd' | 'temperature' | 'pressure'>;
  label: string;
  abbreviation: string;
  unit: string;
  color: string;
  baselineMin: number;
  baselineMax: number;
}

export interface FormationLayer {
  name: string;
  topDepth: number;
  bottomDepth: number;
  lithology: 'shale' | 'sandstone' | 'limestone' | 'salt' | 'clay' | 'siltstone';
  porePressure: number;
  fracGradient: number;
}

export interface CasingString {
  type: 'conductor' | 'surface' | 'intermediate' | 'production' | 'liner';
  outerDiameter: number;
  setDepth: number;
  color: string;
}

export interface WellboreSchematicData {
  formations: FormationLayer[];
  casings: CasingString[];
  bitDepth: number;
  totalDepth: number;
  mudWeight: number;
  holeSize: number;
}

export interface ShiftSummary {
  id: string;
  wellId: string;
  wellName: string;
  shiftStart: string;
  shiftEnd: string;
  crew: string;
  incomingCrew: string;
  depthStart: number;
  depthEnd: number;
  riskScoreAvg: number;
  riskScoreMax: number;
  alertCount: number;
  criticalEvents: string[];
  sensorAnomalies: string[];
  recommendations: string[];
  aiSummary: string;
  operationalHighlights: string[];
  mudWeight: number;
  ropAvg: number;
  status: 'safe' | 'caution' | 'critical';
}
