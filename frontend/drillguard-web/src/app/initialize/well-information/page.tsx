"use client";

import clsx from "clsx";
import { Calendar } from "lucide-react";
import { Card, Field, InfoBanner } from "@/components/ui/primitives";
import { WizardTop, StepHeading, WizardNav, SubHeading, SummaryKV } from "../_components/wizard";
import { step2, wellSummary, wizardHeader, routes } from "@/data/wizard";

export default function WellInformationPage() {
  const d = step2;
  return (
    <>
      <WizardTop
        current={2}
        subtitle={d.header.subtitle}
        rigLabel={wizardHeader.rigLabel}
        rangeLabel={wizardHeader.rangeLabel}
      />

      <div className="space-y-4 p-5">
        <StepHeading sub={d.sub}>{d.heading}</StepHeading>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(240px,335px)] gap-4">
          <div className="space-y-4">
            <Card>
              {d.sections.map((s, si) => (
                <div key={s.title} className={clsx(si > 0 && "mt-5 border-t border-border pt-5")}>
                  <SubHeading>{s.title}</SubHeading>
                  <div className="space-y-4">
                    {s.rows.map((row, ri) => (
                      <div
                        key={ri}
                        className={clsx("grid gap-5", row.length === 4 ? "grid-cols-4" : "grid-cols-3")}
                      >
                        {row.map((f) => (
                          <Field
                            key={f.label}
                            label={f.label}
                            value={f.value}
                            required={"required" in f ? f.required : undefined}
                            select={f.select}
                            suffix={"suffix" in f ? f.suffix : undefined}
                            icon={
                              "icon" in f && f.icon === "calendar" ? (
                                <Calendar size={16} className="text-text-2" />
                              ) : undefined
                            }
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Card>

            <WizardNav
              backHref={routes.runMode}
              backLabel={d.back}
              nextHref={routes.configuration}
              nextLabel={d.next}
            />
          </div>

          <Card className="self-start">
            <h3 className="text-[18px] font-semibold">{d.summary.title}</h3>
            <p className="mt-0.5 text-[13px] text-muted">{d.summary.description}</p>
            <div className="mt-3">
              {wellSummary.map((r) => (
                <SummaryKV key={r.k} k={r.k} v={r.v} className="py-2.5" />
              ))}
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
