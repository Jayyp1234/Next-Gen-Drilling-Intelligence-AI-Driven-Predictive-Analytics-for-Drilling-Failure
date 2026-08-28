"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const axisTick = { fontSize: 11, fill: "#64748b" };

/**
 * Stacked High/Medium/Low bars with a fixed 0–20 axis, an "Alerts" axis
 * caption and a vertical legend on the right (as drawn). Local because the
 * shared StackedBars has no domain prop and only a horizontal Recharts legend.
 */
export function AlertHistoryChart({
  data,
  legend,
  yLabel,
  yDomain,
  yTicks,
  height = 200,
}: {
  data: { d: string; high: number; medium: number; low: number }[];
  legend: { key: string; name: string; color: string }[];
  yLabel: string;
  yDomain: [number, number];
  yTicks: number[];
  height?: number;
}) {
  // stack bottom → top: low, medium, high (blue / orange / red)
  const stack = [...legend].reverse();
  return (
    <div className="flex gap-4">
      <div className="relative min-w-0 flex-1">
        <span className="absolute -top-0.5 left-1 text-[11px] text-muted">{yLabel}</span>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 16, right: 8, left: -20, bottom: 0 }} barSize={26}>
            <CartesianGrid stroke="#e6eaf2" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="d" tick={axisTick} tickLine={false} axisLine={{ stroke: "#e6eaf2" }} interval={0} />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={yDomain} ticks={yTicks} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            {stack.map((k, i) => (
              <Bar
                key={k.key}
                dataKey={k.key}
                name={k.name}
                stackId="a"
                fill={k.color}
                isAnimationActive={false}
                radius={i === stack.length - 1 ? [3, 3, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="shrink-0 space-y-2.5 pt-6 text-[11px] text-text-2">
        {legend.map((l) => (
          <li key={l.key} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: l.color }} />
            {l.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
