"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardTitle, Button, Badge, Chip } from "@/components/ui/primitives";
import { AreaTrend } from "@/components/charts";
import {
  UploadCloud, FileText, Cpu, Zap, TriangleAlert, CheckCircle2, Flag, Loader2, PlayCircle,
} from "lucide-react";
import {
  inferEnabled, scoreCsv, modelCard, type ScoreCsvResult, type ModelCard,
} from "@/lib/inference/client";

const TIER_SEV: Record<string, "high" | "medium" | "low" | "good"> = {
  Action: "high", Elevated: "medium", Watch: "low", Normal: "good",
};

const MODELS = [
  { id: "bilabri-d2", label: "Stuck Pipe", sub: "Bilabri D2", sample: "/sample-well.csv" },
  { id: "eos-stick-slip", label: "Stick-Slip", sub: "31/5-7 Eos", sample: "/sample-eos.csv" },
  { id: "volve-packoff", label: "Pack-Off", sub: "Volve F-15", sample: "/sample-volve.csv" },
];

export default function AnalyzePage() {
  const [model, setModel] = useState("bilabri-d2");
  const [card, setCard] = useState<ModelCard | null>(null);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [result, setResult] = useState<ScoreCsvResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inferEnabled) modelCard(model).then(setCard).catch(() => setCard(null));
  }, [model]);

  const run = useCallback(async (blob: File | Blob, name: string, size: number, mdl: string) => {
    setBusy(true); setError(null); setResult(null); setFile({ name, size });
    try {
      setResult(await scoreCsv(blob, mdl));
    } catch (e) {
      setError(e instanceof Error ? e.message : "scoring failed");
    } finally {
      setBusy(false);
    }
  }, []);

  const onFile = (f: File) => run(f, f.name, f.size, model);
  const trySample = async () => {
    if (busy) return;
    const m = MODELS.find((x) => x.id === model)!;
    const res = await fetch(m.sample);
    const blob = await res.blob();
    run(blob, `${m.sample.slice(1)} · ${m.sub}`, blob.size, model);
  };

  if (!inferEnabled) {
    return (
      <>
        <PageHeader title="Analyze a Well" subtitle="Score your own drilling telemetry with the DrillGuard model" />
        <div className="p-5">
          <Card className="flex items-center gap-3">
            <TriangleAlert size={20} className="text-medium" />
            <div className="text-[14px] text-text-2">
              The inference service is not configured. Set <code className="rounded bg-surface-2 px-1">NEXT_PUBLIC_INFER_BASE</code> and start
              <code className="ml-1 rounded bg-surface-2 px-1">ml-pipeline/serving</code>.
            </div>
          </Card>
        </div>
      </>
    );
  }

  const traj = (result?.trajectory ?? []).filter((t) => t.risk != null);
  const chartData = traj.map((t) => ({ d: t.depth, risk: t.risk as number, rf: (t.S_baseline ?? 0) * 100 }));

  return (
    <>
      <PageHeader title="Analyze a Well" subtitle="Upload drilling telemetry — the model scores every window on the spot" />
      <div className="space-y-4 p-5">
        {/* ---- Model selector ---- */}
        <div>
          <div className="section-label mb-2">Choose a model</div>
          <div className="flex flex-wrap gap-2">
            {MODELS.map((m) => {
              const active = m.id === model;
              return (
                <button key={m.id} type="button" onClick={() => { setModel(m.id); setResult(null); setFile(null); setError(null); }}
                  className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-left transition-colors ${active ? "border-primary bg-primary-soft" : "border-border bg-surface hover:bg-surface-2"}`}>
                  <Cpu size={17} className={active ? "text-primary" : "text-muted"} />
                  <span>
                    <span className={`block text-[13.5px] font-semibold ${active ? "text-primary" : "text-text"}`}>{m.label}</span>
                    <span className="block text-[11.5px] text-muted">{m.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---- Upload + model card ---- */}
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4">
          <Card className="flex flex-col">
            <CardTitle>Upload telemetry (CSV)</CardTitle>
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
              onClick={() => inputRef.current?.click()}
              className={`mt-1 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${drag ? "border-primary bg-primary-soft" : "border-border bg-surface-2 hover:border-primary"}`}
            >
              <UploadCloud size={34} className="text-primary" />
              <div className="mt-3 text-[15px] font-semibold text-text">Drop a CSV here, or click to choose</div>
              <div className="mt-1 text-[12.5px] text-muted">
                Required columns: {(card?.raw_inputs ?? ["torque", "wob", "spp", "gpm", "mse_psi", "rop"]).join(", ")} <span className="text-muted-2">(optional: depth)</span>
              </div>
              <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Button variant="outline" icon={<PlayCircle size={16} />} onClick={trySample}>Try the sample well</Button>
              {file && <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted"><FileText size={14} /> {file.name} · {(file.size / 1024).toFixed(0)} KB</span>}
            </div>
            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-high-soft px-3 py-2.5 text-[13px] text-high">
                <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </Card>

          <Card>
            <CardTitle right={<span className="inline-flex items-center gap-1 rounded-md bg-good-soft px-2 py-0.5 text-[11px] font-semibold text-good"><Zap size={12} /> live model</span>}>
              <span className="inline-flex items-center gap-2"><Cpu size={16} className="text-primary" /> Model</span>
            </CardTitle>
            {card ? (
              <div className="space-y-2 text-[13px]">
                <Row k="Model" v={card.model} />
                <Row k="Mechanism" v={card.mechanism.replace(/_/g, " ")} />
                <Row k="Validated on" v={`${card.well} · ${card.anchor}`} />
                <Row k="Monitors" v={card.monitors.join(" + ")} />
                <Row k="Window" v={`${card.window_samples} samples`} />
                <p className="pt-1 text-[11.5px] leading-relaxed text-muted-2">{card.note}</p>
              </div>
            ) : (
              <div className="py-4 text-center text-[13px] text-muted">Model card unavailable — is the service running?</div>
            )}
          </Card>
        </div>

        {/* ---- Busy ---- */}
        {busy && (
          <Card className="flex items-center justify-center gap-3 py-10 text-muted">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span className="text-[14px]">Scoring every window through RF + LSTM-AE + DTW…</span>
          </Card>
        )}

        {/* ---- Results ---- */}
        {result && !busy && (
          <>
            <div className="grid grid-cols-4 gap-4">
              <Tile label="Windows scored" value={result.rows_scored.toLocaleString()} icon={<CheckCircle2 size={18} />} sev="good" />
              <Tile label="Peak risk" value={result.peak_risk ? `${Math.round(result.peak_risk.risk)}/100` : "—"} sub={result.peak_risk ? `at ${result.peak_risk.depth.toLocaleString()} m` : ""} icon={<TriangleAlert size={18} />} sev="high" />
              <Tile label="Tier crossings" value={String(result.tier_crossings.length)} icon={<Flag size={18} />} sev="medium" />
              <Tile label="Window size" value={`${result.window}`} sub="samples" icon={<Cpu size={18} />} sev="info" />
            </div>

            <Card>
              <CardTitle sub="model risk (0–100) + RF channel, computed per window">Risk trajectory</CardTitle>
              <AreaTrend
                data={chartData}
                xKey="d"
                dataKey="risk"
                color="#e53935"
                targetKey="rf"
                targetColor="#1d5af0"
                yDomain={[0, 100]}
                yTicks={[0, 25, 50, 75, 100]}
                height={230}
              />
              <div className="mt-2 flex items-center gap-5 text-[12px] text-muted">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-high" /> Fused risk</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-primary" /> RF channel (×100)</span>
              </div>
            </Card>

            <Card>
              <CardTitle>Detected escalations</CardTitle>
              {result.tier_crossings.length === 0 ? (
                <div className="py-6 text-center text-[13px] text-muted">No tier crossings — the model held this run at Normal.</div>
              ) : (
                <div className="space-y-2">
                  {result.tier_crossings.map((c, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Flag size={15} className="text-high" />
                        <span className="text-[13.5px] font-semibold">Crossed into {c.tier}</span>
                        <Chip sev={TIER_SEV[c.tier] ?? "good"}>{c.tier}</Chip>
                      </div>
                      <div className="flex items-center gap-4 text-[12.5px] text-muted">
                        <span>depth <span className="font-semibold text-text">{c.depth.toLocaleString()} m</span></span>
                        <span>risk <span className="font-semibold text-text">{c.risk == null ? "—" : Math.round(c.risk)}</span></span>
                        <Badge sev="low">{c.active_monitors}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[12px] leading-relaxed text-muted-2">
                Every value here was computed by the model from the uploaded telemetry — {result.rows_scored.toLocaleString()} windows
                scored through the RF + LSTM-AE + DTW ensemble. Nothing is pre-recorded.
              </p>
            </Card>
          </>
        )}
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-2">{k}</span>
      <span className="font-semibold text-text">{v}</span>
    </div>
  );
}

function Tile({ label, value, sub, icon, sev }: { label: string; value: string; sub?: string; icon: React.ReactNode; sev: "good" | "high" | "medium" | "info" }) {
  const tone: Record<string, string> = { good: "text-good bg-good-soft", high: "text-high bg-high-soft", medium: "text-medium bg-medium-soft", info: "text-primary bg-primary-soft" };
  return (
    <Card className="flex items-start gap-3">
      <span className={`grid h-9 w-9 place-items-center rounded-lg ${tone[sev]}`}>{icon}</span>
      <div>
        <div className="text-[12.5px] text-muted">{label}</div>
        <div className="text-[22px] font-extrabold leading-tight tnum">{value}</div>
        {sub && <div className="text-[11.5px] text-muted-2">{sub}</div>}
      </div>
    </Card>
  );
}
