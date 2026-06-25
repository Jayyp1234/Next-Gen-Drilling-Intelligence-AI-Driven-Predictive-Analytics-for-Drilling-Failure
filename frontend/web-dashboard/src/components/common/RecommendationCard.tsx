import { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { Recommendation } from '../../types';
import { MODEL_COLORS } from '../../lib/constants';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onFeedback?: (id: string, feedback: 'positive' | 'negative') => void;
}

export default function RecommendationCard({ recommendation, onFeedback }: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const modelColor = recommendation.source_model ? MODEL_COLORS[recommendation.source_model] : '#8B949E';

  return (
    <div
      className="rounded-lg p-3 px-4 cursor-pointer transition-all duration-200"
      style={{
        backgroundColor: 'rgba(210,153,34,0.04)',
        border: '1px solid rgba(210,153,34,0.15)',
        borderLeftWidth: 3,
        borderLeftColor: '#D29922',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2">
        <Lightbulb size={18} className="text-dg-watch shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className={`text-sm text-dg-text-primary ${expanded ? '' : 'line-clamp-2'}`}>
            {recommendation.text}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-20 h-1 bg-dg-bg-card-active rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-dg-watch"
                  style={{ width: `${recommendation.confidence * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-dg-text-tertiary tabular-nums">
                {(recommendation.confidence * 100).toFixed(0)}%
              </span>
            </div>

            {recommendation.source_model && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ backgroundColor: `${modelColor}20`, color: modelColor }}
              >
                {recommendation.source_model}
              </span>
            )}
          </div>

          {expanded && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-dg-border-muted">
              <button
                onClick={(e) => { e.stopPropagation(); onFeedback?.(recommendation.id, 'positive'); }}
                className={`p-1.5 rounded transition-colors ${
                  recommendation.feedback === 'positive'
                    ? 'bg-dg-normal/20 text-dg-normal'
                    : 'text-dg-text-tertiary hover:text-dg-normal hover:bg-dg-normal/10'
                }`}
              >
                <ThumbsUp size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onFeedback?.(recommendation.id, 'negative'); }}
                className={`p-1.5 rounded transition-colors ${
                  recommendation.feedback === 'negative'
                    ? 'bg-dg-action/20 text-dg-action'
                    : 'text-dg-text-tertiary hover:text-dg-action hover:bg-dg-action/10'
                }`}
              >
                <ThumbsDown size={14} />
              </button>
            </div>
          )}
        </div>

        <button className="text-dg-text-tertiary shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
    </div>
  );
}
