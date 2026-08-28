import { NextResponse } from "next/server";
import { loadReplay } from "@/lib/replay/server";

// Static-exportable: every dataset id is known at build time, so each replay
// JSON is baked into the export (self-contained demo on static hosting).
export const dynamic = "force-static";

export function generateStaticParams() {
  const { datasets } = loadReplay();
  return datasets.map((d) => ({ id: d.id }));
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { datasets, rows } = loadReplay();
  const ds = datasets.find((d) => d.id === id);
  if (!ds) return NextResponse.json({ error: "unknown dataset" }, { status: 404 });
  return NextResponse.json({ dataset: ds, rows: rows[id] });
}
