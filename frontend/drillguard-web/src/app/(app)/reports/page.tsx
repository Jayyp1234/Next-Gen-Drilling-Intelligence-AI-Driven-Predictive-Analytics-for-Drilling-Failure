"use client";

import { download, toCsv } from "@/lib/export";

import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardHeading,
  Button,
  Chip,
  InlineSelect,
  Table,
  GreenToggle,
  ArrowLink,
  Delta,
} from "@/components/ui/primitives";
import { Donut } from "@/components/ui/gauges";
import { DotLegend } from "@/components/charts";
import {
  Plus,
  Search,
  Download,
  MoreVertical,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { ToneTile, ReportIcon, toneSev, toneText } from "./_components/tone";
import { useReportsView } from "@/lib/replay/screens";

export default function ReportsPage() {
  const d = useReportsView();
  const exportReport = (r: (typeof d.recentRows)[number]) => {
    const manifest = toCsv([{ report: r.name, type: r.type, well_rig: r.wellRig, generated_by: r.generatedBy, generated_on: r.generatedOn, period_covered: r.period, format: r.format, size: r.size }]);
    download(`${r.name.replace(/[^A-Za-z0-9]+/g, "_")}.csv`, manifest, "text/csv");
  };
  // "New Report" → generate a fresh snapshot report of the current report register.
  const newReport = () => {
    const rows = d.recentRows.map((r) => ({ report: r.name, type: r.type, well_rig: r.wellRig, generated_on: r.generatedOn, period: r.period, format: r.format }));
    download(`drillguard_report_register_${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows), "text/csv");
  };
  return (
    <>
      <PageHeader
        title={d.header.title}
        subtitle={d.header.subtitle}
        rigLabel={d.header.rigLabel}
        rangeLabel={d.header.rangeLabel}
        rangeIcon="calendar"
        action={<Button icon={<Plus size={16} />} onClick={newReport}>{d.header.action}</Button>}
      />

      <div className="space-y-4 p-5">
        {/* ---- Row 1: KPI cards --------------------------------------- */}
        <div className="grid grid-cols-4 gap-4">
          {d.kpis.map((k) => (
            <Card key={k.title}>
              <div className="flex items-start gap-4">
                <ToneTile tone={k.tone} solid square size={44}>
                  <ReportIcon icon={k.icon} size={20} />
                </ToneTile>
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-text-2">
                    {k.title}
                  </div>
                  <div className="mt-1 text-[26px] font-extrabold leading-none tnum">
                    {k.value}
                  </div>
                  <div className="mt-2.5 text-[12px] text-muted">
                    {k.delta ? (
                      <Delta
                        dir="up"
                        value={k.delta.value}
                        suffix={k.delta.suffix}
                        good
                      />
                    ) : (
                      k.sub
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* ---- Row 2: Report categories / Reports overview ------------- */}
        <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(0,1.1fr)] gap-4">
          <Card>
            <CardHeading
              title={d.categories.title}
              description={d.categories.description}
            />
            <div className="grid grid-cols-4 gap-3">
              {d.templates.map((t) => (
                <div
                  key={t.name}
                  className="flex flex-col items-center rounded-xl border border-border px-1.5 py-5 text-center"
                >
                  <ToneTile tone={t.tone} size={44}>
                    <ReportIcon icon={t.icon} size={20} />
                  </ToneTile>
                  <div className="mt-3 text-[12px] font-bold leading-tight">
                    {t.name}
                  </div>
                  <div className="mt-1.5 min-h-[32px] text-[11px] leading-4 text-muted">
                    {t.description}
                  </div>
                  <div
                    className={`mt-2 text-[11px] font-semibold ${toneText[t.tone]}`}
                  >
                    {t.frequency}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-center">
              <ArrowLink>{d.categories.footer}</ArrowLink>
            </div>
          </Card>

          <Card>
            <CardHeading
              title={d.overview.title}
              right={<InlineSelect value={d.overview.rangeValue} />}
            />
            <div className="flex items-center gap-8 px-2 pt-2">
              <Donut
                slices={d.overviewSlices.map((s) => ({
                  value: s.value,
                  color: s.color,
                }))}
                size={190}
                thickness={30}
                center={d.overview.centerValue}
                sub={d.overview.centerLabel}
              />
              <DotLegend
                className="flex-1 space-y-3 text-[12px]"
                items={d.overviewSlices.map((s) => ({
                  label: s.label,
                  color: s.color,
                  value: `${s.value} (${s.pct})`,
                }))}
              />
            </div>
            <div className="mt-6 grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-surface-2">
              {d.overview.stats.map((s) => (
                <div key={s.label} className="px-4 py-3">
                  <div className="text-[11px] text-muted">{s.label}</div>
                  <div className="mt-1 text-[13px] font-semibold">
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ---- Row 3: Recent reports / Scheduled reports --------------- */}
        <div className="grid grid-cols-[minmax(0,1.85fr)_minmax(0,0.65fr)] gap-4">
          <Card className="min-w-0">
            <CardHeading
              title={d.recent.title}
              description={d.recent.description}
              right={
                <div className="flex items-center gap-3">
                  <InlineSelect value={d.recent.filterValue} />
                  <label className="flex h-9 w-[170px] items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[13px]">
                    <input
                      type="text"
                      placeholder={d.recent.searchPlaceholder}
                      className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted"
                    />
                    <Search size={15} className="shrink-0 text-muted" />
                  </label>
                </div>
              }
            />
            <div className="overflow-x-auto scroll-thin [&_table]:text-[10.5px] [&_td_span]:text-[10.5px] [&_td]:pr-1.5 [&_th]:pr-1.5 [&_td_.inline-flex]:px-1.5 [&_td:last-child]:pr-0 [&_th:last-child]:pr-0">
              <Table
                compact
                head={d.recent.columns}
                rows={d.recentRows.map((r) => [
                  <span
                    key="name"
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <ToneTile tone={r.tone} square size={22}>
                      <ReportIcon icon={r.icon} size={13} />
                    </ToneTile>
                    <span className="font-semibold">{r.name}</span>
                  </span>,
                  <span key="type" className="whitespace-nowrap">
                    <Chip sev={toneSev[r.tone === "teal" ? "grey" : r.tone]}>
                      {r.type}
                    </Chip>
                  </span>,
                  <span key="well" className="whitespace-nowrap text-text-2">
                    {r.wellRig}
                  </span>,
                  <span key="by" className="whitespace-nowrap text-text-2">
                    {r.generatedBy}
                  </span>,
                  <span key="on" className="whitespace-nowrap text-text-2">
                    {r.generatedOn}
                  </span>,
                  <span key="period" className="whitespace-nowrap text-text-2">
                    {r.period}
                  </span>,
                  <span
                    key="fmt"
                    className="flex items-center gap-1.5 whitespace-nowrap text-text-2"
                  >
                    {r.format === "PDF" ? (
                      <FileText size={14} className="text-high" />
                    ) : (
                      <FileSpreadsheet size={14} className="text-good" />
                    )}
                    {r.format}
                  </span>,
                  <span key="size" className="whitespace-nowrap text-text-2">
                    {r.size}
                  </span>,
                  <span
                    key="actions"
                    className="flex items-center gap-2 text-text-2"
                  >
                    <button type="button" onClick={() => exportReport(r)} aria-label={`Download ${r.name}`}>
                      <Download size={14} className="text-primary" />
                    </button>
                    <MoreVertical size={14} />
                  </span>,
                ])}
              />
            </div>
            <div className="mt-4 flex justify-center">
              <ArrowLink>{d.recent.footer}</ArrowLink>
            </div>
          </Card>

          <Card padded={false} className="min-w-0 p-4">
            <CardHeading
              title={d.scheduled.title}
              description={d.scheduled.description}
            />
            <div className="space-y-2.5">
              {d.scheduledRows.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center gap-2 rounded-xl border border-border p-2"
                >
                  <ToneTile tone={s.tone} square size={32}>
                    <ReportIcon icon={s.icon} size={15} />
                  </ToneTile>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11.5px] font-semibold leading-snug">
                      {s.name}
                    </div>
                    <div className="text-[10.5px] leading-snug text-muted">
                      {s.schedule}
                    </div>
                  </div>
                  <GreenToggle on={s.on} />
                  <MoreVertical size={14} className="shrink-0 text-text-2" />
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <ArrowLink>{d.scheduled.footer}</ArrowLink>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
