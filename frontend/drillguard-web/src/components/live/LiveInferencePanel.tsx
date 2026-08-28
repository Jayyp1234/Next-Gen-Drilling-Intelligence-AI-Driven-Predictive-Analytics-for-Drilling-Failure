"use client";

import { useEffect, useState } from "react";
import { Cpu, Zap, AlertTriangle } from "lucide-react";
import { useLiveInference } from "@/lib/inference/useLiveInference";
import { inferBase } from "@/lib/inference/client";

const TIER_COLOR: Record<string, string> = {
  Action: "text-high", Elevated: "text-medium", Watch: "text-low", Normal: "text-good",
};

/**
 * Shows the model scoring the CURRENT window in real time — the proof that the gauge
 * is computed, not replayed. Only renders when a D2 replay is loaded and the inference
 * service is reachable.
 */
export function LiveInferencePanel() {
  const live = useLiveInference();
  const [ago, setAgo] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setAgo(live.computedAt ? Math.max(0, Math.round((Date.now() - live.computedAt) / 100) / 10) : 0);
    }, 200);
    return () => window.clearInterval(id);
  }, [live.computedAt]);

  if (!live.active) return null;

  const r = live.result;
  const scored = live.status === "ok" && r;

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary"><Cpu size={17} /></span>
          <div>
            <div className="text-[13px] font-bold text-text">Live Model Inference{live.label ? ` · ${live.label}` : ""}</div>
            <div className="text-[11px] text-muted">{live.model ?? "model"} · RF + LSTM-AE + DTW · scored on the current window</div>
          </div>
        </div>
        {live.status === "error" ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-high-soft px-2 py-1 text-[11px] font-semibold text-high"><AlertTriangle size={12} /> API offline</span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-good-soft px-2 py-1 text-[11px] font-semibold text-good"><Zap size={12} /> Computed live</span>
        )}
      </div>

      {scored ? (
        <>
          <div className="flex items-end gap-4">
            <div>
              <div className="section-label">Model risk</div>
              <div className="text-[34px] font-extrabold leading-none tnum">{r.risk == null ? "—" : Math.round(r.risk)}<span className="text-[15px] font-semibold text-muted">/100</span></div>
            </div>
            <div className={`pb-1 text-[15px] font-bold uppercase ${TIER_COLOR[r.tier] ?? "text-muted"}`}>{r.tier || "—"}</div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { k: "RF", v: r.S_baseline, hint: "point classifier" },
              { k: "LSTM", v: r.S_LSTM, hint: "trend detector" },
              { k: "DTW", v: r.S_DTW, hint: "shape matcher" },
            ].map((m) => (
              <div key={m.k} className="rounded-lg border border-border bg-surface-2 p-2.5">
                <div className="text-[11px] font-semibold text-text-2">{m.k}</div>
                <div className="text-[16px] font-bold tnum">{m.v == null ? "—" : m.v.toFixed(2)}</div>
                <div className="text-[10px] text-muted-2">{m.hint}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
            <span>active: {r.active_monitors || "—"}</span>
            <span className="tnum">computed {ago.toFixed(1)}s ago · {live.latencyMs}ms · {inferBase.replace(/^https?:\/\//, "")}</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-2">
            This number is POSTed from the browser to the Python model service and computed on the
            last 30 samples — not read from a file. It matches the gauge because the served model is
            the validated model.
          </p>
        </>
      ) : (
        <div className="py-4 text-center text-[13px] text-muted">
          {live.status === "error" ? "Inference service unreachable — start ml-pipeline/serving." : "Waiting for a full 30-sample window…"}
        </div>
      )}
    </div>
  );
}
