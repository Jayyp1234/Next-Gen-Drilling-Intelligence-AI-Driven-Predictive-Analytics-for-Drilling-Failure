import { useEffect, useState, useMemo } from 'react';
import type { RiskLevel } from '../../types';
import { RISK_COLORS } from '../../lib/constants';
import { useTheme } from '../../context/ThemeContext';
import { getChartTheme } from '../../lib/chartTheme';

interface RiskScoreGaugeProps {
  score: number;
  level: RiskLevel;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const SIZE_CONFIG = {
  small: { width: 64, strokeWidth: 6, fontSize: 18, labelSize: 0, radius: 24 },
  medium: { width: 120, strokeWidth: 8, fontSize: 28, labelSize: 12, radius: 46 },
  large: { width: 200, strokeWidth: 12, fontSize: 48, labelSize: 16, radius: 78 },
};

export default function RiskScoreGauge({ score, level, size = 'medium', showLabel = true }: RiskScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const { theme } = useTheme();
  const ct = useMemo(() => getChartTheme(), [theme]);
  const config = SIZE_CONFIG[size];
  const cx = config.width / 2;
  const cy = config.width / 2;
  const circumference = 2 * Math.PI * config.radius;
  const arcLength = circumference * 0.75;
  const offset = arcLength - (animatedScore / 100) * arcLength;
  const color = RISK_COLORS[level];
  const isAction = level === 'ACTION';

  useEffect(() => {
    const start = performance.now();
    const from = animatedScore;
    const to = score;
    const duration = 800;

    function animate(time: number) {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className={`relative inline-flex flex-col items-center ${isAction ? 'animate-pulse-action' : ''}`}>
      <svg width={config.width} height={config.width} viewBox={`0 0 ${config.width} ${config.width}`}>
        <defs>
          <filter id={`glow-${size}-${level}`}>
            <feGaussianBlur stdDeviation={size === 'large' ? 6 : 4} result="blur" />
            <feFlood floodColor={color} floodOpacity={isAction ? 0.6 : 0.4} result="color" />
            <feComposite in="color" in2="blur" operator="in" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx={cx}
          cy={cy}
          r={config.radius}
          fill="none"
          stroke={ct.borderMuted}
          strokeWidth={config.strokeWidth}
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          strokeLinecap="round"
          transform={`rotate(135, ${cx}, ${cy})`}
        />

        <circle
          cx={cx}
          cy={cy}
          r={config.radius}
          fill="none"
          stroke={color}
          strokeWidth={config.strokeWidth}
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(135, ${cx}, ${cy})`}
          filter={`url(#glow-${size}-${level})`}
          style={{ transition: 'stroke-dashoffset 500ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />

        {size !== 'small' && (
          <>
            {[0, 30, 50, 71, 100].map(tick => {
              const angle = 135 + (tick / 100) * 270;
              const rad = (angle * Math.PI) / 180;
              const innerR = config.radius - config.strokeWidth;
              const outerR = config.radius + 4;
              return (
                <line
                  key={tick}
                  x1={cx + innerR * Math.cos(rad)}
                  y1={cy + innerR * Math.sin(rad)}
                  x2={cx + outerR * Math.cos(rad)}
                  y2={cy + outerR * Math.sin(rad)}
                  stroke={ct.axis}
                  strokeWidth={1}
                />
              );
            })}
          </>
        )}

        <text
          x={cx}
          y={cy + (size === 'small' ? 1 : 4)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize={config.fontSize}
          fontWeight={800}
          fontFamily="Inter, sans-serif"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {animatedScore}
        </text>
      </svg>

      {showLabel && config.labelSize > 0 && (
        <span
          className="mt-1 font-semibold uppercase tracking-wider"
          style={{ color, fontSize: config.labelSize }}
        >
          {level}
        </span>
      )}
    </div>
  );
}
