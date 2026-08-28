/**
 * Well History fixtures — values exactly as drawn in
 * 02_Core_App_Screens/05_Performance.png (light; mislabeled — it is the
 * Well History 3-column layout) and 04_Well_History_Dark_Variant.png.
 * DESIGN FIXTURE, not real well data.
 */
import type { Severity } from "@/components/ui/primitives";

export const header = {
  title: "Well History",
  subtitle: "Historical data, events and performance overview",
  rigLabel: "OML18-W12",
  rangeLabel: "Apr 20 – May 24, 2025",
  exportLabel: "Export",
};

/* ---- Well banner ---------------------------------------------------- */
export const well = {
  name: "OML18-W12",
  status: "COMPLETING",
  facts: [
    { k: "Location", v: "Block OML 18" },
    { k: "Rig", v: "Rig 12" },
    { k: "Operator", v: "DrilCorp Energy" },
    { k: "Objective", v: "Oil Exploration" },
  ],
  stats: [
    { k: "Spud Date", v: "Apr 12, 2025" },
    { k: "Days Drilled", v: "42 days" },
    { k: "Total Depth (TVD)", v: "7,842 ft" },
    { k: "Current Depth (TVD)", v: "7,842 ft" },
    { k: "Well Status", v: "COMPLETING", good: true },
  ],
};

export const tabs = [
  "Overview",
  "Depth Profile",
  "Events & Incidents",
  "Daily Reports",
  "Operations Summary",
  "Well Schematics",
  "Documents",
];

/* ---- Row A --------------------------------------------------------- */
export type SummaryRow =
  | { k: string; v: string; kind?: "text" }
  | { k: string; v: string; kind: "chip" }
  | { k: string; v: string; kind: "dot" };

export const wellSummary: SummaryRow[] = [
  { k: "Total Depth (TVD)", v: "7,842 ft" },
  { k: "Total Depth (MD)", v: "8,215 ft" },
  { k: "Spud Date", v: "Apr 12, 2025" },
  { k: "Days Drilled", v: "42 days" },
  { k: "Current Phase", v: "COMPLETING", kind: "chip" },
  { k: "Formation at TD", v: "Sandstone" },
  { k: "Water Depth", v: "1,245 ft" },
  { k: "Well Type", v: "Exploration" },
  { k: "Fluid System", v: "Oil Based Mud" },
  { k: "Well Control Status", v: "Normal", kind: "dot" },
];
export const wellSummaryLink = "View Well Details";

export const depthLegend = [
  { label: "Drilled Depth", color: "#1d5af0" },
  { label: "Planned Depth", color: "#94a3b8", dashed: true },
  { label: "Target Depth", color: "#16a34a", dashed: true },
];
export const depthAxisLabel = "Depth (ft)";
/** x-axis: day index from Apr 20 (0) to May 24 (34) */
export const depthTicks = [
  { t: 0, label: "Apr 20" },
  { t: 7, label: "Apr 27" },
  { t: 14, label: "May 4" },
  { t: 21, label: "May 11" },
  { t: 28, label: "May 18" },
  { t: 34, label: "May 24" },
];
export const depthEndLabel = "7,842 ft";
export const depthTarget = 8000;

/**
 * Step-line geometry reproduced from the design: the drilled line starts at
 * the ~8,000 ft level on Apr 20 and climbs (reversed axis) to ~2,000 ft by
 * May 18, flat to the end dot on May 24. Planned runs slightly above it and
 * flattens at ~1,900 from May 18. Target is a flat line at 8,000.
 */
const drilledSteps: [number, number][] = [
  [0, 8000], [1, 8000], [2, 7700], [3, 7700], [4, 7400], [5, 7400], [6, 7200],
  [7, 7200], [8, 6900], [9, 6900], [10, 6500], [11, 6500], [12, 6100],
  [13, 6100], [14, 5800], [15, 5800], [16, 5400], [17, 5400], [18, 5000],
  [19, 5000], [20, 4600], [21, 4600], [22, 4200], [23, 4200], [24, 3700],
  [25, 3700], [26, 3200], [27, 3200], [28, 2700], [29, 2700], [30, 2300],
  [31, 2300], [32, 2150], [33, 2150], [34, 2100],
];
const plannedSteps: [number, number][] = [
  [0, 7700], [1, 7700], [2, 7400], [3, 7400], [4, 7100], [5, 7100], [6, 6800],
  [7, 6800], [8, 6400], [9, 6400], [10, 6000], [11, 6000], [12, 5600],
  [13, 5600], [14, 5200], [15, 5200], [16, 4800], [17, 4800], [18, 4400],
  [19, 4400], [20, 4000], [21, 4000], [22, 3500], [23, 3500], [24, 3000],
  [25, 3000], [26, 2500], [27, 2500], [28, 1900], [29, 1900], [30, 1900],
  [31, 1900], [32, 1900], [33, 1900], [34, 1900],
];
export const depthData = drilledSteps.map(([t, drilled], i) => ({
  t,
  drilled,
  planned: plannedSteps[i][1],
  target: depthTarget,
}));

export const depthFooter = [
  { k: "TVD Progress", v: "7,842 ft (100%)" },
  { k: "Planned TD", v: "8,000 ft" },
  { k: "Ahead / Behind", v: "+158 ft", good: true },
  { k: "Days Remaining", v: "0 days" },
];

export const integrity = {
  status: "Good",
  note: "No integrity issues detected",
  rows: [
    { k: "Casing Integrity", v: "Good" },
    { k: "Cement Bond", v: "Good" },
    { k: "Well Control", v: "Good" },
    { k: "Pressure Trend", v: "Normal" },
  ],
  riskLabel: "Risk Level",
  riskValue: "Low",
  link: "View Integrity Details",
};

/* ---- Row B: timeline ---------------------------------------------- */
export const timeline = [
  { name: "Spud", date: "Apr 12, 2025", done: true },
  { name: "Surface Casing", date: "Apr 13, 2025", done: true },
  { name: "Intermediate Casing", date: "Apr 22, 2025", done: true },
  { name: "Production Casing", date: "May 10, 2025", done: true },
  { name: "TD Reached", date: "May 20, 2025", done: true },
  { name: "Completing", date: "In Progress", done: false },
];
export const timelineLink = "View Full Timeline";

/* ---- Row C --------------------------------------------------------- */
export const eventsSummary = {
  total: 28,
  totalLabel: "Total Events",
  slices: [
    { label: "High Risk", value: 4, pct: "14%", color: "#e53935" },
    { label: "Medium Risk", value: 9, pct: "32%", color: "#f97316" },
    { label: "Low Risk", value: 10, pct: "36%", color: "#f59e0b" },
    { label: "Informational", value: 5, pct: "18%", color: "#1d5af0" },
  ],
  link: "View All Events",
};

export const dailyPerformance = {
  title: "Daily Drilling Performance",
  sub: "(Avg)",
  stats: [
    { label: "ROP", value: "58 ft/hr", icon: "rop" },
    { label: "WOB", value: "32 klbs", icon: "wob" },
    { label: "Torque", value: "94 ft-lb", icon: "torque" },
    { label: "SPP", value: "2,350 psi", icon: "spp" },
  ],
  link: "View Performance Details",
};

export const recentEventsHead = ["Time", "Event", "Type", "Severity", "Depth (TVD)"];
export const recentEvents: {
  time: string;
  event: string;
  icon: Severity;
  type: string;
  severity: string;
  sev: Severity;
  depth: string;
}[] = [
  { time: "May 24, 10:18 AM", event: "High Torque Trend", icon: "high", type: "Operational", severity: "High", sev: "high", depth: "7,842 ft" },
  { time: "May 24, 09:47 AM", event: "Standpipe Pressure Spike", icon: "medium", type: "Operational", severity: "Medium", sev: "medium", depth: "7,820 ft" },
  { time: "May 24, 08:12 AM", event: "Drillstring Vibration", icon: "info", type: "Operational", severity: "Low", sev: "good", depth: "7,650 ft" },
  { time: "May 23, 04:35 PM", event: "Bit Balling Detected", icon: "medium", type: "Operational", severity: "Medium", sev: "medium", depth: "7,210 ft" },
  { time: "May 23, 11:02 AM", event: "Gas Show", icon: "high", type: "Well Control", severity: "High", sev: "high", depth: "6,890 ft" },
];
export const recentEventsLink = "View All Events";

export const documents: { name: string; date: string; sev: Severity; icon: string }[] = [
  { name: "Daily Drilling Report", date: "May 24, 2025", sev: "info", icon: "text" },
  { name: "Casing Program", date: "Apr 12, 2025", sev: "good", icon: "sheet" },
  { name: "Well Schematic", date: "May 10, 2025", sev: "high", icon: "pdf" },
  { name: "Mud Program", date: "Apr 12, 2025", sev: "medium", icon: "box" },
  { name: "Well Summary Report", date: "May 20, 2025", sev: "info", icon: "text" },
];
export const documentsLink = "View All Documents";

export const footer = {
  left: "© 2025 DrillGuard. All rights reserved.",
  refreshLabel: "Data auto-refresh:",
  refreshTime: "10:24:30 AM",
  live: "Live",
};
