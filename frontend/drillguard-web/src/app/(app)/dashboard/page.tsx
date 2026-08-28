"use client";

import { useReplay } from "@/lib/replay/ReplayProvider";
import { ReplayBar } from "@/components/layout/ReplayBar";

import clsx from "clsx";
import { PageHeader, HeaderSelect } from "@/components/layout/PageHeader";
import { Card, CardTitle, Badge, Chip, IconTile, SoftTile, CheckDot, Table } from "@/components/ui/primitives";
import { RiskGauge, Sparkline, BarStrip, Bar } from "@/components/ui/gauges";
import { DerrickIllustration } from "@/components/ui/icons";
import {
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  AlertCircle,
  Sun,
  Wind,
  Droplets,
  Clock,
  DollarSign,
  Leaf,
  Cloud,
} from "lucide-react";
import * as d from "@/data/dashboard";
import { RiskTrendChart } from "./_components/RiskTrendChart";
import { NptTrendChart } from "./_components/NptTrendChart";
import { WellboreIllustration } from "./_components/WellboreIllustration";

const TONE = { blue: "#1d5af0", red: "#e53935" } as const;

const weatherIcon: Record<string, React.ReactNode> = {
  sun: <Sun size={22} className="text-medium" />,
  wind: <Wind size={22} className="text-text-2" />,
  drop: <Droplets size={22} className="text-primary" />,
};

const kpiIcon: Record<string, React.ReactNode> = {
  clock: <Clock size={20} />,
  dollar: <DollarSign size={20} />,
  triangle: <AlertTriangle size={20} />,
  leaf: <Leaf size={20} />,
  cloud: <Cloud size={20} />,
};

function ViewLink({ children, href = "#" }: { children: React.ReactNode; href?: string }) {
  return (
    <a className="text-[12px] font-medium text-primary" href={href}>
      {children}
    </a>
  );
}

export default function DashboardPage() {
  const replay = useReplay();
  const cur = replay.current;
  const scoreLabel = (v: number) => (v < 40 ? "LOW RISK" : v < 70 ? "MODERATE" : "HIGH RISK");
  const risk = cur
    ? { ...d.risk, score: Math.round(cur.risk ?? 0), label: scoreLabel(Math.round(cur.risk ?? 0)), delta: `${replay.dataset?.well}`, deltaText: `replay · ${replay.fmtIdx(cur.idx)}` }
    : d.risk;
  const activeAlerts = replay.dataset
    ? replay.alerts.filter((a) => !a.acknowledged).slice(0, 3).map((a) => ({ title: a.title.toUpperCase(), desc: a.desc, time: a.at, sev: a.sev, badge: a.tier.toUpperCase() }))
    : d.activeAlerts;
  return (
    <>
      <PageHeader
        title={d.header.title}
        subtitle={d.header.subtitle}
        rangeLabel={d.header.date}
        rangeIcon="calendar"
        bellCount={d.header.bell}
        userChip
        beforeBell={<HeaderSelect icon="clock" label={d.header.range} />}
      />
      <ReplayBar />

      <div className="space-y-4 p-5">
        {/* ---- Row 1: Risk score / Live parameters / Risk trend -------- */}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.6fr)] gap-4">
          <Card>
            <CardTitle info>Drilling Risk Score</CardTitle>
            <div className="flex justify-center">
              <RiskGauge value={risk.score} label={risk.label} size={200} showScale labelColor={risk.score >= 70 ? "#e53935" : risk.score >= 40 ? "#f59e0b" : "#16a34a"} denominator={false} />
            </div>
            <div className="mt-2 flex items-center justify-center gap-1 text-[13px]">
              <ArrowUp size={14} className="text-high" />
              <span className="font-semibold text-high">{risk.delta}</span>
              <span className="text-muted">{risk.deltaText}</span>
            </div>
            <div className="mt-4 rounded-lg bg-surface-2 p-3.5">
              <div className="flex items-center gap-2">
                <IconTile sev="high" size={18}>
                  <AlertCircle size={11} strokeWidth={3} />
                </IconTile>
                <span className="text-[13px] font-semibold">{d.risk.noteTitle}</span>
              </div>
              <p className="mt-1.5 pl-[26px] text-[12px] leading-relaxed text-text-2">{d.risk.noteBody}</p>
            </div>
          </Card>

          <Card>
            <CardTitle info>Live Parameters</CardTitle>
            <table className="w-full text-left text-[12px] whitespace-nowrap">
              <thead>
                <tr className="text-[11px] text-muted">
                  {d.liveParamsHead.map((h, i) => (
                    <th key={h} className={clsx("pb-2 font-medium", i === 2 && "text-right")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.liveParams.map((p) => (
                  <tr key={p.name} className="border-t border-border">
                    <td className="py-[7px] pr-2 text-text-2">{p.name}</td>
                    <td className="py-[7px] pr-2 font-medium tnum">{p.value}</td>
                    <td className="py-[7px] text-right leading-none">
                      <Sparkline data={p.spark} color={TONE[p.tone]} width={64} height={22} strokeWidth={1.5} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card>
            <CardTitle info sub="(Last 2 Hours)">
              Risk Trend
            </CardTitle>
            <RiskTrendChart
              data={d.riskTrend}
              ticks={d.riskTrendTicks}
              yTicks={d.riskTrendYTicks}
              refs={d.riskTrendRefs}
              end={d.riskTrendEnd}
              height={222}
            />
            <div className="mt-3 grid grid-cols-3 divide-x divide-border border-t border-border pt-3">
              {d.riskTrendStats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-[12px] text-text-2">{s.label}</div>
                  <div className="mt-0.5 text-[20px] font-bold tnum" style={{ color: s.color }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ---- Row 2: Active alerts / Well overview / Well status ------ */}
        <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,0.9fr)_minmax(0,1.05fr)] gap-4">
          <Card>
            <CardTitle right={<ViewLink href="/alerts">{d.activeAlertsLink}</ViewLink>}>Active Alerts</CardTitle>
            <div className="space-y-2.5">
              {activeAlerts.map((a, ai) => (
                <div
                  key={ai}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg px-2.5 py-2.5",
                    a.sev === "high" ? "bg-high-soft/60" : "bg-surface-2"
                  )}
                >
                  <IconTile sev={a.sev} size={32}>
                    <AlertTriangle size={15} />
                  </IconTile>
                  <div className="min-w-0 flex-1 leading-snug">
                    <div className="text-[11px] font-bold">{a.title}</div>
                    <div className="mt-1 text-[10.5px] text-text-2">{a.desc}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-[11px] text-muted">{a.time}</span>
                    <Badge sev={a.sev} size="xs">{a.badge}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle right={<ViewLink href="/well-history">{d.wellOverview.link}</ViewLink>}>Well Overview</CardTitle>
            <div className="flex gap-4">
              <WellboreIllustration width={96} height={236} />
              <div className="min-w-0 flex-1">
                <div className="space-y-[9px] text-[12.5px]">
                  {d.wellOverview.rows.map((r) => (
                    <div key={r.k} className="flex items-center justify-between gap-2">
                      <span className="text-text-2">{r.k}</span>
                      {r.chip ? (
                        <Chip sev="good">{r.v}</Chip>
                      ) : (
                        <span className="font-semibold tnum">{r.v}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between text-[12.5px]">
                  <span className="text-text-2">{d.wellOverview.progressLabel}</span>
                  <span className="font-semibold tnum">{d.wellOverview.progressText}</span>
                </div>
                <Bar pct={d.wellOverview.progressPct} color="#1d5af0" height={8} className="mt-2" />
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle right={<ViewLink href="/well-history">{d.wellStatus.link}</ViewLink>}>Well Status</CardTitle>
            <div className="flex gap-3">
              <ul className="w-[132px] shrink-0 space-y-3">
                {d.wellStatus.items.map((it) => (
                  <li key={it.label} className="flex items-start gap-2.5">
                    <CheckDot size={16} />
                    <div className="leading-tight">
                      <div className="text-[12.5px] font-semibold">{it.label}</div>
                      <div className="mt-0.5 text-[12px] text-good">{it.value}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="grid min-w-0 flex-1 place-items-center rounded-xl bg-surface-2">
                <DerrickIllustration size={128} color="#475569" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-lg bg-surface-2 px-2 py-3">
              {d.wellStatus.weather.map((w) => (
                <div key={w.label} className="flex items-center justify-center gap-2.5">
                  {weatherIcon[w.icon]}
                  <div className="leading-tight">
                    <div className="text-[13px] font-bold tnum">{w.value}</div>
                    <div className="text-[11px] text-muted">{w.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ---- Row 3: KPI cards ----------------------------------------- */}
        <div className="grid grid-cols-5 gap-4">
          {d.kpis.map((k) => (
            <Card key={k.title}>
              <div className="flex items-start gap-3">
                <SoftTile sev={k.tone} size={40}>
                  {kpiIcon[k.icon]}
                </SoftTile>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-text-2">{k.title}</div>
                  <div className="mt-1 text-[24px] font-extrabold leading-none tnum">
                    {k.value}
                    {k.unit && <span className="ml-1 text-[15px] font-semibold">{k.unit}</span>}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <BarStrip data={k.bars} color={k.barColor} width={180} height={26} />
              </div>
              <div className="mt-2.5 flex items-center gap-1 text-[12px]">
                <span className="text-muted">{k.vsLabel}</span>
                <span className={clsx("font-semibold", k.good ? "text-good" : "text-high")}>{k.vsValue}</span>
                {k.dir === "up" ? (
                  <ArrowUp size={13} className={k.good ? "text-good" : "text-high"} />
                ) : (
                  <ArrowDown size={13} className={k.good ? "text-good" : "text-high"} />
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* ---- Row 4: Recent incidents / NPT trend --------------------- */}
        <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-4">
          <Card>
            <CardTitle right={<ViewLink href="/incidents">{d.incidentsLink}</ViewLink>}>Recent Incidents</CardTitle>
            <Table
              head={d.incidentsHead}
              rows={d.incidents.map((r) => [
                <span key="id" className="font-medium tnum">{r.id}</span>,
                r.type,
                r.well,
                <span key="det" className="tnum">{r.detected}</span>,
                <Chip key="st" sev={r.sev}>
                  {r.status}
                </Chip>,
              ])}
            />
          </Card>

          <Card>
            <CardTitle sub={d.npt.sub} right={<ViewLink href="/reports">{d.npt.link}</ViewLink>}>
              NPT Trend
            </CardTitle>
            <div className="flex gap-4">
              <div className="min-w-0 flex-1">
                <NptTrendChart data={d.npt.data} yTicks={d.npt.yTicks} yLabel={d.npt.yLabel} height={200} />
              </div>
              <div className="w-[150px] shrink-0 self-center rounded-lg bg-surface-2 p-4">
                <div className="text-[11px] font-semibold tracking-wide text-text-2">{d.npt.totalLabel}</div>
                <div className="mt-1.5 text-[26px] font-extrabold leading-none tnum">
                  {d.npt.totalValue} <span className="text-[14px] font-semibold">{d.npt.totalUnit}</span>
                </div>
                <div className="mt-3 text-[11.5px] text-muted">{d.npt.vsLabel}</div>
                <div className="mt-0.5 flex items-center gap-1 text-[13px] font-semibold text-good">
                  {d.npt.vsValue}
                  <ArrowDown size={13} />
                </div>
                <div className="text-[13px] font-semibold text-good">{d.npt.vsPct}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
