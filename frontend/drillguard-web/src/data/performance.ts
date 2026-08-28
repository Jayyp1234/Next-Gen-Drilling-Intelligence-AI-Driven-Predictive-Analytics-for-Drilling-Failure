/**
 * Performance fixtures — DESIGN FIXTURE, not measured data.
 * There is no design image for this screen (05_Performance.png is a Well
 * History variant), so these values are composed in the visual language of
 * 01_Live_Monitoring / 07_Sustainability and kept numerically consistent with
 * the Rig 12 – OML18-W12 world used everywhere else (ROP 58 ft/hr, WOB 32 klbs,
 * Torque 94 ft-lb, SPP 2,350 psi, 7,842 ft, 42 days, NPT 65.3 hrs).
 * Nothing here comes from the ML pipeline.
 */
import type { Severity } from "@/components/ui/primitives";

export const header = {
  title: "Performance",
  subtitle: "Drilling efficiency, KPIs and benchmark comparison",
  rigLabel: "Rig 12 – OML18-W12",
  rangeLabel: "Apr 20 – May 24, 2025",
  exportLabel: "Export",
  bellCount: 6,
};

/* ---- Row 1: KPI cards ------------------------------------------------ */
export type KpiIcon = "rop" | "efficiency" | "npt" | "cost" | "onBottom";
export const kpis: {
  title: string;
  value: string;
  unit: string;
  dir: "up" | "down";
  delta: string;
  good: boolean;
  deltaText: string;
  icon: KpiIcon;
  sev: Severity;
}[] = [
  { title: "Avg ROP", value: "58", unit: "ft/hr", dir: "up", delta: "6.2%", good: true, deltaText: "vs previous 30 days", icon: "rop", sev: "info" },
  { title: "Drilling Efficiency", value: "87", unit: "%", dir: "up", delta: "3.1%", good: true, deltaText: "vs previous 30 days", icon: "efficiency", sev: "good" },
  { title: "NPT (Period)", value: "65.3", unit: "hrs", dir: "down", delta: "22%", good: true, deltaText: "vs previous 30 days", icon: "npt", sev: "high" },
  { title: "Cost per Foot", value: "$312", unit: "/ft", dir: "down", delta: "8.4%", good: true, deltaText: "vs previous 30 days", icon: "cost", sev: "purple" },
  { title: "On-Bottom Time", value: "74", unit: "%", dir: "up", delta: "2.5%", good: true, deltaText: "vs previous 30 days", icon: "onBottom", sev: "good" },
];

/* ---- Row 2: ROP vs depth --------------------------------------------- */
export const ropVsDepth = {
  title: "ROP vs Depth",
  sub: "ft/hr · Apr 20 – May 24",
  select: "Daily",
  legend: [
    { label: "Actual ROP", color: "#1d5af0" },
    { label: "Planned ROP", color: "#94a3b8", dashed: true },
  ],
  yDomain: [0, 100] as [number, number],
  yTicks: [0, 25, 50, 75, 100],
  xTicks: ["1,200", "2,400", "3,600", "4,800", "6,000", "7,200"],
};

/** 200 ft depth bins from the 12¼" shoe (1,200 ft) down to the current bit depth. */
const ropByBin = [
  72, 70, 69, 75, 74, 66, 72, 71, 63, 68, 75, 70, 64, 61, 58, 66, 57, 52, 60, 55,
  49, 58, 62, 54, 47, 59, 51, 44, 38, 42, 57, 63, 66, 61, 60,
];
/** Planned ROP steps with hole section (matches the Live Monitoring schematic). */
const plannedAt = (depth: number) => (depth < 4500 ? 65 : depth < 7800 ? 50 : 42);
export const ropDepthData = ropByBin.map((rop, i) => {
  const depth = i < 34 ? 1200 + i * 200 : 7842;
  return { d: depth.toLocaleString("en-US"), rop, planned: plannedAt(depth) };
});

/* ---- Row 2: Time breakdown ------------------------------------------- */
export const timeBreakdown = {
  title: "Time Breakdown",
  center: "1,008",
  sub: "Total hrs",
  slices: [
    { label: "Drilling", value: 612, pct: "61%", color: "#1d5af0" },
    { label: "Tripping", value: 168, pct: "17%", color: "#16a34a" },
    { label: "Casing & Cementing", value: 96, pct: "10%", color: "#7c3aed" },
    { label: "NPT", value: 65, pct: "6%", color: "#e53935" },
    { label: "Other", value: 67, pct: "6%", color: "#94a3b8" },
  ],
};

/* ---- Row 3: Drilling parameters (period average) --------------------- */
export type ParamIcon = "rop" | "wob" | "torque" | "spp" | "rpm" | "flow";
export const params: { name: string; value: string; unit: string; range: string; gauge: number; icon: ParamIcon }[] = [
  { name: "ROP", value: "58", unit: "ft/hr", range: "30 – 120 ft/hr", gauge: 0.31, icon: "rop" },
  { name: "Weight on Bit", value: "32", unit: "klbs", range: "20 – 50 klbs", gauge: 0.4, icon: "wob" },
  { name: "Torque", value: "94", unit: "ft-lb", range: "70 – 140 ft-lb", gauge: 0.34, icon: "torque" },
  { name: "Standpipe Pressure", value: "2,350", unit: "psi", range: "2,000 – 3,000 psi", gauge: 0.35, icon: "spp" },
  { name: "Rotary Speed", value: "120", unit: "rpm", range: "80 – 180 rpm", gauge: 0.4, icon: "rpm" },
  { name: "Mud Flow Rate", value: "560", unit: "gpm", range: "400 – 700 gpm", gauge: 0.53, icon: "flow" },
];

/* ---- Row 4: NPT by category ------------------------------------------ */
export const nptByCategory = {
  title: "NPT by Category",
  sub: "hrs per week",
  keys: [
    { key: "equipment", color: "#1d5af0", name: "Equipment" },
    { key: "hole", color: "#f97316", name: "Hole Problems" },
    { key: "weather", color: "#94a3b8", name: "Weather" },
    { key: "other", color: "#7c3aed", name: "Other" },
  ],
  yTicks: [0, 5, 10, 15, 20],
};
/** Weekly split of the 65.3 hrs period NPT (W1 = Apr 20–26 … W5 = May 18–24). */
export const nptWeekly = [
  { d: "W1", equipment: 4.2, hole: 3.1, weather: 1.0, other: 1.5 },
  { d: "W2", equipment: 5.5, hole: 6.2, weather: 0.8, other: 2.0 },
  { d: "W3", equipment: 3.8, hole: 8.4, weather: 2.1, other: 1.2 },
  { d: "W4", equipment: 2.6, hole: 4.0, weather: 0.6, other: 1.8 },
  { d: "W5", equipment: 6.9, hole: 5.8, weather: 1.4, other: 2.4 },
];

/* ---- Row 4: Benchmark vs field average ------------------------------- */
export const benchmark = {
  title: "Benchmark vs Field Average",
  head: ["Metric", "This Well", "Field Avg", "Delta"],
  rows: [
    { metric: "ROP (ft/hr)", well: "58", field: "52", delta: "+11.5%", sev: "good" as Severity },
    { metric: "Days to TD", well: "42", field: "48", delta: "-12.5%", sev: "good" as Severity },
    { metric: "NPT %", well: "6.5%", field: "9.1%", delta: "-2.6 pts", sev: "good" as Severity },
    { metric: "Cost / ft", well: "$312", field: "$341", delta: "-8.5%", sev: "good" as Severity },
    { metric: "Connection Time", well: "4.2 min", field: "5.1 min", delta: "-17.6%", sev: "good" as Severity },
  ],
};

/* ---- Row 5: Daily performance log ------------------------------------ */
export type LogStatus = "On Plan" | "Behind";
export const logStatusSev: Record<LogStatus, Severity> = { "On Plan": "good", Behind: "medium" };
export const dailyLog = {
  title: "Daily Performance Log",
  head: ["Date", "Depth (ft)", "Footage", "Avg ROP", "NPT", "Efficiency", "Status"],
  rows: [
    { date: "May 20, 2025", depth: "6,329", footage: "421 ft", rop: "59 ft/hr", npt: "1.5 hrs", eff: 86, status: "On Plan" as LogStatus },
    { date: "May 21, 2025", depth: "6,727", footage: "398 ft", rop: "57 ft/hr", npt: "1.2 hrs", eff: 88, status: "On Plan" as LogStatus },
    { date: "May 22, 2025", depth: "6,965", footage: "238 ft", rop: "38 ft/hr", npt: "5.6 hrs", eff: 71, status: "Behind" as LogStatus },
    { date: "May 23, 2025", depth: "7,430", footage: "465 ft", rop: "64 ft/hr", npt: "0.4 hrs", eff: 93, status: "On Plan" as LogStatus },
    { date: "May 24, 2025", depth: "7,842", footage: "412 ft", rop: "61 ft/hr", npt: "0.8 hrs", eff: 91, status: "On Plan" as LogStatus },
  ],
  footer: "Showing 5 of 42 drilling days",
};
