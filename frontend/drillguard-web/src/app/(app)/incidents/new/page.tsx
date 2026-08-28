"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReplayBar } from "@/components/layout/ReplayBar";
import { Card, CardHeading, Button, Chip } from "@/components/ui/primitives";
import { ArrowLeft, Plus } from "lucide-react";
import { useReplay } from "@/lib/replay/ReplayProvider";
import { useIncidents, type Sev } from "@/lib/incidents/store";
import { statusSev } from "../_components/incident-detail";

const TYPES = [
  "Stuck Pipe",
  "Loss Circulation",
  "Kick / Well Control",
  "Equipment Failure",
  "Bit Wear",
  "Stick-Slip",
  "Other",
];
const SEVS: { key: Sev; label: string }[] = [
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];
const sevPill: Record<Sev, string> = {
  high: "border-high/40 bg-high-soft text-high",
  medium: "border-medium/40 bg-medium-soft text-medium",
  low: "border-low/40 bg-low-soft text-low",
};

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-[14px] text-text outline-none focus:border-primary";
const labelCls = "mb-1.5 block text-[13px] font-medium text-text-2";

export default function Page() {
  const router = useRouter();
  const replay = useReplay();
  const { createManual } = useIncidents();

  const replayWell = replay.dataset?.well ?? "OML18-W12";

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [sev, setSev] = useState<Sev>("high");
  const [well, setWell] = useState("");
  const [wellEdited, setWellEdited] = useState(false);
  const wellValue = wellEdited ? well : replayWell;

  const canSubmit = title.trim().length > 0;

  const onCreate = async () => {
    if (!canSubmit) return;
    const inc = await createManual({
      title: title.trim(),
      desc: desc.trim(),
      type,
      sev,
      well: wellValue.trim() || replayWell,
    });
    router.push(`/incidents/${inc.id}`);
  };

  return (
    <>
      <PageHeader
        title="Report Incident"
        subtitle="Log a new drilling incident"
        rigLabel={replayWell}
        action={
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push("/incidents")}
          >
            Cancel
          </Button>
        }
      />
      <ReplayBar />

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 p-5">
        {/* ---- form ------------------------------------------------------- */}
        <Card>
          <CardHeading
            title="Incident Details"
            description="Capture what happened and how severe it is. You can refine it after it&rsquo;s logged."
          />

          <div className="space-y-4">
            <div>
              <label className={labelCls} htmlFor="inc-title">
                Title <span className="text-high">*</span>
              </label>
              <input
                id="inc-title"
                className={inputCls}
                placeholder="e.g. High Torque Trend"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className={labelCls} htmlFor="inc-desc">
                Description
              </label>
              <textarea
                id="inc-desc"
                rows={4}
                className={inputCls + " h-auto resize-y py-2 leading-relaxed"}
                placeholder="Describe the observed behaviour, affected parameter and any context…"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} htmlFor="inc-type">
                  Type
                </label>
                <select
                  id="inc-type"
                  className={inputCls}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls} htmlFor="inc-well">
                  Well
                </label>
                <input
                  id="inc-well"
                  className={inputCls}
                  value={wellValue}
                  onChange={(e) => {
                    setWell(e.target.value);
                    setWellEdited(true);
                  }}
                />
              </div>
            </div>

            <div>
              <span className={labelCls}>Severity</span>
              <div className="flex gap-2.5">
                {SEVS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSev(s.key)}
                    className={
                      "h-10 flex-1 rounded-lg border text-[14px] font-semibold transition-colors " +
                      (sev === s.key
                        ? sevPill[s.key]
                        : "border-border bg-surface text-text-2 hover:border-border-strong")
                    }
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={onCreate}
                className={canSubmit ? "" : "cursor-not-allowed opacity-50"}
              >
                Create Incident
              </Button>
            </div>
          </div>
        </Card>

        {/* ---- live summary ---------------------------------------------- */}
        <Card>
          <CardHeading title="Summary" description="Live preview of the incident record." />
          <div className="space-y-3 text-[13px]">
            <SummaryRow label="Title">
              <span className={title ? "font-semibold text-text" : "text-muted"}>
                {title || "Untitled incident"}
              </span>
            </SummaryRow>
            <SummaryRow label="Type">
              <span className="font-semibold text-text">{type}</span>
            </SummaryRow>
            <SummaryRow label="Severity">
              <Chip sev={sev}>{SEVS.find((s) => s.key === sev)?.label}</Chip>
            </SummaryRow>
            <SummaryRow label="Status">
              <Chip sev={statusSev.Open} dot>
                Open
              </Chip>
            </SummaryRow>
            <SummaryRow label="Well">
              <span className="font-semibold text-text">{wellValue || "—"}</span>
            </SummaryRow>
            <div>
              <div className="mb-1 text-text-2">Description</div>
              <p className="text-[12px] leading-relaxed text-text">
                {desc || <span className="text-muted">No description yet.</span>}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-text-2">{label}</span>
      {children}
    </div>
  );
}
