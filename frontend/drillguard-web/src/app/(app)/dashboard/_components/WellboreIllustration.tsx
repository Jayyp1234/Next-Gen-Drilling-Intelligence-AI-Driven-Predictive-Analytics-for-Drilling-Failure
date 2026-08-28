"use client";

import { DerrickIllustration } from "@/components/ui/icons";

/**
 * WELL OVERVIEW schematic — a small derrick over stacked strata with a grey
 * casing/drillstring running down the centre and a bit at the bottom. Pure
 * CSS gradients + the kit's derrick glyph (no raster assets).
 */
export function WellboreIllustration({ width = 104, height = 250 }: { width?: number; height?: number }) {
  const strata =
    "linear-gradient(180deg," +
    "#c9a27a 0%, #c9a27a 13%," +
    "#8a6a4c 13%, #8a6a4c 27%," +
    "#b0b6bf 27%, #b0b6bf 40%," +
    "#6b5440 40%, #6b5440 55%," +
    "#8c8f96 55%, #8c8f96 70%," +
    "#4e3d30 70%, #4e3d30 85%," +
    "#3a2f27 85%, #3a2f27 100%)";
  return (
    <div className="flex shrink-0 flex-col items-center" style={{ width }}>
      <DerrickIllustration size={Math.round(width * 0.55)} color="#334155" />
      <div className="relative -mt-1 w-full overflow-hidden rounded-md" style={{ height, background: strata }}>
        {/* casing */}
        <div className="absolute left-1/2 top-0 h-[90%] w-[18px] -translate-x-1/2 bg-[#e2e8f0]" />
        <div className="absolute left-1/2 top-0 h-[62%] w-[10px] -translate-x-1/2 bg-[#94a3b8]" />
        {/* drillstring */}
        <div className="absolute left-1/2 top-0 h-[90%] w-[4px] -translate-x-1/2 bg-[#475569]" />
        {/* bit */}
        <div className="absolute left-1/2 top-[88%] h-[14px] w-[26px] -translate-x-1/2 rounded-b-md bg-[#64748b]" />
      </div>
    </div>
  );
}
