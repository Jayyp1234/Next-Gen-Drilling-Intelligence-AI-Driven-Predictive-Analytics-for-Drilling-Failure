"use client";

import { useRouter } from "next/navigation";
import { useIncidents } from "@/lib/incidents/store";
import { useReplay } from "@/lib/replay/ReplayProvider";
import { apiEnabled } from "@/lib/api/client";
import { ReplayBar } from "@/components/layout/ReplayBar";

import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardTitle,
  Button,
  Badge,
  Chip,
  SoftTile,
  InlineSelect,
  Tabs,
  Pager,
  Delta,
  ArrowLink,
  EmptyState,
} from "@/components/ui/primitives";
import { Donut } from "@/components/ui/gauges";
import { DotLegend } from "@/components/charts";
import {
  Plus,
  TriangleAlert,
  CircleAlert,
  Clock,
  Check,
  Timer,
  Funnel,
  EllipsisVertical,
  ClipboardList,
  Pencil,
  X,
  Drill,
  Network,
  Droplet,
  Settings,
  CircleMinus,
} from "lucide-react";
import * as d from "@/data/incidents";
import { IncidentsOverTime, TorqueTrend, SquareLegend } from "./_components/charts";

const kpiIcon: Record<(typeof d.kpis)[number]["icon"], React.ReactNode> = {
  alert: <TriangleAlert size={18} />,
  open: <CircleAlert size={18} />,
  clock: <Clock size={18} />,
  check: <Check size={18} strokeWidth={3} />,
  timer: <Timer size={18} />,
};

const typeIcon: Record<(typeof d.incidents)[number]["typeIcon"], React.ReactNode> = {
  stuck: <Drill size={15} className="text-text-2" />,
  loss: <Network size={15} className="text-text-2" />,
  kick: <Droplet size={15} className="text-text-2" />,
  equipment: <Settings size={15} className="text-text-2" />,
  other: <CircleMinus size={15} className="text-text-2" />,
};

const barColor: Record<string, string> = {
  high: "bg-high",
  medium: "bg-medium",
  good: "bg-good",
  low: "bg-low",
};

export default function IncidentsPage() {
  const router = useRouter();
  const store = useIncidents();
  const replay = useReplay();
  // Show real incidents whenever the PHP backend is on, or a replay dataset is loaded.
  const live = apiEnabled || replay.dataset != null;
  // Real incidents (documented anchors + escalated + manual) when available.
  const rows = live
    ? store.incidents.map((inc) => ({
        id: inc.id, title: inc.title, sub: inc.desc.slice(0, 60), type: inc.type,
        typeIcon: (({ "Stuck Pipe": "stuck", "Loss Circulation": "loss", "Kick / Well Control": "kick", "Equipment Failure": "equipment" } as Record<string, "stuck" | "loss" | "kick" | "equipment" | "other">)[inc.type] ?? "other"), sev: inc.sev, severity: inc.sev[0].toUpperCase() + inc.sev.slice(1),
        well: inc.well, detected: inc.detected, status: inc.status, owner: inc.owner,
        bar: inc.sev as "high" | "medium" | "low",
      }))
    : d.incidents;
  return (
    <>
      <PageHeader
        title="Incidents"
        subtitle="Track, manage and analyze drilling incidents"
        rigLabel="Rig 12 – OML18-W12"
        rangeLabel="Last 30 Days"
        rangeIcon="calendar"
        bellCount={6}
        action={<Button icon={<Plus size={16} />} onClick={() => router.push("/incidents/new")}>Report Incident</Button>}
      />
      <ReplayBar />

      <div className="space-y-4 p-5">
        {/* ---- Row 1: KPI cards --------------------------------------- */}
        <div className="grid grid-cols-5 gap-4">
          {d.kpis.map((k) => (
            <Card key={k.label} className="flex items-start gap-3 p-4">
              <SoftTile sev={k.sev} size={40}>
                {kpiIcon[k.icon]}
              </SoftTile>
              <div className="min-w-0">
                <div className="text-[13px] text-text-2">{k.label}</div>
                <div className="mt-1 text-[28px] font-extrabold leading-none tnum">
                  {k.value}
                  {k.unit && <span className="ml-1 text-[15px] font-semibold">{k.unit}</span>}
                </div>
                <div className="mt-2 text-[12px] text-muted">{k.compare}</div>
                <div className="mt-0.5">
                  <Delta dir={k.dir} value={k.delta} good={k.good} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* ---- Row 2: Over time / By type ------------------------------ */}
        <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4">
          <Card>
            <CardTitle right={<SquareLegend items={d.overTimeLegend} />}>Incidents Over Time</CardTitle>
            <IncidentsOverTime data={d.overTimeData} ticks={d.overTimeTicks} yTicks={d.overTimeYTicks} height={200} />
          </Card>

          <Card>
            <CardTitle>Incidents By Type</CardTitle>
            <div className="flex items-center gap-6 px-2">
              <Donut
                slices={d.byType.items.map((it) => ({ value: it.value, color: it.color }))}
                size={164}
                thickness={26}
                center={d.byType.total}
                sub={d.byType.totalLabel}
              />
              <DotLegend
                className="flex-1 space-y-3 text-[12px]"
                items={d.byType.items.map((it) => ({ label: it.label, color: it.color, value: `${it.value} (${it.pct})` }))}
              />
            </div>
            <div className="mt-4 flex justify-center">
              <ArrowLink>{d.byType.footer}</ArrowLink>
            </div>
          </Card>
        </div>

        {/* ---- Row 3: Incidents table ---------------------------------- */}
        <Card>
          <div className="relative">
            <Tabs items={d.tableTabs} active={d.tableTabs[0]} />
            <div className="absolute -top-1 right-0 flex items-center gap-2">
              <InlineSelect label={d.tableFilters.severity.label} value={d.tableFilters.severity.value} />
              <InlineSelect label={d.tableFilters.type.label} value={d.tableFilters.type.value} />
              <Button variant="outline" size="sm" className="h-9 px-3 text-[13px] text-text" icon={<Funnel size={14} />}>
                {d.tableFilters.button}
              </Button>
            </div>
          </div>

          <table className="mt-1 w-full text-left text-[13px]">
            <thead>
              <tr className="text-[12px] text-muted">
                {d.tableHead.map((h, i) => (
                  <th key={h} className={i === 0 ? "py-3 pl-4 font-medium" : i === d.tableHead.length - 1 ? "py-3 pr-2 text-right font-medium" : "py-3 font-medium"}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {live && rows.length === 0 ? (
                <tr><td colSpan={9}>
                  <EmptyState compact icon={<ClipboardList size={24} />} title="No incidents recorded"
                    desc="Documented events for this well appear here automatically. Escalate an alert or report one manually to add your own." />
                </td></tr>
              ) : rows.map((r) => (
                <tr key={r.id} onClick={() => router.push(`/incidents/view?id=${r.id}`)} className="cursor-pointer border-t border-border hover:bg-surface-2">
                  <td className="relative py-3.5 pl-4">
                    <span className={`absolute bottom-3 left-0 top-3 w-[3px] rounded-full ${barColor[r.bar]}`} />
                    <span className="tnum">{r.id}</span>
                  </td>
                  <td className="py-3.5 pr-3">
                    <div className="font-semibold text-text">{r.title}</div>
                    <div className="mt-0.5 text-[12px] text-muted">{r.sub}</div>
                  </td>
                  <td className="py-3.5">
                    <span className="inline-flex items-center gap-1.5">
                      {typeIcon[r.typeIcon]}
                      {r.type}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <Chip sev={r.sev}>{r.severity}</Chip>
                  </td>
                  <td className="py-3.5">{r.well}</td>
                  <td className="py-3.5">{r.detected}</td>
                  <td className="py-3.5">
                    <Chip sev={d.statusSev[r.status as keyof typeof d.statusSev]}>{r.status}</Chip>
                  </td>
                  <td className="py-3.5">{r.owner}</td>
                  <td className="py-3.5 pr-2 text-right">
                    <button type="button" onClick={(e) => { e.stopPropagation(); router.push(`/incidents/view?id=${r.id}`); }} className="text-text-2" aria-label="Actions">
                      <EllipsisVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-border">
            <Pager text={live ? `Showing ${rows.length} incident${rows.length === 1 ? "" : "s"} (documented + reported)` : d.tablePager.text} pages={d.tablePager.pages} />
          </div>
        </Card>

        {/* ---- Row 4: Incident detail ---------------------------------- */}
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-[16px] font-bold tnum">{d.detail.id}</h3>
                <Badge sev="high">{d.detail.badge}</Badge>
              </div>
              <p className="mt-1.5 text-[13px] text-muted">{d.detail.summary}</p>
            </div>
            <div className="flex items-center gap-4 text-[13px]">
              <span className="text-text-2">
                {d.detail.statusLabel} <span className="font-semibold text-high">{d.detail.status}</span>
              </span>
              <span className="h-5 w-px bg-border" />
              <span className="text-text-2">
                {d.detail.detectedLabel} <span className="font-semibold text-text">{d.detail.detected}</span>
              </span>
              <Button variant="outline" size="sm" className="ml-2 h-9 px-4 text-[13px]" icon={<Pencil size={14} />}>
                {d.detail.editButton}
              </Button>
              <button type="button" className="text-text-2" aria-label="Close">
                <X size={18} />
              </button>
            </div>
          </div>

          <Tabs className="mt-4" items={d.detail.tabs} active={d.detail.tabs[0]} />

          <div className="mt-4 grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)_minmax(0,1.15fr)_minmax(0,0.95fr)] divide-x divide-border">
            {/* Incident Information */}
            <div className="pr-5">
              <h4 className="text-[13px] font-semibold">{d.detail.info.title}</h4>
              <div className="mt-3 grid grid-cols-[96px_1fr] gap-y-2.5 text-[13px]">
                {d.detail.info.rows.map((r) => (
                  <div key={r.k} className="contents">
                    <span className="text-text-2">{r.k}</span>
                    <span className="font-semibold text-text">{r.v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[13px] text-text-2">{d.detail.info.descriptionLabel}</div>
              <p className="mt-1 text-[12px] leading-relaxed text-text">{d.detail.info.description}</p>
            </div>

            {/* Trend */}
            <div className="px-5">
              <h4 className="text-[13px] font-semibold">
                {d.detail.trend.title} <span className="font-normal text-muted">{d.detail.trend.sub}</span>
              </h4>
              <div className="mt-2 text-[11px] text-muted">{d.detail.trend.yLabel}</div>
              <TorqueTrend
                data={d.trendData}
                tickIdx={d.trendTickIdx}
                tickLabels={d.detail.trend.ticks}
                yTicks={d.detail.trend.yTicks}
                height={185}
              />
            </div>

            {/* Causes / Actions */}
            <div className="px-5">
              <h4 className="text-[13px] font-semibold">{d.detail.causes.title}</h4>
              <ul className="mt-3 space-y-1.5 text-[12px] text-text">
                {d.detail.causes.items.map((c) => (
                  <li key={c} className="flex items-start gap-2">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-text" />
                    {c}
                  </li>
                ))}
              </ul>
              <h4 className="mt-5 text-[13px] font-semibold">{d.detail.actions.title}</h4>
              <ol className="mt-3 space-y-1.5 text-[12px] text-text">
                {d.detail.actions.items.map((a, i) => (
                  <li key={a} className="flex items-start gap-1.5">
                    <span className="tnum">{i + 1}.</span>
                    {a}
                  </li>
                ))}
              </ol>
            </div>

            {/* Activity Log */}
            <div className="flex flex-col pl-5">
              <h4 className="text-[13px] font-semibold">{d.detail.activity.title}</h4>
              <ul className="relative mt-3 space-y-4">
                <span className="absolute bottom-2 left-[4px] top-2 w-px bg-border" />
                {d.detail.activity.items.map((a, i) => (
                  <li key={i} className="relative flex items-start gap-3 text-[12px]">
                    <span className="relative z-10 mt-1 h-[9px] w-[9px] shrink-0 rounded-full" style={{ background: a.color }} />
                    <span className="w-[58px] shrink-0 text-muted tnum">{a.time}</span>
                    <span className="leading-snug">
                      <span className="block font-semibold text-text">{a.text}</span>
                      {a.sub && <span className="block text-text-2">{a.sub}</span>}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex justify-end pt-4">
                <Button size="sm" className="h-9 px-4 text-[13px]">
                  {d.detail.activity.button}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
