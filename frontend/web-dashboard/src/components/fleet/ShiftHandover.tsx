import { useState, useMemo } from 'react';
import type { ShiftSummary } from '../../types';
import { RISK_COLORS } from '../../lib/constants';
import {
  Clock, AlertTriangle, ArrowRightLeft, ChevronDown, ChevronUp,
  Activity, Wrench, Brain, TrendingUp, Users, FileText
} from 'lucide-react';

const STATUS_CONFIG = {
  critical: { color: RISK_COLORS.ACTION, label: 'Critical', bg: 'rgba(248,81,73,0.10)', border: 'rgba(248,81,73,0.30)' },
  caution: { color: RISK_COLORS.ELEVATED, label: 'Caution', bg: 'rgba(232,124,37,0.10)', border: 'rgba(232,124,37,0.30)' },
  safe: { color: RISK_COLORS.NORMAL, label: 'All Clear', bg: 'rgba(46,160,67,0.10)', border: 'rgba(46,160,67,0.30)' },
};

interface Props {
  summaries: ShiftSummary[];
}

export default function ShiftHandover({ summaries }: Props) {
  const [expandedWell, setExpandedWell] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const sortedSummaries = useMemo(() => {
    const order = { critical: 0, caution: 1, safe: 2 };
    return [...summaries].sort((a, b) => order[a.status] - order[b.status]);
  }, [summaries]);

  const displayed = showAll ? sortedSummaries : sortedSummaries.slice(0, 4);

  const shiftTime = summaries[0]
    ? `${new Date(summaries[0].shiftStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${new Date(summaries[0].shiftEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '';

  const overallStatus = useMemo(() => {
    if (summaries.some(s => s.status === 'critical')) return 'critical';
    if (summaries.some(s => s.status === 'caution')) return 'caution';
    return 'safe';
  }, [summaries]);

  const totalAlerts = summaries.reduce((acc, s) => acc + s.alertCount, 0);
  const totalDepthDrilled = summaries.reduce((acc, s) => acc + (s.depthEnd - s.depthStart), 0);

  return (
    <div className="bg-dg-bg-card border border-dg-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-dg-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: STATUS_CONFIG[overallStatus].bg, border: `1px solid ${STATUS_CONFIG[overallStatus].border}` }}>
              <ArrowRightLeft size={18} style={{ color: STATUS_CONFIG[overallStatus].color }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dg-text-primary">AI Shift Handover Report</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Clock size={11} className="text-dg-text-tertiary" />
                <span className="text-[11px] text-dg-text-tertiary">{shiftTime}</span>
              </div>
            </div>
          </div>
          <div
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
            style={{
              backgroundColor: STATUS_CONFIG[overallStatus].bg,
              color: STATUS_CONFIG[overallStatus].color,
              border: `1px solid ${STATUS_CONFIG[overallStatus].border}`,
            }}
          >
            {STATUS_CONFIG[overallStatus].label}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-dg-bg-card-hover">
            <p className="text-[10px] text-dg-text-tertiary uppercase tracking-wider">Fleet Alerts</p>
            <p className="text-lg font-bold text-dg-text-primary mt-0.5">{totalAlerts}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-dg-bg-card-hover">
            <p className="text-[10px] text-dg-text-tertiary uppercase tracking-wider">Total Drilled</p>
            <p className="text-lg font-bold text-dg-text-primary mt-0.5">{totalDepthDrilled}m</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-dg-bg-card-hover">
            <p className="text-[10px] text-dg-text-tertiary uppercase tracking-wider">Active Wells</p>
            <p className="text-lg font-bold text-dg-text-primary mt-0.5">{summaries.length}</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-dg-border-muted">
        {displayed.map(summary => {
          const isExpanded = expandedWell === summary.wellId;
          const cfg = STATUS_CONFIG[summary.status];

          return (
            <div key={summary.id}>
              <button
                onClick={() => setExpandedWell(isExpanded ? null : summary.wellId)}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-dg-bg-card-hover transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-dg-text-primary truncate">{summary.wellName}</p>
                    <p className="text-[11px] text-dg-text-tertiary">
                      {summary.depthStart}m → {summary.depthEnd}m | Risk Avg: {summary.riskScoreAvg}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {summary.alertCount > 0 && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                      <AlertTriangle size={10} />
                      {summary.alertCount}
                    </span>
                  )}
                  {isExpanded ? <ChevronUp size={14} className="text-dg-text-tertiary" /> : <ChevronDown size={14} className="text-dg-text-tertiary" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <MetricPill icon={<TrendingUp size={12} />} label="Avg ROP" value={`${summary.ropAvg.toFixed(1)} m/hr`} />
                    <MetricPill icon={<Activity size={12} />} label="Max Risk" value={String(summary.riskScoreMax)} color={cfg.color} />
                    <MetricPill icon={<Wrench size={12} />} label="MW" value={`${summary.mudWeight.toFixed(1)} ppg`} />
                    <MetricPill icon={<Users size={12} />} label="Crew" value={summary.crew.split('(')[0].trim()} />
                  </div>

                  <div className="mb-4 p-3 rounded-lg border border-dg-border-muted bg-dg-bg-card-hover">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={13} className="text-dg-info" />
                      <span className="text-[11px] font-semibold text-dg-info uppercase tracking-wider">AI Synthesis</span>
                    </div>
                    <p className="text-xs text-dg-text-secondary leading-relaxed">{summary.aiSummary}</p>
                  </div>

                  {summary.criticalEvents.length > 0 && (
                    <div className="mb-3">
                      <SectionLabel icon={<AlertTriangle size={11} />} label="Critical Events" color="#F85149" />
                      <ul className="space-y-1 mt-1.5">
                        {summary.criticalEvents.map((ev, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-dg-action">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-dg-action flex-shrink-0" />
                            {ev}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {summary.sensorAnomalies.length > 0 && (
                    <div className="mb-3">
                      <SectionLabel icon={<Activity size={11} />} label="Sensor Anomalies" color="#E87C25" />
                      <ul className="space-y-1 mt-1.5">
                        {summary.sensorAnomalies.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-dg-text-secondary">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-dg-elevated flex-shrink-0" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mb-3">
                    <SectionLabel icon={<FileText size={11} />} label="Operational Highlights" color={undefined} />
                    <ul className="space-y-1 mt-1.5">
                      {summary.operationalHighlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-dg-text-secondary">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-dg-text-tertiary flex-shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <SectionLabel icon={<Wrench size={11} />} label="Handover Recommendations" color="#58A6FF" />
                    <ul className="space-y-1 mt-1.5">
                      {summary.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-dg-info">
                          <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: '#58A6FF' }} />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-3 pt-3 border-t border-dg-border-muted flex items-center justify-between text-[10px] text-dg-text-tertiary">
                    <span>Outgoing: {summary.crew}</span>
                    <span className="text-dg-info">Incoming: {summary.incomingCrew}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sortedSummaries.length > 4 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2.5 text-[11px] text-dg-info hover:bg-dg-bg-card-hover transition-colors border-t border-dg-border font-medium"
        >
          {showAll ? 'Show Less' : `Show All ${sortedSummaries.length} Wells`}
        </button>
      )}
    </div>
  );
}

function MetricPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-dg-bg-primary border border-dg-border-muted">
      <span className="text-dg-text-tertiary">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] text-dg-text-tertiary uppercase tracking-wider">{label}</p>
        <p className="text-xs font-semibold truncate" style={{ color: color || 'var(--dg-text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}

function SectionLabel({ icon, label, color }: { icon: React.ReactNode; label: string; color: string | undefined }) {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ color: color || 'var(--dg-text-tertiary)' }}>{icon}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: color || 'var(--dg-text-tertiary)' }}>{label}</span>
    </div>
  );
}
