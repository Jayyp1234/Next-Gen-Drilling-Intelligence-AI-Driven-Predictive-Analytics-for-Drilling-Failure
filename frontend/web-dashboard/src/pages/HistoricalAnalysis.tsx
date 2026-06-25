import { useState, useMemo, useCallback } from 'react';
import { Calendar, TrendingUp, AlertTriangle, Clock, Target } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { useDrillGuard } from '../context/DrillGuardContext';
import { useTheme } from '../context/ThemeContext';
import { getChartTheme } from '../lib/chartTheme';
import { RISK_COLORS, timeAgo } from '../lib/constants';
import { generateHistoricalEvents } from '../lib/mockData';

const EVENT_TYPE_LABELS: Record<string, string> = {
  stuck_pipe: 'Stuck Pipe',
  kick: 'Kick',
  lost_circulation: 'Lost Circulation',
  washout: 'Washout',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  stuck_pipe: '#F85149',
  kick: '#E87C25',
  lost_circulation: '#D29922',
  washout: '#58A6FF',
};

function EventMarkerShape({ cx, cy, payload, selectedId }: any) {
  if (cx == null || cy == null) return null;
  const type: string = payload?.type || '';
  const isSelected = payload?.id === selectedId;
  const color = EVENT_TYPE_COLORS[type] || '#8B949E';
  const scale = isSelected ? 1.35 : 1;
  const opacity = isSelected ? 1 : 0.85;

  switch (type) {
    case 'stuck_pipe':
      return (
        <g transform={`translate(${cx}, ${cy}) scale(${scale})`} opacity={opacity} style={{ cursor: 'pointer' }}>
          <polygon
            points="0,-10 8,0 0,10 -8,0"
            fill={color}
            stroke={isSelected ? '#fff' : color}
            strokeWidth={isSelected ? 2 : 1}
            strokeOpacity={0.8}
          />
          <line x1="-3" y1="-2" x2="3" y2="-2" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" />
          <line x1="-3" y1="2" x2="3" y2="2" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" />
        </g>
      );

    case 'kick':
      return (
        <g transform={`translate(${cx}, ${cy}) scale(${scale})`} opacity={opacity} style={{ cursor: 'pointer' }}>
          <polygon
            points="0,-11 9,7 -9,7"
            fill={color}
            stroke={isSelected ? '#fff' : color}
            strokeWidth={isSelected ? 2 : 1}
            strokeOpacity={0.8}
            strokeLinejoin="round"
          />
          <line x1="0" y1="-4" x2="0" y2="1" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
          <circle cx={0} cy={4} r={1.2} fill="#fff" />
        </g>
      );

    case 'lost_circulation':
      return (
        <g transform={`translate(${cx}, ${cy}) scale(${scale})`} opacity={opacity} style={{ cursor: 'pointer' }}>
          <circle
            r={9}
            fill={color}
            stroke={isSelected ? '#fff' : color}
            strokeWidth={isSelected ? 2 : 1}
            strokeOpacity={0.8}
          />
          <path d="M0,-4 L0,4 M-2,2 L0,4 L2,2" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      );

    case 'washout':
      return (
        <g transform={`translate(${cx}, ${cy}) scale(${scale})`} opacity={opacity} style={{ cursor: 'pointer' }}>
          <rect
            x={-8}
            y={-8}
            width={16}
            height={16}
            rx={3}
            fill={color}
            stroke={isSelected ? '#fff' : color}
            strokeWidth={isSelected ? 2 : 1}
            strokeOpacity={0.8}
          />
          <path d="M-3,-2 Q0,3 3,-2 M-3,2 Q0,6 3,2" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" fill="none" />
        </g>
      );

    default:
      return (
        <g transform={`translate(${cx}, ${cy}) scale(${scale})`} opacity={opacity} style={{ cursor: 'pointer' }}>
          <circle r={7} fill={color} stroke={isSelected ? '#fff' : 'none'} strokeWidth={2} />
        </g>
      );
  }
}

function TimelineLegend() {
  const items: Array<{ type: string; label: string }> = [
    { type: 'stuck_pipe', label: 'Stuck Pipe' },
    { type: 'kick', label: 'Kick' },
    { type: 'lost_circulation', label: 'Lost Circulation' },
    { type: 'washout', label: 'Washout' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 px-1">
      {items.map(item => (
        <div key={item.type} className="flex items-center gap-1.5">
          <svg width={20} height={20} viewBox="-12 -12 24 24">
            <EventMarkerShape
              cx={0}
              cy={0}
              payload={{ type: item.type, severity: 'ELEVATED', id: null }}
              selectedId={null}
            />
          </svg>
          <span className="text-[11px] text-dg-text-secondary">{item.label}</span>
        </div>
      ))}
      <div className="ml-2 h-3 w-px bg-dg-border" />
      {(['WATCH', 'ELEVATED', 'ACTION'] as const).map(sev => (
        <div key={sev} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: RISK_COLORS[sev] }}
          />
          <span className="text-[11px] text-dg-text-secondary">{sev[0] + sev.slice(1).toLowerCase()}</span>
        </div>
      ))}
    </div>
  );
}

export default function HistoricalAnalysis() {
  const { wells } = useDrillGuard();
  const { theme } = useTheme();
  const ct = useMemo(() => getChartTheme(), [theme]);
  const [selectedWells, setSelectedWells] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const events = useMemo(() => generateHistoricalEvents(wells), [wells]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (selectedWells.length > 0 && !selectedWells.includes(e.well_id)) return false;
      if (selectedEventTypes.length > 0 && !selectedEventTypes.includes(e.event_type)) return false;
      return true;
    });
  }, [events, selectedWells, selectedEventTypes]);

  const timelineData = filteredEvents.map(e => ({
    time: new Date(e.start_time).getTime(),
    score: e.max_risk_score || 50,
    severity: e.severity,
    type: e.event_type,
    id: e.id,
    wellName: e.well_name,
  }));

  const stats = useMemo(() => {
    const total = filteredEvents.length;
    const detected = filteredEvents.filter(e => e.max_risk_score && e.max_risk_score > 50).length;
    const avgLead = 24;
    const fpRate = 12;
    return {
      detectionRate: total > 0 ? Math.round((detected / total) * 100) : 0,
      falsePositiveRate: fpRate,
      avgLeadTime: avgLead,
      totalAlerts: total,
    };
  }, [filteredEvents]);

  const eventDetail = selectedEvent ? filteredEvents.find(e => e.id === selectedEvent) : null;

  const renderShape = useCallback((props: any) => {
    return <EventMarkerShape {...props} selectedId={selectedEvent} />;
  }, [selectedEvent]);

  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (!active || !payload?.[0]?.payload) return null;
    const data = payload[0].payload;
    const color = EVENT_TYPE_COLORS[data.type] || '#8B949E';
    return (
      <div
        className="rounded-lg p-3 shadow-lg"
        style={{
          background: ct.tooltipBg,
          border: `1px solid ${ct.tooltipBorder}`,
          color: ct.tooltipText,
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <svg width={16} height={16} viewBox="-12 -12 24 24">
            <EventMarkerShape
              cx={0}
              cy={0}
              payload={data}
              selectedId={null}
            />
          </svg>
          <span className="text-xs font-semibold" style={{ color }}>
            {EVENT_TYPE_LABELS[data.type] || data.type}
          </span>
        </div>
        <div className="text-[11px] space-y-0.5">
          <div className="flex justify-between gap-4">
            <span className="text-dg-text-tertiary">Risk Score</span>
            <span className="font-mono font-semibold tabular-nums" style={{ color: RISK_COLORS[data.severity as keyof typeof RISK_COLORS] }}>
              {data.score?.toFixed(0)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-dg-text-tertiary">Severity</span>
            <span className="font-medium">{data.severity}</span>
          </div>
          {data.wellName && (
            <div className="flex justify-between gap-4">
              <span className="text-dg-text-tertiary">Well</span>
              <span>{data.wellName}</span>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <span className="text-dg-text-tertiary">Date</span>
            <span>{new Date(data.time).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  }, [ct]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          multiple
          value={selectedWells}
          onChange={e => setSelectedWells(Array.from(e.target.selectedOptions, o => o.value))}
          className="h-9 bg-dg-bg-primary border border-dg-border rounded-lg px-3 text-sm text-dg-text-primary outline-none focus:border-dg-info"
        >
          {wells.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>

        <select
          value={selectedEventTypes.join(',')}
          onChange={e => setSelectedEventTypes(e.target.value ? e.target.value.split(',') : [])}
          className="h-9 bg-dg-bg-primary border border-dg-border rounded-lg px-3 text-sm text-dg-text-primary outline-none focus:border-dg-info"
        >
          <option value="">All Event Types</option>
          {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <div className="flex items-center gap-2 ml-auto text-sm text-dg-text-secondary">
          <Calendar size={14} />
          <span>{filteredEvents.length} events</span>
        </div>
      </div>

      <div className="bg-dg-bg-card border border-dg-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-dg-text-primary mb-4">Event Timeline</h2>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 12, right: 24, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis
                dataKey="time"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                stroke={ct.axis}
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                dataKey="score"
                domain={[0, 100]}
                stroke={ct.axis}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                label={{
                  value: 'Risk Score',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 11, fill: ct.axis },
                  offset: 10,
                }}
              />
              <Tooltip content={CustomTooltip} />
              <Scatter
                data={timelineData}
                shape={renderShape}
                onClick={(data: any) => setSelectedEvent(data?.id ?? null)}
              >
                {timelineData.map((_, i) => (
                  <Cell key={i} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <TimelineLegend />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Detection Rate', value: `${stats.detectionRate}%`, icon: Target, color: '#2EA043' },
          { label: 'False Positive Rate', value: `${stats.falsePositiveRate}%`, icon: AlertTriangle, color: '#D29922' },
          { label: 'Avg Lead Time', value: `${stats.avgLeadTime} min`, icon: Clock, color: '#58A6FF' },
          { label: 'Total Events', value: String(stats.totalAlerts), icon: TrendingUp, color: '#E6EDF3' },
        ].map(stat => (
          <div key={stat.label} className="bg-dg-bg-card border border-dg-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} style={{ color: stat.color }} />
              <span className="text-[11px] uppercase tracking-wider text-dg-text-tertiary font-medium">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {eventDetail && (
        <div className="bg-dg-bg-card border border-dg-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <svg width={28} height={28} viewBox="-12 -12 24 24" className="shrink-0">
                <EventMarkerShape
                  cx={0}
                  cy={0}
                  payload={{ type: eventDetail.event_type, severity: eventDetail.severity, id: eventDetail.id }}
                  selectedId={null}
                />
              </svg>
              <div>
                <h2 className="text-base font-semibold text-dg-text-primary">
                  {EVENT_TYPE_LABELS[eventDetail.event_type] || eventDetail.event_type}
                </h2>
                <p className="text-sm text-dg-text-secondary">{eventDetail.well_name} - {new Date(eventDetail.start_time).toLocaleString()}</p>
              </div>
            </div>
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{
                backgroundColor: `${RISK_COLORS[eventDetail.severity as keyof typeof RISK_COLORS]}20`,
                color: RISK_COLORS[eventDetail.severity as keyof typeof RISK_COLORS],
              }}
            >
              {eventDetail.severity}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] text-dg-text-tertiary mb-1">Max Risk Score</p>
              <p className="text-xl font-bold font-mono tabular-nums" style={{ color: RISK_COLORS[eventDetail.severity as keyof typeof RISK_COLORS] }}>
                {eventDetail.max_risk_score?.toFixed(0) || '--'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-dg-text-tertiary mb-1">Duration</p>
              <p className="text-xl font-bold text-dg-text-primary tabular-nums">
                {eventDetail.end_time
                  ? `${((new Date(eventDetail.end_time).getTime() - new Date(eventDetail.start_time).getTime()) / 3600000).toFixed(1)}h`
                  : 'Ongoing'
                }
              </p>
            </div>
            <div>
              <p className="text-[11px] text-dg-text-tertiary mb-1">Similarity</p>
              <p className="text-xl font-bold text-dg-info tabular-nums">
                {eventDetail.similarity_score ? `${(eventDetail.similarity_score * 100).toFixed(0)}%` : '--'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-dg-text-tertiary mb-1">Outcome</p>
              <p className="text-sm text-dg-text-primary">{eventDetail.outcome || 'Unknown'}</p>
            </div>
          </div>

          {eventDetail.description && (
            <p className="mt-4 text-sm text-dg-text-secondary">{eventDetail.description}</p>
          )}
        </div>
      )}

      <div className="bg-dg-bg-card border border-dg-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-dg-text-primary mb-4">Event Log</h2>
        <div className="space-y-2">
          {filteredEvents.slice(0, 20).map(event => (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event.id)}
              className={`
                flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer
                ${selectedEvent === event.id
                  ? 'border-dg-info bg-dg-info/5'
                  : 'border-dg-border hover:bg-dg-bg-card-hover'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <svg width={22} height={22} viewBox="-12 -12 24 24" className="shrink-0">
                  <EventMarkerShape
                    cx={0}
                    cy={0}
                    payload={{ type: event.event_type, severity: event.severity, id: event.id }}
                    selectedId={selectedEvent}
                  />
                </svg>
                <div>
                  <span className="text-sm text-dg-text-primary">{EVENT_TYPE_LABELS[event.event_type] || event.event_type}</span>
                  <span className="text-xs text-dg-text-tertiary ml-2">{event.well_name}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm tabular-nums" style={{ color: RISK_COLORS[event.severity as keyof typeof RISK_COLORS] }}>
                  {event.max_risk_score?.toFixed(0)}
                </span>
                <span className="text-xs text-dg-text-tertiary">{timeAgo(event.start_time)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
