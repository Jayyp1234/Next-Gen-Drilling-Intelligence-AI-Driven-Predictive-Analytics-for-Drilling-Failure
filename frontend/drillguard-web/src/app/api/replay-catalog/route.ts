import { NextResponse } from "next/server";
import { loadReplay } from "@/lib/replay/server";

// Static-exportable: the catalog is fixed pipeline output, baked at build time
// so the cPanel static deployment ships a self-contained replay demo.
export const dynamic = "force-static";

/** Catalog of replayable datasets (real pipeline output, no rows). */
export function GET() {
  const { datasets } = loadReplay();
  return NextResponse.json({ datasets });
}
