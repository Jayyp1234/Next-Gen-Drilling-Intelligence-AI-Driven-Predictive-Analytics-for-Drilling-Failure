"use client";

import { downloadCsv, download } from "@/lib/export";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DerrickIllustration } from "@/components/ui/icons";
import {
  Card,
  CardTitle,
  Button,
  Chip,
  IconTile,
  Tabs,
  KV,
  Table,
  ArrowLink,
  Dot,
} from "@/components/ui/primitives";
import { Donut } from "@/components/ui/gauges";
import { LegendChips, DotLegend } from "@/components/charts";
import {
  Upload,
  ShieldCheck,
  ArrowUpRight,
  Weight,
  RotateCw,
  Activity,
  AlertOctagon,
  AlertTriangle,
  Zap,
  FileText,
  FileSpreadsheet,
  FileBox,
  File,
  Download,
} from "lucide-react";
import { DepthChart } from "./_components/DepthChart";
import { Timeline } from "./_components/Timeline";
import { useWellHistoryView } from "@/lib/replay/screens";

const perfIcon: Record<string, React.ReactNode> = {
  rop: <ArrowUpRight size={16} className="text-text" />,
  wob: <Weight size={16} className="text-text" />,
  torque: <RotateCw size={16} className="text-text" />,
  spp: <Activity size={16} className="text-text" />,
};

const eventIcon: Record<string, React.ReactNode> = {
  high: <AlertOctagon size={11} />,
  medium: <AlertTriangle size={11} />,
  info: <Zap size={11} />,
};

const docIcon: Record<string, React.ReactNode> = {
  text: <FileText size={15} />,
  sheet: <FileSpreadsheet size={15} />,
  pdf: <File size={15} />,
  box: <FileBox size={15} />,
};

export default function WellHistoryPage() {
  const d = useWellHistoryView();
  const exportEvents = () => downloadCsv("drillguard_well_history_events", d.recentEvents.map((e) => ({ time: e.time, event: e.event, type: e.type, severity: e.severity, depth_tvd: e.depth })));
  const exportDoc = (doc: (typeof d.documents)[number]) => {
    const body = [
      `DrillGuard — ${doc.name}`,
      `Well / Rig: ${d.header.rigLabel}`,
      `Document date: ${doc.date}`,
      "",
      "This is a generated document summary from the DrillGuard well-history record.",
      "The underlying source file is held in the operator's document store.",
    ].join("\n");
    download(`${doc.name.replace(/[^A-Za-z0-9]+/g, "_")}.txt`, body, "text/plain");
  };
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
          <Button variant="navy" icon={<Upload size={16} />} onClick={exportEvents}>
            {d.header.exportLabel}
          </Button>
        }
      />

      <div className="space-y-4 p-5">
        {/* ---- Well banner -------------------------------------------- */}
        <Card className="flex items-center gap-6 py-4">
          <span className="grid h-[88px] w-[88px] shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <DerrickIllustration size={52} color="#1d5af0" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="text-[20px] font-bold">{d.well.name}</span>
              <Chip sev="good">{d.well.status}</Chip>
            </div>
            <div className="mt-3 flex items-center gap-6 whitespace-nowrap">
              {d.well.facts.map((f) => (
                <div key={f.k}>
                  <div className="text-[11px] text-muted">{f.k}</div>
                  <div className="mt-0.5 text-[13px] font-semibold">{f.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 items-stretch whitespace-nowrap">
            {d.well.stats.map((s) => (
              <div
                key={s.k}
                className="border-l border-border px-4 first:border-l-0"
              >
                <div className="text-[11px] text-muted">{s.k}</div>
                <div
                  className={
                    s.good
                      ? "mt-1 text-[13px] font-bold text-good"
                      : "mt-1 text-[13px] font-semibold"
                  }
                >
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ---- Tabs ---------------------------------------------------- */}
        <Tabs items={d.tabs} active={tab} onChange={setTab} />

        {/* ---- Row A: Summary / Depth progress / Integrity ------------ */}
        <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)_minmax(0,1.05fr)] gap-4">
          <Card className="flex flex-col">
            <CardTitle>Well Summary</CardTitle>
            <div>
              {d.wellSummary.map((r) => (
                <KV
                  key={r.k}
                  k={r.k}
                  divider={false}
                  className="py-2.5"
                  v={
                    r.kind === "chip" ? (
                      <Chip sev="good">{r.v}</Chip>
                    ) : r.kind === "dot" ? (
                      <span className="inline-flex items-center gap-2">
                        <Dot sev="good" /> {r.v}
                      </span>
                    ) : (
                      r.v
                    )
                  }
                />
              ))}
            </div>
            <div className="mt-auto flex justify-center pt-4">
              <ArrowLink boxed center>
                {d.wellSummaryLink}
              </ArrowLink>
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-3">Depth Progress (TVD)</CardTitle>
            <LegendChips
              items={d.depthLegend}
              className="flex items-center gap-6 text-[12px] text-text-2"
            />
            <div className="mt-3 text-[11px] text-muted">
              {d.depthAxisLabel}
            </div>
            <DepthChart
              data={d.depthData}
              ticks={d.depthTicks}
              endLabel={d.depthEndLabel}
              height={200}
            />
            <div className="mt-4 flex items-stretch justify-between whitespace-nowrap rounded-lg border border-border py-3">
              {d.depthFooter.map((f) => (
                <div
                  key={f.k}
                  className="flex-1 border-l border-border px-3 first:border-l-0"
                >
                  <div className="text-[11px] text-muted">{f.k}</div>
                  <div
                    className={
                      f.good
                        ? "mt-1 text-[13px] font-bold text-good"
                        : "mt-1 text-[13px] font-bold"
                    }
                  >
                    {f.v}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="flex flex-col">
            <CardTitle>Well Integrity Summary</CardTitle>
            <div className="flex items-center gap-5">
              <ShieldCheck
                size={60}
                className="shrink-0 text-good"
                strokeWidth={1.8}
              />
              <div>
                <div className="text-[22px] font-bold text-good">
                  {d.integrity.status}
                </div>
                <div className="mt-0.5 text-[13px] text-muted">
                  {d.integrity.note}
                </div>
              </div>
            </div>
            <div className="mt-4">
              {d.integrity.rows.map((r) => (
                <KV
                  key={r.k}
                  k={r.k}
                  className="py-2.5"
                  v={
                    <span className="inline-flex items-center gap-2.5">
                      {r.v} <Dot sev="good" size={10} />
                    </span>
                  }
                />
              ))}
              <KV
                k={d.integrity.riskLabel}
                className="py-2.5"
                v={<Chip sev="good">{d.integrity.riskValue}</Chip>}
              />
            </div>
            <div className="mt-auto flex justify-center pt-4">
              <ArrowLink boxed center>
                {d.integrity.link}
              </ArrowLink>
            </div>
          </Card>
        </div>

        {/* ---- Row B: Timeline ---------------------------------------- */}
        <Card>
          <CardTitle>Well Timeline</CardTitle>
          <Timeline items={d.timeline} />
          <div className="mt-4 flex justify-center">
            <ArrowLink>{d.timelineLink}</ArrowLink>
          </div>
        </Card>

        {/* ---- Row C: Events summary + perf / Recent events / Docs ---- */}
        <div className="grid grid-cols-[minmax(0,0.78fr)_minmax(0,1.3fr)_minmax(0,0.82fr)] gap-4">
          <div className="space-y-4">
            <Card>
              <CardTitle>Events Summary</CardTitle>
              <div className="flex items-center gap-3">
                <Donut
                  slices={d.eventsSummary.slices.map((s) => ({
                    value: s.value,
                    color: s.color,
                  }))}
                  size={104}
                  thickness={15}
                  center={d.eventsSummary.total}
                  sub={d.eventsSummary.totalLabel}
                />
                <DotLegend
                  className="flex-1 space-y-2.5 whitespace-nowrap text-[11px]"
                  items={d.eventsSummary.slices.map((s) => ({
                    label: s.label,
                    color: s.color,
                    value: `${s.value} (${s.pct})`,
                  }))}
                />
              </div>
              <div className="mt-4 flex justify-center">
                <ArrowLink>{d.eventsSummary.link}</ArrowLink>
              </div>
            </Card>

            <Card>
              <CardTitle sub={d.dailyPerformance.sub}>
                {d.dailyPerformance.title}
              </CardTitle>
              <div className="grid grid-cols-4 gap-2">
                {d.dailyPerformance.stats.map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col items-center text-center"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-border-strong">
                      {perfIcon[s.icon]}
                    </span>
                    <div className="mt-2 text-[12px] text-text-2">
                      {s.label}
                    </div>
                    <div className="mt-0.5 text-[13px] font-bold">
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-center">
                <ArrowLink>{d.dailyPerformance.link}</ArrowLink>
              </div>
            </Card>
          </div>

          <Card className="flex flex-col px-4">
            <CardTitle>Recent Events</CardTitle>
            <div className="[&_table]:text-[11px]">
              <Table
                compact
                head={d.recentEventsHead.map((h, i) => (
                  <span
                    key={h}
                    className={i === d.recentEventsHead.length - 1 ? "whitespace-nowrap text-[11px]" : "whitespace-nowrap pr-2 text-[11px]"}
                  >
                    {h}
                  </span>
                ))}
                rows={d.recentEvents.map((e) => [
                  <span
                    key="t"
                    className="block whitespace-nowrap pr-2 text-muted"
                  >
                    {e.time}
                  </span>,
                  <span
                    key="e"
                    className="inline-flex items-center gap-1.5 whitespace-nowrap pr-2 font-medium"
                  >
                    <IconTile sev={e.icon} size={18}>
                      {eventIcon[e.icon]}
                    </IconTile>
                    {e.event}
                  </span>,
                  <span
                    key="ty"
                    className="block whitespace-nowrap pr-2 text-text-2"
                  >
                    {e.type}
                  </span>,
                  <span key="s" className="block pr-1">
                    <Chip sev={e.sev}>{e.severity}</Chip>
                  </span>,
                  <span key="d" className="block whitespace-nowrap tnum">
                    {e.depth}
                  </span>,
                ])}
              />
            </div>
            <div className="mt-auto flex justify-center pt-4">
              <ArrowLink>{d.recentEventsLink}</ArrowLink>
            </div>
          </Card>

          <Card className="flex flex-col px-4">
            <CardTitle>Documents</CardTitle>
            <div className="space-y-2.5">
              {d.documents.map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center gap-2.5 rounded-lg border border-border px-2.5 py-2.5"
                >
                  <IconTile sev={doc.sev} size={30} square>
                    {docIcon[doc.icon]}
                  </IconTile>
                  <span className="min-w-0 flex-1 truncate text-[12px] font-medium">
                    {doc.name}
                  </span>
                  <span className="whitespace-nowrap text-[10.5px] text-muted">
                    {doc.date}
                  </span>
                  <button
                    type="button"
                    onClick={() => exportDoc(doc)}
                    aria-label={`Download ${doc.name}`}
                    className="shrink-0 rounded p-0.5 text-primary transition-colors hover:bg-primary-soft"
                  >
                    <Download size={15} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-auto flex justify-center pt-5">
              <ArrowLink>{d.documentsLink}</ArrowLink>
            </div>
          </Card>
        </div>

        {/* ---- Footer -------------------------------------------------- */}
        <div className="flex items-center justify-between pt-1 text-[12px] text-muted">
          <span>{d.footer.left}</span>
          <span className="inline-flex items-center gap-2">
            {d.footer.refreshLabel} {d.footer.refreshTime}
            <Dot sev="good" />
            <span className="text-text">{d.footer.live}</span>
          </span>
        </div>
      </div>
    </>
  );
}
