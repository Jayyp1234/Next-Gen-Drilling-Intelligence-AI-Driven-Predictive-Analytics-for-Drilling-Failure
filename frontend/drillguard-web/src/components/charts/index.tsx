"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
  Cell,
} from "recharts";

export const C = {
  blue: "#1d5af0",
  green: "#16a34a",
  purple: "#7c3aed",
  orange: "#f97316",
  red: "#e53935",
  yellow: "#f59e0b",
  grey: "#94a3b8",
  lightBlue: "#60a5fa",
};

const axisTick = { fontSize: 11, fill: "#64748b" };
const grid = { stroke: "#e6eaf2", strokeDasharray: "3 3" } as const;

/** Multi-series line chart (Live Parameter Trends) */
export function MultiLine({
  data,
  series,
  xKey = "t",
  height = 220,
  yDomain,
  yTicks,
  xTicks,
  dashedTail = false,
  tickFormatter,
}: {
  data: Record<string, number | string>[];
  series: { key: string; color: string; width?: number }[];
  xKey?: string;
  height?: number;
  yDomain?: [number, number];
  yTicks?: number[];
  xTicks?: (string | number)[];
  dashedTail?: boolean;
  tickFormatter?: (v: number | string) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid {...grid} vertical={false} />
        <XAxis dataKey={xKey} tick={axisTick} tickLine={false} axisLine={{ stroke: "#e6eaf2" }} ticks={xTicks as never} tickFormatter={tickFormatter} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={yDomain} ticks={yTicks} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={s.width ?? 2} dot={false} isAnimationActive={false} strokeDasharray={dashedTail ? undefined : undefined} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Single red/blue/green area trend with soft fill (Alert detail trend, emissions) */
export function AreaTrend({
  data,
  dataKey = "v",
  xKey = "t",
  color = C.red,
  height = 180,
  yDomain,
  yTicks,
  yLabel,
  reference,
  dot = false,
  targetKey,
  targetColor = C.blue,
  xInterval,
}: {
  data: Record<string, number | string>[];
  dataKey?: string;
  xKey?: string;
  color?: string;
  height?: number;
  yDomain?: [number, number];
  yTicks?: number[];
  yLabel?: string;
  reference?: { y: number; label?: string; color?: string }[];
  dot?: boolean;
  targetKey?: string;
  targetColor?: string;
  xInterval?: number;
}) {
  const id = `area-${color.replace("#", "")}`;
  return (
    <div className="relative">
      {yLabel && <span className="absolute -top-1 left-0 text-[11px] text-muted">{yLabel}</span>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 14, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid {...grid} vertical={false} />
          <XAxis dataKey={xKey} tick={axisTick} tickLine={false} axisLine={{ stroke: "#e6eaf2" }} interval={xInterval ?? "preserveStartEnd"} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={yDomain} ticks={yTicks} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          {reference?.map((r, i) => (
            <ReferenceLine key={i} y={r.y} stroke={r.color ?? "#cbd5e1"} strokeDasharray="4 4" label={r.label ? { value: r.label, position: "right", fontSize: 10, fill: r.color } : undefined} />
          ))}
          {targetKey && <Line type="monotone" dataKey={targetKey} stroke={targetColor} strokeDasharray="5 5" strokeWidth={1.5} dot={false} isAnimationActive={false} />}
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${id})`} dot={dot ? { r: 2, fill: color, strokeWidth: 0 } : false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Stacked severity bars (Alert History Overview, Incidents Over Time) */
export function StackedBars({
  data,
  xKey = "d",
  keys = [
    { key: "low", color: C.blue, name: "Low" },
    { key: "medium", color: C.orange, name: "Medium" },
    { key: "high", color: C.red, name: "High" },
  ],
  height = 180,
  barSize = 26,
  legend = true,
  yTicks,
  xInterval,
}: {
  data: Record<string, number | string>[];
  xKey?: string;
  keys?: { key: string; color: string; name: string }[];
  height?: number;
  barSize?: number;
  legend?: boolean;
  yTicks?: number[];
  xInterval?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barSize={barSize}>
        <CartesianGrid {...grid} vertical={false} />
        <XAxis dataKey={xKey} tick={axisTick} tickLine={false} axisLine={{ stroke: "#e6eaf2" }} interval={xInterval ?? 0} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} ticks={yTicks} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        {legend && (
          <Legend
            verticalAlign="top"
            align="right"
            iconType="square"
            iconSize={9}
            wrapperStyle={{ fontSize: 11, top: -4 }}
            itemSorter={(item) => -[...keys].findIndex((k) => k.name === item.value)}
          />
        )}
        {keys.map((k, i) => (
          <Bar key={k.key} dataKey={k.key} name={k.name} stackId="a" fill={k.color} isAnimationActive={false} radius={i === keys.length - 1 ? [3, 3, 0, 0] : 0} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Plain bars with value labels (NPT Trend) */
export function ValueBars({
  data,
  xKey = "d",
  dataKey = "v",
  color = C.blue,
  height = 180,
  barSize = 28,
  yTicks,
  lastColor,
}: {
  data: Record<string, number | string>[];
  xKey?: string;
  dataKey?: string;
  color?: string;
  height?: number;
  barSize?: number;
  yTicks?: number[];
  lastColor?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 18, right: 8, left: -20, bottom: 0 }} barSize={barSize}>
        <CartesianGrid {...grid} vertical={false} />
        <XAxis dataKey={xKey} tick={axisTick} tickLine={false} axisLine={{ stroke: "#e6eaf2" }} interval={0} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} ticks={yTicks} />
        <Bar dataKey={dataKey} fill={color} isAnimationActive={false} radius={[3, 3, 0, 0]} label={{ position: "top", fontSize: 11, fill: "#334155" }}>
          {data.map((_, i) => (
            <Cell key={i} fill={lastColor && i === data.length - 1 ? lastColor : color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Step-style depth progress (Well History) — drilled vs planned vs target */
export function DepthProgress({
  data,
  height = 220,
}: {
  data: { d: string; drilled?: number; planned?: number; target?: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="depth-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={C.blue} stopOpacity={0.18} />
            <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...grid} vertical={false} />
        <XAxis dataKey="d" tick={axisTick} tickLine={false} axisLine={{ stroke: "#e6eaf2" }} interval={0} />
        <YAxis reversed tick={axisTick} tickLine={false} axisLine={false} domain={[0, 10000]} ticks={[0, 2000, 4000, 6000, 8000, 10000]} tickFormatter={(v) => v.toLocaleString()} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Line type="stepAfter" dataKey="planned" stroke="#64748b" strokeDasharray="5 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="target" stroke={C.green} strokeDasharray="5 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Area type="stepAfter" dataKey="drilled" stroke={C.blue} strokeWidth={2.2} fill="url(#depth-fill)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Multi-line with dots (Incident Trend alternate) */
export function DottedLines({
  data,
  series,
  xKey = "d",
  height = 180,
}: {
  data: Record<string, number | string>[];
  series: { key: string; color: string; name: string }[];
  xKey?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid {...grid} vertical={false} />
        <XAxis dataKey={xKey} tick={axisTick} tickLine={false} axisLine={{ stroke: "#e6eaf2" }} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} />
        <Legend verticalAlign="top" align="right" iconType="square" iconSize={9} wrapperStyle={{ fontSize: 11, top: -4 }} itemSorter={() => 0} />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 2.5, fill: s.color, strokeWidth: 0 }} isAnimationActive={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Legend chips "— Hookload (klbs)" */
export function LegendChips({ items, className }: { items: { label: string; color: string; dashed?: boolean }[]; className?: string }) {
  return (
    <div className={className ?? "flex flex-wrap items-center gap-5 text-[12px] text-text-2"}>
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-2">
          <span className="inline-block h-[3px] w-5 rounded" style={{ background: it.dashed ? "transparent" : it.color, borderTop: it.dashed ? `2px dashed ${it.color}` : undefined }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

/** Legend with dots (donut legends) */
export function DotLegend({ items, className }: { items: { label: string; color: string; value?: string }[]; className?: string }) {
  return (
    <ul className={className ?? "space-y-2.5 text-[12px]"}>
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: it.color }} />
          <span className="flex-1 text-text-2">{it.label}</span>
          {it.value && <span className="font-semibold text-text">{it.value}</span>}
        </li>
      ))}
    </ul>
  );
}
