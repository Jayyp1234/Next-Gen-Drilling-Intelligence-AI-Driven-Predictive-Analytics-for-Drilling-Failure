import { useMemo } from 'react';

interface LogoProps {
  /** Size of the logo (single number = square). */
  size?: number;
  /** Optional CSS class for the wrapper. */
  className?: string;
  /** Show subtle pulse/glow animation. */
  animated?: boolean;
  /** Accessible label. */
  ariaHidden?: boolean;
}

const LOGO_SRC = '/logo.png';

export default function Logo({ size = 32, className = '', animated = true, ariaHidden }: LogoProps) {
  const sizeStyle = useMemo(() => ({ width: size, height: size, minWidth: size, minHeight: size }), [size]);

  return (
    <span
      className={`
        inline-flex items-center justify-center shrink-0
        transition-transform duration-300 ease-out
        hover:scale-105
        ${className}
      `}
      style={sizeStyle}
      aria-hidden={ariaHidden ?? true}
    >
      <img
        src={LOGO_SRC}
        alt="DrillGuard"
        className={`w-full h-full object-contain select-none ${animated ? 'animate-logo-glow' : ''}`}
        draggable={false}
        fetchPriority="high"
        style={sizeStyle}
      />
    </span>
  );
}
