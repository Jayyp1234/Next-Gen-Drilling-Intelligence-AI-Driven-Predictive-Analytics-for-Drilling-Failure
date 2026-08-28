"use client";

import { useEffect, useRef } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardTitle,
  Button,
  Badge,
  Chip,
  IconTile,
  InlineSelect,
  CheckDot,
  ArrowLink,
} from "@/components/ui/primitives";
import { RiskGauge, MiniGauge, Ring, Sparkline, series } from "@/components/ui/gauges";
import { MultiLine, LegendChips } from "@/components/charts";
import { DerrickIllustration } from "@/components/ui/icons";
import {
  Upload,
  Database,
  Wifi,
  ArrowDown,
  Maximize2,
  MoreVertical,
  AlertTriangle,
  AlertOctagon,
  Droplets,
  Anchor,
  RotateCw,
  Gauge as GaugeIcon,
  TrendingUp,
  Weight,
  Flame,
  Thermometer,
  Wind,
  Sun,
  Beaker,
  FlaskConical,
  Mountain,
} from "lucide-react";
import { useLiveView } from "@/lib/replay/useLiveView";
import { ReplayBar } from "@/components/layout/ReplayBar";
import { LiveInferencePanel } from "@/components/live/LiveInferencePanel";
import { downloadCsv } from "@/lib/export";

const paramIcon: Record<string, React.ReactNode> = {
  hook: <Anchor size={15} className="text-good" />,
  torque: <RotateCw size={15} className="text-good" />,
  spp: <GaugeIcon size={15} className="text-primary" />,
  rop: <TrendingUp size={15} className="text-orange-500" />,
  wob: <Weight size={15} className="text-medium" />,
  flow: <Droplets size={15} className="text-primary" />,
  gas: <Flame size={15} className="text-good" />,
};
const envIcon: Record<string, React.ReactNode> = {
  temp: <Thermometer size={22} className="text-primary" />,
  wind: <Wind size={22} className="text-text-2" />,
  drop: <Droplets size={22} className="text-primary" />,
  sun: <Sun size={22} className="text-medium" />,
  visc: <Beaker size={22} className="text-good" />,
  ph: <FlaskConical size={22} className="text-good" />,
  sand: <Mountain size={22} className="text-text-2" />,
};

export default function LiveMonitoringPage() {
  const d = useLiveView();

  // Guided demo: arriving with ?demo=1, once the well's rows are loaded, seek to the
  // documented-event approach and auto-play so the warning unfolds hands-free.
  const demoRan = useRef(false);
  const r = d.r;
  useEffect(() => {
    if (demoRan.current || typeof window === "undefined") return;
    if (sessionStorage.getItem("dg-demo-launch") !== "1") return;
    if (!r.dataset || !r.rows.length || !r.hasEvent) return;
    demoRan.current = true;
    sessionStorage.removeItem("dg-demo-launch");
    r.jumpToEvent();
    r.setSpeed(3); // watchable pace — ~10 s to climb through the warning into the event
    r.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when rows first load
  }, [r.dataset, r.rows.length, r.hasEvent]);
  const exportData = () => {
    if (d.replay && d.r.dataset) {
      const rows = d.r.rows.map((row) => ({
        index: row.idx, on_bottom_circulating: row.onb,
        S_baseline: row.sb, S_LSTM: row.sl, S_DTW: row.sd,
        active_monitors: row.active, risk_score: row.risk, alert_tier: row.tier, label: row.label,
        ...row.ch,
      }));
      downloadCsv(`drillguard_${d.r.dataset.well.replace(/[^A-Za-z0-9]+/g, "-")}_ensemble`, rows);
    } else {
      downloadCsv("drillguard_sample_parameters", d.params.map((pm) => ({ parameter: pm.name, value: pm.value, unit: pm.unit, range: pm.range })));
    }
  };
  return (
    <>
      <PageHeader
        title="Live Monitoring"
        subtitle="Real-time drilling data and operational overview"
        rigLabel="Rig 12 – OML18-W12"
        rangeLabel="Last 5 Minutes"
        bellCount={3}
        action={<Button icon={<Upload size={16} />} onClick={exportData}>Export</Button>}
      />
      <ReplayBar />
      {!d.replay && (
        <div className="flex items-center justify-between gap-3 border-b border-border bg-primary-soft px-7 py-2.5 text-[13px] text-primary">
          <span className="flex items-center gap-2">
            <Database size={15} /> Showing <strong>sample data</strong>. Initialize a well to stream real field data (Volve · Bilabri · Eos).
          </span>
          <a href="/initialize/run-mode" className="shrink-0 font-semibold underline-offset-2 hover:underline">Initialize a well →</a>
        </div>
      )}

      <div className="space-y-4 p-5">
        {/* ---- Row 1: KPI cards --------------------------------------- */}
        <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)_minmax(0,0.9fr)_minmax(0,1.05fr)_minmax(0,0.95fr)] gap-4">
          <Card>
            <CardTitle info>Drilling Risk Score</CardTitle>
            <div className="flex justify-center">
              <RiskGauge value={d.risk.score} label={d.risk.label} size={200} />
            </div>
            <div className="mt-2 flex items-center justify-center gap-1 text-[13px]">
              <ArrowDown size={14} className="text-good" />
              <span className="font-semibold text-good">{d.risk.delta}</span>
              <span className="text-muted">{d.risk.deltaText}</span>
            </div>
          </Card>

          <Card>
            <CardTitle>Operational State</CardTitle>
            <div className="flex flex-col items-center pt-1">
              <DerrickIllustration size={70} />
              <div className="mt-3 text-[20px] font-extrabold text-good">{d.kpis.state.value}</div>
              <div className="mt-1 text-[13px] text-muted">{d.kpis.state.since}</div>
            </div>
          </Card>

          <Card>
            <CardTitle>Depth (TVD)</CardTitle>
            <div className="text-[30px] font-extrabold leading-none tnum">
              {d.kpis.depth.value} <span className="text-[15px] font-semibold">{d.kpis.depth.unit}</span>
            </div>
            <div className="mt-2 text-[12px] text-muted">{d.kpis.depth.sub}</div>
            <div className="mt-3">
              <Sparkline data={series(24, 40, 6, 5, 30)} color="#1d5af0" width={150} height={44} />
            </div>
          </Card>

          <Card>
            <CardTitle>Hookload</CardTitle>
            <div className="text-[30px] font-extrabold leading-none tnum">
              {d.kpis.hookload.value} <span className="text-[15px] font-semibold">{d.kpis.hookload.unit}</span>
            </div>
            <div className="mt-2 text-[12px] text-muted">{d.kpis.hookload.sub}</div>
            <div className="mt-3">
              <Sparkline data={series(24, 40, 10, 9, 4)} color="#16a34a" width={160} height={44} />
            </div>
          </Card>

          <Card>
            <CardTitle>Connection</CardTitle>
            <div className="flex flex-col items-center pt-1">
              <Wifi size={48} className="text-good" strokeWidth={2.2} />
              <div className="mt-2 text-[20px] font-extrabold text-good">{d.kpis.connection.value}</div>
              <div className="mt-1 text-[13px] text-muted">{d.kpis.connection.sub}</div>
            </div>
          </Card>
        </div>

        {/* ---- Live model inference (only when the served model + API are on) --- */}
        <LiveInferencePanel />

        {/* ---- Row 2: Live parameter trends ---------------------------- */}
        <Card>
          <CardTitle
            right={
              <div className="flex items-center gap-4">
                <LegendChips items={d.trendLegend} />
                <InlineSelect value="Auto Scale" />
                <Maximize2 size={16} className="text-text-2" />
                <MoreVertical size={16} className="text-text-2" />
              </div>
            }
          >
            Live Parameter Trends
          </CardTitle>
          <div className="flex gap-3">
            <div className="min-w-0 flex-1">
              <MultiLine
                data={d.trendData}
                series={d.replay ? [
                  { key: "risk", color: "#1d5af0" },
                  { key: "rf", color: "#16a34a" },
                  { key: "lstm", color: "#7c3aed" },
                  { key: "dtw", color: "#f97316" },
                ] : [
                  { key: "hookload", color: "#1d5af0" },
                  { key: "torque", color: "#16a34a" },
                  { key: "spp", color: "#7c3aed" },
                  { key: "rop", color: "#f97316" },
                ]}
                yDomain={d.replay ? [0, 100] : [0, 200]}
                yTicks={d.replay ? [0, 25, 50, 75, 100] : [0, 50, 100, 150, 200]}
                xTicks={[0, 12, 24, 36, 48, 59]}
                tickFormatter={(v) => d.replay ? (Number(v) === 59 ? "Now" : `-${59 - Number(v)}`) : (({ 0: "10:20", 12: "10:21", 24: "10:22", 36: "10:23", 48: "10:24", 59: "Now" } as Record<number, string>)[Number(v)] ?? "")}
                height={230}
              />
            </div>
            <div className="flex w-[72px] shrink-0 flex-col justify-around py-3">
              {d.trendEnds.map((e) => (
                <span key={e.label} className="rounded-md px-2 py-1 text-center text-[11px] font-bold text-white" style={{ background: e.color }}>
                  {e.label}
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* ---- Row 3: Real-time parameters ----------------------------- */}
        <Card>
          <CardTitle>Real-Time Parameters</CardTitle>
          <div className="grid grid-cols-7 gap-3">
            {d.params.map((p) => (
              <div key={p.name} className="rounded-xl border border-border bg-surface p-3">
                <div className="flex items-center gap-2 text-[12px] font-medium text-text-2">
                  {paramIcon[p.icon]}
                  {p.name}
                </div>
                <div className="mt-2 text-[18px] font-bold tnum">
                  {p.value} <span className="text-[13px] font-medium">{p.unit}</span>
                </div>
                <div className="text-[11px] text-muted">{p.range}</div>
                <div className="mt-2 flex justify-center">
                  <MiniGauge value={p.gauge} width={104} />
                </div>
                <div className="mt-1 flex justify-center">
                  <Chip sev={d.replay ? ({ Action: "high", Elevated: "medium", Watch: "low" } as const)[d.r.current?.tier ?? ""] ?? "info" : "info"}>{d.replay ? (d.r.current?.tier ?? "Normal") : "Normal"}</Chip>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ---- Row 4: Schematic / Active alerts / Data quality --------- */}
        <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,1.05fr)] gap-4">
          <Card>
            <CardTitle>Wellbore Schematic</CardTitle>
            <div className="flex gap-3">
              <div className="flex flex-col justify-between py-1 text-right text-[11px] text-muted">
                {d.schematic.axis.map((a) => (
                  <span key={a}>{a}</span>
                ))}
                <span className="text-[10px]">ft</span>
              </div>
              <div className="relative h-[220px] w-[100px] shrink-0 overflow-hidden rounded-md bg-[linear-gradient(180deg,#a78b6b_0%,#7c5f45_30%,#5b4634_60%,#3f3128_100%)]">
                <div className="absolute left-1/2 top-0 h-[92%] w-5 -translate-x-1/2 bg-[#cbd5e1]" />
                <div className="absolute left-1/2 top-0 h-[78%] w-3 -translate-x-1/2 bg-[#475569]" />
                <div className="absolute left-1/2 top-[85%] h-5 w-7 -translate-x-1/2 rounded-b bg-[#94a3b8]" />
              </div>
              <div className="flex flex-col justify-between text-[11px]">
                {d.schematic.sections.map((s) => (
                  <div key={s.name}>
                    <div className="font-semibold text-text">{s.name}</div>
                    <div className="text-muted">{s.range}</div>
                  </div>
                ))}
                <div>
                  <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">Bit Depth</span>
                  <div className="mt-0.5 font-semibold text-primary">{d.schematic.bitDepth}</div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle right={<a className="text-[12px] font-medium text-primary" href="/alerts">View all</a>}>Active Alerts</CardTitle>
            <div className="space-y-2.5">
              {d.activeAlerts.map((a, ai) => (
                <div key={("id" in a && a.id) || `${a.title}-${ai}`} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <IconTile sev={a.sev} size={34}>
                    {a.sev === "high" ? <AlertOctagon size={16} /> : a.sev === "medium" ? <AlertTriangle size={16} /> : <Droplets size={16} />}
                  </IconTile>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">{a.title}</div>
                    <div className="truncate text-[12px] text-muted">{a.desc}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[11px] text-muted">{a.time}</span>
                    <Badge sev={a.sev}>{a.sev}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-center">
              <button type="button" className="text-[12px] font-medium text-primary" onClick={() => d.replay && d.r.acknowledge()}>Acknowledge All</button>
            </div>
          </Card>

          <Card>
            <CardTitle>Data Quality</CardTitle>
            <div className="flex items-center gap-6">
              <Ring pct={d.dataQuality.pct} size={150} thickness={16} label={`${d.dataQuality.pct}%`} sub="Good" />
              <ul className="space-y-3 text-[13px]">
                {d.dataQuality.checks.map((c) => (
                  <li key={c} className="flex items-center gap-2.5">
                    <CheckDot size={16} /> {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 flex justify-center">
              <ArrowLink>View Data Quality Details</ArrowLink>
            </div>
          </Card>
        </div>

        {/* ---- Row 5: Environment / Mud system ------------------------- */}
        <div className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-4">
          {[
            { title: "Environment", items: d.environment },
            { title: "Mud System", items: d.mudSystem },
          ].map((g) => (
            <Card key={g.title} className="py-4">
              <CardTitle className="mb-3">{g.title}</CardTitle>
              <div className="flex justify-between px-2">
                {g.items.map((it) => (
                  <div key={it.value} className="flex items-center gap-3">
                    {envIcon[it.icon]}
                    <div>
                      <div className="text-[14px] font-bold">{it.value}</div>
                      {it.label && <div className="text-[11px] text-muted">{it.label}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
