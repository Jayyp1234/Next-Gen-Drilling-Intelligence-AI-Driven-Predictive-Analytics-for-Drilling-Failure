"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from "recharts";
import { C } from "@/components/charts";

const axisTick = { fontSize: 11, fill: "var(--muted)" };

/**
 * Depth progress (TVD) — step line on a reversed depth axis with 6 dated
 * ticks and a labelled end marker. Local because the shared DepthProgress
 * uses a category axis (one tick per point) and has no end label.
 */
export function DepthChart({
  data,
  ticks,
  endLabel,
  height = 200,
}: {
  data: { t: number; drilled: number; planned: number; target: number }[];
  ticks: { t: number; label: string }[];
  endLabel: string;
  height?: number;
}) {
  const last = data[data.length - 1];
  const tickMap = Object.fromEntries(ticks.map((x) => [x.t, x.label]));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 18, right: 34, left: -6, bottom: 0 }}>
        <defs>
          <linearGradient id="wh-depth-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={C.blue} stopOpacity={0.16} />
            <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="t"
          type="number"
          domain={[0, last.t]}
          ticks={ticks.map((x) => x.t)}
          tickFormatter={(v: number) => tickMap[v] ?? ""}
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          reversed
          domain={[0, 10000]}
          ticks={[0, 2000, 4000, 6000, 8000, 10000]}
          tickFormatter={(v: number) => v.toLocaleString("en-US")}
          tick={axisTick}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          labelFormatter={(v) => tickMap[Number(v)] ?? `Day ${v}`}
        />
        <Line type="monotone" dataKey="target" stroke={C.green} strokeDasharray="5 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Line type="stepAfter" dataKey="planned" stroke="#94a3b8" strokeDasharray="5 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Area type="stepAfter" dataKey="drilled" stroke={C.blue} strokeWidth={2.2} fill="url(#wh-depth-fill)" dot={false} isAnimationActive={false} />
        <ReferenceDot
          x={last.t}
          y={last.drilled}
          r={4}
          fill={C.blue}
          stroke="var(--surface)"
          strokeWidth={2}
          label={{ value: endLabel, position: "top", fontSize: 11, fontWeight: 600, fill: "var(--text-2)", dy: -4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
