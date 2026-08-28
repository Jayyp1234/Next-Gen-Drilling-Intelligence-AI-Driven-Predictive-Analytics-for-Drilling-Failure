"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Dataset, ReplayRow } from "./server";
import { apiUrl } from "@/lib/api/client";

export type ReplayAlert = {
  id: string; title: string; desc: string; at: string; idx: number;
  sev: "high" | "medium" | "low"; tier: string; acknowledged: boolean;
};

type State = {
  catalog: Dataset[];
  dataset: Dataset | null;
  rows: ReplayRow[];
  cursor: number;
  playing: boolean;
  speed: number;
  loading: boolean;
};
type Ctx = State & {
  select: (id: string | null) => Promise<void>;
  play: () => void; pause: () => void; seek: (i: number) => void; setSpeed: (s: number) => void;
  /** Seek to just before the documented event approach (for the guided demo / "Jump to event"). */
  jumpToEvent: () => void;
  hasEvent: boolean;
  current: ReplayRow | null;
  window: (n: number) => ReplayRow[];
  alerts: ReplayAlert[];
  acknowledge: (id?: string) => void;
  fmtIdx: (idx: number) => string;
  anchorLead: { anchorId: string; eventIdx: number; firstWatchIdx: number | null; via: string | null; leadM: number | null } | null;
};

const ReplayCtx = createContext<Ctx | null>(null);
const TIER_SEV: Record<string, "high" | "medium" | "low"> = { Action: "high", Elevated: "medium", Watch: "low" };
const TIER_RANK: Record<string, number> = { Normal: 0, Watch: 1, Elevated: 2, Action: 3 };
const MECH_TITLE: Record<string, string> = {
  stuck_pipe: "Hole Drag / Stuck Pipe Risk", bit_wear: "Bit Wear Trend", stick_slip: "Stick-Slip Severity", pack_off: "Pack-Off Tendency",
};
const BASE_MS = 400; // wall-clock per row at 1x
// The demo well: Bilabri D2 — documented stuck pipe, RF warned 50 m ahead.
export const DEFAULT_DATASET_ID = "bilabri-heldout-bilabri-d2";

export function ReplayProvider({ children }: { children: React.ReactNode }) {
  const [s, set] = useState<State>({ catalog: [], dataset: null, rows: [], cursor: 0, playing: false, speed: 10, loading: false });
  const [acked, setAcked] = useState<Set<string>>(new Set());
  const timer = useRef<number | null>(null);

  const select = useCallback(async (id: string | null) => {
    if (timer.current) window.clearInterval(timer.current);
    if (!id) { localStorage.removeItem("dg-replay-dataset"); set((p) => ({ ...p, dataset: null, rows: [], cursor: 0, playing: false })); return; }
    set((p) => ({ ...p, loading: true }));
    const j = await fetch(apiUrl(`/api/replay/${id}`)).then((r) => r.json());
    localStorage.setItem("dg-replay-dataset", id);
    setAcked(new Set());
    set((p) => ({ ...p, dataset: j.dataset, rows: j.rows, cursor: 0, playing: false, loading: false }));
  }, []);
  useEffect(() => {
    let alive = true;
    fetch(apiUrl("/api/replay-catalog")).then((r) => r.json()).then((j) => alive && set((p) => ({ ...p, catalog: j.datasets })));
    // Default to the D2 demo well so the app is never in an empty state.
    const saved = localStorage.getItem("dg-replay-dataset") ?? DEFAULT_DATASET_ID;
    // deferred so the restore does not run setState synchronously in the effect body
    const t = window.setTimeout(() => alive && select(saved), 0);
    return () => { alive = false; if (t) window.clearTimeout(t); };
  }, [select]);

  // Wall-clock transport: cursor = start + elapsed / msPerRow. Background tabs
  // throttle timers; deriving position from elapsed time means playback stays
  // true to the chosen speed instead of silently slowing down.
  const origin = useRef<{ t0: number; c0: number } | null>(null);
  useEffect(() => {
    if (timer.current) window.clearInterval(timer.current);
    if (!s.playing || !s.rows.length) { origin.current = null; return; }
    const msPerRow = Math.max(16, BASE_MS / s.speed);
    origin.current = { t0: performance.now(), c0: s.cursor };
    timer.current = window.setInterval(() => {
      const o = origin.current; if (!o) return;
      const target = o.c0 + Math.floor((performance.now() - o.t0) / msPerRow);
      set((p) => (target >= p.rows.length - 1 ? { ...p, cursor: p.rows.length - 1, playing: false } : target > p.cursor ? { ...p, cursor: target } : p));
    }, Math.min(200, msPerRow));
    return () => { if (timer.current) window.clearInterval(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cursor is read once at (re)start, not tracked
  }, [s.playing, s.speed, s.rows.length]);

  const fmtIdx = useCallback((idx: number) => {
    if (!s.dataset) return "";
    if (s.dataset.indexKind === "time_1900_days") {
      const d = new Date(Date.UTC(1899, 11, 30) + idx * 86400000);
      return d.toISOString().slice(11, 19);
    }
    return `${Math.round(idx * 3.28084).toLocaleString("en-US")} ft`;
  }, [s.dataset]);

  const current = s.rows[s.cursor] ?? null;
  const alerts = useMemo<ReplayAlert[]>(() => {
    const out: ReplayAlert[] = [];
    // Emit one alert per ESCALATION to a new severity high (Watch → Elevated → Action),
    // not on every oscillation — a clean escalation ladder rather than duplicate spam.
    let maxRank = 0;
    for (let i = 0; i <= s.cursor && i < s.rows.length; i++) {
      const r = s.rows[i]; const rank = TIER_RANK[r.tier] ?? 0;
      if (rank > maxRank) {
        const id = `${s.dataset?.id}-${r.tier}-${i}`;
        out.push({
          id, tier: r.tier, sev: TIER_SEV[r.tier], idx: r.idx, at: fmtIdx(r.idx), acknowledged: acked.has(id),
          title: `${MECH_TITLE[s.dataset?.mechanism ?? ""] ?? "Risk"} — ${r.tier}`,
          desc: `Fused risk ${Math.round(r.risk ?? 0)} (${r.active.split("|").join(" + ")} active)`,
        });
        maxRank = rank;
      }
    }
    return out.reverse();
  }, [s.rows, s.cursor, s.dataset, acked, fmtIdx]);

  const anchorLead = useMemo(() => {
    const a = s.dataset?.anchors[0];
    if (!a) return null;
    const inApproach = (r: ReplayRow, i: number) => i <= s.cursor && r.idx >= a.eventIdx - 200 && r.idx <= a.eventIdx;
    // fused tier warning (Watch+) OR the RF channel crossing its 99th pct (S_baseline>=0.99):
    // on the Bilabri stuck-pipe fold the documented lead lives in the RF channel, not the
    // fused tier — surface whichever the pipeline actually produced, honestly labelled.
    const firstTier = s.rows.find((r, i) => inApproach(r, i) && (TIER_RANK[r.tier] ?? 0) >= 1);
    const firstRf = s.rows.find((r, i) => inApproach(r, i) && (r.sb ?? 0) >= 0.99);
    const chosen = firstTier ?? firstRf;
    const via = firstTier ? "fused" : firstRf ? "RF" : null;
    return { anchorId: a.id, eventIdx: a.eventIdx, firstWatchIdx: chosen?.idx ?? null, via, leadM: chosen ? Math.round(a.eventIdx - chosen.idx) : null };
  }, [s.dataset, s.rows, s.cursor]);

  const value: Ctx = {
    ...s, select, current, alerts, fmtIdx, anchorLead,
    play: () => set((p) => ({ ...p, playing: true, cursor: p.cursor >= p.rows.length - 1 ? 0 : p.cursor })),
    pause: () => set((p) => ({ ...p, playing: false })),
    seek: (i) => set((p) => ({ ...p, cursor: Math.max(0, Math.min(i, p.rows.length - 1)) })),
    setSpeed: (speed) => set((p) => ({ ...p, speed })),
    hasEvent: (s.dataset?.anchors.length ?? 0) > 0,
    jumpToEvent: () => set((p) => {
      const a = p.dataset?.anchors[0];
      if (!a || !p.rows.length) return p;
      // Land ~80 m before the documented event so the approach + warning are visible on play.
      const target = a.eventIdx - 80;
      let best = 0, bestD = Infinity;
      for (let i = 0; i < p.rows.length; i++) {
        const d = Math.abs(p.rows[i].idx - target);
        if (d < bestD) { bestD = d; best = i; }
      }
      return { ...p, cursor: best, playing: false };
    }),
    window: (n) => s.rows.slice(Math.max(0, s.cursor - n + 1), s.cursor + 1),
    acknowledge: (id) => setAcked((prev) => new Set(id ? [...prev, id] : [...prev, ...alerts.map((a) => a.id)])),
  };
  return <ReplayCtx.Provider value={value}>{children}</ReplayCtx.Provider>;
}

export function useReplay() {
  const c = useContext(ReplayCtx);
  if (!c) throw new Error("useReplay outside ReplayProvider");
  return c;
}
