"use client";

/**
 * Adapter: turns the replay stream into the exact shapes the Live Monitoring
 * design renders, so the page stays design-faithful whether it is showing
 * fixtures (no dataset loaded) or REAL pipeline output (replay active).
 */
import * as fx from "@/data/liveMonitoring";
import { useReplay, type ReplayAlert } from "./ReplayProvider";
import type { ReplayRow } from "./server";

const scoreLabel = (v: number) => (v < 40 ? "LOW RISK" : v < 70 ? "MODERATE" : "HIGH RISK");

const fmt = (v: number | undefined, d = 0) => (v === undefined || !Number.isFinite(v) ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: d }));
const gaugePos = (v: number | undefined, lo: number, hi: number) => (v === undefined ? 0.5 : Math.max(0.02, Math.min(0.98, (v - lo) / (hi - lo))));

export function useLiveView() {
  const r = useReplay();
  if (!r.dataset || !r.current) return { replay: false as const, ...fx, replayAlerts: [] as ReplayAlert[], r };

  const cur = r.current;
  const win = r.window(60);
  const riskNow = Math.round(cur.risk ?? 0);
  const risk30 = r.rows[Math.max(0, r.cursor - 30)]?.risk ?? cur.risk ?? 0;
  const delta = Math.round((cur.risk ?? 0) - risk30);
  const isEos = r.dataset.indexKind === "time_1900_days";

  const params = isEos
    ? [
        { name: "Collar RPM", value: fmt(cur.ch.crpm), unit: "rpm", range: "60 – 180 rpm", gauge: gaugePos(cur.ch.crpm, 0, 200), icon: "torque" },
        { name: "Stick-Slip (STICK)", value: fmt(cur.ch.stick), unit: "c/min", range: "instrument", gauge: gaugePos(cur.ch.stick, 0, 400), icon: "rop" },
        { name: "ECD", value: fmt(cur.ch.ecd, 3), unit: "sg", range: "1.0 – 2.0 sg", gauge: gaugePos(cur.ch.ecd, 1.0, 2.0), icon: "flow" },
        { name: "Annulus Pressure", value: fmt(cur.ch.dhap), unit: "bar", range: "downhole (RM)", gauge: gaugePos(cur.ch.dhap, 0, 500), icon: "spp" },
        { name: "S_baseline (RF)", value: fmt((cur.sb ?? 0) * 100), unit: "pct", range: "0 – 100", gauge: cur.sb ?? 0, icon: "hook" },
        { name: "S_LSTM", value: fmt((cur.sl ?? 0) * 100), unit: "pct", range: "0 – 100", gauge: cur.sl ?? 0, icon: "wob" },
        { name: "S_DTW", value: fmt((cur.sd ?? 0) * 100), unit: "pct", range: "0 – 100", gauge: cur.sd ?? 0, icon: "gas" },
      ]
    : [
        { name: "Hookload", value: fmt(cur.ch.hookload), unit: "klbs", range: "80 – 180 klbs", gauge: gaugePos(cur.ch.hookload, 0, 250), icon: "hook" },
        { name: "Torque", value: fmt(cur.ch.torque), unit: "ft-lb", range: "surface", gauge: gaugePos(cur.ch.torque, 0, 25000), icon: "torque" },
        { name: "Standpipe Pressure", value: fmt(cur.ch.spp), unit: "psi", range: "200 – 6,000 psi", gauge: gaugePos(cur.ch.spp, 0, 5000), icon: "spp" },
        { name: "ROP", value: fmt(cur.ch.rop), unit: "ft/hr", range: "0 – 500 ft/hr", gauge: gaugePos(cur.ch.rop, 0, 400), icon: "rop" },
        { name: "Weight on Bit", value: fmt(cur.ch.wob, 1), unit: "klbs", range: "0 – 60 klbs", gauge: gaugePos(cur.ch.wob, 0, 50), icon: "wob" },
        { name: "Mud Flow Rate", value: fmt(cur.ch.flow), unit: "gpm", range: "50 – 1,500 gpm", gauge: gaugePos(cur.ch.flow, 0, 1400), icon: "flow" },
        { name: "MSE", value: fmt(cur.ch.mse), unit: "psi", range: "Teale, surface torque", gauge: gaugePos(cur.ch.mse, 0, 100000), icon: "gas" },
      ];

  const scale = (v: number | null | undefined) => (v === null || v === undefined ? null : Math.round(v * 1000) / 10);
  const trendData = win.map((w: ReplayRow, i: number) => ({
    t: i, risk: Math.round(w.risk ?? 0), rf: scale(w.sb) ?? 0, lstm: scale(w.sl) ?? 0, dtw: scale(w.sd) ?? 0,
  }));
  const last = win[win.length - 1];
  const finite = win.filter((w) => w.risk !== null).length;

  return {
    replay: true as const, r,
    risk: { score: riskNow, label: scoreLabel(riskNow), delta: `${Math.abs(delta)} pts`, deltaText: `vs 30 rows ago (${delta >= 0 ? "up" : "down"})` },
    kpis: {
      state: { value: cur.onb ? "DRILLING" : "OFF BOTTOM", since: `${r.dataset.units.indexLabel} ${r.fmtIdx(cur.idx)}` },
      depth: { value: isEos ? r.fmtIdx(cur.idx) : fmt(cur.idx * 3.28084), unit: isEos ? "" : "ft", sub: isEos ? "Time-indexed (10 s)" : `MD ${fmt(cur.idx)} m` },
      hookload: { value: fmt(isEos ? cur.ch.crpm : cur.ch.hookload ?? cur.ch.wob), unit: isEos ? "rpm" : cur.ch.hookload ? "klbs" : "klbs WOB", sub: `Monitors: ${cur.active || "none"}` },
      connection: { value: r.playing ? "LIVE" : "PAUSED", sub: `Replay ${r.speed}× · ${r.dataset.well}` },
    },
    trendData,
    trendLegend: [
      { label: "Fused risk (0–100)", color: "#1d5af0" }, { label: "S_baseline · RF (%)", color: "#16a34a" },
      { label: "S_LSTM (%)", color: "#7c3aed" }, { label: "S_DTW (%)", color: "#f97316" },
    ],
    trendEnds: [
      { label: `risk ${Math.round(last?.risk ?? 0)}`, color: "#1d5af0" }, { label: `RF ${scale(last?.sb) ?? "—"}`, color: "#16a34a" },
      { label: `LSTM ${scale(last?.sl) ?? "—"}`, color: "#7c3aed" }, { label: `DTW ${scale(last?.sd) ?? "—"}`, color: "#f97316" },
    ],
    trendTicks: fx.trendTicks, params, schematic: fx.schematic,
    activeAlerts: r.alerts.filter((a) => !a.acknowledged).slice(0, 3).map((a) => ({ id: a.id, title: a.title, desc: a.desc, time: a.at, sev: a.sev })),
    replayAlerts: r.alerts,
    dataQuality: {
      pct: win.length ? Math.round((100 * finite) / win.length) : 100,
      checks: [
        `${cur.active.split("|").filter(Boolean).length}/3 monitors active`,
        `Coverage: ${r.dataset.mechanism.replace("_", " ")}`,
        `Label tier: ${r.dataset.labelTier}`,
        cur.onb ? "On-bottom & circulating" : "Off-bottom (gated out)",
        r.dataset.evidence,
      ],
    },
    environment: fx.environment, mudSystem: fx.mudSystem,
  };
}
