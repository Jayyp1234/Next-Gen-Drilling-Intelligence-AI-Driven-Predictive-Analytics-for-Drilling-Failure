import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowDown, PanelRightOpen, PanelRightClose, Play, Pause, Brain, Lightbulb, Layers, ZoomOut } from 'lucide-react';
import { useDrillGuard } from '../context/DrillGuardContext';
import RiskScoreGauge from '../components/charts/RiskScoreGauge';
import SensorChart from '../components/charts/SensorChart';
import RiskScoreChart from '../components/charts/RiskScoreChart';
import ParameterTile from '../components/common/ParameterTile';
import AlertCard from '../components/common/AlertCard';
import RecommendationCard from '../components/common/RecommendationCard';
import TimeToImpactBadge from '../components/common/TimeToImpactBadge';
import WellboreSchematic from '../components/wellbore/WellboreSchematic';
import LogAnalysisModal from '../components/wellbore/LogAnalysisModal';
import { SENSOR_PARAMETERS } from '../lib/constants';
import { generateWellboreSchematic } from '../lib/mockData';

const STATE_COLORS: Record<string, string> = {
  drilling: '#58A6FF',
  tripping: '#D29922',
  circulating: '#2EA043',
  idle: '#8B949E',
};

export default function WellDetail() {
  const { wellId } = useParams<{ wellId: string }>();
  const navigate = useNavigate();
  const { wells, getSensorReadings, getWellAlerts, getWellRecommendations } = useDrillGuard();
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [paused, setPaused] = useState(false);
  const [crosshairTime, setCrosshairTime] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [showSchematic, setShowSchematic] = useState(false);
  /** Zoom all logs to this time range (ms). Set when user draws a selection box. */
  const [timeDomainZoom, setTimeDomainZoom] = useState<[number, number] | null>(null);
  /** When set, show the analysis modal for this range. */
  const [analysisModalRange, setAnalysisModalRange] = useState<{ start: number; end: number } | null>(null);

  const well = wells.find(w => w.id === wellId);
  const readings = useMemo(() => wellId ? getSensorReadings(wellId) : [], [wellId, getSensorReadings]);
  const alerts = useMemo(() => wellId ? getWellAlerts(wellId) : [], [wellId, getWellAlerts]);
  const recommendations = useMemo(() => wellId ? getWellRecommendations(wellId) : [], [wellId, getWellRecommendations]);

  const schematicData = useMemo(() => well ? generateWellboreSchematic(well) : null, [well]);

  const handleHover = useCallback((time: string | null) => {
    if (!paused) setCrosshairTime(time);
  }, [paused]);

  const handleSelectionComplete = useCallback((startTime: number, endTime: number) => {
    setTimeDomainZoom([startTime, endTime]);
    setAnalysisModalRange({ start: startTime, end: endTime });
  }, []);

  const resetZoom = useCallback(() => {
    setTimeDomainZoom(null);
    setAnalysisModalRange(null);
  }, []);

  if (!well) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-dg-text-secondary">
        Well not found.
        <button onClick={() => navigate('/dashboard')} className="ml-2 text-dg-info hover:underline">
          Back to Fleet
        </button>
      </div>
    );
  }

  const activeAlerts = alerts.filter(a => a.status === 'new' || a.status === 'acknowledged');

  return (
    <div className="flex gap-0">
      <div className={`flex-1 min-w-0 transition-all duration-200 ${rightPanelOpen ? 'lg:mr-80' : ''}`}>
        <div className="bg-dg-bg-card border border-dg-border rounded-xl p-4 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg font-semibold text-dg-text-primary">{well.name}</h1>
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
                <div className="flex items-center gap-1 text-dg-text-primary">
                  <ArrowDown size={14} className="text-dg-text-tertiary" />
                  <span className="text-2xl font-bold tabular-nums">{well.depth.toFixed(0)}</span>
                  <span className="text-sm text-dg-text-secondary ml-0.5">m MD</span>
                </div>
              </div>

              {well.tti_minutes !== null && well.risk_level !== 'NORMAL' && (
                <TimeToImpactBadge minutes={well.tti_minutes} level={well.risk_level} />
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center border border-dg-border rounded-lg overflow-hidden">
                {['1h', '6h', '12h', '24h'].map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      timeRange === range
                        ? 'bg-dg-info/15 text-dg-info'
                        : 'text-dg-text-tertiary hover:text-dg-text-secondary hover:bg-dg-bg-card-hover'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPaused(!paused)}
                className={`p-2 rounded-lg border transition-colors ${
                  paused
                    ? 'border-dg-watch bg-dg-watch/10 text-dg-watch'
                    : 'border-dg-border text-dg-text-tertiary hover:text-dg-text-secondary'
                }`}
              >
                {paused ? <Play size={16} /> : <Pause size={16} />}
              </button>

              <button
                onClick={() => setShowSchematic(!showSchematic)}
                className={`p-2 rounded-lg border transition-colors ${
                  showSchematic
                    ? 'border-dg-info/30 bg-dg-info/10 text-dg-info'
                    : 'border-dg-border text-dg-text-tertiary hover:text-dg-info hover:border-dg-info/30'
                }`}
                title="Wellbore Schematic"
              >
                <Layers size={16} />
              </button>

              <button
                onClick={() => navigate(`/wells/${wellId}/analysis`)}
                className="p-2 rounded-lg border border-dg-border text-dg-text-tertiary hover:text-dg-ml-accent hover:border-dg-ml-accent/30 transition-colors"
              >
                <Brain size={16} />
              </button>

              {timeDomainZoom && (
                <button
                  onClick={resetZoom}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dg-border text-dg-text-tertiary hover:text-dg-info hover:border-dg-info/30 transition-colors text-xs font-medium"
                  title="Reset zoom to full range"
                >
                  <ZoomOut size={14} />
                  Reset zoom
                </button>
              )}

              <RiskScoreGauge score={well.risk_score} level={well.risk_level} size="small" showLabel={false} />
            </div>
          </div>

          {paused && (
            <div className="mt-3 px-3 py-1.5 bg-dg-watch/10 border border-dg-watch/30 rounded-lg text-xs text-dg-watch font-medium inline-block">
              PAUSED - Real-time updates suspended
            </div>
          )}
        </div>

        {showSchematic && schematicData && (
          <div className="mb-4 animate-fade-in">
            <WellboreSchematic data={schematicData} wellName={well.name} />
          </div>
        )}

        <div className="space-y-0.5 bg-dg-bg-card border border-dg-border rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-dg-border bg-dg-bg-primary/50 flex items-center justify-between">
            <span className="text-xs text-dg-text-tertiary">
              Drag a box on any log to zoom and analyze that range
            </span>
          </div>
          {SENSOR_PARAMETERS.map(param => (
            <div key={param.key} className="border-b border-dg-border-muted last:border-b-0">
              <SensorChart
                readings={readings}
                parameter={param}
                height={120}
                crosshairTime={crosshairTime}
                onHover={handleHover}
                xDomain={timeDomainZoom}
                onSelectionComplete={handleSelectionComplete}
              />
            </div>
          ))}
          <div className="border-t border-dg-border">
            <RiskScoreChart
              readings={readings}
              height={160}
              crosshairTime={crosshairTime}
              onHover={handleHover}
              xDomain={timeDomainZoom}
              onSelectionComplete={handleSelectionComplete}
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto py-4 -mx-1 px-1">
          {SENSOR_PARAMETERS.map(param => (
            <ParameterTile
              key={param.key}
              parameter={param}
              readings={readings}
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => setRightPanelOpen(!rightPanelOpen)}
        className="fixed right-4 bottom-4 lg:bottom-auto lg:top-20 z-dropdown p-2 rounded-lg bg-dg-bg-card border border-dg-border text-dg-text-tertiary hover:text-dg-text-primary transition-colors shadow-lg"
      >
        {rightPanelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
      </button>

      {analysisModalRange && (
        <LogAnalysisModal
          wellName={well.name}
          startTime={analysisModalRange.start}
          endTime={analysisModalRange.end}
          readings={readings}
          onClose={() => setAnalysisModalRange(null)}
          onResetZoom={resetZoom}
          isZoomed={timeDomainZoom !== null}
        />
      )}

      {rightPanelOpen && (
        <div className="fixed right-0 top-14 bottom-0 w-80 bg-dg-bg-card border-l border-dg-border overflow-y-auto z-sidebar hidden lg:block">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-dg-text-primary flex items-center gap-2">
                Active Alerts
                {activeAlerts.length > 0 && (
                  <span className="bg-dg-action/20 text-dg-action text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {activeAlerts.length}
                  </span>
                )}
              </h2>
            </div>

            {activeAlerts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 mx-auto rounded-full bg-dg-normal/10 flex items-center justify-center mb-2">
                  <span className="text-dg-normal text-lg">&#10003;</span>
                </div>
                <p className="text-sm text-dg-text-tertiary">No active alerts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeAlerts.map(alert => (
                  <AlertCard key={alert.id} alert={alert} compact />
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-dg-border">
              <h2 className="text-sm font-semibold text-dg-text-primary flex items-center gap-2 mb-3">
                <Lightbulb size={16} className="text-dg-watch" />
                Recommendations
              </h2>

              {recommendations.length === 0 ? (
                <p className="text-sm text-dg-text-tertiary text-center py-4">No recommendations</p>
              ) : (
                <div className="space-y-2">
                  {recommendations.map(rec => (
                    <RecommendationCard key={rec.id} recommendation={rec} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
