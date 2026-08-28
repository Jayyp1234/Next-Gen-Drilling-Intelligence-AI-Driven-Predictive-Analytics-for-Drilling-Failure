/**
 * Live inference client (mobile) — talks to the Python model service
 * (ml-pipeline/serving/app.py). Native fetch, so no CORS. Set
 * EXPO_PUBLIC_INFER_BASE (default http://localhost:8099 on the Simulator).
 */
const BASE = process.env.EXPO_PUBLIC_INFER_BASE?.replace(/\/$/, "") ?? "";
export const inferEnabled = BASE !== "";
export const inferBase = BASE;

export const MODELS = [
  { id: "bilabri-d2", label: "Stuck Pipe", sub: "Bilabri D2" },
  { id: "eos-stick-slip", label: "Stick-Slip", sub: "31/5-7 Eos" },
  { id: "volve-packoff", label: "Pack-Off", sub: "Volve F-15" },
];

export type ModelCard = {
  model: string; well: string; mechanism: string; anchor: string;
  window_samples: number; features: string[]; raw_inputs: string[]; monitors: string[];
};
export type TrajPoint = {
  i: number; depth: number; risk: number | null; tier: string;
  S_baseline: number | null; S_LSTM: number | null; S_DTW: number | null;
};
export type ScoreResult = {
  model: string; sample: string | null; rows_scored: number; window: number;
  peak_risk: { risk: number; depth: number } | null;
  tier_crossings: { i: number; depth: number; tier: string; risk: number | null; active_monitors: string }[];
  trajectory: TrajPoint[];
};

export async function modelCard(model: string): Promise<ModelCard> {
  const r = await fetch(`${BASE}/model?model=${encodeURIComponent(model)}`);
  if (!r.ok) throw new Error(`model card ${r.status}`);
  return r.json();
}

export async function scoreSample(model: string): Promise<ScoreResult> {
  const r = await fetch(`${BASE}/score-sample?model=${encodeURIComponent(model)}`);
  const t = await r.text();
  const d = t ? JSON.parse(t) : null;
  if (!r.ok) throw new Error(typeof d?.detail === "string" ? d.detail : `inference ${r.status}`);
  return d as ScoreResult;
}
