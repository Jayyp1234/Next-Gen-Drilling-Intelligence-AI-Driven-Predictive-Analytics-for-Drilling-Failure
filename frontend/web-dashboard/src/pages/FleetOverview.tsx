import { useMemo, useState } from 'react';
import { useDrillGuard } from '../context/DrillGuardContext';
import WellStatusCard from '../components/common/WellStatusCard';
import GeospatialView from '../components/fleet/GeospatialView';
import ShiftHandover from '../components/fleet/ShiftHandover';
import type { RiskLevel } from '../types';
import { RISK_COLORS } from '../lib/constants';
import { generateShiftSummaries } from '../lib/mockData';
import { LayoutGrid, Map, ArrowRightLeft } from 'lucide-react';

const RISK_ORDER: Record<RiskLevel, number> = { ACTION: 0, ELEVATED: 1, WATCH: 2, NORMAL: 3 };

export default function FleetOverview() {
  const { wells } = useDrillGuard();
  const [activeTab, setActiveTab] = useState<'grid' | 'map' | 'handover'>('grid');

  const sortedWells = useMemo(() => {
    return [...wells].sort((a, b) => {
      const orderDiff = RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level];
      if (orderDiff !== 0) return orderDiff;
      return b.risk_score - a.risk_score;
    });
  }, [wells]);

  const shiftSummaries = useMemo(() => generateShiftSummaries(wells), [wells]);

  const counts = useMemo(() => {
    const c = { total: wells.length, NORMAL: 0, WATCH: 0, ELEVATED: 0, ACTION: 0 };
    wells.forEach(w => c[w.risk_level]++);
    return c;
  }, [wells]);

  const summaryItems: Array<{ label: string; count: number; color: string; level: RiskLevel | null }> = [
    { label: 'Total Wells', count: counts.total, color: '#E6EDF3', level: null },
    { label: 'Normal', count: counts.NORMAL, color: RISK_COLORS.NORMAL, level: 'NORMAL' },
    { label: 'Watch', count: counts.WATCH, color: RISK_COLORS.WATCH, level: 'WATCH' },
    { label: 'Elevated', count: counts.ELEVATED, color: RISK_COLORS.ELEVATED, level: 'ELEVATED' },
    { label: 'Action', count: counts.ACTION, color: RISK_COLORS.ACTION, level: 'ACTION' },
  ];

  const tabs = [
    { id: 'grid' as const, label: 'Fleet Grid', icon: LayoutGrid },
    { id: 'map' as const, label: 'Geospatial', icon: Map },
    { id: 'handover' as const, label: 'Shift Handover', icon: ArrowRightLeft },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-dg-bg-card border border-dg-border rounded-xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {summaryItems.map(item => (
            <div
              key={item.label}
              className={`text-center p-3 rounded-lg ${
                item.level === 'ACTION' && counts.ACTION > 0 ? 'animate-pulse-action' : ''
              }`}
              style={{
                backgroundColor: item.level ? `${item.color}08` : 'transparent',
                border: item.level ? `1px solid ${item.color}20` : 'none',
              }}
            >
              <p className="text-[11px] uppercase tracking-wider text-dg-text-tertiary font-medium mb-1">
                {item.label}
              </p>
              <p className="text-3xl font-bold tabular-nums" style={{ color: item.color }}>
                {item.count}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 bg-dg-bg-card border border-dg-border rounded-xl p-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-dg-info/10 text-dg-info border border-dg-info/20'
                  : 'text-dg-text-tertiary hover:text-dg-text-secondary hover:bg-dg-bg-card-hover border border-transparent'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sortedWells.map((well, i) => (
            <div
              key={well.id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <WellStatusCard well={well} />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'map' && (
        <div className="animate-fade-in">
          <GeospatialView wells={wells} />
        </div>
      )}

      {activeTab === 'handover' && (
        <div className="animate-fade-in">
          <ShiftHandover summaries={shiftSummaries} />
        </div>
      )}
    </div>
  );
}
