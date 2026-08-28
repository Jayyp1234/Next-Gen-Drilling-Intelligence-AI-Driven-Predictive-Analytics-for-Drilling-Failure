/**
 * Incidents fixtures — values exactly as drawn in
 * 02_Core_App_Screens/03_Incidents.png.
 * DESIGN FIXTURE, not live model output. Real incident records are meant to
 * come from the intelligence service once the backend exists.
 */
import type { Severity } from "@/components/ui/primitives";

/* ---- Row 1: KPI cards ------------------------------------------------ */
export const kpis: {
  label: string;
  value: string;
  unit?: string;
  sev: Severity;
  icon: "alert" | "open" | "clock" | "check" | "timer";
  compare: string;
  dir: "up" | "down";
  delta: string;
  good: boolean;
}[] = [
  { label: "Total Incidents", value: "14", sev: "high", icon: "alert", compare: "vs previous 30 days", dir: "up", delta: "27%", good: false },
  { label: "Open Incidents", value: "5", sev: "medium", icon: "open", compare: "vs previous 30 days", dir: "up", delta: "25%", good: false },
  { label: "Under Investigation", value: "3", sev: "medium", icon: "clock", compare: "vs previous 30 days", dir: "down", delta: "40%", good: true },
  { label: "Resolved", value: "6", sev: "good", icon: "check", compare: "vs previous 30 days", dir: "up", delta: "20%", good: true },
  { label: "MTTR (Open)", value: "18.4", unit: "hrs", sev: "purple", icon: "timer", compare: "vs previous 30 days", dir: "down", delta: "12%", good: true },
];

/* ---- Row 2: Incidents over time (30 daily bars, Apr 24 → May 24) ------- */
export const overTimeLegend = [
  { label: "High", color: "#e53935" },
  { label: "Medium", color: "#f97316" },
  { label: "Low", color: "#1d5af0" },
];

// [low, medium, high] per day, read off the design's stacked bars
const bars: [number, number, number][] = [
  [3, 3, 4], [2, 2, 4], [1, 1, 2], [4, 3, 3], [4, 4, 4],
  [3, 3, 5], [3, 1, 3], [1, 1, 2], [2, 1, 1], [2, 1, 4],
  [4, 5, 8], [1, 0, 1], [1, 1, 2], [3, 1, 3], [3, 0, 2],
  [2, 4, 5], [1, 1, 1], [2, 0, 2], [1, 1, 4], [2, 2, 2],
  [3, 1, 4], [2, 2, 4], [3, 3, 2], [1, 0, 1], [1, 0, 1],
  [1, 1, 3], [1, 1, 2], [2, 2, 3], [1, 0, 0], [1, 0, 0],
];
export const overTimeData = bars.map(([low, medium, high], i) => ({ i, low, medium, high }));
export const overTimeTicks: Record<number, string> = {
  0: "Apr 24",
  5: "Apr 29",
  9: "May 4",
  14: "May 9",
  19: "May 14",
  23: "May 19",
  27: "May 24",
};
export const overTimeYTicks = [0, 5, 10, 15, 20];

/* ---- Row 2: Incidents by type ---------------------------------------- */
export const byType = {
  total: "14",
  totalLabel: "Total",
  items: [
    { label: "Stuck Pipe", value: 5, pct: "36%", color: "#e53935" },
    { label: "Loss Circulation", value: 3, pct: "21%", color: "#f97316" },
    { label: "Kick / Well Control", value: 2, pct: "14%", color: "#f59e0b" },
    { label: "Equipment Failure", value: 2, pct: "14%", color: "#1d5af0" },
    { label: "Other", value: 2, pct: "14%", color: "#7c3aed" },
  ],
  footer: "View full breakdown",
};

/* ---- Row 3: Incidents table ------------------------------------------ */
export const tableTabs = ["All Incidents (14)", "Open (5)", "Under Investigation (3)", "Resolved (6)", "Closed (0)"];
export const tableFilters = {
  severity: { label: "Severity:", value: "All" },
  type: { label: "Type:", value: "All" },
  button: "Filters",
};
export const tableHead = ["ID", "Incident Title", "Type", "Severity", "Well", "Detected", "Status", "Owner", "Actions"];

export type IncidentStatus = "Open" | "Under Investigation" | "Resolved";
export const statusSev: Record<IncidentStatus, Severity> = {
  Open: "high",
  "Under Investigation": "medium",
  Resolved: "good",
};

export const incidents: {
  id: string;
  title: string;
  sub: string;
  type: string;
  typeIcon: "stuck" | "loss" | "kick" | "equipment" | "other";
  severity: "High" | "Medium" | "Low";
  sev: Severity;
  well: string;
  detected: string;
  status: IncidentStatus;
  owner: string;
  bar: Severity;
}[] = [
  { id: "INC-20250524-001", title: "High Torque Trend", sub: "Torque increasing consistently", type: "Stuck Pipe", typeIcon: "stuck", severity: "High", sev: "high", well: "OML18-W12", detected: "May 24, 10:18 AM", status: "Open", owner: "Drilling Engineer", bar: "high" },
  { id: "INC-20250523-007", title: "Loss Circulation", sub: "Flow rate drop detected", type: "Loss Circulation", typeIcon: "loss", severity: "Medium", sev: "medium", well: "OML18-W12", detected: "May 23, 07:42 PM", status: "Under Investigation", owner: "Fluids Engineer", bar: "medium" },
  { id: "INC-20250522-004", title: "Kick Warning", sub: "Pit gain detected", type: "Kick / Well Control", typeIcon: "kick", severity: "High", sev: "high", well: "OML18-W09", detected: "May 22, 10:05 AM", status: "Under Investigation", owner: "Drilling Engineer", bar: "medium" },
  { id: "INC-20250520-003", title: "Mud Pump Failure", sub: "Pump #2 pressure drop", type: "Equipment Failure", typeIcon: "equipment", severity: "Medium", sev: "medium", well: "OML18-W12", detected: "May 20, 03:11 PM", status: "Resolved", owner: "Maintenance Lead", bar: "good" },
  { id: "INC-20250518-002", title: "High Vibration", sub: "Drillstring vibration high", type: "Other", typeIcon: "other", severity: "Low", sev: "low", well: "OML18-W12", detected: "May 18, 11:32 AM", status: "Resolved", owner: "Drilling Engineer", bar: "good" },
];
export const tablePager = { text: "Showing 1 to 5 of 14 incidents", pages: [1, 2, 3] };

/* ---- Row 4: Incident detail ------------------------------------------ */
export const detail = {
  id: "INC-20250524-001",
  badge: "HIGH",
  summary: "Torque increasing 18% in the last 5 minutes",
  statusLabel: "Status:",
  status: "Open",
  detectedLabel: "Detected:",
  detected: "May 24, 10:18 AM",
  editButton: "Edit Incident",
  tabs: ["Overview", "Analysis", "Timeline", "Actions", "Attachments", "Notes"],
  info: {
    title: "Incident Information",
    rows: [
      { k: "Type", v: "Stuck Pipe" },
      { k: "Well", v: "OML18-W12" },
      { k: "Rig", v: "Rig 12" },
      { k: "Depth (TVD)", v: "7,842 ft" },
      { k: "Parameter", v: "Torque" },
      { k: "Current Value", v: "9,450 ft-lb" },
      { k: "Threshold", v: "8,000 ft-lb" },
    ],
    descriptionLabel: "Description",
    description: "Torque has been increasing steadily over the last 5 minutes.",
  },
  trend: {
    title: "Trend",
    sub: "(Last 30 Minutes)",
    yLabel: "ft-lb",
    yTicks: [0, 2000, 4000, 6000, 8000, 10000],
    ticks: ["09:48", "09:53", "09:58", "10:03", "10:08", "10:13", "10:18"],
  },
  causes: {
    title: "Possible Causes",
    items: ["Differential sticking", "Pack-off", "Mechanical restriction", "High dogleg severity"],
  },
  actions: {
    title: "Recommended Actions",
    items: [
      "Reduce weight on bit",
      "Monitor torque and drag closely",
      "Work pipe up/down gently",
      "Prepare for back-off if trend continues",
    ],
  },
  activity: {
    title: "Activity Log",
    items: [
      { time: "10:18 AM", text: "Incident created", sub: "by System", color: "#e53935" },
      { time: "10:18 AM", text: "Alert triggered", sub: "High Torque Trend", color: "#f97316" },
      { time: "10:20 AM", text: "Assigned to", sub: "Drilling Engineer", color: "#f59e0b" },
      { time: "–", text: "Awaiting action", sub: "", color: "#94a3b8" },
    ],
    button: "Add Note",
  },
};

/* Torque trend — 31 one-minute samples 09:48 → 10:18, flat ~6,000 ft-lb
 * then climbing to ~9,450 at the end (the design's red dotted area). */
const torque = [
  6050, 5980, 6100, 5900, 5700, 5800, 6000, 5850, 5700, 5800,
  5650, 5800, 5950, 5750, 5700, 5750, 5600, 6100, 6500, 6900,
  7050, 7400, 7150, 7300, 7700, 8100, 8450, 8700, 9100, 8900,
  9450,
];
export const trendData = torque.map((v, i) => ({ i, v }));
export const trendTickIdx = [0, 5, 10, 15, 20, 25, 30];
