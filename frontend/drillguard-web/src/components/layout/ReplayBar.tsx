"use client";

import { Play, Pause, SkipBack, Database, Flag } from "lucide-react";
import Link from "next/link";
import { useReplay } from "@/lib/replay/ReplayProvider";
import clsx from "clsx";

const SPEEDS = [1, 5, 10, 50, 100];

/** Replay transport strip — shown wherever a replay dataset is loaded. */
export function ReplayBar() {
  const r = useReplay();
  if (!r.dataset) return null;
  const pct = r.rows.length ? (r.cursor / (r.rows.length - 1)) * 100 : 0;
  const a = r.anchorLead;
  const anchorPct = a && r.rows.length ? ((a.eventIdx - r.dataset.lo) / (r.dataset.hi - r.dataset.lo)) * 100 : null;
  return (
    <div className="flex items-center gap-4 border-b border-border bg-surface px-7 py-2.5 text-[13px]">
      <Database size={16} className="shrink-0 text-primary" />
      <span className="shrink-0 font-semibold">{r.dataset.name}</span>
      <span className="shrink-0 rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">REPLAY · {r.dataset.labelTier}</span>

      <button type="button" onClick={() => r.seek(0)} className="grid h-8 w-8 place-items-center rounded-lg border border-border"><SkipBack size={14} /></button>
      <button type="button" onClick={r.playing ? r.pause : r.play} className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">
        {r.playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
        {SPEEDS.map((sp) => (
          <button key={sp} type="button" onClick={() => r.setSpeed(sp)}
            className={clsx("rounded-md px-2 py-1 text-[12px] font-medium", sp === r.speed ? "bg-primary text-white" : "text-text-2")}>{sp}×</button>
        ))}
      </div>
      {r.hasEvent && (
        <button type="button" onClick={r.jumpToEvent}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-high/40 bg-high-soft px-2.5 text-[12px] font-semibold text-high"
          title="Seek to the documented event approach">
          <Flag size={13} /> Jump to event
        </button>
      )}

      <div className="relative min-w-0 flex-1">
        <input type="range" min={0} max={Math.max(0, r.rows.length - 1)} value={r.cursor} onChange={(e) => r.seek(Number(e.target.value))}
          className="w-full accent-[#1d5af0]" aria-label="Replay position" />
        {anchorPct !== null && (
          <span className="pointer-events-none absolute -top-1.5 -translate-x-1/2 text-high" style={{ left: `${anchorPct}%` }} title={`Documented event: ${a?.anchorId}`}>
            <Flag size={12} className="fill-high" />
          </span>
        )}
      </div>
      <span className="shrink-0 tnum text-text-2">
        {r.current ? r.fmtIdx(r.current.idx) : "—"} · row {r.cursor + 1}/{r.rows.length} · {pct.toFixed(0)}%
      </span>
      {a && (
        <span className={clsx("shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold", a.leadM !== null ? "bg-good-soft text-good" : "bg-surface-2 text-muted")}>
          {a.leadM !== null ? `${a.via} warned ${a.leadM} m before ${a.anchorId}` : `Documented event ahead: ${a.anchorId}`}
        </span>
      )}
      <Link href="/initialize/run-mode" className="shrink-0 text-[12px] font-medium text-primary">Change dataset</Link>
    </div>
  );
}
