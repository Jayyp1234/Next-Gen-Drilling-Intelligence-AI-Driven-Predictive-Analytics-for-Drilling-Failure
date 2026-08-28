"use client";

import { downloadCsv } from "@/lib/export";

import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardTitle,
  Button,
  Chip,
  SoftTile,
  InlineSelect,
  Table,
  ArrowLink,
  Delta,
} from "@/components/ui/primitives";
import { MiniGauge, Donut, Bar } from "@/components/ui/gauges";
import { StackedBars, LegendChips, DotLegend } from "@/components/charts";
import {
  Upload,
  TrendingUp,
  Gauge as GaugeIcon,
  Clock,
  DollarSign,
  Timer,
  Weight,
  RotateCw,
  RefreshCw,
  Droplets,
} from "lucide-react";
import * as fx from "@/data/performance";
import { usePerformanceView } from "@/lib/replay/screens";
import { RopDepthChart } from "./_components/RopDepthChart";

const kpiIcon: Record<fx.KpiIcon, React.ReactNode> = {
  rop: <TrendingUp size={22} />,
  efficiency: <GaugeIcon size={22} />,
  npt: <Clock size={22} />,
  cost: <DollarSign size={22} />,
  onBottom: <Timer size={22} />,
};
const paramIcon: Record<fx.ParamIcon, React.ReactNode> = {
  rop: <TrendingUp size={15} className="text-orange-500" />,
  wob: <Weight size={15} className="text-medium" />,
  torque: <RotateCw size={15} className="text-good" />,
  spp: <GaugeIcon size={15} className="text-primary" />,
  rpm: <RefreshCw size={15} className="text-purple" />,
  flow: <Droplets size={15} className="text-primary" />,
};

export default function PerformancePage() {
  const d = usePerformanceView();
  const exportLog = () => downloadCsv("drillguard_performance_log", d.dailyLog.rows.map((r) => ({ date: r.date, depth_ft: r.depth, footage: r.footage, avg_rop: r.rop, npt: r.npt, efficiency_pct: r.eff, status: r.status })));
  return (
    <>
      <PageHeader
        title={d.header.title}
        subtitle={d.header.subtitle}
        rigLabel={d.header.rigLabel}
        rangeLabel={d.header.rangeLabel}
        rangeIcon="calendar"
        bellCount={d.header.bellCount}
        action={
          <Button variant="navy" icon={<Upload size={16} />} onClick={exportLog}>
            {d.header.exportLabel}
          </Button>
        }
      />

      <div className="space-y-4 p-5">
        {/* ---- Row 1: KPI cards --------------------------------------- */}
        <div className="grid grid-cols-5 gap-4">
          {d.kpis.map((k) => (
            <Card key={k.title}>
              <div className="flex items-start gap-3.5">
                <SoftTile sev={k.sev} size={52}>
                  {kpiIcon[k.icon]}
                </SoftTile>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-text-2">{k.title}</div>
                  <div className="mt-1 text-[28px] font-extrabold leading-none tnum">
                    {k.value}{" "}
                    <span className="text-[14px] font-semibold text-text-2">{k.unit}</span>
                  </div>
                  <div className="mt-3">
                    <Delta dir={k.dir} value={k.delta} good={k.good} />
                  </div>
                  <div className="mt-0.5 text-[12px] text-muted">{k.deltaText}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* ---- Row 2: ROP vs depth / Time breakdown ------------------- */}
        <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4">
          <Card>
            <CardTitle sub={d.ropVsDepth.sub} right={<InlineSelect value={d.ropVsDepth.select} />}>
              {d.ropVsDepth.title}
            </CardTitle>
            <LegendChips
              items={d.ropVsDepth.legend}
              className="mb-3 flex flex-wrap items-center gap-5 pl-2 text-[12px] text-text-2"
            />
            <RopDepthChart
              data={d.ropDepthData}
              xTicks={d.ropVsDepth.xTicks}
              yDomain={d.ropVsDepth.yDomain}
              yTicks={d.ropVsDepth.yTicks}
            />
            <div className="mt-1 text-center text-[11px] text-muted">Measured depth (ft)</div>
          </Card>

          <Card>
            <CardTitle>{d.timeBreakdown.title}</CardTitle>
            <div className="flex items-center gap-5 pt-1">
              <Donut
                slices={d.timeBreakdown.slices.map((s) => ({ value: s.value, color: s.color }))}
                size={160}
                thickness={24}
                center={d.timeBreakdown.center}
                sub={d.timeBreakdown.sub}
              />
              <DotLegend
                className="flex-1 space-y-3 text-[12px]"
                items={d.timeBreakdown.slices.map((s) => ({
                  label: s.label,
                  color: s.color,
                  value: `${s.value} (${s.pct})`,
                }))}
              />
            </div>
            <div className="mt-6 flex justify-center">
              <ArrowLink href="/well-history">View Time Analysis</ArrowLink>
            </div>
          </Card>
        </div>

        {/* ---- Row 3: Drilling parameters (period avg) ---------------- */}
        <Card>
          <CardTitle sub="Period Avg">Drilling Parameters</CardTitle>
          <div className="grid grid-cols-6 gap-3">
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
                  <Chip sev="info">Normal</Chip>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ---- Row 4: NPT by category / Benchmark --------------------- */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardTitle sub={d.nptByCategory.sub}>{d.nptByCategory.title}</CardTitle>
            <StackedBars
              data={d.nptWeekly}
              keys={d.nptByCategory.keys}
              yTicks={d.nptByCategory.yTicks}
              height={230}
              barSize={34}
            />
          </Card>

          <Card>
            <CardTitle>{d.benchmark.title}</CardTitle>
            <Table
              head={d.benchmark.head.map((h, i) => (
                <span key={h} className={i === 0 ? "block" : "block text-center"}>
                  {h}
                </span>
              ))}
              rows={d.benchmark.rows.map((r) => [
                <span key="m" className="text-[13px] text-text">{r.metric}</span>,
                <div key="w" className="text-center font-semibold tnum">{r.well}</div>,
                <div key="f" className="text-center text-text-2 tnum">{r.field}</div>,
                <div key="d" className="flex justify-center">
                  <Chip sev={r.sev}>{r.delta}</Chip>
                </div>,
              ])}
            />
            <div className="mt-4 flex justify-center">
              <ArrowLink href="/reports">View Benchmark Report</ArrowLink>
            </div>
          </Card>
        </div>

        {/* ---- Row 5: Daily performance log --------------------------- */}
        <Card>
          <CardTitle right={<InlineSelect label="Sort by:" value="Date" />}>{d.dailyLog.title}</CardTitle>
          <Table
            head={d.dailyLog.head.map((h, i) => (
              <span key={h} className={i === 0 ? "block" : "block text-center"}>
                {h}
              </span>
            ))}
            rows={d.dailyLog.rows.map((r) => [
              <span key="d" className="font-medium text-text">{r.date}</span>,
              <div key="dp" className="text-center font-semibold tnum">{r.depth}</div>,
              <div key="ft" className="text-center tnum">{r.footage}</div>,
              <div key="rop" className="text-center tnum">{r.rop}</div>,
              <div key="npt" className="text-center tnum">{r.npt}</div>,
              <div key="eff" className="flex items-center justify-center gap-2.5">
                <Bar pct={r.eff} color={r.eff >= 80 ? "#16a34a" : "#f59e0b"} height={5} className="w-[72px] shrink-0" />
                <span className="w-[32px] text-right tnum">{r.eff}%</span>
              </div>,
              <div key="s" className="flex justify-center">
                <Chip sev={d.logStatusSev[r.status]} dot>
                  {r.status}
                </Chip>
              </div>,
            ])}
          />
          <div className="mt-3 flex items-center justify-between text-[12px] text-muted">
            <span>{d.dailyLog.footer}</span>
            <ArrowLink href="/well-history">View Full Log</ArrowLink>
          </div>
        </Card>
      </div>
    </>
  );
}
