import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, Cell,
} from 'recharts';
import { useDrillGuard } from '../context/DrillGuardContext';
import { useTheme } from '../context/ThemeContext';
import { getChartTheme } from '../lib/chartTheme';
import RiskScoreGauge from '../components/charts/RiskScoreGauge';
import ModelContributionChart from '../components/charts/ModelContributionChart';
import TimeToImpactBadge from '../components/common/TimeToImpactBadge';

export default function RiskAnalysis() {
  const { wellId } = useParams<{ wellId: string }>();
  const navigate = useNavigate();
  const { wells, getModelOutputs } = useDrillGuard();
  const { theme } = useTheme();
  const ct = useMemo(() => getChartTheme(), [theme]);

  const well = wells.find(w => w.id === wellId);
  const modelOutputs = useMemo(() => wellId ? getModelOutputs(wellId) : [], [wellId, getModelOutputs]);

  if (!well) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-dg-text-secondary">
        Well not found.
      </div>
    );
  }

  const latest = modelOutputs[modelOutputs.length - 1];

  const featureData = latest?.feature_importance.slice(0, 10).map(f => ({
    name: f.name,
    importance: Math.round(f.importance * 100),
  })) || [];

  const timelineData = modelOutputs.map(o => ({
    time: new Date(o.timestamp).getTime(),
    rf: o.random_forest_score,
    lstm: o.lstm_score,
    dtw: o.dtw_score,
    fused: o.fused_score,
  }));

  const similarEvents = [
    { type: 'Stuck Pipe', well: 'Bonga SW-3', similarity: 0.89, date: '2025-12-15', outcome: 'Resolved' },
    { type: 'Kick Precursor', well: 'Agbami Deep-1', similarity: 0.76, date: '2025-11-22', outcome: 'Near miss' },
    { type: 'Lost Circulation', well: 'Egina North-2', similarity: 0.64, date: '2025-10-08', outcome: 'Minor damage' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/wells/${wellId}`)}
          className="p-2 rounded-lg border border-dg-border text-dg-text-tertiary hover:text-dg-text-primary transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-semibold text-dg-text-primary">Risk Analysis - {well.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-dg-bg-card border border-dg-border rounded-xl p-6 flex flex-col items-center justify-center">
          <RiskScoreGauge score={well.risk_score} level={well.risk_level} size="large" />
          {well.tti_minutes !== null && well.risk_level !== 'NORMAL' && (
            <div className="mt-4">
              <TimeToImpactBadge minutes={well.tti_minutes} level={well.risk_level} />
            </div>
          )}
        </div>

        <div className="bg-dg-bg-card border border-dg-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-dg-text-primary mb-4">Model Contributions</h2>
          {latest && (
            <ModelContributionChart
              rfScore={latest.random_forest_score}
              lstmScore={latest.lstm_score}
              dtwScore={latest.dtw_score}
            />
          )}
        </div>
      </div>

      <div className="bg-dg-bg-card border border-dg-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-dg-text-primary mb-4">Feature Importance (Top 10)</h2>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={featureData} layout="vertical" margin={{ left: 140, right: 24, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} horizontal={false} />
              <XAxis type="number" domain={[0, 20]} stroke={ct.axis} fontSize={11} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                stroke={ct.axis}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={130}
              />
              <Tooltip
                contentStyle={{
                  background: ct.tooltipBg,
                  border: `1px solid ${ct.tooltipBorder}`,
                  borderRadius: 8,
                  fontSize: 12,
                  color: ct.tooltipText,
                }}
                formatter={(val: any) => [`${val}%`, 'Importance']}
              />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]} barSize={20}>
                {featureData.map((_, i) => {
                  const t = i / (featureData.length - 1 || 1);
                  const r = Math.round(88 + t * (142 - 88));
                  const g = Math.round(166 + t * (50 - 166));
                  const b = Math.round(255 + t * (233 - 255));
                  return <Cell key={i} fill={`rgb(${r},${g},${b})`} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-dg-bg-card border border-dg-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-dg-text-primary mb-4">Model Output Timeline</h2>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} vertical={false} />
              <XAxis
                dataKey="time"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                stroke={ct.axis}
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                domain={[0, 100]}
                stroke={ct.axis}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 1]}
                stroke={ct.axis}
                fontSize={11}
                tickLine={false}
                axisLine={false}
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
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#8B949E' }}
              />
              <Line yAxisId="right" type="monotoneX" dataKey="rf" stroke="#58A6FF" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Random Forest" />
              <Line yAxisId="right" type="monotoneX" dataKey="lstm" stroke="#8E32E9" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="LSTM" />
              <Line yAxisId="right" type="monotoneX" dataKey="dtw" stroke="#D29922" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="DTW" />
              <Line yAxisId="left" type="monotoneX" dataKey="fused" stroke="#FF6B6B" strokeWidth={2.5} dot={false} name="Fused Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-dg-bg-card border border-dg-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-dg-text-primary flex items-center gap-2 mb-4">
          <Brain size={16} className="text-dg-ml-accent" />
          Similar Historical Events
        </h2>
        <div className="space-y-3">
          {similarEvents.map((event, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg border border-dg-border hover:bg-dg-bg-card-hover transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-dg-text-primary">{event.type}</span>
                  <span className="text-[11px] text-dg-text-tertiary">{event.well}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-24 h-1.5 bg-dg-bg-card-active rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${event.similarity * 100}%`,
                          backgroundColor: event.similarity > 0.8 ? '#F85149' : event.similarity > 0.6 ? '#E87C25' : '#D29922',
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-dg-text-tertiary tabular-nums">{(event.similarity * 100).toFixed(0)}%</span>
                  </div>
                  <span className="text-[11px] text-dg-text-tertiary">{event.date}</span>
                </div>
              </div>
              <span className="text-xs text-dg-text-secondary">{event.outcome}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
