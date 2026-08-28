"use client";

import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, Chip, InfoBanner } from "@/components/ui/primitives";
import { WizardTop, StepHeading, WizardNav, SubHeading, InputBox, SelectBox, RangePair, SummaryKV } from "../_components/wizard";
import { step3, wizardHeader, routes } from "@/data/wizard";

/** Simple vertical telescoping casing diagram: 4 nested rectangles of decreasing width. */
function CasingDiagram() {
  const widths = [44, 30, 18, 8];
  const tops = [0, 28, 96, 160];
  const bottoms = [28, 96, 160, 210];
  const cx = 30;
  return (
    <svg width={60} height={216} viewBox="0 0 60 216" aria-hidden="true" className="shrink-0">
      {widths.map((w, i) => (
        <rect
          key={i}
          x={cx - w / 2}
          y={tops[i]}
          width={w}
          height={bottoms[i] - tops[i]}
          fill="var(--surface)"
          stroke="var(--muted)"
          strokeWidth={1.5}
        />
      ))}
      <line x1={cx} y1={0} x2={cx} y2={216} stroke="var(--muted)" strokeWidth={1} />
    </svg>
  );
}

export default function ConfigurationPage() {
  const d = step3;
  const hs = d.holeSections;
  return (
    <>
      <WizardTop
        current={3}
        subtitle={d.header.subtitle}
        rigLabel={wizardHeader.rigLabel}
        rangeLabel={wizardHeader.rangeLabel}
      />

      <div className="space-y-4 p-5">
        <StepHeading sub={d.sub}>{d.heading}</StepHeading>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(240px,310px)] gap-4">
          <div className="space-y-4">
            {/* ---- Row 1: Hole sections / Drilling parameters --------- */}
            <div className="grid grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] gap-4">
              <Card>
                <SubHeading>{hs.title}</SubHeading>
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="text-[12px] text-muted">
                      {hs.head.map((h) => (
                        <th key={h} className="pb-2 pr-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hs.rows.map((r) => (
                      <tr key={r.section}>
                        <td className="py-1.5 pr-2">{r.section}</td>
                        {[r.holeSize, r.top, r.td, r.inc, r.az].map((v, i) => (
                          <td key={i} className="py-1.5 pr-2">
                            <span className="flex h-8 w-[72px] items-center rounded-md border border-border bg-surface px-2.5">
                              {v}
                            </span>
                          </td>
                        ))}
                        <td className="py-1.5">
                          <span className="inline-flex items-center gap-3">
                            <Pencil size={14} className="text-primary" />
                            <Trash2 size={14} className="text-high" />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-[13px] font-medium text-primary"
                >
                  <Plus size={14} /> {hs.addButton}
                </button>
              </Card>

              <Card>
                <SubHeading suffix={d.drillingParams.titleSuffix}>{d.drillingParams.title}</SubHeading>
                <div className="space-y-3">
                  {d.drillingParams.ranges.map((r) => (
                    <RangePair key={r.label} label={r.label} min={r.min} max={r.max} />
                  ))}
                </div>
              </Card>
            </div>

            {/* ---- Row 2: Mud system / Pressure & temperature --------- */}
            <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-4">
              <Card>
                <SubHeading>{d.mudSystem.title}</SubHeading>
                <div className="grid grid-cols-4 gap-3">
                  {d.mudSystem.fields.map((f) =>
                    "select" in f && f.select ? (
                      <SelectBox key={f.label} label={f.label} value={f.value} />
                    ) : (
                      <InputBox key={f.label} label={f.label} value={f.value} />
                    )
                  )}
                </div>
              </Card>

              <Card>
                <SubHeading suffix={d.pressureTemp.titleSuffix}>{d.pressureTemp.title}</SubHeading>
                <div className="space-y-3">
                  {d.pressureTemp.ranges.map((r) => (
                    <RangePair key={r.label} label={r.label} min={r.min} max={r.max} />
                  ))}
                </div>
              </Card>
            </div>

            {/* ---- Row 3: Formation / Equipment ------------------------ */}
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4">
              <Card>
                <SubHeading suffix={d.formation.titleSuffix}>{d.formation.title}</SubHeading>
                <div className="grid grid-cols-3 gap-3">
                  {d.formation.fields.map((f) => (
                    <SelectBox key={f.label} label={f.label} value={f.value} />
                  ))}
                </div>
                <div className="mt-4">
                  <span className="mb-1.5 block text-[12px] font-medium text-text-2">{d.formation.hazardsLabel}</span>
                  <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-2">
                    {d.formation.hazards.map((h) => (
                      <Chip key={h} sev="info">{h}</Chip>
                    ))}
                    <ChevronDown size={16} className="ml-1 text-muted" />
                  </span>
                </div>
              </Card>

              <Card>
                <SubHeading>{d.equipment.title}</SubHeading>
                <div className="grid grid-cols-3 gap-3">
                  {d.equipment.fields.map((f) =>
                    "select" in f && f.select ? (
                      <SelectBox key={f.label} label={f.label} value={f.value} />
                    ) : (
                      <InputBox key={f.label} label={f.label} value={f.value} />
                    )
                  )}
                </div>
              </Card>
            </div>

            <WizardNav
              backHref={routes.wellInformation}
              backLabel={d.back}
              nextHref={routes.dataConnection}
              nextLabel={d.next}
            />
          </div>

          {/* ---- Right: Configuration Summary ------------------------ */}
          <Card className="self-start">
            <h3 className="text-[18px] font-semibold">{d.summary.title}</h3>
            <p className="mt-0.5 text-[13px] text-muted">{d.summary.description}</p>

            <div className="mt-4">
              <div className="text-[13px] font-semibold">{d.summary.geometryLabel}</div>
              <div className="text-[12px] text-muted">{d.summary.geometryCount}</div>
            </div>
            <div className="mt-3 flex gap-5">
              <CasingDiagram />
              <div className="flex flex-col justify-between py-1 text-[12px]">
                {d.summary.geometry.map((g) => (
                  <div key={g.size}>
                    <div className="font-medium text-text">{g.size}</div>
                    <div className="text-muted">{g.range}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              {d.summary.kv.map((r) => (
                <SummaryKV key={r.k} k={r.k} v={r.v} labelWidth={112} />
              ))}
              <div className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-2 py-2 text-[13px]">
                <span className="whitespace-nowrap text-text-2">{d.summary.hazardsLabel}</span>
                <span className="flex flex-col items-start gap-1.5">
                  {d.summary.hazards.map((h) => (
                    <Chip key={h} sev="info">{h}</Chip>
                  ))}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <InfoBanner>{d.summary.banner}</InfoBanner>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
