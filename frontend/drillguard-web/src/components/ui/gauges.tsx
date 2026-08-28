"use client";

import clsx from "clsx";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 180) * Math.PI) / 180;
  // rounded: sub-ulp float differences between server and client otherwise
  // produce hydration mismatches in the path strings
  return [Number((cx + r * Math.cos(a)).toFixed(3)), Number((cy + r * Math.sin(a)).toFixed(3))] as const;
}
/** arc from angle a0 to a1 (degrees, 0 = left, 180 = right, over the top) */
function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

/* ------------------------------------------------------------------ */
/* RiskGauge — the big semi-circle "24 /100 LOW RISK"                    */
/* ------------------------------------------------------------------ */
export function RiskGauge({
  value,
  label,
  size = 220,
  showScale = false,
  thick = 22,
  labelColor,
  denominator = true,
}: {
  value: number;
  label: string;
  size?: number;
  showScale?: boolean;
  thick?: number;
  labelColor?: string;
  /** show the small "/100" after the value (Live Monitoring yes, Dashboard no) */
  denominator?: boolean;
}) {
  const w = size;
  const h = size * 0.58;
  const cx = w / 2;
  const cy = h - 8;
  const r = w / 2 - thick / 2 - 4;
  // green → yellow → orange → red segments (design: 4 bands)
  const bands = [
    { a0: 0, a1: 60, c: "#22c55e" },
    { a0: 60, a1: 105, c: "#facc15" },
    { a0: 105, a1: 145, c: "#f97316" },
    { a0: 145, a1: 180, c: "#ef4444" },
  ];
  const needle = (value / 100) * 180;
  const [nx, ny] = polar(cx, cy, r - thick / 2 - 6, needle);
  const [tx, ty] = polar(cx, cy, r + thick / 2 + 4, needle);
  const color = labelColor ?? (value < 40 ? "#16a34a" : value < 70 ? "#f59e0b" : "#e53935");
  return (
    <div className="flex flex-col items-center">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* track */}
        <path d={arc(cx, cy, r, 0, 180)} stroke="#e5e9f2" strokeWidth={thick} fill="none" strokeLinecap="round" />
        {bands.map((b) => (
          <path
            key={b.a0}
            d={arc(cx, cy, r, b.a0 + 1, b.a1 - 1)}
            stroke={b.c}
            strokeWidth={thick}
            fill="none"
            strokeLinecap="butt"
          />
        ))}
        {/* needle tick */}
        <line x1={nx} y1={ny} x2={tx} y2={ty} stroke="#0f172a" strokeWidth={3} strokeLinecap="round" />
        {showScale && (
          <>
            <text x={thick / 2 + 4} y={h - 2} fontSize="11" fill="#64748b">0</text>
            <text x={w - thick - 4} y={h - 2} fontSize="11" fill="#64748b">100</text>
          </>
        )}
      </svg>
      <div className="-mt-9 text-center">
        <div className="text-[44px] font-extrabold leading-none tnum">
          {value}
          {denominator && <span className="ml-1 text-[14px] font-medium text-muted">/100</span>}
        </div>
        <div className="mt-1 text-[14px] font-bold tracking-wide" style={{ color }}>
          {label}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MiniGauge — small arc under each REAL-TIME PARAMETER tile              */
/* ------------------------------------------------------------------ */
export function MiniGauge({ value = 0.45, width = 110 }: { value?: number; width?: number }) {
  const w = width;
  const h = w * 0.55;
  const cx = w / 2;
  const cy = h - 6;
  const r = w / 2 - 10;
  const thick = 9;
  const bands = [
    { a0: 0, a1: 50, c: "#22c55e" },
    { a0: 50, a1: 100, c: "#facc15" },
    { a0: 100, a1: 135, c: "#22c55e" },
    { a0: 135, a1: 180, c: "#16a34a" },
  ];
  const a = value * 180;
  const [nx, ny] = polar(cx, cy, r - 2, a);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {bands.map((b) => (
        <path key={b.a0} d={arc(cx, cy, r, b.a0 + 1.5, b.a1 - 1.5)} stroke={b.c} strokeWidth={thick} fill="none" opacity={0.9} />
      ))}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#0f172a" strokeWidth={2.2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={3} fill="#0f172a" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Donut — "48 Total Alerts", "14 Total", "32 Reports"                   */
/* ------------------------------------------------------------------ */
export function Donut({
  slices,
  size = 150,
  thickness = 22,
  center,
  sub,
  className,
}: {
  slices: { value: number; color: string }[];
  size?: number;
  thickness?: number;
  center?: React.ReactNode;
  sub?: string;
  className?: string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = size / 2 - thickness / 2;
  const C = 2 * Math.PI * r;
  // pre-compute arc lengths + start offsets (pure; no mutation during render)
  const arcs = slices.reduce<{ len: number; start: number; color: string }[]>((acc, s) => {
    const start = acc.length ? acc[acc.length - 1].start + acc[acc.length - 1].len : 0;
    return [...acc, { len: (s.value / total) * C, start, color: s.color }];
  }, []);
  return (
    <div className={clsx("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={thickness}
            strokeDasharray={`${Math.max(a.len - 2, 0).toFixed(2)} ${C.toFixed(2)}`}
            strokeDashoffset={Number((-a.start).toFixed(2))}
          />
        ))}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[28px] font-extrabold leading-none tnum">{center}</div>
          {sub && <div className="mt-1 text-[11px] text-muted">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

/** Single-value ring: DATA QUALITY 96% Good */
export function Ring({
  pct,
  size = 150,
  thickness = 16,
  color = "#16a34a",
  track = "#e5e9f2",
  label,
  sub,
}: {
  pct: number;
  size?: number;
  thickness?: number;
  color?: string;
  track?: string;
  label?: React.ReactNode;
  sub?: string;
}) {
  const r = size / 2 - thickness / 2;
  const C = 2 * Math.PI * r;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${((pct / 100) * C).toFixed(2)} ${C.toFixed(2)}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[30px] font-extrabold leading-none tnum">{label ?? `${pct}%`}</div>
          {sub && <div className="mt-1 text-[13px] font-medium" style={{ color }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline — small inline trend                                        */
/* ------------------------------------------------------------------ */
export function Sparkline({
  data,
  color = "#1d5af0",
  width = 120,
  height = 36,
  fill = true,
  strokeWidth = 1.8,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  strokeWidth?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [
    Number(((i / (data.length - 1)) * width).toFixed(2)),
    Number((height - 3 - ((v - min) / span) * (height - 6)).toFixed(2)),
  ]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const id = `sp-${color.replace("#", "")}-${width}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {fill && (
        <>
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${d} L${width},${height} L0,${height} Z`} fill={`url(#${id})`} />
        </>
      )}
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  );
}

/** Tiny bar strip used in the Dashboard KPI cards */
export function BarStrip({ data, color = "#1d5af0", width = 150, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(...data) || 1;
  const bw = width / data.length;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((v, i) => (
        <rect key={i} x={Number((i * bw + 1).toFixed(2))} y={Number((height - (v / max) * height).toFixed(2))} width={Number(Math.max(bw - 2, 1).toFixed(2))} height={Number(((v / max) * height).toFixed(2))} fill={color} rx={1} />
      ))}
    </svg>
  );
}

/** Horizontal progress bar with label (scorecard / coverage / progress to TD) */
export function Bar({ pct, color = "#16a34a", height = 6, track = "#e5e9f2", className, width }: { pct: number; color?: string; height?: number; track?: string; className?: string; /** fixed px width; otherwise fills its container */ width?: number }) {
  const fixed = width !== undefined || /(^|\s)w-/.test(className ?? "");
  return (
    <div className={clsx(!fixed && "w-full", "shrink-0 overflow-hidden rounded-full", className)} style={{ height, background: track, width }}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

/** Deterministic pseudo-random series so fixtures look like the designs. */
export function series(n: number, base: number, amp: number, seed = 1, trend = 0) {
  let s = seed;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280 - 0.5;
    out.push(Number((base + r * amp + (i / n) * trend).toFixed(3)));
  }
  return out;
}
