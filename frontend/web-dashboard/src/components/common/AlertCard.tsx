import { ShieldAlert, Clock, CheckCircle } from 'lucide-react';
import type { Alert } from '../../types';
import { RISK_COLORS, timeAgo } from '../../lib/constants';
import TimeToImpactBadge from './TimeToImpactBadge';

interface AlertCardProps {
  alert: Alert;
  onClick?: () => void;
  compact?: boolean;
}

export default function AlertCard({ alert, onClick, compact = false }: AlertCardProps) {
  const color = RISK_COLORS[alert.severity];
  const isAcknowledged = alert.status === 'acknowledged';

  return (
    <div
      onClick={onClick}
      className={`
        bg-dg-bg-card border border-dg-border rounded-lg cursor-pointer
        transition-all duration-200 hover:bg-dg-bg-card-hover
        ${isAcknowledged ? 'opacity-60' : ''}
      `}
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <div className={compact ? 'p-3' : 'p-3 px-4'}>
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{ backgroundColor: `${color}20`, color }}
          >
            <ShieldAlert size={12} />
            {alert.severity}
          </span>
          <span className="text-[11px] text-dg-text-tertiary flex items-center gap-1">
            <Clock size={10} />
            {timeAgo(alert.created_at)}
          </span>
        </div>

        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-dg-text-secondary">
            {alert.well_name || alert.well_id}
          </span>
          <span className="font-mono text-lg font-bold tabular-nums" style={{ color }}>
            {alert.risk_score}
          </span>
        </div>

        {!compact && (
          <p className="text-xs text-dg-text-secondary line-clamp-1 mb-2">
            {alert.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {alert.contributing_model && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{
                  backgroundColor: `${
                    alert.contributing_model === 'RF' ? '#58A6FF' :
                    alert.contributing_model === 'LSTM' ? '#8E32E9' : '#D29922'
                  }20`,
                  color: alert.contributing_model === 'RF' ? '#58A6FF' :
                    alert.contributing_model === 'LSTM' ? '#8E32E9' : '#D29922',
                }}
              >
                {alert.contributing_model}
              </span>
            )}
            {alert.tti_minutes !== null && (
              <TimeToImpactBadge minutes={alert.tti_minutes} level={alert.severity} size="small" />
            )}
          </div>

          {isAcknowledged && (
            <span className="flex items-center gap-1 text-[11px] text-dg-normal">
              <CheckCircle size={12} />
              Acked
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
