"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
} from "recharts";

const axisTick = { fontSize: 11, fill: "#64748b" };

/** Small rounded "82" pill drawn just right of the last point. */
function EndPill({ cx = 0, cy = 0, text, color }: { cx?: number; cy?: number; text: string; color: string }) {
  const w = 30;
  const h = 20;
  const x = Number((cx + 8).toFixed(1));
  const y = Number((cy - h / 2).toFixed(1));
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4} fill={color} />
      <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="#ffffff">
        {text}
      </text>
    </g>
  );
}

/**
 * RISK TREND (Last 2 Hours) — single series whose stroke runs green → orange →
 * red along x, with dashed severity thresholds labelled on the right and a
 * red value pill at the end. Local because the shared AreaTrend has a single
 * solid colour and no end pill.
 */
export function RiskTrendChart({
  data,
  ticks,
  yTicks,
  refs,
  end,
  height = 220,
}: {
  data: { t: number; v: number }[];
  ticks: Record<number, string>;
  yTicks: number[];
  refs: { y: number; label: string; color: string }[];
  end: { value: string; color: string };
  height?: number;
}) {
  const last = data[data.length - 1];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 70, left: -14, bottom: 0 }}>
        <defs>
          <linearGradient id="risk-stroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="30%" stopColor="#16a34a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="72%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#e53935" />
          </linearGradient>
          <linearGradient id="risk-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#e53935" stopOpacity={0.16} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e6eaf2" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="t"
          type="number"
          domain={[0, last.t]}
          ticks={Object.keys(ticks).map(Number)}
          tickFormatter={(v) => ticks[Number(v)] ?? ""}
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "#e6eaf2" }}
          padding={{ right: 44 }}
        />
        <YAxis domain={[0, 100]} ticks={yTicks} tick={axisTick} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          labelFormatter={(v) => ticks[Number(v)] ?? `+${Number(v) * 5} min`}
          formatter={(v) => [v, "Risk"]}
        />
        {refs.map((r) => (
          <ReferenceLine
            key={r.label}
            y={r.y}
            stroke={r.color}
            strokeOpacity={0.6}
            strokeDasharray="4 4"
            label={{ value: r.label, position: "right", fontSize: 10, fontWeight: 700, fill: r.color }}
          />
        ))}
        <Area
          type="monotone"
          dataKey="v"
          stroke="url(#risk-stroke)"
          strokeWidth={2.4}
          fill="url(#risk-fill)"
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0, fill: end.color }}
          isAnimationActive={false}
        />
        <ReferenceDot
          x={last.t}
          y={last.v}
          r={0}
          shape={(p: { cx?: number; cy?: number }) => <EndPill cx={p.cx} cy={p.cy} text={end.value} color={end.color} />}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
