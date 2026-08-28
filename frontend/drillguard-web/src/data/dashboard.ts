/**
 * Dashboard fixtures — values exactly as drawn in
 * 04_Concept_Variants/Dashboard_High_Detail_Variant.png (cross-checked against
 * Dashboard_Dark_Light_Variant.png).
 * DESIGN FIXTURE, not live model output. The Step-4 "Data Connection" path is
 * where real pipeline output (ml-pipeline/artifacts/ensemble_scores.csv) is
 * meant to replace these.
 */
import { series } from "@/components/ui/gauges";

/* ---- Header ------------------------------------------------------- */
export const header = {
  title: "Dashboard",
  subtitle: "Real-time drilling overview and safety intelligence",
  date: "May 20, 2025",
  range: "Last 2 Hours",
  bell: 3,
};

/* ---- Row 1 -------------------------------------------------------- */
export const risk = {
  score: 82,
  label: "HIGH RISK",
  delta: "+12",
  deltaText: "vs 30 min ago",
  noteTitle: "Risk increasing",
  noteBody: "Monitor closely and follow recommended actions.",
};

export type ParamTone = "blue" | "red";
export const liveParams: { name: string; value: string; tone: ParamTone; spark: number[] }[] = [
  { name: "Hookload", value: "128 klbs", tone: "blue", spark: series(20, 10, 6, 3, 4) },
  { name: "Torque", value: "9,450 ft-lb", tone: "blue", spark: series(20, 10, 6, 5, 5) },
  { name: "ROP", value: "28 ft/hr", tone: "red", spark: series(20, 10, 7, 7, 3) },
  { name: "Standpipe Pressure", value: "2,350 psi", tone: "blue", spark: series(20, 10, 6, 11, 4) },
  { name: "Weight on Bit", value: "32 klbs", tone: "red", spark: series(20, 10, 7, 13, 2) },
  { name: "Mud Flow Rate", value: "560 gpm", tone: "blue", spark: series(20, 10, 6, 17, 3) },
  { name: "Gas Units", value: "1.45", tone: "blue", spark: series(20, 10, 6, 19, 4) },
];
export const liveParamsHead = ["Parameter", "Value", "Trend (5 min)"];

/** Risk trend 08:30 → 10:30, one point per 5 min (25 points). */
export const riskTrendValues = [
  10, 12, 14, 17, 21, 24, 23, 28, 31, 34, 38, 42, 49, 54, 58, 62, 64, 68, 70, 73, 76, 79, 85, 80, 82,
];
export const riskTrend = riskTrendValues.map((v, i) => ({ t: i, v }));
export const riskTrendTicks: Record<number, string> = {
  0: "08:30",
  6: "09:00",
  12: "09:30",
  18: "10:00",
  24: "10:30",
};
export const riskTrendYTicks = [0, 25, 50, 75, 100];
export const riskTrendRefs = [
  { y: 100, label: "CRITICAL", color: "#e53935" },
  { y: 75, label: "HIGH", color: "#e53935" },
  { y: 50, label: "MODERATE", color: "#f59e0b" },
  { y: 25, label: "LOW", color: "#16a34a" },
];
export const riskTrendEnd = { value: "82", color: "#e53935" };
export const riskTrendStats = [
  { label: "Average Risk", value: "54", color: "#f59e0b" },
  { label: "Max Risk", value: "85", color: "#e53935" },
  { label: "Min Risk", value: "21", color: "#16a34a" },
];

/* ---- Row 2 -------------------------------------------------------- */
export const activeAlertsLink = "View all (3)";
export const activeAlerts = [
  {
    title: "HIGH RISK – POSSIBLE STUCK PIPE",
    desc: "Torque increasing while ROP decreasing",
    time: "10:21 AM",
    sev: "high" as const,
    badge: "HIGH",
  },
  {
    title: "ELEVATED STANDPIPE PRESSURE",
    desc: "Standpipe pressure above normal range",
    time: "10:15 AM",
    sev: "medium" as const,
    badge: "MEDIUM",
  },
  {
    title: "ROP BELOW OPTIMAL",
    desc: "Rate of penetration below expected range",
    time: "10:08 AM",
    sev: "medium" as const,
    badge: "MEDIUM",
  },
];

export const wellOverview = {
  link: "View Details",
  rows: [
    { k: "Well Name", v: "OML18-W12" },
    { k: "Depth", v: "7,842 ft" },
    { k: "Operation", v: "DRILLING", chip: true },
    { k: "Hole Size", v: "12.25 in" },
    { k: "Bit Depth", v: "7,842 ft" },
    { k: "Formation", v: "Agbada Fm." },
    { k: "Target Depth", v: "12,500 ft" },
  ],
  progressLabel: "Progress to TD",
  progressPct: 62,
  progressText: "62%",
};

export const wellStatus = {
  link: "View Details",
  items: [
    { label: "Data Connection", value: "Online" },
    { label: "Sensors", value: "All Active" },
    { label: "Mud System", value: "Normal" },
    { label: "BOP Status", value: "Closed" },
    { label: "Weather", value: "Good" },
  ],
  weather: [
    { value: "28°C", label: "Partly Cloudy", icon: "sun" },
    { value: "12 km/h", label: "Wind", icon: "wind" },
    { value: "65%", label: "Humidity", icon: "drop" },
  ],
};

/* ---- Row 3: KPI cards --------------------------------------------- */
export type KpiTone = "info" | "good" | "high";
export const kpis: {
  title: string;
  value: string;
  unit: string;
  icon: "clock" | "dollar" | "triangle" | "leaf" | "cloud";
  tone: KpiTone;
  barColor: string;
  bars: number[];
  vsLabel: string;
  vsValue: string;
  dir: "up" | "down";
  good: boolean;
}[] = [
  {
    title: "NPT (Today)",
    value: "2.4",
    unit: "hrs",
    icon: "clock",
    tone: "info",
    barColor: "#1d5af0",
    bars: series(28, 10, 10, 21),
    vsLabel: "vs Yesterday:",
    vsValue: "-1.2 hrs",
    dir: "down",
    good: true,
  },
  {
    title: "Est. Cost Impact",
    value: "$268,400",
    unit: "",
    icon: "dollar",
    tone: "good",
    barColor: "#16a34a",
    bars: series(28, 10, 10, 23),
    vsLabel: "vs Yesterday:",
    vsValue: "-$120,000",
    dir: "down",
    good: true,
  },
  {
    title: "Active Incidents",
    value: "2",
    unit: "",
    icon: "triangle",
    tone: "high",
    barColor: "#e53935",
    bars: series(28, 10, 10, 29),
    vsLabel: "vs Yesterday:",
    vsValue: "+1",
    dir: "up",
    good: false,
  },
  {
    title: "Diesel Saved (Today)",
    value: "1,240",
    unit: "L",
    icon: "leaf",
    tone: "good",
    barColor: "#16a34a",
    bars: series(28, 10, 10, 31),
    vsLabel: "vs Yesterday:",
    vsValue: "+560 L",
    dir: "up",
    good: true,
  },
  {
    title: "CO₂ Avoided (Today)",
    value: "3.2",
    unit: "t",
    icon: "cloud",
    tone: "info",
    barColor: "#1d5af0",
    bars: series(28, 10, 10, 37),
    vsLabel: "vs Yesterday:",
    vsValue: "+1.4 t",
    dir: "up",
    good: true,
  },
];

/* ---- Row 4 -------------------------------------------------------- */
export const incidentsHead = ["Incident ID", "Type", "Well", "Detected", "Status"];
export const incidents = [
  { id: "INC-250520-02", type: "Stuck Pipe", well: "OML18-W12", detected: "10:21 AM", status: "Active", sev: "high" as const },
  { id: "INC-250519-07", type: "Kick", well: "OML18-W09", detected: "Yesterday, 08:45 PM", status: "Resolved", sev: "good" as const },
  { id: "INC-250519-03", type: "Washout", well: "OML18-W07", detected: "Yesterday, 02:10 PM", status: "Resolved", sev: "good" as const },
];
export const incidentsLink = "View all";

export const npt = {
  sub: "(Last 7 Days)",
  link: "View Report",
  yLabel: "Hours",
  yTicks: [0, 5, 10, 15, 20],
  data: [
    { d: "May 14", v: 8.6 },
    { d: "May 15", v: 12.4 },
    { d: "May 16", v: 9.1 },
    { d: "May 17", v: 14.7 },
    { d: "May 18", v: 11.3 },
    { d: "May 19", v: 6.8 },
    { d: "May 20", v: 2.4 },
  ],
  totalLabel: "TOTAL (7 DAYS)",
  totalValue: "65.3",
  totalUnit: "hrs",
  vsLabel: "vs Previous 7 Days",
  vsValue: "-18.7 hrs",
  vsPct: "(-22%)",
};
