/** Drilling-specific glyphs not in lucide: rig/derrick, used in headers & cards. */
export function RigIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3 7 20h10L12 3Z" />
      <path d="M9.2 12h5.6M8.2 16h7.6M5 20h14" />
      <path d="M12 3v-1" />
    </svg>
  );
}

/** Big derrick illustration for OPERATIONAL STATE */
export function DerrickIllustration({ size = 72, color = "#0f172a" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M32 6 18 56h28L32 6Z" />
      <path d="M24 28h16M21 38h22M18 48h28" />
      <path d="M32 6l-4 0M32 10l6 2M32 22l-8-2M32 22l8 2M32 34l-10-2M32 34l10 2M32 46l-12-2M32 46l12 2" strokeWidth="1.2" />
      <rect x="12" y="56" width="40" height="4" fill={color} />
    </svg>
  );
}
