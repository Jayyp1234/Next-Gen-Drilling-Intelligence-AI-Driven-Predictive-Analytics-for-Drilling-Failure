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

const BLUE = "#1d5af0";
const GREY = "#94a3b8";
const axisTick = { fontSize: 11, fill: "#64748b" };

/**
 * ROP VS DEPTH — blue area of actual ROP over 200 ft depth bins with a grey
 * dashed planned-ROP line that steps at each hole section. Local (same
 * precedent as Sustainability's EmissionsChart): the shared AreaTrend has no
 * explicit x-tick list and draws the target as a monotone curve, whereas a
 * planned ROP is a per-section step.
 */
export function RopDepthChart({
  data,
  xTicks,
  yDomain,
  yTicks,
  height = 230,
}: {
  data: { d: string; rop: number; planned: number }[];
  xTicks: string[];
  yDomain: [number, number];
  yTicks: number[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 10, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="perf-rop-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={BLUE} stopOpacity={0.22} />
            <stop offset="100%" stopColor={BLUE} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e6eaf2" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="d" tick={axisTick} tickLine={false} axisLine={{ stroke: "#e6eaf2" }} ticks={xTicks} interval={0} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={yDomain} ticks={yTicks} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} labelFormatter={(v) => `${v} ft`} />
        <Line type="stepAfter" dataKey="planned" name="Planned ROP (ft/hr)" stroke={GREY} strokeDasharray="5 5" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Area type="monotone" dataKey="rop" name="Actual ROP (ft/hr)" stroke={BLUE} strokeWidth={2} fill="url(#perf-rop-fill)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
