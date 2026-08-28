import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, type Dataset, type ReplayRow } from "./api";

export const DEFAULT_DATASET_ID = "bilabri-heldout-bilabri-d2";
const BASE_MS = 260;
const TIER_RANK: Record<string, number> = { Normal: 0, Watch: 1, Elevated: 2, Action: 3 };
const TIER_SEV: Record<string, "high" | "medium" | "low"> = { Action: "high", Elevated: "medium", Watch: "low" };
const MECH_TITLE: Record<string, string> = {
  stuck_pipe: "Hole Drag / Stuck Pipe Risk", bit_wear: "Bit Wear Trend",
  stick_slip: "Stick-Slip Severity", pack_off: "Pack-Off Tendency",
};

export type ReplayAlert = { id: string; title: string; desc: string; at: string; idx: number; tier: string; sev: "high" | "medium" | "low" };

type Ctx = {
  catalog: Dataset[]; dataset: Dataset | null; rows: ReplayRow[];
  cursor: number; playing: boolean; speed: number; loading: boolean;
  current: ReplayRow | null;
  select: (id: string) => Promise<void>;
  play: () => void; pause: () => void; seek: (i: number) => void; setSpeed: (s: number) => void;
  jumpToEvent: () => void;
  fmtIdx: (idx: number) => string;
  alerts: ReplayAlert[];
  anchorLead: { anchorId: string; eventIdx: number; leadM: number | null; via: string | null } | null;
};

const ReplayCtx = createContext<Ctx | null>(null);

export function ReplayProvider({ children }: { children: React.ReactNode }) {
  const [catalog, setCatalog] = useState<Dataset[]>([]);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [rows, setRows] = useState<ReplayRow[]>([]);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const select = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const j = await api.replay(id);
      setDataset(j.dataset); setRows(j.rows); setCursor(0); setPlaying(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const c = await api.replayCatalog();
        setCatalog(c.datasets);
        await select(DEFAULT_DATASET_ID);
      } catch { /* backend offline — screens show an empty state */ }
    })();
  }, [select]);

  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (!playing || !rows.length) return;
    timer.current = setInterval(() => {
      setCursor((c) => (c >= rows.length - 1 ? (setPlaying(false), c) : c + 1));
    }, Math.max(30, BASE_MS / speed));
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing, speed, rows.length]);

  const fmtIdx = useCallback((idx: number) => {
    if (!dataset) return "";
    if (dataset.indexKind === "time_1900_days") return `${Math.round(idx)} s`;
    return `${Math.round(idx * 3.28084).toLocaleString()} ft`;
  }, [dataset]);

  const current = rows[cursor] ?? null;

  const alerts = useMemo<ReplayAlert[]>(() => {
    const out: ReplayAlert[] = [];
    let maxRank = 0;
    for (let i = 0; i <= cursor && i < rows.length; i++) {
      const r = rows[i]; const rank = TIER_RANK[r.tier] ?? 0;
      if (rank > maxRank) {
        out.push({
          id: `${dataset?.id}-${r.tier}-${i}`, tier: r.tier, sev: TIER_SEV[r.tier],
          idx: r.idx, at: fmtIdx(r.idx),
          title: `${MECH_TITLE[dataset?.mechanism ?? ""] ?? "Risk"} — ${r.tier}`,
          desc: `Fused risk ${Math.round(r.risk ?? 0)} · ${r.active.split("|").join(" + ")}`,
        });
        maxRank = rank;
      }
    }
    return out.reverse();
  }, [rows, cursor, dataset, fmtIdx]);

  const anchorLead = useMemo(() => {
    const a = dataset?.anchors[0];
    if (!a) return null;
    const inApproach = (r: ReplayRow, i: number) => i <= cursor && r.idx >= a.eventIdx - 200 && r.idx <= a.eventIdx;
    const firstTier = rows.find((r, i) => inApproach(r, i) && (TIER_RANK[r.tier] ?? 0) >= 1);
    const firstRf = rows.find((r, i) => inApproach(r, i) && (r.sb ?? 0) >= 0.99);
    const chosen = firstTier ?? firstRf;
    return { anchorId: a.id, eventIdx: a.eventIdx, via: firstTier ? "Fused" : firstRf ? "RF" : null, leadM: chosen ? Math.round(a.eventIdx - chosen.idx) : null };
  }, [dataset, rows, cursor]);

  const jumpToEvent = useCallback(() => {
    const a = dataset?.anchors[0];
    if (!a || !rows.length) return;
    const target = a.eventIdx - 80;
    let best = 0, bestD = Infinity;
    for (let i = 0; i < rows.length; i++) { const d = Math.abs(rows[i].idx - target); if (d < bestD) { bestD = d; best = i; } }
    setCursor(best); setPlaying(false);
  }, [dataset, rows]);

  const value: Ctx = {
    catalog, dataset, rows, cursor, playing, speed, loading, current,
    select, play: () => setPlaying(true), pause: () => setPlaying(false),
    seek: (i) => setCursor(Math.max(0, Math.min(i, rows.length - 1))),
    setSpeed, jumpToEvent, fmtIdx, alerts, anchorLead,
  };
  return <ReplayCtx.Provider value={value}>{children}</ReplayCtx.Provider>;
}

export function useReplay() {
  const c = useContext(ReplayCtx);
  if (!c) throw new Error("useReplay outside ReplayProvider");
  return c;
}
