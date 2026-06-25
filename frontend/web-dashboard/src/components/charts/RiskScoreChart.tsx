import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import type { SensorReading } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { getChartTheme } from '../../lib/chartTheme';

interface RiskScoreChartProps {
  readings: SensorReading[];
  height?: number;
  crosshairTime?: string | null;
  onHover?: (time: string | null) => void;
  /** When set, X axis is zoomed to this time range (ms). */
  xDomain?: [number, number] | null;
  /** Called when user finishes drawing a selection box (start and end time in ms). */
  onSelectionComplete?: (startTime: number, endTime: number) => void;
}

const MIN_DRAG_PX = 8;

export default function RiskScoreChart({
  readings,
  height = 160,
  crosshairTime,
  onHover,
  xDomain,
  onSelectionComplete,
}: RiskScoreChartProps) {
  const { theme } = useTheme();
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<{ x: number; y: number } | null>(null);
  const [chartRect, setChartRect] = useState({ width: 0, height: 0 });

  const ct = useMemo(() => getChartTheme(), [theme]);

  const data = useMemo(() => {
    return readings.map(r => ({
      time: new Date(r.timestamp).getTime(),
      score: r.risk_score ?? 0,
    }));
  }, [readings]);

  const timeExtent = useMemo((): [number, number] => {
    if (data.length === 0) return [0, 0];
    const times = data.map(d => d.time);
    return [Math.min(...times), Math.max(...times)];
  }, [data]);

  useEffect(() => {
    const el = chartAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setChartRect({ width: r.width, height: r.height });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setChartRect({ width: r.width, height: r.height });
    return () => ro.disconnect();
  }, []);

  const pixelToTime = useCallback(
    (px: number) => {
      const [tMin, tMax] = xDomain ?? timeExtent;
      if (chartRect.width <= 0) return tMin;
      return Math.round(tMin + (px / chartRect.width) * (tMax - tMin));
    },
    [chartRect.width, timeExtent, xDomain]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!chartAreaRef.current || !onSelectionComplete) return;
      const rect = chartAreaRef.current.getBoundingClientRect();
      setSelectionStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setSelectionCurrent({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [onSelectionComplete]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!selectionStart) return;
      if (!chartAreaRef.current) return;
      const rect = chartAreaRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      setSelectionCurrent({ x, y });
    },
    [selectionStart]
  );

  const handleMouseUp = useCallback(() => {
    if (!selectionStart || !selectionCurrent || !onSelectionComplete) {
      setSelectionStart(null);
      setSelectionCurrent(null);
      return;
    }
    const dx = Math.abs(selectionCurrent.x - selectionStart.x);
    const dy = Math.abs(selectionCurrent.y - selectionStart.y);
    if (dx < MIN_DRAG_PX && dy < MIN_DRAG_PX) {
      setSelectionStart(null);
      setSelectionCurrent(null);
      return;
    }
    const x1 = Math.min(selectionStart.x, selectionCurrent.x);
    const x2 = Math.max(selectionStart.x, selectionCurrent.x);
    const t1 = pixelToTime(x1);
    const t2 = pixelToTime(x2);
    onSelectionComplete(Math.min(t1, t2), Math.max(t1, t2));
    setSelectionStart(null);
    setSelectionCurrent(null);
  }, [selectionStart, selectionCurrent, onSelectionComplete, pixelToTime]);

  const handleMouseLeave = useCallback(() => {
    if (!selectionStart) onHover?.(null);
    else {
      setSelectionStart(null);
      setSelectionCurrent(null);
    }
  }, [selectionStart, onHover]);

  const selectionBox = useMemo(() => {
    if (!selectionStart || !selectionCurrent) return null;
    const x1 = Math.min(selectionStart.x, selectionCurrent.x);
    const x2 = Math.max(selectionStart.x, selectionCurrent.x);
    const y1 = Math.min(selectionStart.y, selectionCurrent.y);
    const y2 = Math.max(selectionStart.y, selectionCurrent.y);
    return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
  }, [selectionStart, selectionCurrent]);

  const xDomainProp = xDomain ?? ['dataMin', 'dataMax'];

  return (
    <div className="relative select-none" style={{ height }} onMouseLeave={handleMouseLeave}>
      <div className="absolute left-0 top-0 bottom-0 w-[72px] flex flex-col justify-center pl-2 z-[1]">
        <span className="text-xs font-semibold text-[#FF6B6B]">RISK</span>
        <span className="text-[11px] text-dg-text-tertiary">score</span>
      </div>
      <div
        ref={chartAreaRef}
        className="ml-[72px] h-full relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 12, bottom: 4, left: 0 }}
            onMouseMove={(e: any) => {
              if (selectionStart) return;
              if (e?.activePayload?.[0]) {
                onHover?.(new Date(e.activePayload[0].payload.time).toISOString());
              }
            }}
          >
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F85149" stopOpacity={0.3} />
                <stop offset="30%" stopColor="#E87C25" stopOpacity={0.2} />
                <stop offset="60%" stopColor="#D29922" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#2EA043" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} vertical={false} />
            <XAxis
              dataKey="time"
              type="number"
              domain={xDomainProp}
              tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              stroke={ct.axis}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: ct.grid }}
            />
            <YAxis
              domain={[0, 100]}
              stroke={ct.axis}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={40}
              ticks={[0, 30, 50, 71, 100]}
            />

            <ReferenceLine y={30} stroke="rgba(210,153,34,0.3)" strokeDasharray="4 4" />
            <ReferenceLine y={50} stroke="rgba(232,124,37,0.3)" strokeDasharray="4 4" />
            <ReferenceLine y={71} stroke="rgba(248,81,73,0.3)" strokeDasharray="4 4" />

            {crosshairTime && (
              <ReferenceLine x={new Date(crosshairTime).getTime()} stroke={ct.crosshair} strokeWidth={1} />
            )}

            <Area
              type="monotoneX"
              dataKey="score"
              stroke="#FF6B6B"
              strokeWidth={2.5}
              fill="url(#riskGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#FF6B6B', stroke: ct.activeDotStroke, strokeWidth: 2 }}
              isAnimationActive={false}
            />

            <Tooltip
              contentStyle={{
                background: ct.tooltipBg,
                border: `1px solid ${ct.tooltipBorder}`,
                borderRadius: 8,
                fontSize: 12,
                color: ct.tooltipText,
              }}
              labelFormatter={(val) => new Date(val).toLocaleTimeString()}
              formatter={(val: any) => [Number(val)?.toFixed(1), 'Risk Score']}
            />
          </AreaChart>
        </ResponsiveContainer>

        {selectionBox && selectionBox.width > 2 && selectionBox.height > 2 && (
          <div
            className="absolute pointer-events-none border-2 border-dashed border-dg-info bg-dg-info/10 z-[2]"
            style={{
              left: selectionBox.x,
              top: selectionBox.y,
              width: selectionBox.width,
              height: selectionBox.height,
            }}
          />
        )}
      </div>
    </div>
  );
}
