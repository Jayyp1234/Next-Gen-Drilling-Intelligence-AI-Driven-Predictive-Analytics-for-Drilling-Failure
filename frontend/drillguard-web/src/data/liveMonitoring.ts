/**
 * Live Monitoring fixtures — values exactly as drawn in
 * 02_Core_App_Screens/01_Live_Monitoring.png.
 * DESIGN FIXTURE, not live model output. The Step-4 "Data Connection" path is
 * where real pipeline output (ml-pipeline/artifacts/ensemble_scores.csv) is
 * meant to replace these.
 */
import { series } from "@/components/ui/gauges";

export const risk = { score: 24, label: "LOW RISK", delta: "12 pts", deltaText: "vs last 5 min" };

export const kpis = {
  state: { value: "DRILLING", since: "Since 08:15 AM" },
  depth: { value: "7,842", unit: "ft", sub: "Bit Depth: 7,842 ft" },
  hookload: { value: "128", unit: "klbs", sub: "Normal Range: 80 – 180 klbs" },
  connection: { value: "GOOD", sub: "Data Latency: 2 sec" },
};

const n = 60;
export const trendData = Array.from({ length: n }, (_, i) => ({
  t: i,
  hookload: series(n, 150, 6, 3)[i],
  torque: series(n, 100, 5, 7)[i],
  spp: series(n, 60, 4, 11)[i],
  rop: series(n, 30, 4, 13)[i],
}));
export const trendTicks = { labels: ["10:20", "10:21", "10:22", "10:23", "10:24"], now: "Now" };
export const trendLegend = [
  { label: "Hookload (klbs)", color: "#1d5af0" },
  { label: "Torque (ft-lb)", color: "#16a34a" },
  { label: "Standpipe Pressure (psi)", color: "#7c3aed" },
  { label: "ROP (ft/hr)", color: "#f97316" },
];
export const trendEnds = [
  { label: "128 klbs", color: "#1d5af0" },
  { label: "94 ft-lb", color: "#16a34a" },
  { label: "2,350 psi", color: "#7c3aed" },
  { label: "58 ft/hr", color: "#f97316" },
];

export const params = [
  { name: "Hookload", value: "128", unit: "klbs", range: "80 – 180 klbs", gauge: 0.45, icon: "hook" },
  { name: "Torque", value: "94", unit: "ft-lb", range: "70 – 140 ft-lb", gauge: 0.42, icon: "torque" },
  { name: "Standpipe Pressure", value: "2,350", unit: "psi", range: "2,000 – 3,000 psi", gauge: 0.4, icon: "spp" },
  { name: "ROP", value: "58", unit: "ft/hr", range: "30 – 120 ft/hr", gauge: 0.42, icon: "rop" },
  { name: "Weight on Bit", value: "32", unit: "klbs", range: "20 – 50 klbs", gauge: 0.44, icon: "wob" },
  { name: "Mud Flow Rate", value: "560", unit: "gpm", range: "400 – 700 gpm", gauge: 0.5, icon: "flow" },
  { name: "Gas Units", value: "1.45", unit: "", range: "0 – 5", gauge: 0.3, icon: "gas" },
];

export const schematic = {
  sections: [
    { name: "Surface Hole", range: "0 – 1,200 ft" },
    { name: '12 1/4" Section', range: "1,200 – 4,500 ft" },
    { name: '8 1/2" Section', range: "4,500 – 7,800 ft" },
    { name: '6 1/8" Section', range: "7,800 ft – TD" },
  ],
  bitDepth: "7,842 ft",
  axis: ["0", "2,000", "4,000", "6,000", "8,000", "10,000"],
};

export const activeAlerts = [
  { title: "High Torque Trend", desc: "Torque increasing 18% in the last 5 min", time: "10:18 AM", sev: "high" as const },
  { title: "Standpipe Pressure Rise", desc: "Pressure above normal range", time: "10:16 AM", sev: "medium" as const },
  { title: "Mud Flow Rate Low", desc: "Below target range", time: "10:14 AM", sev: "low" as const },
];

export const dataQuality = {
  pct: 96,
  checks: ["Sensors Online", "No Data Gaps", "Latency < 3 sec", "Timestamp Sync", "Valid Ranges"],
};

export const environment = [
  { value: "28°C", label: "Temperature", icon: "temp" },
  { value: "12 km/h", label: "Wind", icon: "wind" },
  { value: "65%", label: "Humidity", icon: "drop" },
  { value: "Partly Cloudy", label: "", icon: "sun" },
];
export const mudSystem = [
  { value: "1.20 sg", label: "Mud Weight", icon: "temp" },
  { value: "9.6 ppg", label: "Viscosity", icon: "visc" },
  { value: "8.2", label: "pH", icon: "ph" },
  { value: "3%", label: "Sand Content", icon: "sand" },
];
