"use client";

/**
 * Local Recharts charts for the Incidents screen.
 * The shared StackedBars / AreaTrend wrappers lack explicit tick control,
 * legend ordering and an end-point marker, so these are built here.
 */
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from "recharts";
import { C } from "@/components/charts";

const axisTick = { fontSize: 11, fill: "#64748b" };
const grid = { stroke: "#e6eaf2", strokeDasharray: "3 3" } as const;

/** Square-swatch legend "■ High ■ Medium ■ Low" (design order). */
export function SquareLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex items-center gap-4 text-[12px] text-text-2">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

/** INCIDENTS OVER TIME — daily stacked bars with sparse date ticks. */
export function IncidentsOverTime({
  data,
  ticks,
  yTicks,
  height = 200,
}: {
  data: { i: number; low: number; medium: number; high: number }[];
  ticks: Record<number, string>;
  yTicks: number[];
  height?: number;
}) {
  const tickIdx = Object.keys(ticks).map(Number);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barSize={11}>
        <CartesianGrid {...grid} vertical={false} />
        <XAxis
          dataKey="i"
          type="category"
          ticks={tickIdx as never}
          tickFormatter={(v) => ticks[Number(v)] ?? ""}
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "#e6eaf2" }}
          interval={0}
        />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} ticks={yTicks} domain={[0, yTicks[yTicks.length - 1]]} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} labelFormatter={(v) => ticks[Number(v)] ?? `Day ${Number(v) + 1}`} />
        <Bar dataKey="low" name="Low" stackId="a" fill={C.blue} isAnimationActive={false} />
        <Bar dataKey="medium" name="Medium" stackId="a" fill={C.orange} isAnimationActive={false} />
        <Bar dataKey="high" name="High" stackId="a" fill={C.red} isAnimationActive={false} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Trend (Last 30 Minutes) — red dotted area, larger marker on the last sample. */
export function TorqueTrend({
  data,
  tickIdx,
  tickLabels,
  yTicks,
  height = 190,
}: {
  data: { i: number; v: number }[];
  tickIdx: number[];
  tickLabels: string[];
  yTicks: number[];
  height?: number;
}) {
  const labelFor = (v: number | string) => {
    const k = tickIdx.indexOf(Number(v));
    return k >= 0 ? tickLabels[k] : "";
  };
  const last = data[data.length - 1];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: -4, bottom: 0 }}>
        <defs>
          <linearGradient id="inc-torque-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={C.red} stopOpacity={0.22} />
            <stop offset="100%" stopColor={C.red} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...grid} vertical={false} />
        <XAxis
          dataKey="i"
          type="category"
          ticks={tickIdx as never}
          tickFormatter={labelFor}
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "#e6eaf2" }}
          interval={0}
        />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          ticks={yTicks}
          domain={[0, yTicks[yTicks.length - 1]]}
          tickFormatter={(v) => Number(v).toLocaleString("en-US")}
        />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} labelFormatter={(v) => labelFor(v as number) || `+${Number(v)} min`} />
        <Area
          type="linear"
          dataKey="v"
          name="Torque (ft-lb)"
          stroke={C.red}
          strokeWidth={2}
          fill="url(#inc-torque-fill)"
          dot={{ r: 2.5, fill: C.red, strokeWidth: 0 }}
          isAnimationActive={false}
        />
        <ReferenceDot x={last.i} y={last.v} r={5} fill={C.red} stroke="#ffffff" strokeWidth={1.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
