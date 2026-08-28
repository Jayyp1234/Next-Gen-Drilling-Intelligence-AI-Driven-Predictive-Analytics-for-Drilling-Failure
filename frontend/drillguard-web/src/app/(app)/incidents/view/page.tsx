"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReplayBar } from "@/components/layout/ReplayBar";
import { Card, Button, Badge, Chip, KV } from "@/components/ui/primitives";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useIncidents } from "@/lib/incidents/store";
import {
  statusSev,
  causesActions,
  DetailTrend,
  IncidentNotFound,
} from "../_components/incident-detail";

const TABS = ["Overview", "Analysis", "Timeline", "Actions", "Attachments", "Notes"];
const toneSev: Record<string, string> = {
  high: "#e53935",
  medium: "#f97316",
  low: "#1d5af0",
  grey: "#94a3b8",
};

/**
 * Incident detail lives at /incidents/view?id=INC-xxxx (query param instead of
 * a dynamic segment) so the whole app can ship as a static export to cPanel.
 * useSearchParams requires a Suspense boundary under output: "export".
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <IncidentDetail />
    </Suspense>
  );
}

function IncidentDetail() {
  const id = useSearchParams().get("id") ?? "";

  const { get, update } = useIncidents();
  const inc = get(id);

  const [tab, setTab] = useState(TABS[0]);

  // --- not found / no dataset loaded --------------------------------------
  if (!inc) {
    return (
      <>
        <PageHeader
          title={id || "Incident"}
          subtitle="Incident detail"
          rigLabel="Incidents"
          action={<BackButton />}
        />
        <ReplayBar />
        <IncidentNotFound />
      </>
    );
  }

  const { causes, actions } = causesActions(inc.type);

  const onResolve = () => update(inc.id, { status: "Resolved" });
  const onAddNote = () => {
    // Wall-clock computed here in the handler — never during render.
    const time = new Date().toISOString().slice(11, 16);
    update(inc.id, {
      activity: [
        ...inc.activity,
        { time, title: "Note added", by: inc.owner || "Drilling Engineer", tone: "grey" },
      ],
    });
  };

  return (
    <>
      <PageHeader
        title={inc.id}
        subtitle={inc.title}
        rigLabel={inc.well}
        action={
          <div className="flex items-center gap-3">
            <BackButton />
            {inc.status !== "Resolved" && (
              <Button variant="primary" icon={<CheckCircle2 size={16} />} onClick={onResolve}>
                Resolve
              </Button>
            )}
          </div>
        }
      />
      <ReplayBar />

      <div className="space-y-4 p-5">
        <Card>
          {/* ---- header row ------------------------------------------------ */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-[16px] font-bold tnum">{inc.id}</h3>
                <Badge sev={inc.sev}>{inc.sev}</Badge>
                <Chip sev={statusSev[inc.status]} dot>
                  {inc.status}
                </Chip>
              </div>
              <p className="mt-1.5 text-[13px] text-muted">{inc.desc}</p>
            </div>
            <div className="flex items-center gap-4 text-[13px]">
              <span className="text-text-2">
                Status:{" "}
                <span className="font-semibold text-text">{inc.status}</span>
              </span>
              <span className="h-5 w-px bg-border" />
              <span className="text-text-2">
                Detected: <span className="font-semibold text-text">{inc.detected}</span>
              </span>
            </div>
          </div>

          {/* ---- tabs ------------------------------------------------------ */}
          <div className="mt-4 flex gap-8 border-b border-border">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={
                  "-mb-px border-b-2 pb-3 text-[14px] font-medium transition-colors " +
                  (t === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-text-2 hover:text-text")
                }
              >
                {t}
              </button>
            ))}
          </div>

          {/* ---- 4-column body -------------------------------------------- */}
          <div className="mt-4 grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)_minmax(0,1.15fr)_minmax(0,0.95fr)] divide-x divide-border">
            {/* (1) Incident Information */}
            <div className="pr-5">
              <h4 className="text-[13px] font-semibold">Incident Information</h4>
              <div className="mt-2">
                {inc.params?.map((p) => (
                  <KV key={p.label} k={p.label} v={p.value} />
                ))}
                <KV k="Type" v={inc.type} />
                <KV k="Well" v={inc.well} />
                <KV k="Owner" v={inc.owner} />
                <KV k="Source" v={<span className="capitalize">{inc.source}</span>} />
              </div>

              <div className="mt-3 text-[13px] text-text-2">Description</div>
              <p className="mt-1 text-[12px] leading-relaxed text-text">{inc.desc}</p>

              {inc.quote && (
                <>
                  <div className="mt-3 text-[13px] text-text-2">Documented record</div>
                  <blockquote className="mt-1 border-l-2 border-border pl-3 text-[12px] italic leading-relaxed text-text-2">
                    “{inc.quote}”
                  </blockquote>
                </>
              )}
            </div>

            {/* (2) Trend */}
            <div className="px-5">
              <h4 className="text-[13px] font-semibold">
                Trend <span className="font-normal text-muted">(Last 30 rows)</span>
              </h4>
              <div className="mt-2 text-[11px] text-muted">risk index</div>
              <DetailTrend sev={inc.sev} />
            </div>

            {/* (3) Possible Causes + Recommended Actions */}
            <div className="px-5">
              <h4 className="text-[13px] font-semibold">Possible Causes</h4>
              <ul className="mt-3 space-y-1.5 text-[12px] text-text">
                {causes.map((c) => (
                  <li key={c} className="flex items-start gap-2">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-text" />
                    {c}
                  </li>
                ))}
              </ul>
              <h4 className="mt-5 text-[13px] font-semibold">Recommended Actions</h4>
              <ol className="mt-3 space-y-1.5 text-[12px] text-text">
                {actions.map((a, i) => (
                  <li key={a} className="flex items-start gap-1.5">
                    <span className="tnum">{i + 1}.</span>
                    {a}
                  </li>
                ))}
              </ol>
            </div>

            {/* (4) Activity Log */}
            <div className="flex flex-col pl-5">
              <h4 className="text-[13px] font-semibold">Activity Log</h4>
              <ul className="relative mt-3 space-y-4">
                <span className="absolute bottom-2 left-[4px] top-2 w-px bg-border" />
                {inc.activity.map((a, i) => (
                  <li key={i} className="relative flex items-start gap-3 text-[12px]">
                    <span
                      className="relative z-10 mt-1 h-[9px] w-[9px] shrink-0 rounded-full"
                      style={{ background: toneSev[a.tone] ?? toneSev.grey }}
                    />
                    <span className="w-[58px] shrink-0 text-muted tnum">{a.time}</span>
                    <span className="leading-snug">
                      <span className="block font-semibold text-text">{a.title}</span>
                      {a.by && <span className="block text-text-2">{a.by}</span>}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex justify-end pt-4">
                <Button size="sm" className="h-9 px-4 text-[13px]" onClick={onAddNote}>
                  Add Note
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

function BackButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      icon={<ArrowLeft size={16} />}
      onClick={() => router.push("/incidents")}
    >
      Back to Incidents
    </Button>
  );
}
