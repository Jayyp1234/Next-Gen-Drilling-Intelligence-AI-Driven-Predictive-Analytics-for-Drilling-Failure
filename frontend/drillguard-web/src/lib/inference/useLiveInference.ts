"use client";

import { useEffect, useRef, useState } from "react";
import { useReplay } from "@/lib/replay/ReplayProvider";
import { inferEnabled, modelForWell, scoreWindow, type ScoreResult, type RawSample } from "./client";

const WINDOW = 30; // must match the served models' window
const POLL_MS = 900;

export type LiveInferenceState = {
  active: boolean;                       // this dataset has a served model + API is on
  model: string | null;
  label: string | null;                  // mechanism label ("Stuck Pipe" …)
  status: "idle" | "ok" | "error";
  result: ScoreResult | null;
  latencyMs: number | null;
  computedAt: number | null;
  idx: number | null;
};

/**
 * While a replay whose well has a served model is loaded and the inference API is on,
 * periodically POST the CURRENT telemetry window (win + the model's history) to /score
 * and return the model's fresh computation. Works for stuck-pipe (D2), stick-slip (Eos)
 * and pack-off (Volve). Uses a ref so the poller isn't torn down each cursor tick.
 */
export function useLiveInference(): LiveInferenceState {
  const r = useReplay();
  const model = inferEnabled ? modelForWell(r.dataset?.well) : null;
  const active = !!model;

  const ref = useRef({ rows: r.rows, cursor: r.cursor });
  useEffect(() => {
    ref.current = { rows: r.rows, cursor: r.cursor };
  });

  const [state, setState] = useState<Omit<LiveInferenceState, "active" | "model" | "label">>({
    status: "idle", result: null, latencyMs: null, computedAt: null, idx: null,
  });

  useEffect(() => {
    if (!model) return;
    let alive = true;
    const span = WINDOW + model.history;

    const buildWindow = (rows: typeof ref.current.rows, end: number): RawSample[] | null => {
      const lo = Math.max(0, end - span + 1);
      if (end - lo + 1 < WINDOW) return null;               // not enough for even the base window
      const win: RawSample[] = [];
      for (let i = lo; i <= end; i++) {
        const raw = model.rawFromCh(rows[i]?.ch ?? {});
        if (!raw) return null;
        win.push(raw);
      }
      return win;
    };

    const tick = async () => {
      const { rows, cursor } = ref.current;
      if (cursor < WINDOW - 1 || !rows.length) return;
      // window at the cursor, or the most recent fully-valid one before it (channels flicker)
      let end = cursor, win: RawSample[] | null = null;
      for (let back = 0; back < 300 && end - back >= WINDOW - 1; back++) {
        win = buildWindow(rows, end - back);
        if (win) { end -= back; break; }
      }
      if (!win) return;
      const t0 = performance.now();
      try {
        const result = await scoreWindow(win, model.id);
        if (alive) {
          setState({
            status: "ok", result,
            latencyMs: Math.round(performance.now() - t0),
            computedAt: Date.now(), idx: rows[end]?.idx ?? null,
          });
        }
      } catch {
        if (alive) setState((s) => ({ ...s, status: "error" }));
      }
    };

    tick();
    const id = window.setInterval(tick, POLL_MS);
    return () => { alive = false; window.clearInterval(id); };
  }, [model]);

  return { active, model: model?.id ?? null, label: model?.label ?? null, ...state };
}
