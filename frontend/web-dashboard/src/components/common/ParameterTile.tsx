import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { SensorParameter, SensorReading } from '../../types';

interface ParameterTileProps {
  parameter: SensorParameter;
  readings: SensorReading[];
  isAlertContributor?: boolean;
}

export default function ParameterTile({ parameter, readings, isAlertContributor = false }: ParameterTileProps) {
  const latest = readings[readings.length - 1];
  const prev = readings.length > 1 ? readings[readings.length - 2] : null;
  const value = latest?.[parameter.key] as number | null;
  const prevValue = prev?.[parameter.key] as number | null;

  let trend: 'up' | 'down' | 'flat' = 'flat';
  if (value !== null && prevValue !== null) {
    const diff = value - prevValue;
    if (diff > 0.5) trend = 'up';
    else if (diff < -0.5) trend = 'down';
  }

  const isAboveBaseline = value !== null && value > parameter.baselineMax;
  const isBelowBaseline = value !== null && value < parameter.baselineMin;
  const isOutOfRange = isAboveBaseline || isBelowBaseline;

  return (
    <div
      className={`
        flex-shrink-0 w-[140px] h-20 rounded-lg p-3 border transition-all duration-200
        ${isAlertContributor
          ? 'border-dg-action bg-[rgba(248,81,73,0.05)]'
          : isOutOfRange
            ? 'border-dg-watch bg-[rgba(210,153,34,0.05)]'
            : 'border-dg-border bg-dg-bg-card'
        }
      `}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium" style={{ color: parameter.color }}>
          {parameter.abbreviation}
        </span>
        {isAlertContributor && (
          <span className="w-2 h-2 rounded-full bg-dg-action animate-pulse" />
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="font-mono text-xl font-bold text-dg-text-primary tabular-nums">
            {value !== null ? value.toFixed(1) : '--'}
          </span>
          <span className="text-[11px] text-dg-text-tertiary ml-1">{parameter.unit}</span>
        </div>
        <div className="mb-1">
          {trend === 'up' && <TrendingUp size={14} className={isOutOfRange ? 'text-dg-action' : 'text-dg-text-tertiary'} />}
          {trend === 'down' && <TrendingDown size={14} className={isOutOfRange ? 'text-dg-action' : 'text-dg-text-tertiary'} />}
          {trend === 'flat' && <Minus size={14} className="text-dg-text-tertiary" />}
        </div>
      </div>
    </div>
  );
}
