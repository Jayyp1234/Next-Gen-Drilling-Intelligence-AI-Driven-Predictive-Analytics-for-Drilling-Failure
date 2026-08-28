"use client";

import Link from "next/link";
import clsx from "clsx";
import {
  ArrowRight,
  Calendar,
  Check,
  Database,
  Info,
  MoreVertical,
  Radio,
  Upload,
} from "lucide-react";
import {
  Card,
  Chip,
  CheckDot,
  Dot,
  Field,
  InfoBanner,
  Tabs,
  Table,
} from "@/components/ui/primitives";
import { WizardTop, StepHeading, SearchBox } from "../_components/wizard";
import { step1, routes } from "@/data/wizard";
import { useReplay } from "@/lib/replay/ReplayProvider";
import { useRouter } from "next/navigation";

export default function RunModePage() {
  const replay = useReplay();
  const router = useRouter();
  const fmtRange = (ds: (typeof replay.catalog)[number]) => ds.indexKind === "depth_m" ? `${Math.round(ds.lo)} – ${Math.round(ds.hi)} m MD` : `${ds.n} samples @ 10 s`;
  const d = step1;
  return (
    <>
      <WizardTop
        current={1}
        subtitle={d.header.subtitle}
        rigLabel={d.header.rigLabel}
        rangeLabel={d.header.rangeLabel}
      />

      <div className="space-y-4 p-5">
        <StepHeading sub={d.sub}>{d.heading}</StepHeading>

        {/* ---- Run-mode option cards ----------------------------------- */}
        <div className="grid grid-cols-2 gap-4">
          {d.options.map((o) => {
            const sim = o.key === "sim";
            return (
              <section
                key={o.key}
                className={clsx(
                  "card relative p-5",
                  o.selected ? "border-primary ring-1 ring-primary" : ""
                )}
              >
                {o.selected && (
                  <span className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-primary text-white">
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
                <div className="flex gap-5">
                  <span
                    className={clsx(
                      "grid h-[72px] w-[72px] shrink-0 place-items-center rounded-full",
                      sim ? "bg-primary-soft text-primary" : "bg-good-soft text-good"
                    )}
                  >
                    {sim ? <Database size={30} /> : <Radio size={30} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className={clsx("text-[18px] font-semibold", sim ? "text-text" : "text-good")}>
                      {o.title}
                    </h3>
                    <p className="mt-1 text-[13px] text-text-2">{o.description}</p>
                    <ul className="mt-4 space-y-2.5 text-[13px] text-text-2">
                      {o.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2.5">
                          <CheckDot size={15} sev={sim ? "info" : "good"} /> {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <Link
                  href={sim ? routes.wellInformation : routes.dataConnection}
                  className={clsx(
                    "mt-6 inline-flex h-11 items-center gap-3 rounded-lg px-5 text-[14px] font-semibold text-white",
                    sim ? "bg-primary hover:bg-primary-hover" : "bg-[#15803d]"
                  )}
                >
                  {o.button} <ArrowRight size={16} />
                </Link>
              </section>
            );
          })}
        </div>

        {/* ---- Dataset library + simulation settings ------------------- */}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(240px,300px)] gap-4">
          <Card>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-semibold">{d.datasets.title}</h3>
                <p className="mt-0.5 text-[13px] text-muted">{d.datasets.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-[13px] font-medium text-primary"
                >
                  <Upload size={15} /> {d.datasets.importButton}
                </button>
                <SearchBox placeholder={d.datasets.searchPlaceholder} className="w-[150px]" />
              </div>
            </div>

            <Tabs items={[...d.datasets.tabs]} active={d.datasets.activeTab} />

            <Table
              className="mt-2"
              head={d.datasets.head}
              rows={replay.catalog.map((ds) => {
                const selected = replay.dataset?.id === ds.id;
                return [
                <span key="n" className="font-medium">{ds.name}</span>,
                ds.well,
                ds.field,
                <Chip key="s" sev={ds.scenarioTone}>{ds.scenario}</Chip>,
                `${ds.n.toLocaleString("en-US")} rows`,
                fmtRange(ds),
                <span key="st" className={clsx("inline-flex items-center gap-2 font-medium", selected ? "text-primary" : "text-good")}>
                  <Dot sev={selected ? "info" : "good"} /> {selected ? "Selected" : "Ready"}
                </span>,
                <span key="a" className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => { await replay.select(ds.id); router.push(routes.wellInformation); }}
                    className={clsx("inline-flex h-8 items-center rounded-md border px-3 text-[12px] font-medium", selected ? "border-primary bg-primary text-white" : "border-border bg-surface text-primary")}
                  >
                    {replay.loading && selected ? "Loading…" : "Select"}
                  </button>
                  <MoreVertical size={15} className="text-muted" />
                </span>,
              ]; })}
            />

            <div className="mt-3">
              <InfoBanner>{d.datasets.banner} Datasets listed are real pipeline output (ensemble_scores.csv) with raw channels joined from the STEP 3 feature tables.</InfoBanner>
            </div>
          </Card>

          <Card padded={false} className="p-4">
            <h3 className="text-[16px] font-semibold">{d.settings.title}</h3>

            <div className="mt-5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-text-2">
                {d.settings.playbackLabel} <Info size={14} className="text-muted" />
              </span>
              <span className="text-[15px] font-bold text-primary">{d.settings.playbackValue}</span>
            </div>
            {/* slider: 10× is the 4th of 6 ticks */}
            <div className="relative mt-4 h-1.5 rounded-full bg-border">
              <div className="absolute inset-y-0 left-0 w-[60%] rounded-full bg-primary" />
              <span className="absolute left-[60%] top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow" />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-muted">
              {d.settings.ticks.map((t) => (
                <span key={t} className={clsx(t === d.settings.activeTick && "font-semibold text-primary")}>
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-5 space-y-4">
              <Field
                label={d.settings.startTime.label}
                value={d.settings.startTime.value}
                select={false}
                icon={<Calendar size={16} className="ml-auto order-last text-text-2" />}
              />
              <Field label={d.settings.timeZone.label} value={d.settings.timeZone.value} />
              <Field label={d.settings.endCondition.label} value={d.settings.endCondition.value} />
            </div>

            <Link
              href={routes.wellInformation}
              className="mt-6 flex h-11 w-full items-center justify-center gap-3 rounded-lg bg-primary text-[14px] font-semibold text-white hover:bg-primary-hover"
            >
              {d.settings.continue} <ArrowRight size={16} />
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}
