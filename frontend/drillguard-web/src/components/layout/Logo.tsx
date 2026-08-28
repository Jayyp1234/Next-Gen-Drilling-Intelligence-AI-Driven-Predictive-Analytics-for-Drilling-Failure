/** DrillGuard shield + derrick mark and wordmark, as in every screen header. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="44" height="48" viewBox="0 0 44 48" aria-hidden="true">
        <path
          d="M22 2 L40 8 V24 C40 34 32 42 22 46 C12 42 4 34 4 24 V8 Z"
          fill="#ffffff"
          stroke="#1d5af0"
          strokeWidth="2.5"
        />
        {/* derrick */}
        <path
          d="M22 10 L16 32 H28 Z M19 20 H25 M18 26 H26"
          fill="none"
          stroke="#0b1a33"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M14 32 H30" stroke="#0b1a33" strokeWidth="2" />
        <path d="M19 36 L22 40 L25 36" fill="#1d5af0" />
      </svg>
      {!compact && (
        <div className="leading-none">
          <div className="text-[21px] font-extrabold tracking-tight">
            <span className="text-sidebar-text">DRILL</span>
            <span className="text-primary">GUARD</span>
          </div>
          <div className="mt-1 whitespace-nowrap text-[10.5px] text-sidebar-muted">
            Drilling Safety Intelligence
          </div>
        </div>
      )}
    </div>
  );
}
