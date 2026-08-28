/**
 * Sustainability fixtures — values exactly as drawn in
 * 02_Core_App_Screens/07_Sustainability.png.
 * DESIGN FIXTURE, not measured data. Nothing here comes from the ML pipeline
 * or a real emissions ledger; it exists so the screen renders faithfully.
 */
import type { Severity } from "@/components/ui/primitives";

export const header = {
  title: "Sustainability",
  subtitle: "Track environmental performance, emissions and resource efficiency",
  rigLabel: "OML18-W12",
  rangeLabel: "Apr 20 – May 24, 2025",
  exportLabel: "Export Report",
};

export const tabs = [
  "Overview",
  "Emissions",
  "Energy & Fuel",
  "Water",
  "Waste",
  "Environmental Compliance",
  "ESG Summary",
];

/* ---- Row 1: KPI cards ------------------------------------------------ */
export type KpiIcon = "cloud" | "fuel" | "drop" | "trash" | "leaf";
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
  { title: "Total CO₂e Emissions", value: "542.6", unit: "tCO₂e", dir: "down", delta: "12.6%", good: true, deltaText: "vs previous 30 days", icon: "cloud", sev: "good" },
  { title: "Fuel Consumption", value: "182,450", unit: "L", dir: "up", delta: "8.3%", good: true, deltaText: "vs previous 30 days", icon: "fuel", sev: "info" },
  { title: "Water Usage", value: "1,245", unit: "m³", dir: "up", delta: "5.4%", good: false, deltaText: "vs previous 30 days", icon: "drop", sev: "info" },
  { title: "Waste Generated", value: "24.8", unit: "tonnes", dir: "down", delta: "9.1%", good: true, deltaText: "vs previous 30 days", icon: "trash", sev: "purple" },
  { title: "Environmental Score", value: "86", unit: "/100", dir: "up", delta: "6.3%", good: true, deltaText: "vs previous 30 days", icon: "leaf", sev: "good" },
];

/* ---- Row 2: Emissions over time --------------------------------------- */
export const emissionsOverTime = {
  title: "Emissions Over Time",
  select: "Daily",
  legend: [
    { label: "CO₂e Emissions (tCO₂e)", color: "#16a34a" },
    { label: "Target (tCO₂e)", color: "#1d5af0", dashed: true },
  ],
  yTicks: [0, 50, 100, 150, 200, 250],
  yDomain: [0, 250] as [number, number],
  xTicks: ["Apr 20", "Apr 27", "May 4", "May 11", "May 18", "May 24"],
};

/** 35 daily samples Apr 20 → May 24; traced from the zig-zag drawn in the design. */
const emissionsDaily = [
  115, 115, 148, 128, 145, 128, 115, 115, 138, 125, 130, 145, 148, 118, 145, 125, 100, 100,
  118, 118, 95, 148, 130, 140, 118, 138, 128, 132, 130, 135, 135, 130, 130, 135, 130,
];
const dayLabel = (i: number) => {
  // Apr 20 is index 0; Apr has 30 days so May 1 is index 11.
  const d = 20 + i;
  return d <= 30 ? `Apr ${d}` : `May ${d - 30}`;
};
export const emissionsData = emissionsDaily.map((v, i) => ({
  t: dayLabel(i),
  v,
  target: 195,
}));

/* ---- Row 2: Emissions breakdown --------------------------------------- */
export const breakdown = {
  title: "Emissions Breakdown (tCO₂e)",
  center: "542.6",
  sub: "tCO₂e",
  slices: [
    { label: "Fuel Combustion", value: 304.2, pct: "56.0%", color: "#16a34a" },
    { label: "Drilling Operations", value: 121.8, pct: "22.4%", color: "#1d5af0" },
    { label: "Power Generation", value: 68.3, pct: "12.6%", color: "#7c3aed" },
    { label: "Flaring", value: 28.1, pct: "5.2%", color: "#f97316" },
    { label: "Other Sources", value: 20.2, pct: "3.8%", color: "#94a3b8" },
  ],
  link: "View Emissions Details",
};

/* ---- Row 2: Environmental scorecard ----------------------------------- */
export const scorecard = {
  title: "Environmental Scorecard",
  rows: [
    { label: "Emissions Management", score: 85, color: "#16a34a" },
    { label: "Energy Efficiency", score: 82, color: "#16a34a" },
    { label: "Water Stewardship", score: 78, color: "#1d5af0" },
    { label: "Waste Management", score: 88, color: "#16a34a" },
    { label: "Compliance & Reporting", score: 90, color: "#16a34a" },
  ],
  overallLabel: "Overall Score",
  overall: 86,
  outOf: "/100",
  link: "View Scorecard Details",
};

/* ---- Row 3: Key sustainability indicators ----------------------------- */
export type IndicatorStatus = "On Target" | "Off Target" | "Near Target";
export const indicators = {
  title: "Key Sustainability Indicators",
  head: ["Metric", "Current Period", "Previous 30 Days", "Change", "Trend", "Target", "Status"],
  rows: [
    { metric: "CO₂ Emissions Intensity", unit: "(tCO₂e / 1,000 ft drilled)", current: "1.24", previous: "1.42", dir: "down" as const, change: "12.6%", good: true, trend: [2, 4, 3, 5, 3, 6, 4, 5, 3, 4, 6, 5], trendColor: "#16a34a", target: "≤ 1.50", status: "On Target" as IndicatorStatus },
    { metric: "Fuel Efficiency", unit: "(L / 1,000 ft drilled)", current: "41.7", previous: "45.5", dir: "down" as const, change: "8.3%", good: true, trend: [3, 4, 6, 4, 5, 3, 5, 6, 4, 5, 4, 6], trendColor: "#16a34a", target: "≤ 45.0", status: "On Target" as IndicatorStatus },
    { metric: "Water Intensity", unit: "(m³ / 1,000 ft drilled)", current: "0.92", previous: "0.87", dir: "up" as const, change: "5.4%", good: false, trend: [5, 4, 6, 5, 6, 4, 5, 3, 4, 3, 4, 2], trendColor: "#e53935", target: "≤ 0.90", status: "Off Target" as IndicatorStatus },
    { metric: "Waste Intensity", unit: "(tonnes / 1,000 ft drilled)", current: "0.018", previous: "0.020", dir: "down" as const, change: "9.1%", good: true, trend: [3, 4, 3, 5, 4, 6, 5, 4, 5, 4, 6, 5], trendColor: "#16a34a", target: "≤ 0.020", status: "On Target" as IndicatorStatus },
    { metric: "Renewable Energy Use", unit: "(%)", current: "18.6%", previous: "16.2%", dir: "up" as const, change: "2.4%", good: true, trend: [3, 4, 3, 5, 4, 5, 6, 5, 6, 5, 6, 7], trendColor: "#16a34a", target: "≥ 20%", status: "Near Target" as IndicatorStatus },
  ],
  link: "View All Indicators",
};

export const statusSev: Record<IndicatorStatus, Severity> = {
  "On Target": "good",
  "Off Target": "high",
  "Near Target": "medium",
};

/* ---- Row 3: Sustainability initiatives -------------------------------- */
export type InitiativeIcon = "leaf" | "drop" | "recycle" | "solar";
export type InitiativeStatus = "In Progress" | "Completed" | "Planned";
export const initiatives = {
  title: "Sustainability Initiatives",
  items: [
    { title: "Optimize Drilling Parameters", desc: "Reduce fuel usage and emissions", status: "In Progress" as InitiativeStatus, icon: "leaf" as InitiativeIcon, sev: "good" as Severity },
    { title: "Water Recycling Program", desc: "Increase recycled water usage", status: "In Progress" as InitiativeStatus, icon: "drop" as InitiativeIcon, sev: "info" as Severity },
    { title: "Waste Segregation Initiative", desc: "Improve waste management", status: "Completed" as InitiativeStatus, icon: "recycle" as InitiativeIcon, sev: "good" as Severity },
    { title: "Solar Power Integration", desc: "Increase renewable energy usage", status: "Planned" as InitiativeStatus, icon: "solar" as InitiativeIcon, sev: "info" as Severity },
  ],
  link: "View All Initiatives",
};

export const initiativeSev: Record<InitiativeStatus, Severity> = {
  "In Progress": "info",
  Completed: "good",
  Planned: "purple",
};

/* ---- Row 4: Recent sustainability events ------------------------------ */
export type EventIcon = "leaf" | "drop" | "trash" | "check";
export const events = {
  title: "Recent Sustainability Events",
  items: [
    { title: "Emissions target achieved", desc: "Daily CO₂e emissions below target", time: "May 24, 08:30 AM", icon: "leaf" as EventIcon, sev: "good" as Severity },
    { title: "Water usage alert", desc: "Water intensity above target", time: "May 23, 06:15 PM", icon: "drop" as EventIcon, sev: "info" as Severity },
    { title: "Waste disposed", desc: "12.4 tonnes of waste disposed", time: "May 23, 02:40 PM", icon: "trash" as EventIcon, sev: "purple" as Severity },
    { title: "Compliance check passed", desc: "All environmental checks passed", time: "May 22, 11:05 AM", icon: "check" as EventIcon, sev: "good" as Severity },
  ],
  link: "View All Events",
};
