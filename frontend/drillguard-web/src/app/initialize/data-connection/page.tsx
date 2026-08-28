"use client";

import clsx from "clsx";
import {
  Activity,
  BarChart3,
  Calendar,
  ChevronDown,
  Clock,
  Database,
  Flag,
  Info,
  Link2,
  MoreVertical,
  Play,
  Plus,
  Sparkles,
  Table2,
} from "lucide-react";
import { Card, Chip, CheckDot, Dot, Field, Table } from "@/components/ui/primitives";
import { WizardTop, StepHeading, WizardNav, SearchBox } from "../_components/wizard";
import { step4, wizardHeader, routes } from "@/data/wizard";

const infoIcon: Record<string, React.ReactNode> = {
  clock: <Clock size={13} />,
  calendar: <Calendar size={13} />,
  activity: <Activity size={13} />,
  table: <Table2 size={13} />,
  flag: <Flag size={13} />,
  database: <Database size={13} />,
};

function RadioCard({ title, description, selected }: { title: string; description: string; selected: boolean }) {
  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-lg border px-4 py-3",
        selected ? "border-primary bg-primary-soft/50" : "border-border bg-surface"
      )}
    >
      <span
        className={clsx(
          "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2",
          selected ? "border-primary" : "border-border-strong"
        )}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      <span>
        <span className="block text-[14px] font-semibold">{title}</span>
        <span className="block text-[12.5px] text-muted">{description}</span>
      </span>
    </div>
  );
}

export default function DataConnectionPage() {
  const d = step4;
  return (
    <>
      <WizardTop
        current={4}
        subtitle={d.header.subtitle}
        rigLabel={wizardHeader.rigLabel}
        rangeLabel={wizardHeader.rangeLabel}
      />

      <div className="space-y-4 p-5">
        <StepHeading sub={d.sub}>
          {d.heading.plain} <span className="text-primary">{d.heading.accent}</span>
        </StepHeading>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(240px,360px)] gap-4">
          <div className="space-y-4">
            {/* ---- 1. Select Data Source ------------------------------ */}
            <Card>
              <h3 className="mb-3 text-[15px] font-semibold">{d.source.title}</h3>
              <div className="grid grid-cols-2 gap-5">
                {d.source.options.map((o) => (
                  <RadioCard key={o.title} {...o} />
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-5">
                {/* left: dataset + info + playback */}
                <div>
                  <span className="mb-1.5 block text-[12.5px] font-medium text-text-2">{d.source.datasetLabel}</span>
                  <span className="flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[13px]">
                    <span className="flex-1 truncate">{d.source.datasetValue}</span>
                    <Chip sev="good">{d.source.datasetChip}</Chip>
                    <ChevronDown size={16} className="text-muted" />
                  </span>

                  <div className="mt-3 grid grid-cols-[auto_auto_auto] justify-between gap-x-4 gap-y-3 rounded-lg border border-border bg-surface-2 p-3">
                    {d.source.info.map((it) => (
                      <div key={it.label} className="whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[11.5px] text-muted">
                          {infoIcon[it.icon]} {it.label}
                        </div>
                        <div className="mt-1 text-[12.5px] font-medium">
                          {"sev" in it && it.sev ? <Chip sev={it.sev}>{it.value}</Chip> : it.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 text-[13px] font-semibold">{d.source.playbackTitle}</div>
                  <div className="mt-2 grid grid-cols-[1fr_1fr_auto] items-end gap-3">
                    <Field label={d.source.playbackSpeed.label} value={d.source.playbackSpeed.value} />
                    <Field label={d.source.startFrom.label} value={d.source.startFrom.value} />
                    <button
                      type="button"
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[13px] font-medium text-primary"
                    >
                      <Play size={13} /> {d.source.previewButton}
                    </button>
                  </div>
                </div>

                {/* right: connection settings */}
                <div className="space-y-4">
                  <Field label={d.source.connectionType.label} value={d.source.connectionType.value} />
                  <Field label={d.source.endpoint.label} value={d.source.endpoint.value} select={false} />
                  <Field label={d.source.auth.label} value={d.source.auth.value} />
                  <button
                    type="button"
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary/40 bg-surface px-5 text-[13px] font-medium text-primary"
                  >
                    <Link2 size={15} /> {d.source.connectButton}
                  </button>
                </div>
              </div>
            </Card>

            {/* ---- 2. Map Drilling Parameters ------------------------- */}
            <Card>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-semibold">{d.mapping.title}</h3>
                  <p className="mt-0.5 text-[12.5px] text-muted">{d.mapping.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary/30 bg-primary-soft px-4 text-[13px] font-medium text-primary"
                  >
                    <Sparkles size={14} /> {d.mapping.autoMap}
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-[13px] font-medium text-text-2"
                  >
                    {d.mapping.reset}
                  </button>
                  <SearchBox placeholder={d.mapping.searchPlaceholder} className="w-[165px]" />
                </div>
              </div>

              <Table
                compact
                className="[&_td]:pr-3 [&_th]:pr-3"
                head={d.mapping.head}
                rows={d.mapping.rows.map((r) => [
                  <span key="p" className="font-medium">{r.param}</span>,
                  <span key="d" className="text-text-2">{r.desc}</span>,
                  <span key="f" className="inline-flex h-8 w-[116px] items-center justify-between rounded-md border border-border bg-surface px-2.5 text-[12.5px]">
                    {r.field} <ChevronDown size={14} className="text-muted" />
                  </span>,
                  r.unit,
                  r.sample,
                  <span key="q" className="font-medium text-good">{r.quality}</span>,
                  <span key="s" className="inline-flex items-center gap-2 text-good">
                    <Dot sev="good" /> {r.status}
                  </span>,
                  <MoreVertical key="m" size={15} className="text-muted" />,
                ])}
              />
              <button
                type="button"
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-[13px] font-medium text-primary"
              >
                <Plus size={14} /> {d.mapping.addButton}
              </button>
            </Card>

            <WizardNav
              backHref={routes.configuration}
              backLabel={d.back}
              nextHref={routes.review}
              nextLabel={d.next}
            />
          </div>

          {/* ---- Right column --------------------------------------- */}
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold">{d.status.title}</h3>
                <Chip sev="good">{d.status.chip}</Chip>
              </div>
              <ul className="mt-4 space-y-3 text-[13px]">
                {d.status.checks.map((c) => (
                  <li key={c.label} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2.5 text-text-2">
                      <CheckDot size={15} /> {c.label}
                    </span>
                    <span className="text-right font-medium">{c.value}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex gap-2.5 rounded-lg border border-primary/20 bg-primary-soft px-4 py-3 text-[13px] text-primary">
                <Info size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p>{d.status.banner}</p>
                  <button
                    type="button"
                    className="mt-2.5 inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-[13px] font-medium text-primary"
                  >
                    <BarChart3 size={14} /> {d.status.bannerButton}
                  </button>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold">{d.coverage.title}</h3>
                <Chip sev="good">{d.coverage.chip}</Chip>
              </div>
              <div className="mt-3">
                {d.coverage.rows.map((r) => (
                  <div key={r.k} className="flex items-center justify-between py-1.5 text-[13px]">
                    <span className="text-text-2">{r.k}</span>
                    <span className="font-semibold">{r.v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 h-2 rounded-full bg-border">
                <div className="h-2 rounded-full bg-good" style={{ width: `${d.coverage.pct}%` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-muted">
                {d.coverage.ticks.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-[15px] font-semibold">{d.preview.title}</h3>
              <Table className="mt-3 [&_td]:pr-2 [&_th]:pr-2 [&_th]:whitespace-nowrap [&_th]:text-[11px]" compact head={d.preview.head} rows={d.preview.rows} />
              <div className="mt-3 flex items-center justify-between text-[12.5px] text-text-2">
                <span>{d.preview.footer}</span>
                <button
                  type="button"
                  className="inline-flex h-8 items-center rounded-md border border-border bg-surface px-3 text-[12px] font-medium text-primary"
                >
                  {d.preview.moreButton}
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
