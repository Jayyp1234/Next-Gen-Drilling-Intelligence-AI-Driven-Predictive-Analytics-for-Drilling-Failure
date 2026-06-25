import { useMemo } from 'react';
import { X, ZoomOut, BarChart3 } from 'lucide-react';
import type { SensorReading } from '../../types';
import { SENSOR_PARAMETERS } from '../../lib/constants';
import SensorChart from '../charts/SensorChart';
import RiskScoreChart from '../charts/RiskScoreChart';

interface LogAnalysisModalProps {
  wellName: string;
  startTime: number;
  endTime: number;
  readings: SensorReading[];
  onClose: () => void;
  onResetZoom: () => void;
  isZoomed: boolean;
}

function statForReadings(
  readings: SensorReading[],
  key: keyof SensorReading
): { min: number; max: number; mean: number; count: number } {
  const values = readings
    .map(r => (r as Record<string, unknown>)[key] as number | null)
    .filter((v): v is number => v != null && typeof v === 'number');
  if (values.length === 0) return { min: 0, max: 0, mean: 0, count: 0 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return { min, max, mean, count: values.length };
}

function formatVal(v: number, unit: string): string {
  if (unit === 'gAPI' || unit === 'ppg' || unit === 'degF' || unit === 'psi') return v.toFixed(1);
  if (unit === '%' || unit === 'rpm') return v.toFixed(0);
  return v.toFixed(2);
}

export default function LogAnalysisModal({
  wellName,
  startTime,
  endTime,
  readings,
  onClose,
  onResetZoom,
  isZoomed,
}: LogAnalysisModalProps) {
  const filteredReadings = useMemo(() => {
    const start = startTime;
    const end = endTime;
    return readings.filter(r => {
      const t = new Date(r.timestamp).getTime();
      return t >= start && t <= end;
    });
  }, [readings, startTime, endTime]);

  const riskStats = useMemo(
    () => statForReadings(filteredReadings, 'risk_score'),
    [filteredReadings]
  );

  const paramStats = useMemo(() => {
    return SENSOR_PARAMETERS.map(param => ({
      param,
      ...statForReadings(filteredReadings, param.key),
    }));
  }, [filteredReadings]);

  const timeLabel = useMemo(() => {
    const s = new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const e = new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = new Date(startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    return `${dateStr} · ${s} – ${e}`;
  }, [startTime, endTime]);

  const durationMin = useMemo(() => {
    return (endTime - startTime) / 60000;
  }, [startTime, endTime]);

  /** Key params to show in modal charts (first 4 + risk). */
  const chartParams = useMemo(() => SENSOR_PARAMETERS.slice(0, 4), []);

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-dg-bg-card border border-dg-border rounded-xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-labelledby="log-analysis-title"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-dg-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-dg-info/10 border border-dg-info/30">
              <BarChart3 size={20} className="text-dg-info" />
            </div>
            <div>
              <h2 id="log-analysis-title" className="text-lg font-semibold text-dg-text-primary">
                Analyze time range
              </h2>
              <p className="text-sm text-dg-text-tertiary">{wellName} · {timeLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-dg-text-tertiary hover:text-dg-text-primary hover:bg-dg-bg-card-hover transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-dg-bg-primary border border-dg-border rounded-lg px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-dg-text-tertiary font-medium">Samples</p>
              <p className="text-lg font-semibold text-dg-text-primary tabular-nums">{filteredReadings.length}</p>
            </div>
            <div className="bg-dg-bg-primary border border-dg-border rounded-lg px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-dg-text-tertiary font-medium">Duration</p>
              <p className="text-lg font-semibold text-dg-text-primary tabular-nums">
                {durationMin < 60 ? `${durationMin.toFixed(1)} min` : `${(durationMin / 60).toFixed(1)} h`}
              </p>
            </div>
            <div className="bg-dg-bg-primary border border-dg-border rounded-lg px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-dg-text-tertiary font-medium">Risk (avg)</p>
              <p className="text-lg font-semibold text-dg-text-primary tabular-nums">
                {riskStats.count > 0 ? riskStats.mean.toFixed(1) : '–'}
              </p>
            </div>
            <div className="bg-dg-bg-primary border border-dg-border rounded-lg px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-dg-text-tertiary font-medium">Risk (max)</p>
              <p className="text-lg font-semibold text-dg-text-primary tabular-nums">
                {riskStats.count > 0 ? riskStats.max.toFixed(1) : '–'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-dg-text-secondary uppercase tracking-wider mb-3">
              Charts in selected range
            </h3>
            <div className="bg-dg-bg-primary border border-dg-border rounded-xl overflow-hidden">
              {chartParams.map(param => (
                <div key={param.key} className="border-b border-dg-border-muted last:border-b-0">
                  <SensorChart
                    readings={filteredReadings}
                    parameter={param}
                    height={88}
                  />
                </div>
              ))}
              <div className="border-t border-dg-border">
                <RiskScoreChart readings={filteredReadings} height={100} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-dg-text-secondary uppercase tracking-wider mb-3">
              Parameter statistics in range
            </h3>
            <div className="border border-dg-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-dg-bg-primary border-b border-dg-border">
                    <th className="text-left py-2.5 px-3 text-dg-text-tertiary font-medium">Parameter</th>
                    <th className="text-right py-2.5 px-3 text-dg-text-tertiary font-medium">Min</th>
                    <th className="text-right py-2.5 px-3 text-dg-text-tertiary font-medium">Max</th>
                    <th className="text-right py-2.5 px-3 text-dg-text-tertiary font-medium">Mean</th>
                  </tr>
                </thead>
                <tbody>
                  {paramStats.map(({ param, min, max, mean, count }) => (
                    <tr
                      key={param.key}
                      className="border-b border-dg-border-muted last:border-b-0 hover:bg-dg-bg-card-hover/50"
                    >
                      <td className="py-2 px-3">
                        <span className="font-medium text-dg-text-primary">{param.abbreviation}</span>
                        <span className="text-dg-text-tertiary ml-1">{param.unit}</span>
                      </td>
                      <td className="text-right py-2 px-3 tabular-nums text-dg-text-secondary">
                        {count > 0 ? formatVal(min, param.unit) : '–'}
                      </td>
                      <td className="text-right py-2 px-3 tabular-nums text-dg-text-secondary">
                        {count > 0 ? formatVal(max, param.unit) : '–'}
                      </td>
                      <td className="text-right py-2 px-3 tabular-nums text-dg-text-primary">
                        {count > 0 ? formatVal(mean, param.unit) : '–'}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b border-dg-border-muted last:border-b-0 bg-dg-bg-primary/50">
                    <td className="py-2 px-3">
                      <span className="font-medium text-dg-text-primary">RISK</span>
                      <span className="text-dg-text-tertiary ml-1">score</span>
                    </td>
                    <td className="text-right py-2 px-3 tabular-nums text-dg-text-secondary">
                      {riskStats.count > 0 ? riskStats.min.toFixed(1) : '–'}
                    </td>
                    <td className="text-right py-2 px-3 tabular-nums text-dg-text-secondary">
                      {riskStats.count > 0 ? riskStats.max.toFixed(1) : '–'}
                    </td>
                    <td className="text-right py-2 px-3 tabular-nums text-dg-text-primary">
                      {riskStats.count > 0 ? riskStats.mean.toFixed(1) : '–'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-dg-border bg-dg-bg-primary/50 shrink-0">
          <p className="text-xs text-dg-text-tertiary">
            Drag a box on any log to select a range; release to zoom and open this analysis.
          </p>
          <div className="flex items-center gap-2">
            {isZoomed ? (
              <button
                onClick={onResetZoom}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dg-border text-dg-text-secondary hover:text-dg-text-primary hover:bg-dg-bg-card-hover transition-colors text-sm font-medium"
              >
                <ZoomOut size={16} />
                Reset zoom
              </button>
            ) : (
              <span className="text-xs text-dg-text-tertiary">Charts show full range</span>
            )}
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-dg-info text-dg-bg-primary hover:opacity-90 transition-opacity text-sm font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
