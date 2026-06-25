import { useEffect, useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { RISK_COLORS } from '../../lib/constants';
import type { AlertSeverity } from '../../types';

export interface ToastData {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  duration?: number;
}

interface NotificationToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const DURATIONS: Record<AlertSeverity, number> = {
  WATCH: 8000,
  ELEVATED: 15000,
  ACTION: 0,
};

export default function NotificationToast({ toast, onDismiss }: NotificationToastProps) {
  const [progress, setProgress] = useState(100);
  const [exiting, setExiting] = useState(false);
  const color = RISK_COLORS[toast.severity];
  const duration = toast.duration ?? DURATIONS[toast.severity];
  const isAction = toast.severity === 'ACTION';

  useEffect(() => {
    if (duration <= 0) return;
    const interval = 50;
    const step = (interval / duration) * 100;
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          handleDismiss();
          return 0;
        }
        return prev - step;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [duration]);

  function handleDismiss() {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  }

  return (
    <div
      className={`
        w-[360px] bg-dg-bg-card-active border border-dg-border rounded-lg overflow-hidden
        shadow-[0_14px_28px_rgba(0,0,0,0.25),0_10px_10px_rgba(0,0,0,0.22)]
        ${exiting ? 'opacity-0 translate-x-5' : 'animate-slide-in-up'}
        ${isAction ? 'animate-glow-pulse' : ''}
        transition-all duration-200
      `}
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <div className="p-3 px-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} style={{ color }} />
            <span className="text-sm font-semibold text-dg-text-primary">{toast.title}</span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-dg-text-tertiary hover:text-dg-text-secondary transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <p className="text-xs text-dg-text-secondary mt-1 ml-6">{toast.message}</p>
      </div>
      {duration > 0 && (
        <div className="h-0.5 bg-dg-border-muted">
          <div
            className="h-full transition-all duration-50 ease-linear"
            style={{ width: `${progress}%`, backgroundColor: color }}
          />
        </div>
      )}
    </div>
  );
}
