"use client";

import { downloadCsv } from "@/lib/export";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardTitle,
  Button,
  Chip,
  SoftTile,
  InlineSelect,
  Tabs,
  Table,
  ArrowLink,
  Delta,
} from "@/components/ui/primitives";
import { Donut, Sparkline, Bar } from "@/components/ui/gauges";
import { DotLegend, LegendChips } from "@/components/charts";
import {
  Download,
  Cloud,
  Fuel,
  Droplet,
  Trash2,
  Leaf,
  Recycle,
  SolarPanel,
  CircleCheck,
  CircleX,
  Clock,
} from "lucide-react";
import * as fx from "@/data/sustainability";
import { useSustainabilityView } from "@/lib/replay/screens";
import { EmissionsChart } from "./_components/EmissionsChart";

const kpiIcon: Record<fx.KpiIcon, React.ReactNode> = {
  cloud: <Cloud size={22} />,
  fuel: <Fuel size={22} />,
  drop: <Droplet size={22} />,
  trash: <Trash2 size={22} />,
  leaf: <Leaf size={22} />,
};
const initiativeIcon: Record<fx.InitiativeIcon, React.ReactNode> = {
  leaf: <Leaf size={20} />,
  drop: <Droplet size={20} />,
  recycle: <Recycle size={20} />,
  solar: <SolarPanel size={20} />,
};
const eventIcon: Record<fx.EventIcon, React.ReactNode> = {
  leaf: <Leaf size={20} />,
  drop: <Droplet size={20} />,
  trash: <Trash2 size={20} />,
  check: <CircleCheck size={20} />,
};
const statusIcon: Record<fx.IndicatorStatus, React.ReactNode> = {
  "On Target": <CircleCheck size={12} />,
  "Off Target": <CircleX size={12} />,
  "Near Target": <Clock size={12} />,
};

export default function SustainabilityPage() {
  const d = useSustainabilityView();
  const exportIndicators = () => downloadCsv("drillguard_sustainability_indicators", d.indicators.rows.map((r) => ({ metric: r.metric, unit: r.unit, current: r.current, previous: r.previous, change: (r.dir === "down" ? "-" : "+") + r.change, target: r.target, status: r.status })));
  const [tab, setTab] = useState(d.tabs[0]);

  return (
    <>
      <PageHeader
        title={d.header.title}
        subtitle={d.header.subtitle}
        rigLabel={d.header.rigLabel}
        rangeLabel={d.header.rangeLabel}
        rangeIcon="calendar"
        action={
          <Button variant="outline" icon={<Download size={16} />} onClick={exportIndicators}>
            {d.header.exportLabel}
          </Button>
        }
      />

      <div className="space-y-4 p-5">
        <Tabs items={d.tabs} active={tab} onChange={setTab} />

        {/* ---- Row 1: KPI cards --------------------------------------- */}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4">
          {d.kpis.map((k) => (
            <Card key={k.title} className="p-4">
              <div className="flex items-start gap-3">
                <SoftTile sev={k.sev} size={48}>
                  {kpiIcon[k.icon]}
                </SoftTile>
                <div className="min-w-0 whitespace-nowrap">
                  <div className="text-[12px] font-medium text-text-2">{k.title}</div>
                  <div className="mt-1 text-[26px] font-extrabold leading-none tnum">
                    {k.value}{" "}
                    <span className="text-[13px] font-semibold text-text-2">{k.unit}</span>
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

        {/* ---- Row 2: Emissions trend / breakdown / scorecard --------- */}
        <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)_minmax(0,0.95fr)] gap-4">
          <Card>
            <CardTitle right={<InlineSelect value={d.emissionsOverTime.select} />}>
              {d.emissionsOverTime.title}
            </CardTitle>
            <LegendChips items={d.emissionsOverTime.legend} className="mb-3 flex flex-wrap items-center gap-5 pl-2 text-[12px] text-text-2" />
            <EmissionsChart
              data={d.emissionsData}
              xTicks={d.emissionsOverTime.xTicks}
              yDomain={d.emissionsOverTime.yDomain}
              yTicks={d.emissionsOverTime.yTicks}
              height={228}
            />
          </Card>

          <Card className="flex flex-col p-4">
            <CardTitle>{d.breakdown.title}</CardTitle>
            <div className="flex items-center gap-3 pt-1">
              <Donut
                slices={d.breakdown.slices.map((s) => ({ value: s.value, color: s.color }))}
                size={132}
                thickness={22}
                center={d.breakdown.center}
                sub={d.breakdown.sub}
              />
              <DotLegend
                className="flex-1 space-y-3 whitespace-nowrap text-[11px]"
                items={d.breakdown.slices.map((s) => ({
                  label: s.label,
                  color: s.color,
                  value: `${s.value} (${s.pct})`,
                }))}
              />
            </div>
            <div className="mt-auto flex justify-center pt-6">
              <ArrowLink>{d.breakdown.link}</ArrowLink>
            </div>
          </Card>

          <Card className="p-4">
            <CardTitle>{d.scorecard.title}</CardTitle>
            <div className="space-y-3.5">
              {d.scorecard.rows.map((r) => (
                <div key={r.label} className="flex items-center gap-3 whitespace-nowrap text-[12.5px]">
                  <span className="min-w-0 flex-1 truncate text-text-2">{r.label}</span>
                  <Bar pct={r.score} color={r.color} height={5} className="w-[88px] shrink-0" />
                  <span className="w-[42px] shrink-0 text-right tnum">
                    {r.score}/100
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-[15px] font-semibold">{d.scorecard.overallLabel}</span>
              <span className="text-[18px] font-bold tnum">
                <span className="text-good">{d.scorecard.overall}</span>
                <span className="ml-0.5">{d.scorecard.outOf}</span>
              </span>
            </div>
            <div className="mt-4 flex justify-center">
              <ArrowLink>{d.scorecard.link}</ArrowLink>
            </div>
          </Card>
        </div>

        {/* ---- Row 3: Indicators table / Initiatives ------------------ */}
        <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(0,0.95fr)] gap-4">
          <Card>
            <CardTitle>{d.indicators.title}</CardTitle>
            <Table
              head={d.indicators.head.map((h, i) => (
                <span key={h} className={i === 0 ? "block" : "block text-center"}>
                  {h}
                </span>
              ))}
              rows={d.indicators.rows.map((r) => [
                <div key="m">
                  <div className="text-[13px] text-text">{r.metric}</div>
                  <div className="text-[11px] text-muted">{r.unit}</div>
                </div>,
                <div key="c" className="text-center tnum">{r.current}</div>,
                <div key="p" className="text-center tnum">{r.previous}</div>,
                <div key="d" className="text-center">
                  <Delta dir={r.dir} value={r.change} good={r.good} />
                </div>,
                <div key="t" className="flex justify-center">
                  <Sparkline data={r.trend} color={r.trendColor} width={96} height={26} strokeWidth={1.5} />
                </div>,
                <div key="g" className="text-center tnum">{r.target}</div>,
                <div key="s" className="flex justify-center">
                  <Chip sev={d.statusSev[r.status]}>
                    {statusIcon[r.status]}
                    {r.status}
                  </Chip>
                </div>,
              ])}
            />
            <div className="mt-4 flex justify-center">
              <ArrowLink>{d.indicators.link}</ArrowLink>
            </div>
          </Card>

          <Card>
            <CardTitle>{d.initiatives.title}</CardTitle>
            <div className="space-y-2.5">
              {d.initiatives.items.map((it) => (
                <div key={it.title} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <SoftTile sev={it.sev} size={44}>
                    {initiativeIcon[it.icon]}
                  </SoftTile>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold">{it.title}</div>
                    <div className="mt-0.5 text-[12px] text-muted">{it.desc}</div>
                  </div>
                  <Chip sev={d.initiativeSev[it.status]}>{it.status}</Chip>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center">
              <ArrowLink>{d.initiatives.link}</ArrowLink>
            </div>
          </Card>
        </div>

        {/* ---- Row 4: Recent sustainability events -------------------- */}
        <Card>
          <CardTitle>{d.events.title}</CardTitle>
          <div className="grid grid-cols-4 gap-4">
            {d.events.items.map((e) => (
              <div key={e.title} className="flex items-center gap-3.5">
                <SoftTile sev={e.sev} size={44}>
                  {eventIcon[e.icon]}
                </SoftTile>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold">{e.title}</div>
                  <div className="mt-0.5 text-[12px] text-muted">{e.desc}</div>
                  <div className="mt-1 text-[11px] text-muted">{e.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <ArrowLink>{d.events.link}</ArrowLink>
          </div>
        </Card>
      </div>
    </>
  );
}
