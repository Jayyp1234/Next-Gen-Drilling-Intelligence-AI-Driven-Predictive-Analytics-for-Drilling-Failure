/**
 * Real per-well metrics derived from the loaded replay dataset — the mobile mirror of
 * the web's screens.tsx computeCore. Everything here is MEASURED from the replay rows
 * (or reconstructed via Σ dz/ROP); nothing is fabricated. Returns null with no dataset.
 */
import { useMemo } from "react";
import { useReplay } from "./replay";
import type { ReplayRow, Dataset } from "./api";

const FT = 3.280840;
const TIER_RANK: Record<string, number> = { Normal: 0, Watch: 1, Elevated: 2, Action: 3 };

export const fmt = (n: number, dp = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

function meanOf(rows: ReplayRow[], sel: (r: ReplayRow) => number | null | undefined): number | null {
  let s = 0, n = 0;
  for (const r of rows) { const v = sel(r); if (v != null && Number.isFinite(v)) { s += v; n++; } }
  return n ? s / n : null;
}

export type DailyRow = { day: number; depthFt: number; footageFt: number; rop: number; hours: number; onPlan: boolean };

export type Derived = {
  well: string; field: string; mechanism: string; isDepth: boolean;
  loFt: number; hiFt: number; footageFt: number;
  avg: Record<"rop" | "wob" | "torque" | "spp" | "rpm" | "flow" | "mse", number | null>;
  hours: number; days: number; onBottomPct: number;
  ropBins: { depthFt: number; rop: number }[];
  depthCurve: { h: number; depthFt: number }[];
  daily: DailyRow[];
  maxTier: string; meanRisk: number;
};

function compute(ds: Dataset, rows: ReplayRow[]): Derived {
  const isDepth = ds.indexKind === "depth_m";
  const toFt = isDepth ? FT : 1;
  const loFt = ds.lo * toFt, hiFt = ds.hi * toFt;
  const footageFt = Math.max(0, hiFt - loFt);

  const avg = {
    rop: meanOf(rows, (r) => r.ch.rop), wob: meanOf(rows, (r) => r.ch.wob),
    torque: meanOf(rows, (r) => r.ch.torque), spp: meanOf(rows, (r) => r.ch.spp),
    rpm: meanOf(rows, (r) => r.ch.rpm), flow: meanOf(rows, (r) => r.ch.flow),
    mse: meanOf(rows, (r) => r.ch.mse),
  };

  const sorted = [...rows].sort((a, b) => a.idx - b.idx);
  let hours = 0;
  const depthCurve: { h: number; depthFt: number }[] = [];
  const daily: DailyRow[] = [];
  let acc = 0, dayStartFt = loFt, ropSum = 0, ropN = 0, day = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && isDepth) {
      const dzM = Math.min(3, Math.max(0, sorted[i].idx - sorted[i - 1].idx));
      const rop = sorted[i].ch.rop;
      if (rop && rop > 0) { const h = (dzM * FT) / rop; hours += h; acc += h; ropSum += rop; ropN++; }
    }
    depthCurve.push({ h: hours, depthFt: sorted[i].idx * toFt });
    if (isDepth && (acc >= 24 || i === sorted.length - 1) && i > 0) {
      const endFt = sorted[i].idx * FT;
      const avgRop = ropN ? Math.round(ropSum / ropN) : 0;
      daily.push({ day, depthFt: Math.round(endFt), footageFt: Math.round(endFt - dayStartFt), rop: avgRop, hours: +acc.toFixed(1), onPlan: avgRop >= (avg.rop ?? 0) });
      day++; acc = 0; dayStartFt = endFt; ropSum = 0; ropN = 0;
    }
  }
  const days = hours / 24;
  const onBottomPct = (meanOf(rows, (r) => r.onb) ?? 0) * 100;

  const ropBins: { depthFt: number; rop: number }[] = [];
  if (isDepth && footageFt > 0) {
    const N = 24, binM = (ds.hi - ds.lo) / N;
    for (let b = 0; b < N; b++) {
      const lo = ds.lo + b * binM, hi = lo + binM;
      const rop = meanOf(rows.filter((r) => r.idx >= lo && r.idx < hi), (r) => r.ch.rop);
      if (rop != null) ropBins.push({ depthFt: Math.round(lo * FT), rop: Math.round(rop) });
    }
  }

  let maxTier = "Normal";
  for (const r of rows) if ((TIER_RANK[r.tier] ?? 0) > (TIER_RANK[maxTier] ?? 0)) maxTier = r.tier;
  const meanRisk = meanOf(rows, (r) => r.risk) ?? 0;

  return { well: ds.well, field: ds.field, mechanism: ds.mechanism, isDepth, loFt, hiFt, footageFt, avg, hours, days, onBottomPct, ropBins, depthCurve, daily, maxTier, meanRisk };
}

export function useDerived(): Derived | null {
  const r = useReplay();
  return useMemo(() => (r.dataset && r.rows.length ? compute(r.dataset, r.rows) : null), [r.dataset, r.rows]);
}
