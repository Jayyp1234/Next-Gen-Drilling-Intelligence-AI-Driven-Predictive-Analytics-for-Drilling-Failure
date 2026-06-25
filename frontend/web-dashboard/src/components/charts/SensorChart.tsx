import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ReferenceArea,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import type { SensorReading, SensorParameter } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { getChartTheme } from '../../lib/chartTheme';

interface SensorChartProps {
  readings: SensorReading[];
  parameter: SensorParameter;
  height?: number;
  crosshairTime?: string | null;
  onHover?: (time: string | null) => void;
  /** When set, X axis is zoomed to this time range (ms). */
  xDomain?: [number, number] | null;
  /** Called when user finishes drawing a selection box (start and end time in ms). */
  onSelectionComplete?: (startTime: number, endTime: number) => void;
}

const MIN_DRAG_PX = 8;

export default function SensorChart({
  readings,
  parameter,
  height = 120,
  crosshairTime,
  onHover,
  xDomain,
  onSelectionComplete,
}: SensorChartProps) {
  const { theme } = useTheme();
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<{ x: number; y: number } | null>(null);
  const [chartRect, setChartRect] = useState({ width: 0, height: 0 });

  const ct = useMemo(() => getChartTheme(), [theme]);

  const data = useMemo(() => {
    return readings.map(r => ({
      time: new Date(r.timestamp).getTime(),
      value: r[parameter.key] as number | null,
      label: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  }, [readings, parameter.key]);

  const timeExtent = useMemo(() => {
    if (data.length === 0) return [0, 0] as [number, number];
    const times = data.map(d => d.time);
    return [Math.min(...times), Math.max(...times)] as [number, number];
  }, [data]);

  const domain = useMemo(() => {
    const values = data.map(d => d.value).filter((v): v is number => v !== null);
    if (values.length === 0) return [0, 100];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || 10;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
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
      const t = tMin + (px / chartRect.width) * (tMax - tMin);
      return Math.round(t);
    },
    [chartRect.width, timeExtent, xDomain]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!chartAreaRef.current || !onSelectionComplete) return;
      const rect = chartAreaRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setSelectionStart({ x, y });
      setSelectionCurrent({ x, y });
    },
    [onSelectionComplete]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!selectionStart) {
        if (e?.nativeEvent && (e as any).activePayload?.[0]) {
          const payload = (e as any).activePayload?.[0]?.payload;
          if (payload) onHover?.(new Date(payload.time).toISOString());
        }
        return;
      }
      if (!chartAreaRef.current) return;
      const rect = chartAreaRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      setSelectionCurrent({ x, y });
    },
    [selectionStart, onHover]
  );

  const handleMouseUp = useCallback(() => {
    if (!selectionStart || !selectionCurrent || !onSelectionComplete || !chartAreaRef.current) {
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
    <div
      className="relative select-none"
      style={{ height }}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute left-0 top-0 bottom-0 w-[72px] flex flex-col justify-center pl-2 z-[1]">
        <span className="text-xs font-semibold" style={{ color: parameter.color }}>
          {parameter.abbreviation}
        </span>
        <span className="text-[11px] text-dg-text-tertiary">{parameter.unit}</span>
      </div>
      <div
        ref={chartAreaRef}
        className="ml-[72px] h-full relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 4, right: 12, bottom: 4, left: 0 }}
            onMouseMove={(e: any) => {
              if (selectionStart) return;
              if (e?.activePayload?.[0]) {
                onHover?.(new Date(e.activePayload[0].payload.time).toISOString());
              }
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={ct.grid}
              vertical={false}
            />
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
              domain={domain}
              stroke={ct.axis}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={40}
            />

            <ReferenceArea
              y1={parameter.baselineMin}
              y2={parameter.baselineMax}
              fill="rgba(46,160,67,0.08)"
              strokeOpacity={0}
            />
            <ReferenceLine
              y={parameter.baselineMin}
              stroke="rgba(46,160,67,0.3)"
              strokeDasharray="4 4"
            />
            <ReferenceLine
              y={parameter.baselineMax}
              stroke="rgba(46,160,67,0.3)"
              strokeDasharray="4 4"
            />

            {crosshairTime && (
              <ReferenceLine
                x={new Date(crosshairTime).getTime()}
                stroke={ct.crosshair}
                strokeWidth={1}
              />
            )}

            <Line
              type="monotoneX"
              dataKey="value"
              stroke={parameter.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: parameter.color, stroke: ct.activeDotStroke, strokeWidth: 2 }}
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
              formatter={(val: any) => [Number(val)?.toFixed(2), parameter.label]}
            />
          </LineChart>
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
