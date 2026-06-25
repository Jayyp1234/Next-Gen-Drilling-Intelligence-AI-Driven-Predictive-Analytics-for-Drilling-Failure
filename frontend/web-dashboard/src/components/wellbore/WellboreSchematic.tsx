import { useMemo, useState } from 'react';
import type { WellboreSchematicData, FormationLayer } from '../../types';
import { useTheme } from '../../context/ThemeContext';

const LITHOLOGY_PATTERNS: Record<FormationLayer['lithology'], { dark: string; light: string; pattern: string }> = {
  shale: { dark: '#2D333B', light: '#D0D7DE', pattern: 'shale' },
  sandstone: { dark: '#3B2E1A', light: '#F5DEB3', pattern: 'sandstone' },
  limestone: { dark: '#1E3A2F', light: '#B8D4CC', pattern: 'limestone' },
  salt: { dark: '#3D3D4D', light: '#E8E8F0', pattern: 'salt' },
  clay: { dark: '#2B3320', light: '#C5D4A8', pattern: 'clay' },
  siltstone: { dark: '#33302B', light: '#D4CFC5', pattern: 'siltstone' },
};

interface Props {
  data: WellboreSchematicData;
  wellName: string;
}

export default function WellboreSchematic({ data, wellName }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [hoveredFormation, setHoveredFormation] = useState<string | null>(null);
  const [hoveredCasing, setHoveredCasing] = useState<string | null>(null);

  const svgWidth = 380;
  const svgHeight = 640;
  const margin = { top: 48, bottom: 32, left: 72, right: 24 };
  const wellCenterX = margin.left + (svgWidth - margin.left - margin.right) / 2;
  const drawHeight = svgHeight - margin.top - margin.bottom;

  const maxDepth = useMemo(() => {
    const maxForm = Math.max(...data.formations.map(f => f.bottomDepth));
    return Math.max(maxForm, data.totalDepth) * 1.05;
  }, [data]);

  const depthToY = (depth: number) => margin.top + (depth / maxDepth) * drawHeight;
  const maxCasingOD = 30;
  const wellboreHalfWidth = 60;
  const casingScale = (od: number) => (od / maxCasingOD) * wellboreHalfWidth;

  const depthTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = maxDepth > 3000 ? 500 : 250;
    for (let d = 0; d <= maxDepth; d += step) {
      ticks.push(d);
    }
    return ticks;
  }, [maxDepth]);

  const bitY = depthToY(data.bitDepth);

  return (
    <div className="bg-dg-bg-card border border-dg-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-dg-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-dg-text-primary">Wellbore Schematic</h3>
          <p className="text-[11px] text-dg-text-tertiary mt-0.5">{wellName} - Vertical Cross-Section</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-dg-text-tertiary">
          <span>TD: {data.totalDepth.toFixed(0)}m</span>
          <span className="w-px h-3 bg-dg-border" />
          <span>MW: {data.mudWeight.toFixed(1)} ppg</span>
          <span className="w-px h-3 bg-dg-border" />
          <span>Hole: {data.holeSize}"</span>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="block">
        <defs>
          <pattern id="pat-shale" width="12" height="6" patternUnits="userSpaceOnUse">
            <line x1="0" y1="3" x2="12" y2="3" stroke={isDark ? '#484F58' : '#9CA3AF'} strokeWidth="0.5" />
            <line x1="3" y1="0" x2="9" y2="6" stroke={isDark ? '#484F58' : '#9CA3AF'} strokeWidth="0.3" />
          </pattern>
          <pattern id="pat-sandstone" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill={isDark ? '#6E5530' : '#C4A55A'} />
            <circle cx="6" cy="6" r="0.6" fill={isDark ? '#6E5530' : '#C4A55A'} />
            <circle cx="6" cy="2" r="0.5" fill={isDark ? '#5A4425' : '#B89A50'} />
          </pattern>
          <pattern id="pat-limestone" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="none" />
            <line x1="0" y1="5" x2="10" y2="5" stroke={isDark ? '#3A5A4A' : '#7AA590'} strokeWidth="0.5" />
            <line x1="2" y1="0" x2="2" y2="5" stroke={isDark ? '#3A5A4A' : '#7AA590'} strokeWidth="0.5" />
            <line x1="7" y1="5" x2="7" y2="10" stroke={isDark ? '#3A5A4A' : '#7AA590'} strokeWidth="0.5" />
          </pattern>
          <pattern id="pat-salt" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill={isDark ? '#3D3D4D' : '#E8E8F0'} />
            <circle cx="3" cy="3" r="1.5" fill={isDark ? '#525270' : '#CFCFE0'} fillOpacity="0.5" />
          </pattern>
          <pattern id="pat-clay" width="8" height="4" patternUnits="userSpaceOnUse">
            <line x1="0" y1="2" x2="8" y2="2" stroke={isDark ? '#4A5530' : '#8BA060'} strokeWidth="0.8" strokeDasharray="3,2" />
          </pattern>
          <pattern id="pat-siltstone" width="8" height="8" patternUnits="userSpaceOnUse">
            <line x1="0" y1="4" x2="8" y2="4" stroke={isDark ? '#55503A' : '#A09880'} strokeWidth="0.5" />
            <circle cx="4" cy="2" r="0.4" fill={isDark ? '#55503A' : '#A09880'} />
            <circle cx="4" cy="6" r="0.4" fill={isDark ? '#55503A' : '#A09880'} />
          </pattern>

          <linearGradient id="bitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F85149" />
            <stop offset="100%" stopColor="#E87C25" />
          </linearGradient>

          <filter id="bitGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="mudColumn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#58A6FF' : '#0969DA'} stopOpacity="0.05" />
            <stop offset="100%" stopColor={isDark ? '#58A6FF' : '#0969DA'} stopOpacity="0.15" />
          </linearGradient>
        </defs>

        <text
          x={margin.left - 8}
          y={margin.top - 12}
          textAnchor="end"
          fill={isDark ? '#6E7681' : '#8B949E'}
          fontSize="9"
          fontFamily="JetBrains Mono, monospace"
        >
          Depth (m)
        </text>

        {depthTicks.map(d => {
          const y = depthToY(d);
          return (
            <g key={d}>
              <line
                x1={margin.left - 4}
                y1={y}
                x2={svgWidth - margin.right}
                y2={y}
                stroke={isDark ? '#21262D' : '#E5E7EB'}
                strokeWidth="0.5"
                strokeDasharray="2,3"
              />
              <text
                x={margin.left - 8}
                y={y + 3}
                textAnchor="end"
                fill={isDark ? '#6E7681' : '#8B949E'}
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
              >
                {d}
              </text>
            </g>
          );
        })}

        {data.formations.map((f) => {
          const y1 = depthToY(f.topDepth);
          const y2 = depthToY(Math.min(f.bottomDepth, maxDepth));
          const h = y2 - y1;
          const isHovered = hoveredFormation === f.name;
          const lith = LITHOLOGY_PATTERNS[f.lithology];
          const bgColor = isDark ? lith.dark : lith.light;

          return (
            <g
              key={f.name}
              onMouseEnter={() => setHoveredFormation(f.name)}
              onMouseLeave={() => setHoveredFormation(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={wellCenterX - wellboreHalfWidth - 40}
                y={y1}
                width={wellboreHalfWidth * 2 + 80}
                height={h}
                fill={bgColor}
                opacity={isHovered ? 0.9 : 0.6}
                rx="1"
              />
              <rect
                x={wellCenterX - wellboreHalfWidth - 40}
                y={y1}
                width={wellboreHalfWidth * 2 + 80}
                height={h}
                fill={`url(#pat-${f.lithology})`}
                opacity={0.5}
              />
              {isHovered && (
                <rect
                  x={wellCenterX - wellboreHalfWidth - 40}
                  y={y1}
                  width={wellboreHalfWidth * 2 + 80}
                  height={h}
                  fill="none"
                  stroke={isDark ? '#58A6FF' : '#0969DA'}
                  strokeWidth="1.5"
                  rx="1"
                />
              )}
              <text
                x={svgWidth - margin.right - 2}
                y={y1 + h / 2 + 3}
                textAnchor="end"
                fill={isDark ? '#8B949E' : '#57606A'}
                fontSize="8"
                fontWeight={isHovered ? '600' : '400'}
              >
                {f.name}
              </text>

              {isHovered && (
                <g>
                  <rect
                    x={wellCenterX - 70}
                    y={y1 + h / 2 - 22}
                    width={140}
                    height={44}
                    rx="6"
                    fill={isDark ? '#21262D' : '#FFFFFF'}
                    stroke={isDark ? '#30363D' : '#D0D7DE'}
                    strokeWidth="1"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                  />
                  <text x={wellCenterX} y={y1 + h / 2 - 8} textAnchor="middle" fill={isDark ? '#E6EDF3' : '#1F2328'} fontSize="9" fontWeight="600">
                    {f.name}
                  </text>
                  <text x={wellCenterX} y={y1 + h / 2 + 4} textAnchor="middle" fill={isDark ? '#8B949E' : '#57606A'} fontSize="8">
                    {f.topDepth}m - {f.bottomDepth}m | {f.lithology}
                  </text>
                  <text x={wellCenterX} y={y1 + h / 2 + 16} textAnchor="middle" fill={isDark ? '#6E7681' : '#8B949E'} fontSize="7.5">
                    PP: {f.porePressure} ppg | FG: {f.fracGradient} ppg
                  </text>
                </g>
              )}
            </g>
          );
        })}

        <rect
          x={wellCenterX - casingScale(data.holeSize) / 2}
          y={depthToY(data.casings[data.casings.length - 1]?.setDepth ?? 0)}
          width={casingScale(data.holeSize)}
          height={bitY - depthToY(data.casings[data.casings.length - 1]?.setDepth ?? 0)}
          fill="url(#mudColumn)"
          rx="2"
        />

        {data.casings.map((c) => {
          const hw = casingScale(c.outerDiameter) / 2;
          const yTop = depthToY(0);
          const yBot = depthToY(c.setDepth);
          const isHovered = hoveredCasing === c.type;

          return (
            <g
              key={c.type}
              onMouseEnter={() => setHoveredCasing(c.type)}
              onMouseLeave={() => setHoveredCasing(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={wellCenterX - hw}
                y={yTop}
                width={hw * 2}
                height={yBot - yTop}
                fill="none"
                stroke={c.color}
                strokeWidth={isHovered ? 2.5 : 1.5}
                opacity={isHovered ? 1 : 0.7}
                rx="1"
              />
              <line
                x1={wellCenterX - hw - 4}
                y1={yBot}
                x2={wellCenterX + hw + 4}
                y2={yBot}
                stroke={c.color}
                strokeWidth="2.5"
              />
              <polygon
                points={`${wellCenterX - hw - 4},${yBot - 3} ${wellCenterX - hw - 4},${yBot + 3} ${wellCenterX - hw},${yBot}`}
                fill={c.color}
              />
              <polygon
                points={`${wellCenterX + hw + 4},${yBot - 3} ${wellCenterX + hw + 4},${yBot + 3} ${wellCenterX + hw},${yBot}`}
                fill={c.color}
              />

              {isHovered && (
                <g>
                  <rect
                    x={wellCenterX + hw + 8}
                    y={yBot - 20}
                    width={100}
                    height={30}
                    rx="4"
                    fill={isDark ? '#21262D' : '#FFFFFF'}
                    stroke={c.color}
                    strokeWidth="1"
                  />
                  <text x={wellCenterX + hw + 14} y={yBot - 6} fill={c.color} fontSize="8" fontWeight="600" textTransform="capitalize">
                    {c.type} Casing
                  </text>
                  <text x={wellCenterX + hw + 14} y={yBot + 5} fill={isDark ? '#8B949E' : '#57606A'} fontSize="7.5">
                    {c.outerDiameter}" @ {c.setDepth}m
                  </text>
                </g>
              )}
            </g>
          );
        })}

        <g filter="url(#bitGlow)">
          <polygon
            points={`${wellCenterX},${bitY + 12} ${wellCenterX - 8},${bitY - 2} ${wellCenterX + 8},${bitY - 2}`}
            fill="url(#bitGrad)"
            stroke="#F85149"
            strokeWidth="1"
          />
          <line x1={wellCenterX - 5} y1={bitY + 1} x2={wellCenterX + 5} y2={bitY + 1} stroke="#FFF" strokeWidth="0.5" opacity="0.5" />
          <line x1={wellCenterX - 3} y1={bitY + 5} x2={wellCenterX + 3} y2={bitY + 5} stroke="#FFF" strokeWidth="0.5" opacity="0.5" />
        </g>

        <line
          x1={wellCenterX + 14}
          y1={bitY + 4}
          x2={wellCenterX + 28}
          y2={bitY + 4}
          stroke="#F85149"
          strokeWidth="0.8"
          strokeDasharray="2,1"
        />
        <text
          x={wellCenterX + 32}
          y={bitY + 7}
          fill="#F85149"
          fontSize="8"
          fontWeight="600"
          fontFamily="JetBrains Mono, monospace"
        >
          BIT {data.bitDepth.toFixed(0)}m
        </text>

        <line
          x1={margin.left}
          y1={depthToY(0)}
          x2={margin.left}
          y2={depthToY(maxDepth)}
          stroke={isDark ? '#30363D' : '#D0D7DE'}
          strokeWidth="1"
        />
      </svg>

      <div className="px-4 py-3 border-t border-dg-border">
        <div className="flex flex-wrap gap-3">
          {data.casings.map(c => (
            <div key={c.type} className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-sm" style={{ backgroundColor: c.color }} />
              <span className="text-[10px] text-dg-text-tertiary capitalize">{c.type} ({c.outerDiameter}")</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-0 h-0" style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '6px solid #F85149' }} />
            <span className="text-[10px] text-dg-text-tertiary">Bit Position</span>
          </div>
        </div>
      </div>
    </div>
  );
}
