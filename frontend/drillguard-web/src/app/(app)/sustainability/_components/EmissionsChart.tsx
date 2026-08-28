"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const GREEN = "#16a34a";
const BLUE = "#1d5af0";
const axisTick = { fontSize: 11, fill: "#64748b" };

/**
 * EMISSIONS OVER TIME — green linear (zig-zag) area with a flat dashed blue
 * target line. Local because the shared AreaTrend draws a monotone curve and
 * has no explicit x-tick list; the design draws straight segments and six
 * weekly labels.
 */
export function EmissionsChart({
  data,
  xTicks,
  yDomain,
  yTicks,
  height = 210,
}: {
  data: { t: string; v: number; target: number }[];
  xTicks: string[];
  yDomain: [number, number];
  yTicks: number[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 22, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="sust-emissions-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={GREEN} stopOpacity={0.22} />
            <stop offset="100%" stopColor={GREEN} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e6eaf2" strokeDasharray="3 3" />
        <XAxis dataKey="t" tick={axisTick} tickLine={false} axisLine={{ stroke: "#e6eaf2" }} ticks={xTicks} interval={0} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={yDomain} ticks={yTicks} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Line type="linear" dataKey="target" name="Target (tCO₂e)" stroke={BLUE} strokeDasharray="5 5" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Area type="linear" dataKey="v" name="CO₂e Emissions (tCO₂e)" stroke={GREEN} strokeWidth={2} fill="url(#sust-emissions-fill)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
