import { useNavigate } from 'react-router-dom';
import { ArrowDown, Clock } from 'lucide-react';
import type { Well } from '../../types';
import { RISK_COLORS, timeAgo } from '../../lib/constants';
import RiskScoreGauge from '../charts/RiskScoreGauge';
import TimeToImpactBadge from './TimeToImpactBadge';

interface WellStatusCardProps {
  well: Well;
}

const STATE_COLORS: Record<string, string> = {
  drilling: '#58A6FF',
  tripping: '#D29922',
  circulating: '#2EA043',
  idle: '#8B949E',
};

export default function WellStatusCard({ well }: WellStatusCardProps) {
  const navigate = useNavigate();
  const color = RISK_COLORS[well.risk_level];
  const isAction = well.risk_level === 'ACTION';

  return (
    <div
      onClick={() => navigate(`/wells/${well.id}`)}
      className={`
        bg-dg-bg-card border border-dg-border rounded-lg p-5 cursor-pointer
        transition-all duration-200 hover:-translate-y-0.5
        hover:shadow-[0_3px_6px_rgba(0,0,0,0.16),0_3px_6px_rgba(0,0,0,0.23)]
        hover:border-[#484F58]
        ${isAction ? 'animate-glow-pulse' : ''}
      `}
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold text-dg-text-primary truncate">{well.name}</h3>
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-medium capitalize"
              style={{
                backgroundColor: `${STATE_COLORS[well.operational_state]}15`,
                color: STATE_COLORS[well.operational_state],
              }}
            >
              {well.operational_state}
            </span>
          </div>

          <div className="flex items-center gap-1 text-dg-text-primary mb-3">
            <ArrowDown size={16} className="text-dg-text-tertiary" />
            <span className="text-2xl font-bold tabular-nums">{well.depth.toFixed(0)}</span>
            <span className="text-sm text-dg-text-secondary">m MD</span>
          </div>

          {well.tti_minutes !== null && well.risk_level !== 'NORMAL' && (
            <TimeToImpactBadge minutes={well.tti_minutes} level={well.risk_level} size="small" />
          )}

          <div className="flex items-center gap-1 mt-2">
            <Clock size={10} className="text-dg-text-tertiary" />
            <span className="text-[11px] text-dg-text-tertiary">{timeAgo(well.updated_at)}</span>
          </div>
        </div>

        <RiskScoreGauge score={well.risk_score} level={well.risk_level} size="small" showLabel={false} />
      </div>
    </div>
  );
}
