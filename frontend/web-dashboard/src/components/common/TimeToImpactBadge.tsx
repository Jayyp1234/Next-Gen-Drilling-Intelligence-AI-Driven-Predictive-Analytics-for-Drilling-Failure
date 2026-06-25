import { Clock } from 'lucide-react';
import { RISK_COLORS, formatTTI } from '../../lib/constants';
import type { RiskLevel, AlertSeverity } from '../../types';

interface TimeToImpactBadgeProps {
  minutes: number | null;
  level: RiskLevel | AlertSeverity;
  size?: 'small' | 'default';
}

export default function TimeToImpactBadge({ minutes, level, size = 'default' }: TimeToImpactBadgeProps) {
  const isStable = minutes === null || minutes < 0;
  const color = isStable ? '#2EA043' : RISK_COLORS[level as RiskLevel] || '#D29922';
  const isUrgent = minutes !== null && minutes <= 5;
  const isCritical = minutes !== null && minutes <= 1;

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-mono tabular-nums
        ${size === 'small' ? 'px-2 py-0.5 text-[10px]' : 'px-3.5 py-1.5 text-sm'}
        ${isUrgent ? 'animate-pulse' : ''}
      `}
      style={{
        backgroundColor: isCritical ? color : `${color}15`,
        border: `1px solid ${color}50`,
        color: isCritical ? '#FFFFFF' : color,
      }}
    >
      <Clock size={size === 'small' ? 10 : 14} />
      <span className={size === 'small' ? '' : 'text-xs font-medium'}>TTI:</span>
      <span className="font-bold">{formatTTI(minutes)}</span>
    </span>
  );
}
