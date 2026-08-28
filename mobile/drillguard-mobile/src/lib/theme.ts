/** DrillGuard mobile design tokens — mirrors the web app's palette. */
export const C = {
  bg: "#f4f6fb",
  surface: "#ffffff",
  surface2: "#f1f5fb",
  border: "#e6eaf2",
  text: "#0f172a",
  text2: "#334155",
  muted: "#64748b",
  muted2: "#94a3b8",

  navy: "#0b1a33",
  navyCard: "#132846",
  navyBorder: "#22375a",
  navyText: "#e6edf7",
  navyMuted: "#8aa0c2",

  primary: "#1d5af0",
  primarySoft: "#e7effe",

  high: "#e53935",
  highSoft: "#fdeaea",
  medium: "#f97316",
  mediumSoft: "#fdeee1",
  low: "#f59e0b",
  good: "#16a34a",
  goodSoft: "#e6f5ec",
};

export type Tier = "Normal" | "Watch" | "Elevated" | "Action";
export const tierColor: Record<Tier, string> = {
  Normal: C.good,
  Watch: C.low,
  Elevated: C.medium,
  Action: C.high,
};
export type Sev = "high" | "medium" | "low";
export const sevColor: Record<Sev, string> = { high: C.high, medium: C.medium, low: C.low };
export const sevSoft: Record<Sev, string> = { high: C.highSoft, medium: C.mediumSoft, low: C.goodSoft };

/**
 * User-facing risk status for a 0–100 fused score.
 * The pipeline tier (tail-percentile calibration) is authoritative once it
 * escalates; below Watch, describe the score itself so "75 · Normal" can never
 * appear — a 75 reads as High Risk even before the model crosses its 90th-pct
 * alert threshold.
 */
export function riskStatus(risk: number, tier: Tier): { label: string; color: string } {
  if (tier !== "Normal") return { label: tier, color: tierColor[tier] };
  if (risk >= 70) return { label: "High Risk", color: C.high };
  if (risk >= 40) return { label: "Moderate", color: C.low };
  return { label: "Low Risk", color: C.good };
}
