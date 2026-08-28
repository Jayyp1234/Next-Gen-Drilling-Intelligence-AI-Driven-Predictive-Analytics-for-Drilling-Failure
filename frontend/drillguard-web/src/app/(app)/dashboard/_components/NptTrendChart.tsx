"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";

const axisTick = { fontSize: 11, fill: "#64748b" };

/**
 * NPT TREND (Last 7 Days) — value-labelled bars on a fixed 0–20 h axis with
 * the current day drawn in a lighter blue. Local because the shared ValueBars
 * has no yDomain prop, so its auto-domain would drop the "20" tick.
 */
export function NptTrendChart({
  data,
  yTicks,
  yLabel,
  color = "#1d5af0",
  lastColor = "#60a5fa",
  height = 200,
}: {
  data: { d: string; v: number }[];
  yTicks: number[];
  yLabel: string;
  color?: string;
  lastColor?: string;
  height?: number;
}) {
  const top = yTicks[yTicks.length - 1];
  return (
    <div className="relative">
      <span className="absolute -top-1 left-0 text-[11px] text-muted">{yLabel}</span>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 22, right: 8, left: -20, bottom: 0 }} barSize={30}>
          <CartesianGrid stroke="#e6eaf2" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="d" tick={axisTick} tickLine={false} axisLine={{ stroke: "#e6eaf2" }} interval={0} />
          <YAxis domain={[0, top]} ticks={yTicks} tick={axisTick} tickLine={false} axisLine={false} />
          <Bar dataKey="v" isAnimationActive={false} radius={[3, 3, 0, 0]} label={{ position: "top", fontSize: 11, fill: "#334155" }}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === data.length - 1 ? lastColor : color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
