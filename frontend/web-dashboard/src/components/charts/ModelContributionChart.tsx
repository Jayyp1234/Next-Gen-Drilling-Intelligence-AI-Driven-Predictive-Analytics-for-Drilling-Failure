import { useEffect, useState } from 'react';
import { MODEL_COLORS } from '../../lib/constants';

interface ModelContributionChartProps {
  rfScore: number;
  lstmScore: number;
  dtwScore: number;
}

const models = [
  { key: 'rf', label: 'Random Forest', colorKey: 'RF', weight: 0.40 },
  { key: 'lstm', label: 'LSTM Autoencoder', colorKey: 'LSTM', weight: 0.35 },
  { key: 'dtw', label: 'DTW Pattern', colorKey: 'DTW', weight: 0.25 },
] as const;

export default function ModelContributionChart({ rfScore, lstmScore, dtwScore }: ModelContributionChartProps) {
  const [animated, setAnimated] = useState(false);
  const scores = { rf: rfScore, lstm: lstmScore, dtw: dtwScore };

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-3">
      {models.map((model, i) => {
        const score = scores[model.key];
        const color = MODEL_COLORS[model.colorKey];
        const widthPct = animated ? score * 100 : 0;

        return (
          <div key={model.key} className="flex items-center gap-3">
            <span className="text-sm text-dg-text-secondary w-40 shrink-0">{model.label}</span>
            <div className="flex-1 h-7 bg-dg-bg-card-active rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500 ease-out"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: color,
                  transitionDelay: `${i * 100}ms`,
                }}
              />
            </div>
            <span className="font-mono text-sm text-dg-text-primary w-12 text-right tabular-nums">
              {score.toFixed(2)}
            </span>
          </div>
        );
      })}
      <p className="text-[11px] text-dg-text-tertiary mt-2">
        Weights: RF 0.40 | LSTM 0.35 | DTW 0.25
      </p>
    </div>
  );
}
