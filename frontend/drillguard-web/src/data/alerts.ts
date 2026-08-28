/**
 * Alerts fixtures — values exactly as drawn in
 * 02_Core_App_Screens/02_Alerts.png.
 * DESIGN FIXTURE, not live model output. The Step-4 "Data Connection" path is
 * where real pipeline output (ml-pipeline/artifacts/ensemble_scores.csv) is
 * meant to replace these.
 */
import { series } from "@/components/ui/gauges";

export type AlertSev = "high" | "medium" | "low";

/* ---- Header -------------------------------------------------------- */
export const header = {
  title: "Alerts",
  subtitle: "Real-time alerts and warnings",
  rigLabel: "Rig 12 – OML18-W12",
  rangeLabel: "Last 24 Hours",
  bellCount: 6,
  action: "Filter",
};

/* ---- Row 1: KPI cards ---------------------------------------------- */
export const kpis = [
  { title: "High Risk Alerts", value: "2", sub: "Require immediate action", sev: "high" as const, icon: "octagon" },
  { title: "Medium Risk Alerts", value: "3", sub: "Monitor and act", sev: "medium" as const, icon: "triangle" },
  { title: "Low Risk Alerts", value: "1", sub: "Informational", sev: "low" as const, icon: "info" },
  { title: "Acknowledged", value: "18", sub: "In selected period", sev: "grey" as const, icon: "check" },
];

/* ---- Row 2 (left): Alerts list ------------------------------------- */
export const list = {
  title: "Alerts List",
  sortLabel: "Sort by:",
  sortValue: "Newest",
  footer: "Showing 1 to 7 of 24 alerts",
  pages: [1, 2, 3, 4],
};

export const alerts: {
  id: string;
  title: string;
  desc: string;
  time: string;
  sev: AlertSev;
  icon: "triangle" | "droplet" | "rop" | "vibration";
  selected?: boolean;
}[] = [
  { id: "a1", title: "HIGH TORQUE TREND", desc: "Torque increasing 18% in the last 5 min", time: "10:18 AM", sev: "high", icon: "triangle", selected: true },
  { id: "a2", title: "STANDPIPE PRESSURE RISE", desc: "Standpipe pressure above normal range", time: "10:16 AM", sev: "medium", icon: "triangle" },
  { id: "a3", title: "MUD FLOW RATE LOW", desc: "Mud flow rate below target range", time: "10:14 AM", sev: "low", icon: "droplet" },
  { id: "a4", title: "PIT GAIN DETECTED", desc: "Possible influx - pit volume increasing", time: "09:58 AM", sev: "medium", icon: "triangle" },
  { id: "a5", title: "ROP DROP DETECTED", desc: "Rate of penetration dropped 35%", time: "09:45 AM", sev: "high", icon: "rop" },
  { id: "a6", title: "HIGH VIBRATION", desc: "Drillstring vibration above threshold", time: "09:32 AM", sev: "low", icon: "vibration" },
  { id: "a7", title: "ELEVATED HOOKLOAD", desc: "Hookload above normal range", time: "09:20 AM", sev: "medium", icon: "triangle" },
];

/* ---- Row 2 (right): Alert details ---------------------------------- */
export const detail = {
  cardTitle: "Alert Details",
  title: "HIGH TORQUE TREND",
  desc: "Torque increasing 18% in the last 5 minutes.",
  badge: "HIGH RISK",
  sev: "high" as const,
  // rendered row-major into a 2-column grid (matches the design's 2×3 layout)
  fields: [
    { k: "Time Detected", v: "10:18 AM, May 20, 2025", icon: "clock" },
    { k: "Depth (TVD)", v: "7,842 ft", icon: "depth" },
    { k: "Well", v: "OML18-W12", icon: "rig" },
    { k: "Parameter", v: "Torque", icon: "param" },
    { k: "Rig", v: "Rig 12", icon: "rig" },
    { k: "Current Value", v: "9,450 ft-lb", icon: "value" },
  ],
  trend: {
    title: "Trend",
    sub: "(Last 30 Minutes)",
    unit: "ft-lb",
    yDomain: [0, 10000] as [number, number],
    yTicks: [0, 2000, 4000, 6000, 8000, 10000],
    xTicks: ["09:48", "09:53", "09:58", "10:03", "10:08", "10:13", "10:18"],
  },
  causes: {
    title: "Possible Causes",
    items: ["Differential sticking", "Pack-off", "Mechanical restriction"],
  },
  actions: {
    title: "Recommended Actions",
    items: [
      "Reduce weight on bit",
      "Monitor torque and drag closely",
      "If trend continues, circulate and condition mud",
      "Prepare for possible back-off",
    ],
  },
  footer: {
    alertId: { label: "Alert ID", value: "ALT-20250520-1018" },
    status: { label: "Status", value: "Active" },
    acknowledgedBy: { label: "Acknowledged By", value: "—" },
    button: "Acknowledge Alert",
  },
};

/** One sample per minute from 09:48 to 10:18 (31 points). Flat ~6,200 ft-lb
 *  then climbing from ~10:06 to the 9,450 ft-lb current value at 10:18. */
const START_MIN = 9 * 60 + 48;
const N_POINTS = 31;
const RISE_FROM = 18;
const noise = series(N_POINTS, 0, 500, 17);
export const trendData = Array.from({ length: N_POINTS }, (_, i) => {
  const m = START_MIN + i;
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  let v: number;
  if (i < RISE_FROM) {
    v = 6200 + noise[i];
  } else if (i === N_POINTS - 1) {
    v = 9450;
  } else {
    const f = (i - RISE_FROM) / (N_POINTS - 1 - RISE_FROM);
    v = 6300 + f * (9450 - 6300) + noise[i] * 0.4;
  }
  return { t: `${hh}:${mm}`, v: Math.round(v) };
});

/* ---- Row 3 (left): Alert history overview -------------------------- */
export const history = {
  title: "Alert History Overview",
  yLabel: "Alerts",
  yDomain: [0, 20] as [number, number],
  yTicks: [0, 5, 10, 15, 20],
  legend: [
    { key: "high", name: "High", color: "#e53935" },
    { key: "medium", name: "Medium", color: "#f97316" },
    { key: "low", name: "Low", color: "#1d5af0" },
  ],
  data: [
    { d: "May 14", high: 7, medium: 6, low: 3 },
    { d: "May 15", high: 7, medium: 6, low: 3 },
    { d: "May 16", high: 5, medium: 5, low: 2 },
    { d: "May 17", high: 6, medium: 5, low: 3 },
    { d: "May 18", high: 5, medium: 3, low: 2 },
    { d: "May 19", high: 6, medium: 4, low: 2 },
    { d: "May 20", high: 2, medium: 2, low: 1 },
  ],
};

/* ---- Row 3 (right): Alert distribution ----------------------------- */
export const distribution = {
  title: "Alert Distribution",
  sub: "(Last 7 Days)",
  total: "48",
  totalLabel: "Total Alerts",
  slices: [
    { label: "High", value: 16, pct: "33%", color: "#e53935" },
    { label: "Medium", value: 22, pct: "46%", color: "#f97316" },
    { label: "Low", value: 10, pct: "21%", color: "#1d5af0" },
  ],
};
