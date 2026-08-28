"use client";

import { useReplay } from "@/lib/replay/ReplayProvider";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Database,
  Flag,
  Mail,
  PlayCircle,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { RigIcon } from "@/components/ui/icons";
import { Card, Chip, CheckDot, InfoBanner, SoftTile } from "@/components/ui/primitives";
import { WizardTop, StepHeading, WizardNav, SummaryKV } from "../_components/wizard";
import { step5, wellSummary, wizardHeader, routes } from "@/data/wizard";

const cardIcon: Record<string, React.ReactNode> = {
  run: <PlayCircle size={18} />,
  well: <RigIcon size={18} />,
  config: <Settings size={18} />,
  data: <Database size={18} />,
};

export default function ReviewPage() {
  const replay = useReplay();
  const d = step5;
  return (
    <>
      <WizardTop
        current={5}
        subtitle={d.header.subtitle}
        rigLabel={wizardHeader.rigLabel}
        rangeLabel={wizardHeader.rangeLabel}
      />

      <div className="space-y-4 p-5">
        <StepHeading sub={d.sub}>{d.heading}</StepHeading>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(240px,310px)] gap-4">
          <div className="space-y-4">
            {/* ---- All systems ready banner ---------------------------- */}
            <div className="flex items-center justify-between gap-4 rounded-xl border border-good/30 bg-good-soft px-5 py-4">
              <div className="flex items-center gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-good/30 bg-surface text-good">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <div className="text-[15px] font-semibold text-good">{d.ready.title}</div>
                  <div className="mt-0.5 text-[13px] text-text-2">{d.ready.description}</div>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex h-10 shrink-0 items-center rounded-lg border border-border bg-surface px-4 text-[13px] font-medium text-primary"
              >
                {d.ready.button}
              </button>
            </div>

            {/* ---- 4 summary cards ------------------------------------- */}
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)_minmax(0,1.02fr)_minmax(0,1.18fr)] gap-4">
              {d.cards.map((c) => (
                <Card key={c.title} padded={false} className="flex flex-col p-3.5">
                  <div className="flex items-center gap-3">
                    <SoftTile sev="info" size={36} square>
                      {cardIcon[c.icon]}
                    </SoftTile>
                    <div className="leading-tight">
                      <div className="text-[14px] font-semibold">{c.title}</div>
                      {"subtitle" in c && c.subtitle && (
                        <div className="whitespace-nowrap text-[12px] text-muted">{c.subtitle}</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex-1">
                    {c.stacked
                      ? c.kv.map((r) => (
                          <div key={r.k} className="py-1.5">
                            <div className="text-[11.5px] text-muted">{r.k}</div>
                            <div className="text-[12px] font-medium">{r.v}</div>
                          </div>
                        ))
                      : c.kv.map((r) => (
                          <div key={r.k} className="flex items-center justify-between gap-1.5 py-1.5 text-[11.5px]">
                            <span className="whitespace-nowrap text-muted">{r.k}</span>
                            <span className="whitespace-nowrap text-right font-medium">{r.v}</span>
                          </div>
                        ))}
                    {"hazards" in c && c.hazards && (
                      <div className="py-1.5 text-[12px]">
                        <div className="text-muted">{c.hazardsLabel}</div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {c.hazards.map((h) => (
                            <Chip key={h} sev="info">{h}</Chip>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {!c.stacked && (
                    <Link
                      href={c.link}
                      className="mt-3 inline-flex items-center gap-2 text-[13px] font-medium text-primary"
                    >
                      {d.viewDetails} <ArrowRight size={14} />
                    </Link>
                  )}
                </Card>
              ))}
            </div>

            {/* ---- Alerts / Initialization summary --------------------- */}
            <div className="grid grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] gap-4">
              <Card>
                <div className="flex items-center gap-3">
                  <SoftTile sev="info" size={32}>
                    <Bell size={16} />
                  </SoftTile>
                  <h3 className="text-[15px] font-semibold">{d.alerts.title}</h3>
                </div>
                <div className="mt-3">
                  {d.alerts.kv.map((r) => (
                    <div key={r.k} className="grid grid-cols-[140px_minmax(0,1fr)] items-center gap-3 py-2 text-[12.5px]">
                      <span className="text-text-2">{r.k}</span>
                      <span className="inline-flex items-center gap-2 font-medium">
                        {"mail" in r && r.mail && <Mail size={14} className="text-primary" />}
                        {r.v}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/settings"
                  className="mt-3 inline-flex items-center gap-2 text-[13px] font-medium text-primary"
                >
                  {d.alerts.link} <ArrowRight size={14} />
                </Link>
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <SoftTile sev="info" size={32}>
                    <CheckCircle2 size={16} />
                  </SoftTile>
                  <h3 className="text-[15px] font-semibold">{d.initSummary.title}</h3>
                </div>
                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_230px] gap-4">
                  <ul className="space-y-2.5 text-[13px] text-text-2">
                    {d.initSummary.checks.map((c) => (
                      <li key={c} className="flex items-center gap-2.5">
                        <CheckDot size={15} /> {c}
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-xl border border-primary/20 bg-primary-soft/60 p-4">
                    <div className="flex items-center gap-2 text-[14px] font-semibold text-primary">
                      <Flag size={18} /> {d.initSummary.readyTitle}
                    </div>
                    <p className="mt-1.5 text-[12.5px] text-text-2">{d.initSummary.readyDescription}</p>
                    <div className="mt-3 rounded-lg border border-border bg-surface px-2 py-2.5 text-center">
                      <div className="text-[11.5px] text-muted">{d.initSummary.estimatedLabel}</div>
                      <div className="mt-0.5 whitespace-nowrap text-[13.5px] font-semibold">{d.initSummary.estimatedValue}</div>
                      <div className="text-[13px] font-semibold text-good">{d.initSummary.estimatedSub}</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <InfoBanner tone="warn">{d.warning}</InfoBanner>

            <WizardNav
              backHref={routes.dataConnection}
              backLabel={d.back}
              nextHref={routes.liveMonitoring}
              nextLabel={d.next}
              nextIcon="play"
              onNext={() => { replay.seek(0); replay.play(); }}
            />
          </div>

          {/* ---- Right: Well Summary ------------------------------------ */}
          <Card className="self-start">
            <div className="flex items-center gap-2.5">
              <RigIcon size={18} className="text-primary" />
              <h3 className="text-[16px] font-semibold">{d.summary.title}</h3>
            </div>
            <div className="mt-2">
              {wellSummary.map((r) => (
                <SummaryKV key={r.k} k={r.k} v={r.v} labelWidth={108} />
              ))}
            </div>

            <h4 className="mt-4 text-[15px] font-semibold">{d.summary.nextTitle}</h4>
            <ul className="mt-3 space-y-3 text-[12.5px] text-text-2">
              {d.summary.next.map((n) => (
                <li key={n} className="flex items-start gap-2.5">
                  <span className="mt-0.5"><CheckDot size={15} /></span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <InfoBanner>{d.summary.banner}</InfoBanner>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
