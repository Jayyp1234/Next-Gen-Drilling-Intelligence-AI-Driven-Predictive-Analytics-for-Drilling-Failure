import { useState, useMemo, useCallback } from 'react';
import type { Well } from '../../types';
import { RISK_COLORS } from '../../lib/constants';
import { useTheme } from '../../context/ThemeContext';
import { MapPin, Maximize2, Minimize2, Crosshair } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MAP_BOUNDS = {
  latMin: 3.2,
  latMax: 7.0,
  lonMin: 2.5,
  lonMax: 6.5,
};

const COASTLINE_POINTS = [
  [2.5, 6.4], [2.8, 6.35], [3.0, 6.42], [3.2, 6.38], [3.4, 6.45],
  [3.5, 6.5], [3.6, 6.42], [3.8, 6.35], [4.0, 6.3], [4.2, 6.28],
  [4.4, 6.25], [4.5, 6.2], [4.6, 6.1], [4.65, 5.95], [4.7, 5.88],
  [4.8, 5.78], [4.85, 5.7], [4.9, 5.55], [5.0, 5.4], [5.1, 5.3],
  [5.15, 5.2], [5.2, 5.08], [5.3, 4.95], [5.4, 4.85], [5.5, 4.8],
  [5.6, 4.78], [5.8, 4.72], [6.0, 4.7], [6.2, 4.65], [6.5, 4.6],
];

const LAND_FILL_POINTS = [
  ...COASTLINE_POINTS,
  [6.5, 7.0], [2.5, 7.0],
];

interface Props {
  wells: Well[];
}

export default function GeospatialView({ wells }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [hoveredWell, setHoveredWell] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const svgWidth = 520;
  const svgHeight = isExpanded ? 500 : 340;
  const padding = { top: 20, right: 20, bottom: 20, left: 20 };

  const lonToX = useCallback((lon: number) => {
    return padding.left + ((lon - MAP_BOUNDS.lonMin) / (MAP_BOUNDS.lonMax - MAP_BOUNDS.lonMin)) * (svgWidth - padding.left - padding.right);
  }, [svgWidth, padding]);

  const latToY = useCallback((lat: number) => {
    return padding.top + ((MAP_BOUNDS.latMax - lat) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * (svgHeight - padding.top - padding.bottom);
  }, [svgHeight, padding]);

  const coastlinePath = useMemo(() => {
    return COASTLINE_POINTS.map((p, i) => {
      const x = lonToX(p[0]);
      const y = latToY(p[1]);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  }, [lonToX, latToY]);

  const landPath = useMemo(() => {
    return LAND_FILL_POINTS.map((p, i) => {
      const x = lonToX(p[0]);
      const y = latToY(p[1]);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ') + ' Z';
  }, [lonToX, latToY]);

  const gridLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; label: string; isLat: boolean }[] = [];
    for (let lat = Math.ceil(MAP_BOUNDS.latMin); lat <= MAP_BOUNDS.latMax; lat++) {
      lines.push({
        x1: lonToX(MAP_BOUNDS.lonMin),
        y1: latToY(lat),
        x2: lonToX(MAP_BOUNDS.lonMax),
        y2: latToY(lat),
        label: `${lat}°N`,
        isLat: true,
      });
    }
    for (let lon = Math.ceil(MAP_BOUNDS.lonMin); lon <= MAP_BOUNDS.lonMax; lon++) {
      lines.push({
        x1: lonToX(lon),
        y1: latToY(MAP_BOUNDS.latMax),
        x2: lonToX(lon),
        y2: latToY(MAP_BOUNDS.latMin),
        label: `${lon}°E`,
        isLat: false,
      });
    }
    return lines;
  }, [lonToX, latToY]);

  const wellPositions = useMemo(() => {
    return wells.filter(w => w.latitude && w.longitude).map(w => ({
      well: w,
      x: lonToX(w.longitude!),
      y: latToY(w.latitude!),
    }));
  }, [wells, lonToX, latToY]);

  const riskCounts = useMemo(() => {
    const c = { ACTION: 0, ELEVATED: 0, WATCH: 0, NORMAL: 0 };
    wells.forEach(w => c[w.risk_level]++);
    return c;
  }, [wells]);

  return (
    <div className="bg-dg-bg-card border border-dg-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-dg-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-dg-info/10 border border-dg-info/20 flex items-center justify-center">
            <MapPin size={16} className="text-dg-info" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-dg-text-primary">Fleet Geospatial Intelligence</h3>
            <p className="text-[11px] text-dg-text-tertiary">Gulf of Guinea - Nigerian Offshore Assets</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg hover:bg-dg-bg-card-hover text-dg-text-tertiary hover:text-dg-text-primary transition-colors"
        >
          {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      <div className="relative">
        <svg width="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="block">
          <defs>
            <radialGradient id="ocean-grad" cx="50%" cy="50%">
              <stop offset="0%" stopColor={isDark ? '#0D1926' : '#E3EDF7'} />
              <stop offset="100%" stopColor={isDark ? '#0A1218' : '#D4E4F2'} />
            </radialGradient>
            <filter id="well-glow-action">
              <feGaussianBlur stdDeviation="4" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="well-glow-elevated">
              <feGaussianBlur stdDeviation="3" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <rect width={svgWidth} height={svgHeight} fill="url(#ocean-grad)" />

          {gridLines.map((line, i) => (
            <g key={i}>
              <line
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={isDark ? '#1A2332' : '#C8D8E8'}
                strokeWidth="0.5"
                strokeDasharray="4,4"
              />
              {line.isLat && (
                <text x={line.x1 + 4} y={line.y1 - 3} fontSize="8" fill={isDark ? '#30404D' : '#9CAFC0'} fontFamily="JetBrains Mono, monospace">
                  {line.label}
                </text>
              )}
              {!line.isLat && (
                <text x={line.x1 + 3} y={line.y2 - 4} fontSize="8" fill={isDark ? '#30404D' : '#9CAFC0'} fontFamily="JetBrains Mono, monospace">
                  {line.label}
                </text>
              )}
            </g>
          ))}

          <path d={landPath} fill={isDark ? '#161B22' : '#E8EDE4'} />
          <path d={coastlinePath} fill="none" stroke={isDark ? '#2D5A3D' : '#7AAD8A'} strokeWidth="1.5" />

          <text
            x={lonToX(3.5)}
            y={latToY(6.65)}
            fontSize="11"
            fill={isDark ? '#2D4A3A' : '#7A9A8A'}
            fontWeight="600"
            letterSpacing="2"
          >
            NIGERIA
          </text>
          <text
            x={lonToX(3.8)}
            y={latToY(3.6)}
            fontSize="9"
            fill={isDark ? '#1A3040' : '#8AAABA'}
            fontStyle="italic"
            letterSpacing="3"
          >
            Gulf of Guinea
          </text>

          {wellPositions.map(({ well, x, y }) => {
            const color = RISK_COLORS[well.risk_level];
            const isHovered = hoveredWell === well.id;
            const isHighRisk = well.risk_level === 'ACTION' || well.risk_level === 'ELEVATED';
            const radius = isHovered ? 10 : isHighRisk ? 7 : 5.5;
            const glowFilter = well.risk_level === 'ACTION' ? 'url(#well-glow-action)' : well.risk_level === 'ELEVATED' ? 'url(#well-glow-elevated)' : undefined;

            return (
              <g
                key={well.id}
                onMouseEnter={() => setHoveredWell(well.id)}
                onMouseLeave={() => setHoveredWell(null)}
                onClick={() => navigate(`/wells/${well.id}`)}
                style={{ cursor: 'pointer' }}
              >
                {isHighRisk && (
                  <circle cx={x} cy={y} r={radius + 6} fill={color} opacity={0.08}>
                    <animate attributeName="r" values={`${radius + 4};${radius + 10};${radius + 4}`} dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.12;0.04;0.12" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                )}

                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={color}
                  fillOpacity={isHovered ? 0.3 : 0.15}
                  stroke={color}
                  strokeWidth={isHovered ? 2 : 1.5}
                  filter={glowFilter}
                  style={{ transition: 'r 150ms ease, stroke-width 150ms ease' }}
                />

                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 3.5 : 2.5}
                  fill={color}
                  style={{ transition: 'r 150ms ease' }}
                />

                {!isHovered && (
                  <text
                    x={x}
                    y={y - radius - 4}
                    textAnchor="middle"
                    fontSize="7"
                    fill={color}
                    fontWeight="600"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {well.risk_score}
                  </text>
                )}

                {isHovered && (
                  <g>
                    <rect
                      x={x + 14}
                      y={y - 38}
                      width={140}
                      height={66}
                      rx="6"
                      fill={isDark ? '#21262D' : '#FFFFFF'}
                      stroke={color}
                      strokeWidth="1"
                      filter="drop-shadow(0 4px 8px rgba(0,0,0,0.3))"
                    />
                    <text x={x + 22} y={y - 22} fontSize="10" fill={isDark ? '#E6EDF3' : '#1F2328'} fontWeight="600">
                      {well.name}
                    </text>
                    <text x={x + 22} y={y - 9} fontSize="8" fill={isDark ? '#8B949E' : '#57606A'}>
                      Risk: <tspan fill={color} fontWeight="600">{well.risk_score}</tspan> | {well.operational_state}
                    </text>
                    <text x={x + 22} y={y + 4} fontSize="8" fill={isDark ? '#6E7681' : '#8B949E'}>
                      Depth: {well.depth.toFixed(0)}m MD
                    </text>
                    <text x={x + 22} y={y + 17} fontSize="7" fill={isDark ? '#484F58' : '#AFB8C1'}>
                      {well.latitude?.toFixed(3)}°N, {well.longitude?.toFixed(3)}°E
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-dg-bg-card/90 backdrop-blur-sm border border-dg-border rounded-lg px-2.5 py-1.5">
          <Crosshair size={10} className="text-dg-text-tertiary mr-1" />
          {(['ACTION', 'ELEVATED', 'WATCH', 'NORMAL'] as const).map(level => (
            <div key={level} className="flex items-center gap-1 px-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_COLORS[level] }} />
              <span className="text-[9px] text-dg-text-tertiary font-medium">{riskCounts[level]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
