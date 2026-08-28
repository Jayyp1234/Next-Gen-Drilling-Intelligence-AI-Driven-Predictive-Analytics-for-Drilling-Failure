"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const RED = "#e53935";
const axisTick = { fontSize: 11, fill: "#64748b" };

/** "10000" → "10,000" without relying on runtime locale (hydration-safe). */
const fmt = (v: number | string) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

type DotProps = { cx?: number; cy?: number; index?: number };

/**
 * Red area trend for the ALERT DETAILS card: small dot on every sample and a
 * large dot on the final (current) value. Local because the shared AreaTrend
 * has no y tick formatter, explicit x ticks, or end-point emphasis.
 */
export function TorqueTrendChart({
  data,
  xTicks,
  yDomain,
  yTicks,
  unit,
  height = 170,
}: {
  data: { t: string; v: number }[];
  xTicks: string[];
  yDomain: [number, number];
  yTicks: number[];
  unit: string;
  height?: number;
}) {
  const last = data.length - 1;
  const renderDot = (props: DotProps) => {
    const { cx = 0, cy = 0, index = 0 } = props;
    const isLast = index === last;
    return (
      <circle
        key={`dot-${index}`}
        cx={Number(cx.toFixed(2))}
        cy={Number(cy.toFixed(2))}
        r={isLast ? 5 : 2}
        fill={RED}
        stroke="none"
      />
    );
  };

  return (
    <div className="relative">
      <span className="absolute -top-0.5 left-1 text-[11px] text-muted">{unit}</span>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 16, right: 14, left: -4, bottom: 0 }}>
          <defs>
            <linearGradient id="alert-torque-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={RED} stopOpacity={0.22} />
              <stop offset="100%" stopColor={RED} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e6eaf2" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="t"
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: "#e6eaf2" }}
            ticks={xTicks}
            interval={0}
          />
          <YAxis
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            domain={yDomain}
            ticks={yTicks}
            tickFormatter={fmt}
          />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${fmt(Number(v))} ${unit}`, "Torque"]} />
          <Area
            type="linear"
            dataKey="v"
            stroke={RED}
            strokeWidth={2}
            fill="url(#alert-torque-fill)"
            dot={renderDot}
            activeDot={{ r: 4, fill: RED, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
