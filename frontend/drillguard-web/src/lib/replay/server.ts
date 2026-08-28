/**
 * Server-side replay catalog built from REAL pipeline output:
 *   ml-pipeline/artifacts/ensemble_scores.csv   (per-row risk, tier, S_* scores)
 *   ml-pipeline/data/features/<ds>/<well>.csv    (raw channels, joined by index)
 *   ml-pipeline/artifacts/events_anchors.csv, volve_anchors.csv (documented events)
 *
 * Nothing here is simulated: every value the UI replays was produced by the
 * STEP 3/4 pipeline on field data. Module-level cache; read once per process.
 */
import fs from "node:fs";
import path from "node:path";

const REPO = path.resolve(process.cwd(), "..", "..");
const ART = path.join(REPO, "ml-pipeline", "artifacts");
const FEAT = path.join(REPO, "ml-pipeline", "data", "features");

export type Channels = Partial<{
  hookload: number; torque: number; spp: number; rop: number; wob: number;
  flow: number; rpm: number; gas: number; ecd: number; dhap: number;
  stick: number; crpm: number; mse: number; ssi: number;
}>;
export type ReplayRow = {
  i: number; idx: number; onb: number;
  sb: number | null; sl: number | null; sd: number | null;
  active: string; risk: number | null; tier: string; label: number | null;
  ch: Channels;
};
export type Anchor = { id: string; mechanism: string; eventIdx: number; quote: string; note: string };
export type Dataset = {
  id: string; name: string; well: string; field: string; scenario: string;
  scenarioTone: "good" | "medium" | "high" | "info" | "purple";
  mechanism: string; indexKind: "depth_m" | "time_1900_days"; n: number;
  lo: number; hi: number; labelTier: string; evidence: string; anchors: Anchor[];
  units: { index: string; indexLabel: string };
};

// ---------------------------------------------------------------- CSV ----
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { cur.push(field); field = ""; }
    else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || cur.length) { cur.push(field); rows.push(cur); }
  const head = rows.shift() ?? [];
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, j) => [h, r[j] ?? ""])));
}
const num = (v: string | undefined) => (v === undefined || v === "" ? null : Number(v));
const readCsv = (p: string) => (fs.existsSync(p) ? parseCsv(fs.readFileSync(p, "utf8")) : []);

// ------------------------------------------------------- channel joins ----
type Raw = { idx: number; ch: Channels }[];
const FT = 3.280840, KLBF = 2.20462, FTLB = 737.562, PSI = 0.145038, GPM = 1 / 3.785412;

function rawFor(well: string, configId: string): Raw {
  if (well.startsWith("BILABRI")) {
    return readCsv(path.join(FEAT, "bilabri", `${well}.csv`)).map((r) => ({
      idx: Number(r.depth),
      ch: { wob: num(r.wob)!, torque: num(r.torque)! * 1000, spp: num(r.spp)!, rop: num(r.rop)! * FT,
            flow: num(r.gpm)!, rpm: num(r.rpm)!, mse: num(r.mse_psi) ?? undefined },
    }));
  }
  if (well.startsWith("15/9")) {
    const f = well.replace("15/9-", "15_9-");
    return readCsv(path.join(FEAT, "usrop", `${f}.csv`)).map((r) => ({
      idx: Number(r["Measured Depth m"]),
      ch: { wob: num(r["Weight on Bit kkgf"])! * KLBF, torque: num(r["Average Surface Torque kN.m"])! * FTLB,
            spp: num(r["Average Standpipe Pressure kPa"])! * PSI, rop: num(r["Rate of Penetration m/h"])! * FT,
            flow: num(r["Mud Flow In L/min"])! * GPM, rpm: num(r["Average Rotary Speed rpm"])!,
            hookload: num(r["Average Hookload kkgf"])! * KLBF, mse: num(r.mse_psi) ?? undefined },
    }));
  }
  const run = configId.split("test:")[1];
  return readCsv(path.join(FEAT, "eos", `${run}.csv`)).map((r) => ({
    idx: Number(r.TIME_1900),
    ch: { crpm: num(r.CRPM) ?? undefined, stick: num(r.STICK) ?? undefined, ecd: num(r.ecd_gcm3) ?? undefined,
          dhap: num(r.DHAP) ?? undefined, ssi: num(r.stick_slip_index) ?? undefined },
  }));
}
function nearest(raw: Raw, idx: number): Channels {
  if (!raw.length) return {};
  let lo = 0, hi = raw.length - 1;
  while (lo < hi) { const m = (lo + hi) >> 1; if (raw[m].idx < idx) lo = m + 1; else hi = m; }
  const a = raw[lo], b = raw[lo - 1];
  const best = b && Math.abs(b.idx - idx) < Math.abs(a.idx - idx) ? b : a;
  return Math.abs(best.idx - idx) <= (idx > 1000 ? 2 : 0.01) ? best.ch : {};
}

// --------------------------------------------------------------- names ----
const META: Record<string, Partial<Dataset>> = {
  "bilabri-heldout:BILABRI-D2": { name: "Bilabri D2 — Documented stuck pipe", field: "Niger Delta, Nigeria", scenario: "Stuck Pipe Event", scenarioTone: "medium", labelTier: "documented (GEOL daily report)", evidence: "Held-out well; leave-one-event-out. RF@99 lead 50 m @ 0.8% FAR." },
  "bilabri-heldout:BILABRI-D4": { name: "Bilabri D4 — Stuck pipe (record ends 49 m short)", field: "Niger Delta, Nigeria", scenario: "Stuck Pipe Event", scenarioTone: "medium", labelTier: "documented (GEOL daily report)", evidence: "Anchor at 2591 m lies beyond the valid record; no detection claim." },
  "usrop-demo-heldout:15_9-F-14": { name: "Volve 15/9-F-14 — Bit wear demonstration", field: "North Sea, Norway", scenario: "Normal Drilling", scenarioTone: "good", labelTier: "physics-consistency (demonstration)", evidence: "No documented anchors; Action 0.22/h over 194 h." },
  "usrop-demo-heldout:15_9-F-15S": { name: "Volve 15/9-F-15 A — Bit wear demonstration", field: "North Sea, Norway", scenario: "Normal Drilling", scenarioTone: "good", labelTier: "physics-consistency (demonstration)", evidence: "No documented anchors; Action 0.00/h over 131 h." },
  "eos-C1-ssi-test:WL_RAW_BHPR-GR-MECH_TIME_MWD_9": { name: "31/5-7 Eos MWD_9 — Stick-slip (instrument-labelled)", field: "Eos, Norway", scenario: "Stick-Slip Event", scenarioTone: "high", labelTier: "instrument (STICK channel)", evidence: "Fused AUC 0.839 vs downhole STICK ground truth." },
  "eos-C1-ssi-test:WL_RAW_BHPR-GR-MECH_TIME_MWD_5": { name: "31/5-7 Eos MWD_5 — Stick-slip (saturated run)", field: "Eos, Norway", scenario: "Stick-Slip Event", scenarioTone: "high", labelTier: "instrument (STICK channel)", evidence: "66% of drilling rows in stick-slip; weak contrast (AUC 0.64)." },
  "eos-C2-ecd-test:WL_RAW_BHPR-GR-MECH_TIME_MWD_9": { name: "31/5-7 Eos MWD_9 — ECD-only control (C2)", field: "Eos, Norway", scenario: "Relational-channel control", scenarioTone: "purple", labelTier: "instrument (STICK channel)", evidence: "Single relational channel: AUC exactly 0.500 — uninformative by construction." },
  "eos-C2-ecd-test:WL_RAW_BHPR-GR-MECH_TIME_MWD_5": { name: "31/5-7 Eos MWD_5 — ECD-only control (C2)", field: "Eos, Norway", scenario: "Relational-channel control", scenarioTone: "purple", labelTier: "instrument (STICK channel)", evidence: "Single relational channel ≈ chance." },
};

// --------------------------------------------------------------- cache ----
let CACHE: { datasets: Dataset[]; rows: Record<string, ReplayRow[]> } | null = null;

export function loadReplay() {
  if (CACHE) return CACHE;

  // Hosted builds (Vercel/CI) don't carry the raw pipeline CSVs — they are
  // gitignored. Fall back to the committed snapshot (the exact JSON this
  // function exported locally), so the build stays self-contained.
  const snapDir = path.resolve(process.cwd(), "src", "data", "replay-snapshot");
  if (!fs.existsSync(path.join(ART, "ensemble_scores.csv")) && fs.existsSync(path.join(snapDir, "catalog.json"))) {
    const catalog = JSON.parse(fs.readFileSync(path.join(snapDir, "catalog.json"), "utf8")) as { datasets: Dataset[] };
    const rows: Record<string, ReplayRow[]> = {};
    for (const d of catalog.datasets) {
      const f = path.join(snapDir, `${d.id}.json`);
      if (fs.existsSync(f)) rows[d.id] = (JSON.parse(fs.readFileSync(f, "utf8")) as { rows: ReplayRow[] }).rows;
    }
    CACHE = { datasets: catalog.datasets.filter((d) => rows[d.id]?.length), rows };
    return CACHE;
  }

  const scores = readCsv(path.join(ART, "ensemble_scores.csv"));
  const evAnch = readCsv(path.join(ART, "events_anchors.csv"));
  const volAnch = readCsv(path.join(ART, "volve_anchors.csv")).filter((a) => a.window_valid === "True");
  const byCfg = new Map<string, Record<string, string>[]>();
  for (const r of scores) (byCfg.get(r.config_id) ?? byCfg.set(r.config_id, []).get(r.config_id)!).push(r);

  const datasets: Dataset[] = [];
  const rows: Record<string, ReplayRow[]> = {};
  for (const [cfg, rs] of byCfg) {
    const well = rs[0].well;
    const raw = rawFor(well, cfg);
    const sorted = rs.map((r) => ({ r, idx: Number(r.index) })).sort((a, b) => a.idx - b.idx);
    const out: ReplayRow[] = sorted.map(({ r, idx }, i) => ({
      i, idx, onb: Number(r.on_bottom_circulating) || 0,
      sb: num(r.S_baseline), sl: num(r.S_LSTM), sd: num(r.S_DTW),
      active: r.active_monitors, risk: num(r.risk_score), tier: r.alert_tier || "Normal",
      label: num(r.label), ch: nearest(raw, idx),
    }));
    const lo = out[0].idx, hi = out[out.length - 1].idx;
    const anchors: Anchor[] = [
      ...evAnch.filter((a) => a.well === well).map((a) => ({ id: a.anchor_id, mechanism: a.mechanism, eventIdx: Number(a.event_depth_m), quote: a.quote, note: a.note })),
      ...volAnch.filter((a) => well.replace("15/9-", "15_9-") === a.usrop_file).map((a) => ({ id: a.anchor_id, mechanism: a.mechanism, eventIdx: Number(a.event_depth_m), quote: a.quote, note: a.operation_at_event })),
    ].filter((a) => a.eventIdx >= lo && a.eventIdx <= hi + 60);
    const isTime = rs[0].index_kind === "time_1900_days";
    const id = cfg.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    rows[id] = out;
    datasets.push({
      id, well, mechanism: rs[0].mechanism, indexKind: isTime ? "time_1900_days" : "depth_m", n: out.length, lo, hi, anchors,
      units: isTime ? { index: "s", indexLabel: "Time" } : { index: "m", indexLabel: "Depth (MD)" },
      name: cfg, field: "", scenario: "", scenarioTone: "info", labelTier: "", evidence: "",
      ...META[cfg],
    });
  }
  CACHE = { datasets, rows };
  return CACHE;
}
