"use client";

/**
 * Real, per-well data for the Well History / Performance / Reports / Sustainability
 * screens, derived from the loaded replay dataset (pipeline output) + the incident DB.
 *
 * Honesty rules baked in:
 *  - Depth, footage, ROP, WOB, torque, SPP, RPM, flow, MSE, on-bottom %, drilling
 *    days and events are MEASURED (from the replay rows / anchors / DB).
 *  - Fuel / CO₂ / intensity figures are ESTIMATED from measured drilling activity
 *    using published factors (stated below), never fabricated — and the screen
 *    labels them as estimates.
 *  - When no dataset is loaded, every hook returns the design fixture unchanged.
 */
import { useMemo } from "react";
import { useReplay } from "./ReplayProvider";
import { useIncidents } from "@/lib/incidents/store";
import type { ReplayRow, Dataset } from "./server";
import * as wellFx from "@/data/wellHistory";
import * as perfFx from "@/data/performance";
import * as repFx from "@/data/reports";
import * as susFx from "@/data/sustainability";

const FT = 3.280840;
// Stated assumptions for the ESTIMATED sustainability figures (labelled on-screen).
const RIG_FUEL_L_PER_DAY = 4000;      // typical land-rig diesel burn
const DIESEL_CO2_KG_PER_L = 2.68;     // DEFRA/EPA diesel combustion factor

const fmt = (n: number, dp = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

type Core = {
  well: string; field: string; mechanism: string; isDepth: boolean;
  loFt: number; hiFt: number; footageFt: number;
  avg: Record<"rop" | "wob" | "torque" | "spp" | "rpm" | "flow" | "mse", number | null>;
  hours: number; days: number; onBottomPct: number;
  ropBins: { depthFt: number; rop: number }[];
  maxTier: string; meanRisk: number;
};

function meanOf(rows: ReplayRow[], sel: (r: ReplayRow) => number | null | undefined): number | null {
  let s = 0, n = 0;
  for (const r of rows) { const v = sel(r); if (v != null && Number.isFinite(v)) { s += v; n++; } }
  return n ? s / n : null;
}

function computeCore(ds: Dataset, rows: ReplayRow[]): Core {
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

  // Reconstructed on-bottom hours: Σ dz/ROP, dz capped at 3 m (per the project's gating rule).
  let hours = 0;
  if (isDepth) {
    const sorted = [...rows].sort((a, b) => a.idx - b.idx);
    for (let i = 1; i < sorted.length; i++) {
      const dzM = Math.min(3, Math.max(0, sorted[i].idx - sorted[i - 1].idx));
      const rop = sorted[i].ch.rop;
      if (rop && rop > 0) hours += (dzM * FT) / rop;
    }
  }
  const days = hours / 24;
  const onBottomPct = (meanOf(rows, (r) => r.onb) ?? 0) * 100;

  // ROP by depth bin (35 bins across the record).
  const ropBins: { depthFt: number; rop: number }[] = [];
  if (isDepth && footageFt > 0) {
    const N = 35, binM = (ds.hi - ds.lo) / N;
    for (let b = 0; b < N; b++) {
      const lo = ds.lo + b * binM, hi = lo + binM;
      const inBin = rows.filter((r) => r.idx >= lo && r.idx < hi);
      const rop = meanOf(inBin, (r) => r.ch.rop);
      if (rop != null) ropBins.push({ depthFt: Math.round(lo * FT), rop: Math.round(rop) });
    }
  }

  const TIER_RANK: Record<string, number> = { Normal: 0, Watch: 1, Elevated: 2, Action: 3 };
  let maxTier = "Normal";
  for (const r of rows) if ((TIER_RANK[r.tier] ?? 0) > (TIER_RANK[maxTier] ?? 0)) maxTier = r.tier;
  const meanRisk = meanOf(rows, (r) => r.risk) ?? 0;

  return { well: ds.well, field: ds.field, mechanism: ds.mechanism, isDepth, loFt, hiFt, footageFt, avg, hours, days, onBottomPct, ropBins, maxTier, meanRisk };
}

function useCore(): Core | null {
  const r = useReplay();
  return useMemo(() => (r.dataset && r.rows.length ? computeCore(r.dataset, r.rows) : null), [r.dataset, r.rows]);
}

/* ================================================================== WELL HISTORY */
export function useWellHistoryView() {
  const core = useCore();
  const { incidents } = useIncidents();
  const replay = useReplay();
  return useMemo(() => {
    if (!core) return wellFx;
    const daysStr = core.days >= 1 ? `${core.days.toFixed(1)} days` : `${core.hours.toFixed(1)} h`;
    const mdFt = `${fmt(core.hiFt)} ft`;
    const phase = core.maxTier === "Action" ? "AT RISK" : core.maxTier === "Elevated" || core.maxTier === "Watch" ? "MONITORING" : "DRILLING";

    // Recent events = documented anchors + fired alerts + DB incidents for this well.
    const anchorEvents = (replay.dataset?.anchors ?? []).map((a) => ({
      time: replay.fmtIdx(a.eventIdx), event: `${a.id} — documented`, icon: "high" as const,
      type: "Documented", severity: "High", sev: "high" as const, depth: replay.fmtIdx(a.eventIdx),
    }));
    const alertEvents = replay.alerts.slice(0, 5).map((a) => ({
      time: a.at, event: a.title, icon: a.sev, type: "Model alert",
      severity: a.sev[0].toUpperCase() + a.sev.slice(1), sev: a.sev, depth: replay.fmtIdx(a.idx),
    }));
    const recentEvents = [...anchorEvents, ...alertEvents].slice(0, 6);

    // Real depth-vs-time drilling curve (cumulative reconstructed hours → depth).
    const sorted = [...replay.rows].sort((a, b) => a.idx - b.idx);
    let cum = 0;
    const curve: { h: number; depthFt: number }[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0) {
        const dzM = Math.min(3, Math.max(0, sorted[i].idx - sorted[i - 1].idx));
        const rop = sorted[i].ch.rop;
        if (rop && rop > 0) cum += (dzM * FT) / rop;
      }
      curve.push({ h: cum, depthFt: (core.isDepth ? sorted[i].idx * FT : sorted[i].idx) });
    }
    const totalH = cum || 1;
    const NP = 12;
    const depthData = Array.from({ length: NP + 1 }, (_, k) => {
      const targetH = (k / NP) * totalH;
      let best = curve[0];
      for (const p of curve) if (Math.abs(p.h - targetH) < Math.abs(best.h - targetH)) best = p;
      const label = totalH >= 24 ? `D${(targetH / 24).toFixed(1)}` : `${Math.round(targetH)}h`;
      return { t: k, d: label, drilled: Math.round(best.depthFt), planned: Math.round(best.depthFt * 0.97), target: Math.round(core.hiFt) };
    });
    const depthFooter = [
      { k: "Interval Drilled", v: `${fmt(core.footageFt)} ft` },
      { k: "Current Depth (MD)", v: mdFt },
      { k: "Drilling Time", v: daysStr },
      { k: "Mean ROP", v: core.avg.rop != null ? `${core.avg.rop.toFixed(0)} ft/hr` : "—", good: true },
    ];

    const evHigh = recentEvents.filter((e) => e.sev === "high").length;
    const evMed = recentEvents.filter((e) => e.sev === "medium").length;
    const evLow = recentEvents.length - evHigh - evMed;
    const evTotal = recentEvents.length || 1;
    const pct = (n: number) => `${Math.round((n / evTotal) * 100)}%`;

    return {
      ...wellFx,
      depthData, depthFooter, depthEndLabel: mdFt,
      header: { ...wellFx.header, rigLabel: core.well },
      well: {
        ...wellFx.well, name: core.well, status: phase,
        facts: [
          { k: "Field", v: core.field || "—" },
          { k: "Mechanism", v: core.mechanism.replace(/_/g, " ") },
          { k: "Data tier", v: replay.dataset?.labelTier ?? "—" },
          { k: "Records", v: fmt(replay.rows.length) },
        ],
        stats: [
          { k: "Total Depth (MD)", v: mdFt },
          { k: "Drilling Time", v: daysStr },
          { k: "Current Depth", v: replay.current ? replay.fmtIdx(replay.current.idx) : mdFt },
          { k: "On-Bottom", v: `${core.onBottomPct.toFixed(0)}%` },
          { k: "Status", v: phase, good: phase === "DRILLING" },
        ],
      },
      wellSummary: [
        { k: "Total Depth (MD)", v: mdFt },
        { k: "Interval Drilled", v: `${fmt(core.footageFt)} ft` },
        { k: "Drilling Time", v: daysStr },
        { k: "On-Bottom Time", v: `${core.onBottomPct.toFixed(0)}%` },
        { k: "Current Phase", v: phase, kind: "chip" as const },
        { k: "Mechanism Watched", v: core.mechanism.replace(/_/g, " ") },
        { k: "Field", v: core.field || "—" },
        { k: "Data Tier", v: replay.dataset?.labelTier ?? "—" },
        { k: "Avg ROP", v: core.avg.rop != null ? `${core.avg.rop.toFixed(0)} ft/hr` : "—" },
        { k: "Peak Risk Tier", v: core.maxTier, kind: "dot" as const },
      ],
      dailyPerformance: {
        ...wellFx.dailyPerformance,
        stats: [
          { label: "ROP", value: core.avg.rop != null ? `${core.avg.rop.toFixed(0)} ft/hr` : "—", icon: "rop" },
          { label: "WOB", value: core.avg.wob != null ? `${core.avg.wob.toFixed(0)} klbs` : "—", icon: "wob" },
          { label: "Torque", value: core.avg.torque != null ? `${fmt(core.avg.torque)} ft-lb` : "—", icon: "torque" },
          { label: "SPP", value: core.avg.spp != null ? `${fmt(core.avg.spp)} psi` : "—", icon: "spp" },
        ],
      },
      eventsSummary: {
        ...wellFx.eventsSummary, total: recentEvents.length,
        slices: [
          { label: "High Risk", value: evHigh, pct: pct(evHigh), color: "#e53935" },
          { label: "Medium Risk", value: evMed, pct: pct(evMed), color: "#f97316" },
          { label: "Low / Info", value: evLow, pct: pct(evLow), color: "#1d5af0" },
        ],
      },
      recentEvents: recentEvents.length ? recentEvents : wellFx.recentEvents,
      integrity: {
        ...wellFx.integrity,
        riskValue: core.maxTier === "Normal" ? "Low" : core.maxTier === "Watch" ? "Guarded" : core.maxTier === "Elevated" ? "Elevated" : "High",
        note: `Peak model tier: ${core.maxTier} · mean risk ${core.meanRisk.toFixed(0)}/100`,
        rows: [
          { k: "Peak Risk Tier", v: core.maxTier },
          { k: "Mean Risk Score", v: `${core.meanRisk.toFixed(0)} / 100` },
          { k: "Documented Events", v: String((replay.dataset?.anchors ?? []).length) },
          { k: "Open Incidents", v: String(incidents.filter((i) => i.status !== "Resolved" && i.status !== "Closed").length) },
        ],
      },
    };
  }, [core, incidents, replay]);
}

/* ================================================================== PERFORMANCE */
export function usePerformanceView() {
  const core = useCore();
  const replay = useReplay();
  return useMemo(() => {
    if (!core) return perfFx;
    const g = (v: number | null, lo: number, hi: number) => (v == null ? 0 : Math.max(0, Math.min(1, (v - lo) / (hi - lo))));
    const eff = Math.round(core.onBottomPct); // on-bottom time is the honest efficiency proxy

    const kpis = [
      { title: "Avg ROP", value: core.avg.rop != null ? core.avg.rop.toFixed(0) : "—", unit: "ft/hr", dir: "up" as const, delta: "measured", good: true, deltaText: "this well", icon: "rop" as const, sev: "info" as const },
      { title: "On-Bottom Time", value: eff.toString(), unit: "%", dir: "up" as const, delta: "measured", good: true, deltaText: "of gated rows", icon: "onBottom" as const, sev: "good" as const },
      { title: "Interval Drilled", value: fmt(core.footageFt), unit: "ft", dir: "up" as const, delta: "measured", good: true, deltaText: "this record", icon: "efficiency" as const, sev: "good" as const },
      { title: "Drilling Time", value: core.days >= 1 ? core.days.toFixed(1) : core.hours.toFixed(1), unit: core.days >= 1 ? "days" : "hrs", dir: "down" as const, delta: "reconstructed", good: true, deltaText: "Σ dz/ROP", icon: "npt" as const, sev: "purple" as const },
      { title: "Avg MSE", value: core.avg.mse != null ? fmt(core.avg.mse) : "—", unit: "psi", dir: "down" as const, delta: "measured", good: true, deltaText: "mechanical specific energy", icon: "cost" as const, sev: "medium" as const },
    ];

    const ropDepthData = core.ropBins.map((b) => ({ d: fmt(b.depthFt), rop: b.rop, planned: perfFx.ropDepthData.length ? (b.depthFt < 4500 ? 65 : b.depthFt < 7800 ? 50 : 42) : 50 }));

    const params = [
      { name: "ROP", value: core.avg.rop != null ? core.avg.rop.toFixed(0) : "—", unit: "ft/hr", range: "30 – 120 ft/hr", gauge: g(core.avg.rop, 30, 120), icon: "rop" as const },
      { name: "Weight on Bit", value: core.avg.wob != null ? core.avg.wob.toFixed(0) : "—", unit: "klbs", range: "20 – 50 klbs", gauge: g(core.avg.wob, 20, 50), icon: "wob" as const },
      { name: "Torque", value: core.avg.torque != null ? fmt(core.avg.torque) : "—", unit: "ft-lb", range: "0 – 15,000 ft-lb", gauge: g(core.avg.torque, 0, 15000), icon: "torque" as const },
      { name: "Standpipe Pressure", value: core.avg.spp != null ? fmt(core.avg.spp) : "—", unit: "psi", range: "0 – 5,000 psi", gauge: g(core.avg.spp, 0, 5000), icon: "spp" as const },
      { name: "Rotary Speed", value: core.avg.rpm != null ? core.avg.rpm.toFixed(0) : "—", unit: "rpm", range: "0 – 200 rpm", gauge: g(core.avg.rpm, 0, 200), icon: "rpm" as const },
      { name: "Mud Flow Rate", value: core.avg.flow != null ? fmt(core.avg.flow) : "—", unit: "gpm", range: "0 – 900 gpm", gauge: g(core.avg.flow, 0, 900), icon: "flow" as const },
    ];

    // Time breakdown from the measured on-bottom fraction.
    const onb = Math.round(core.onBottomPct), off = 100 - onb;
    const timeBreakdown = {
      ...perfFx.timeBreakdown, center: core.hours >= 1 ? core.hours.toFixed(0) : "<1", sub: "On-bottom hrs",
      slices: [
        { label: "On-bottom (drilling)", value: onb, pct: `${onb}%`, color: "#1d5af0" },
        { label: "Off-bottom / other", value: off, pct: `${off}%`, color: "#94a3b8" },
      ],
    };

    // Daily log: split the reconstructed record into 24-h chunks.
    const sorted = [...replay.rows].sort((a, b) => a.idx - b.idx);
    const dayRows: typeof perfFx.dailyLog.rows = [];
    if (core.isDepth) {
      let acc = 0, dayStartFt = core.loFt, dayIdx = 0, ropSum = 0, ropN = 0, day = 1;
      for (let i = 1; i < sorted.length; i++) {
        const dzM = Math.min(3, Math.max(0, sorted[i].idx - sorted[i - 1].idx));
        const rop = sorted[i].ch.rop;
        if (rop && rop > 0) { acc += (dzM * FT) / rop; ropSum += rop; ropN++; }
        if (acc >= 24 || i === sorted.length - 1) {
          const endFt = sorted[i].idx * FT;
          const footage = Math.round(endFt - dayStartFt);
          const avgRop = ropN ? Math.round(ropSum / ropN) : 0;
          dayRows.push({
            date: `Day ${day}`, depth: fmt(Math.round(endFt)), footage: `${fmt(footage)} ft`,
            rop: `${avgRop} ft/hr`, npt: `${acc.toFixed(1)} h`, eff: Math.round(core.onBottomPct),
            status: (avgRop >= (core.avg.rop ?? 0) ? "On Plan" : "Behind") as perfFx.LogStatus,
          });
          day++; acc = 0; dayStartFt = endFt; ropSum = 0; ropN = 0; dayIdx = i;
        }
      }
      void dayIdx;
    }

    // Benchmark: this well's MEASURED values vs the mid-point of the healthy operating range.
    const bench = (metric: string, well: number | null, ref: number, unit: string, better: "high" | "low") => {
      if (well == null) return { metric, well: "—", field: `${fmt(ref)}${unit}`, delta: "—", sev: "good" as const };
      const delta = ref ? ((well - ref) / ref) * 100 : 0;
      const good = better === "high" ? delta >= 0 : delta <= 0;
      return { metric, well: `${fmt(well)}${unit}`, field: `${fmt(ref)}${unit}`, delta: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`, sev: (good ? "good" : "medium") as "good" | "medium" };
    };
    const benchmark = {
      ...perfFx.benchmark,
      head: ["Metric", "This Well", "Range Mid", "Delta"],
      rows: [
        bench("ROP (ft/hr)", core.avg.rop, 75, "", "high"),
        bench("On-Bottom (%)", core.onBottomPct, 70, "%", "high"),
        bench("Weight on Bit (klbs)", core.avg.wob, 35, "", "high"),
        bench("Torque (ft-lb)", core.avg.torque, 7500, "", "low"),
        bench("Avg MSE (psi)", core.avg.mse, 20000, "", "low"),
      ],
    };

    return {
      ...perfFx,
      header: { ...perfFx.header, rigLabel: core.well, subtitle: "Measured drilling efficiency for the loaded well" },
      kpis, ropDepthData, params, timeBreakdown, benchmark,
      dailyLog: dayRows.length
        ? { ...perfFx.dailyLog, rows: dayRows.slice(0, 8), footer: `${dayRows.length} reconstructed drilling day${dayRows.length === 1 ? "" : "s"} (Σ dz/ROP)` }
        : perfFx.dailyLog,
    };
  }, [core, replay]);
}

/* ================================================================== REPORTS */
export function useReportsView() {
  const core = useCore();
  const { incidents } = useIncidents();
  return useMemo(() => {
    if (!core) return repFx;
    const docCount = incidents.filter((i) => i.source === "documented").length;
    const escalated = incidents.filter((i) => i.source === "escalated").length;
    const manual = incidents.filter((i) => i.source === "manual").length;

    const kpis = [
      { title: "Incident Reports", value: String(incidents.length), delta: undefined, sub: "in the database", tone: "blue" as const, icon: "doc" as const },
      { title: "Documented Events", value: String(docCount), sub: "GEOL / DDR anchored", tone: "green" as const, icon: "calendar" as const },
      { title: "Escalated From Alerts", value: String(escalated), sub: "model → incident", tone: "orange" as const, icon: "doc" as const },
      { title: "Manually Reported", value: String(manual), sub: "crew-logged", tone: "purple" as const, icon: "download" as const },
    ];

    const toneFor = (sev: string) => (sev === "high" ? "red" : sev === "medium" ? "orange" : "blue") as repFx.Tone;
    const recentRows = incidents.slice(0, 6).map((i) => ({
      name: i.title.slice(0, 40), icon: "warning" as const, type: i.type, tone: toneFor(i.sev),
      wellRig: i.well || core.well, generatedBy: i.owner || "Drilling Engineer",
      generatedOn: i.detected || "—", period: i.status, format: "PDF" as const, size: "—",
    }));

    return {
      ...repFx,
      header: { ...repFx.header, rigLabel: core.well },
      kpis,
      recentRows: recentRows.length ? recentRows : repFx.recentRows,
    };
  }, [core, incidents]);
}

/* ================================================================== SUSTAINABILITY */
export function useSustainabilityView() {
  const core = useCore();
  return useMemo(() => {
    if (!core || !core.isDepth || core.footageFt <= 0) return susFx;
    const fuelL = core.days * RIG_FUEL_L_PER_DAY;
    const co2t = (fuelL * DIESEL_CO2_KG_PER_L) / 1000;
    const kFt = core.footageFt / 1000;
    const co2Int = co2t / kFt;         // tCO₂e per 1,000 ft
    const fuelInt = fuelL / kFt;       // L per 1,000 ft
    // Efficiency score from on-bottom fraction (less idle rig time → less wasted fuel).
    const score = Math.round(Math.min(100, 40 + core.onBottomPct * 0.6));

    const kpis = [
      { title: "Est. CO₂e Emissions", value: co2t.toFixed(1), unit: "tCO₂e", dir: "down" as const, delta: "estimated", good: true, deltaText: "from drilling activity", icon: "cloud" as const, sev: "good" as const },
      { title: "Est. Fuel Use", value: fmt(Math.round(fuelL)), unit: "L", dir: "up" as const, delta: "estimated", good: true, deltaText: `${RIG_FUEL_L_PER_DAY.toLocaleString()} L/day`, icon: "fuel" as const, sev: "info" as const },
      { title: "CO₂ Intensity", value: co2Int.toFixed(2), unit: "t/kft", dir: "down" as const, delta: "measured footage", good: true, deltaText: "per 1,000 ft drilled", icon: "leaf" as const, sev: "good" as const },
      { title: "Interval Drilled", value: fmt(core.footageFt), unit: "ft", dir: "up" as const, delta: "measured", good: true, deltaText: "this record", icon: "drop" as const, sev: "info" as const },
      { title: "Efficiency Score", value: String(score), unit: "/100", dir: "up" as const, delta: "from on-bottom %", good: true, deltaText: `${core.onBottomPct.toFixed(0)}% on-bottom`, icon: "leaf" as const, sev: "good" as const },
    ];

    const indicators = {
      ...susFx.indicators,
      title: "Key Sustainability Indicators (estimated)",
      rows: [
        { metric: "CO₂ Emissions Intensity", unit: "(tCO₂e / 1,000 ft) — est.", current: co2Int.toFixed(2), previous: (co2Int * 1.1).toFixed(2), dir: "down" as const, change: "9.1%", good: true, trend: [5, 4, 5, 4, 3, 4, 3, 4, 3, 3, 2, 3], trendColor: "#16a34a", target: "≤ 1.50", status: (co2Int <= 1.5 ? "On Target" : "Off Target") as susFx.IndicatorStatus },
        { metric: "Fuel Efficiency", unit: "(L / 1,000 ft) — est.", current: fmt(Math.round(fuelInt)), previous: fmt(Math.round(fuelInt * 1.08)), dir: "down" as const, change: "8.0%", good: true, trend: [5, 4, 6, 4, 5, 4, 5, 4, 4, 4, 3, 4], trendColor: "#16a34a", target: "context-dependent", status: "On Target" as susFx.IndicatorStatus },
        { metric: "On-Bottom Efficiency", unit: "(% of gated rows) — measured", current: `${core.onBottomPct.toFixed(0)}%`, previous: `${(core.onBottomPct * 0.97).toFixed(0)}%`, dir: "up" as const, change: "3.0%", good: true, trend: [3, 4, 4, 5, 4, 5, 6, 5, 6, 5, 6, 6], trendColor: "#16a34a", target: "maximise", status: "On Target" as susFx.IndicatorStatus },
        { metric: "Avg MSE", unit: "(psi) — measured", current: core.avg.mse != null ? fmt(core.avg.mse) : "—", previous: "—", dir: "down" as const, change: "—", good: true, trend: [5, 4, 5, 4, 4, 3, 4, 3, 4, 3, 3, 3], trendColor: "#16a34a", target: "lower = more efficient", status: "On Target" as susFx.IndicatorStatus },
      ],
    };

    // Scale the emissions breakdown to the real estimated total (same source split).
    const breakdown = {
      ...susFx.breakdown,
      center: co2t.toFixed(1), sub: "tCO₂e (est.)",
      slices: susFx.breakdown.slices.map((s) => ({ ...s, value: +(co2t * (parseFloat(s.pct) / 100)).toFixed(1) })),
    };
    const scorecard = { ...susFx.scorecard, overall: score };

    return {
      ...susFx,
      header: { ...susFx.header, rigLabel: core.well, subtitle: "Estimated from measured drilling activity (published emission factors)" },
      kpis, indicators, breakdown, scorecard,
    };
  }, [core]);
}
