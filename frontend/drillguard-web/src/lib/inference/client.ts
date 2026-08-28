/**
 * Live inference client — talks to the Python model service (ml-pipeline/serving/app.py).
 *
 * When NEXT_PUBLIC_INFER_BASE is set, the Live Monitoring gauge can be COMPUTED by
 * POSTing the current telemetry window to /score, instead of read from the replay JSON.
 * Unset → inferEnabled is false and the app keeps its replay behaviour.
 */
const BASE = process.env.NEXT_PUBLIC_INFER_BASE?.replace(/\/$/, "") ?? "";
export const inferEnabled = BASE !== "";

const FT = 3.280840;

/** Raw sample fed to the model — fields vary by model, so a loose record. */
export type RawSample = Record<string, number>;
type Ch = Partial<Record<"torque" | "wob" | "spp" | "flow" | "rop" | "mse" | "ssi", number>>;
const ok = (...v: (number | undefined)[]) => v.every((x) => x != null && Number.isFinite(x));

export type ScoreResult = {
  risk: number | null; tier: string;
  S_baseline: number | null; S_LSTM: number | null; S_DTW: number | null;
  active_monitors: string;
};

/**
 * The served models and how to reconstruct their raw inputs from a replay row's
 * channels. robust-z (Volve) is unit-invariant, so field-unit channels feed it directly;
 * D2's channels are inverted back to raw Bilabri units.
 */
export type ServedModel = {
  id: string; label: string; mechanism: string; history: number;
  matchWell: (well: string) => boolean;
  rawFromCh: (ch: Ch) => RawSample | null;
};
export const SERVED_MODELS: ServedModel[] = [
  {
    id: "bilabri-d2", label: "Stuck Pipe", mechanism: "stuck_pipe", history: 0,
    matchWell: (w) => w.startsWith("BILABRI"),
    rawFromCh: ({ torque, wob, spp, flow, rop, mse }) =>
      ok(torque, wob, spp, flow, rop, mse)
        ? { torque: torque! / 1000, wob: wob!, spp: spp!, gpm: flow!, rop: rop! / FT, mse_psi: mse! }
        : null,
  },
  {
    id: "eos-stick-slip", label: "Stick-Slip", mechanism: "stick_slip", history: 0,
    matchWell: (w) => w.startsWith("31/5-7") || w.startsWith("EOS"),
    rawFromCh: ({ ssi }) => (ok(ssi) ? { stick_slip_index: ssi! } : null),
  },
  {
    id: "volve-packoff", label: "Pack-Off", mechanism: "pack_off", history: 120,
    matchWell: (w) => w.startsWith("15/9") || w.startsWith("15_9"),
    rawFromCh: ({ spp, torque, flow }) =>
      ok(spp, torque, flow) ? { spp: spp!, torque: torque!, flow: flow! } : null,
  },
];
export function modelForWell(well: string | undefined): ServedModel | null {
  if (!well) return null;
  return SERVED_MODELS.find((m) => m.matchWell(well)) ?? null;
}

export async function scoreWindow(window: RawSample[], model = "bilabri-d2"): Promise<ScoreResult> {
  const res = await fetch(`${BASE}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ window, model }),
  });
  if (!res.ok) throw new Error(`inference ${res.status}`);
  return res.json();
}

export type TrajPoint = {
  i: number; depth: number; risk: number | null; tier: string;
  S_baseline: number | null; S_LSTM: number | null; S_DTW: number | null; active_monitors: string;
};
export type ScoreCsvResult = {
  model: string; rows_scored: number; window: number;
  peak_risk: { risk: number; depth: number } | null;
  tier_crossings: { i: number; depth: number; tier: string; risk: number | null; active_monitors: string }[];
  trajectory: TrajPoint[];
};

/** Bring-your-own-data: upload a telemetry CSV, get the whole run scored by the model. */
export async function scoreCsv(file: File | Blob, model = "bilabri-d2"): Promise<ScoreCsvResult> {
  const fd = new FormData();
  fd.append("file", file, "file" in (file as File) ? (file as File).name : "telemetry.csv");
  const res = await fetch(`${BASE}/score-csv?model=${encodeURIComponent(model)}`, { method: "POST", body: fd });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail = data?.detail ?? data?.error ?? res.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data as ScoreCsvResult;
}

export async function inferHealth(): Promise<boolean> {
  if (!inferEnabled) return false;
  try {
    const r = await fetch(`${BASE}/health`, { cache: "no-store" });
    return r.ok;
  } catch {
    return false;
  }
}

export type ModelCard = {
  model: string; well: string; mechanism: string; anchor: string; event_depth_m: number;
  label_tier: string; window_samples: number; features: string[]; raw_inputs: string[];
  monitors: string[]; monitor_weights: Record<string, number>;
  tiers: { pct: number; name: string }[]; note: string;
};
export async function modelCard(model = "bilabri-d2"): Promise<ModelCard> {
  const r = await fetch(`${BASE}/model?model=${encodeURIComponent(model)}`);
  if (!r.ok) throw new Error(`model card ${r.status}`);
  return r.json();
}

export const inferBase = BASE;
