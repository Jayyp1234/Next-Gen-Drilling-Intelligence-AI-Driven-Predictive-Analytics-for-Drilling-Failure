import { useState, useMemo } from 'react';
import { Eye, CheckCircle, Search, Download, X, Clock } from 'lucide-react';
import { useDrillGuard } from '../context/DrillGuardContext';
import { RISK_COLORS, MODEL_COLORS, timeAgo } from '../lib/constants';
import TimeToImpactBadge from '../components/common/TimeToImpactBadge';
import type { Alert, AlertSeverity, AlertStatus } from '../types';

export default function AlertManagement() {
  const { alerts, wells, acknowledgeAlert, markFalsePositive } = useDrillGuard();
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'ALL'>('ALL');
  const [wellFilter, setWellFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFpModal, setShowFpModal] = useState(false);
  const [fpReason, setFpReason] = useState('');

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (wellFilter !== 'ALL' && a.well_id !== wellFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const wellName = wells.find(w => w.id === a.well_id)?.name?.toLowerCase() || '';
        if (!a.description.toLowerCase().includes(q) && !wellName.includes(q)) return false;
      }
      return true;
    });
  }, [alerts, severityFilter, statusFilter, wellFilter, searchQuery, wells]);

  const getWellName = (wellId: string) => wells.find(w => w.id === wellId)?.name || wellId;

  function handleAcknowledge(alertId: string) {
    acknowledgeAlert(alertId);
    if (selectedAlert?.id === alertId) {
      setSelectedAlert(prev => prev ? { ...prev, status: 'acknowledged' } : null);
    }
  }

  function handleFalsePositive() {
    if (selectedAlert && fpReason) {
      markFalsePositive(selectedAlert.id, fpReason);
      setSelectedAlert(prev => prev ? { ...prev, status: 'false_positive', false_positive_reason: fpReason } : null);
      setShowFpModal(false);
      setFpReason('');
    }
  }

  return (
    <div className="flex gap-0">
      <div className={`flex-1 min-w-0 transition-all duration-200 ${selectedAlert ? 'lg:mr-80' : ''}`}>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value as AlertSeverity | 'ALL')}
            className="h-9 bg-dg-bg-primary border border-dg-border rounded-lg px-3 text-sm text-dg-text-primary outline-none focus:border-dg-info"
          >
            <option value="ALL">All Severities</option>
            <option value="ACTION">Action</option>
            <option value="ELEVATED">Elevated</option>
            <option value="WATCH">Watch</option>
          </select>

          <select
            value={wellFilter}
            onChange={e => setWellFilter(e.target.value)}
            className="h-9 bg-dg-bg-primary border border-dg-border rounded-lg px-3 text-sm text-dg-text-primary outline-none focus:border-dg-info"
          >
            <option value="ALL">All Wells</option>
            {wells.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as AlertStatus | 'ALL')}
            className="h-9 bg-dg-bg-primary border border-dg-border rounded-lg px-3 text-sm text-dg-text-primary outline-none focus:border-dg-info"
          >
            <option value="ALL">All Statuses</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False Positive</option>
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dg-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search alerts..."
              className="w-full h-9 bg-dg-bg-primary border border-dg-border rounded-lg pl-8 pr-3 text-sm text-dg-text-primary placeholder-dg-text-tertiary outline-none focus:border-dg-info"
            />
          </div>

          <button className="h-9 px-3 border border-dg-border rounded-lg text-sm text-dg-text-secondary hover:text-dg-text-primary hover:bg-dg-bg-card-hover transition-colors flex items-center gap-1.5">
            <Download size={14} />
            Export CSV
          </button>
        </div>

        <div className="bg-dg-bg-card border border-dg-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dg-bg-primary">
                  {['Severity', 'Well', 'Risk Score', 'Time', 'Model', 'Status', 'Actions'].map(col => (
                    <th key={col} className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-dg-text-tertiary font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map(alert => {
                  const color = RISK_COLORS[alert.severity];
                  const isSelected = selectedAlert?.id === alert.id;
                  return (
                    <tr
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className={`
                        border-t border-dg-border-muted cursor-pointer transition-colors
                        ${isSelected ? 'bg-dg-bg-card-active' : 'hover:bg-dg-bg-card-hover'}
                        ${alert.status === 'new' ? '' : 'opacity-70'}
                      `}
                      style={alert.status === 'new' ? { boxShadow: `inset 3px 0 0 ${color}` } : undefined}
                    >
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-dg-text-primary">{getWellName(alert.well_id)}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-bold tabular-nums" style={{ color }}>
                          {alert.risk_score}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-dg-text-secondary">{timeAgo(alert.created_at)}</td>
                      <td className="px-4 py-3">
                        {alert.contributing_model && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{
                              backgroundColor: `${MODEL_COLORS[alert.contributing_model]}20`,
                              color: MODEL_COLORS[alert.contributing_model],
                            }}
                          >
                            {alert.contributing_model}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor:
                                alert.status === 'new' ? '#58A6FF'
                                : alert.status === 'acknowledged' ? '#2EA043'
                                : alert.status === 'false_positive' ? '#8B949E'
                                : '#6E7681',
                            }}
                          />
                          <span className="text-dg-text-secondary capitalize">{alert.status.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedAlert(alert); }}
                            className="p-1.5 text-dg-text-tertiary hover:text-dg-info transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                          {alert.status === 'new' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAcknowledge(alert.id); }}
                              className="p-1.5 text-dg-text-tertiary hover:text-dg-normal transition-colors"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredAlerts.length === 0 && (
            <div className="text-center py-12 text-dg-text-tertiary text-sm">
              No alerts match the current filters.
            </div>
          )}
        </div>
      </div>

      {selectedAlert && (
        <div className="fixed right-0 top-14 bottom-0 w-80 bg-dg-bg-card border-l border-dg-border overflow-y-auto z-sidebar hidden lg:block">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-dg-text-primary">Alert Detail</h2>
              <button onClick={() => setSelectedAlert(null)} className="text-dg-text-tertiary hover:text-dg-text-primary">
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span
                className="text-4xl font-bold font-mono tabular-nums"
                style={{ color: RISK_COLORS[selectedAlert.severity] }}
              >
                {selectedAlert.risk_score}
              </span>
              {selectedAlert.tti_minutes !== null && (
                <TimeToImpactBadge minutes={selectedAlert.tti_minutes} level={selectedAlert.severity} size="small" />
              )}
            </div>

            <div className="text-xs text-dg-text-tertiary flex items-center gap-1">
              <Clock size={12} />
              {new Date(selectedAlert.created_at).toLocaleString()}
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider text-dg-text-tertiary font-medium mb-2">Contributing Features</p>
              <div className="space-y-2">
                {selectedAlert.contributing_features.map((f, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-dg-text-secondary">{f.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-dg-bg-card-active rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, f.deviation * 33)}%`,
                            backgroundColor: f.deviation > 2 ? '#F85149' : f.deviation > 1.5 ? '#E87C25' : '#D29922',
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-dg-text-tertiary tabular-nums">
                        {f.deviation.toFixed(1)}\u03C3 {f.direction}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider text-dg-text-tertiary font-medium mb-2">Recommended Actions</p>
              <div className="space-y-2">
                {['Monitor torque trends closely for next 15 minutes', 'Consider reducing WOB if trend continues', 'Prepare contingency for short trip if needed'].map((action, i) => (
                  <div key={i} className="flex gap-2 p-2 rounded-lg" style={{ borderLeft: '3px solid #D29922', backgroundColor: 'rgba(210,153,34,0.04)' }}>
                    <span className="text-xs text-dg-watch font-bold shrink-0">{i + 1}.</span>
                    <span className="text-xs text-dg-text-secondary">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {selectedAlert.status === 'new' && (
                <button
                  onClick={() => handleAcknowledge(selectedAlert.id)}
                  className="w-full h-10 bg-dg-normal text-white font-medium rounded-lg hover:bg-dg-normal/90 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} />
                  Acknowledge
                </button>
              )}
              <button
                onClick={() => setShowFpModal(true)}
                className="w-full h-10 border border-dg-border text-dg-text-secondary rounded-lg hover:bg-dg-bg-card-hover transition-colors text-sm"
              >
                Mark as False Positive
              </button>
            </div>
          </div>
        </div>
      )}

      {showFpModal && (
        <div className="fixed inset-0 z-modal flex items-center justify-center" style={{ backgroundColor: 'rgba(1,4,9,0.80)' }}>
          <div className="bg-dg-bg-card border border-dg-border rounded-xl p-6 w-full max-w-md shadow-[0_10px_20px_rgba(0,0,0,0.19),0_6px_6px_rgba(0,0,0,0.23)]">
            <h3 className="text-base font-semibold text-dg-text-primary mb-4">Mark as False Positive</h3>
            <select
              value={fpReason}
              onChange={e => setFpReason(e.target.value)}
              className="w-full h-10 bg-dg-bg-primary border border-dg-border rounded-lg px-3 text-sm text-dg-text-primary outline-none focus:border-dg-info mb-3"
            >
              <option value="">Select a reason...</option>
              <option value="Normal variation">Normal variation</option>
              <option value="Formation change">Formation change</option>
              <option value="Equipment behavior">Equipment behavior</option>
              <option value="Tripping artifact">Tripping artifact</option>
              <option value="Other">Other</option>
            </select>
            <textarea
              placeholder="Additional notes (optional)"
              className="w-full h-20 bg-dg-bg-primary border border-dg-border rounded-lg p-3 text-sm text-dg-text-primary placeholder-dg-text-tertiary outline-none focus:border-dg-info resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowFpModal(false)}
                className="flex-1 h-10 border border-dg-border text-dg-text-secondary rounded-lg hover:bg-dg-bg-card-hover transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleFalsePositive}
                disabled={!fpReason}
                className="flex-1 h-10 bg-dg-action text-white font-medium rounded-lg hover:bg-dg-action/90 transition-colors text-sm disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
