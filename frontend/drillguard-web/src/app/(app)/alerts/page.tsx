"use client";

import { Suspense, useState } from "react";

import { useReplay } from "@/lib/replay/ReplayProvider";
import { useIncidents } from "@/lib/incidents/store";
import { useRouter, useSearchParams } from "next/navigation";
import { ReplayBar } from "@/components/layout/ReplayBar";

import clsx from "clsx";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardTitle,
  Button,
  Badge,
  IconTile,
  InlineSelect,
  Pager,
  Dot,
  EmptyState,
  Skeleton,
} from "@/components/ui/primitives";
import { Donut } from "@/components/ui/gauges";
import { DotLegend } from "@/components/charts";
import { RigIcon } from "@/components/ui/icons";
import {
  Filter,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle,
  Droplets,
  TrendingDown,
  Activity,
  X,
  Check,
  Clock,
  Ruler,
  SlidersHorizontal,
  Gauge as GaugeIcon,
  ArrowUpRight,
  BellOff,
} from "lucide-react";
import * as d from "@/data/alerts";
import { TorqueTrendChart } from "./_components/TorqueTrendChart";
import { AlertHistoryChart } from "./_components/AlertHistoryChart";

const kpiIcon: Record<string, React.ReactNode> = {
  octagon: <AlertOctagon size={18} />,
  triangle: <AlertTriangle size={18} />,
  info: <Info size={18} />,
  check: <CheckCircle size={18} />,
};
const kpiSubColor: Record<string, string> = {
  high: "text-high",
  medium: "text-medium",
  low: "text-low",
  grey: "text-muted",
};

const listIcon: Record<string, React.ReactNode> = {
  triangle: <AlertTriangle size={15} />,
  droplet: <Droplets size={15} />,
  rop: <TrendingDown size={15} />,
  vibration: <Activity size={15} />,
};

const fieldIcon: Record<string, React.ReactNode> = {
  clock: <Clock size={14} />,
  depth: <Ruler size={14} />,
  rig: <RigIcon size={14} />,
  param: <SlidersHorizontal size={14} />,
  value: <GaugeIcon size={14} />,
};


const CAUSES: Record<string, string[]> = {
  stuck_pipe: ["Differential sticking", "Pack-off / hole cleaning", "Mechanical restriction", "High dogleg severity"],
  bit_wear: ["Dull or worn cutting structure", "Rising mechanical specific energy", "Reduced rate of penetration", "Bit balling"],
  stick_slip: ["Torsional drillstring oscillation", "BHA / bit harmonic coupling", "Insufficient / uneven WOB", "Formation heterogeneity"],
  pack_off: ["Cuttings-bed accumulation", "Annular restriction", "Inadequate hole cleaning"],
};
const ACTIONS: Record<string, string[]> = {
  stuck_pipe: ["Reduce weight on bit", "Monitor torque and drag closely", "Work pipe up/down gently", "Prepare for possible back-off"],
  bit_wear: ["Track MSE trend against baseline", "Optimise WOB / RPM", "Plan bit trip if ROP keeps falling", "Review hydraulics"],
  stick_slip: ["Lower WOB, raise RPM to break the cycle", "Engage soft-torque control if available", "Adjust drilling parameters", "Monitor the STICK channel"],
  pack_off: ["Increase flow / circulate bottoms-up", "Reduce ROP to lower cuttings load", "Ream the interval"],
};
function causesFor(m: string) { return { title: "POSSIBLE CAUSES", items: CAUSES[m] ?? CAUSES.stuck_pipe }; }
function actionsFor(m: string) { return { title: "RECOMMENDED ACTIONS", items: ACTIONS[m] ?? ACTIONS.stuck_pipe }; }

function AlertsInner() {
  const replay = useReplay();
  // Under replay the list is REAL: tier up-transitions from ensemble_scores.csv.
  const liveAlerts = replay.dataset
    ? replay.alerts.slice(0, 7).map((a, i) => ({ id: a.id, title: a.title.toUpperCase(), desc: a.desc, time: a.at, sev: a.sev, icon: "triangle" as const, selected: i === 0 }))
    : null;
  const allAlerts: { id: string; title: string; desc: string; time: string; sev: "high" | "medium" | "low"; icon: "triangle" | "droplet" | "rop" | "vibration"; selected?: boolean }[] = liveAlerts ?? d.alerts;
  // Header filter: cycle severity. null = all.
  const [sevFilter, setSevFilter] = useState<null | "high" | "medium" | "low">(null);
  const cycleFilter = () => setSevFilter((f) => (f === null ? "high" : f === "high" ? "medium" : f === "medium" ? "low" : null));
  const alertsToShow = sevFilter ? allAlerts.filter((a) => a.sev === sevFilter) : allAlerts;
  const router = useRouter();
  const params = useSearchParams();
  const incidents = useIncidents();
  const MECH_TYPE: Record<string, string> = { stuck_pipe: "Stuck Pipe", bit_wear: "Bit Wear", stick_slip: "Stick-Slip", pack_off: "Pack-Off" };

  // Selected alert id from the URL (?a=), defaulting to the newest.
  const selId = params.get("a") ?? alertsToShow[0]?.id;
  const selectAlert = (id: string) => router.replace(`/alerts?a=${encodeURIComponent(id)}`, { scroll: false });

  // Live detail derived from the selected replay alert; else the fixture.
  const liveSel = replay.dataset ? replay.alerts.find((a) => a.id === selId) : undefined;
  const detail = liveSel
    ? {
        cardTitle: "ALERT DETAILS", sev: liveSel.sev,
        title: liveSel.title, desc: liveSel.desc, badge: `${liveSel.tier.toUpperCase()} RISK`,
        fields: [
          { k: "Detected", v: liveSel.at, icon: "clock" as const },
          { k: replay.dataset!.units.indexLabel, v: replay.fmtIdx(liveSel.idx), icon: "depth" as const },
          { k: "Well", v: replay.dataset!.well, icon: "well" as const },
          { k: "Mechanism", v: MECH_TYPE[replay.dataset!.mechanism] ?? replay.dataset!.mechanism, icon: "param" as const },
          { k: "Monitors", v: (replay.current?.active ?? "").split("|").join(" + "), icon: "rig" as const },
          { k: "Label tier", v: replay.dataset!.labelTier, icon: "value" as const },
        ],
        trend: d.detail.trend,
        causes: causesFor(replay.dataset!.mechanism),
        actions: actionsFor(replay.dataset!.mechanism),
        footer: {
          alertId: { label: "Alert ID", value: liveSel.id },
          status: { label: "Status", value: liveSel.acknowledged ? "Acknowledged" : "Active" },
          acknowledgedBy: { label: "Acknowledged By", value: liveSel.acknowledged ? "Drilling Engineer" : "—" },
          button: liveSel.acknowledged ? "Acknowledged" : "Acknowledge Alert",
        },
      }
    : d.detail;
  const detailTrend = d.trendData;
  const escalate = async () => {
    if (!liveSel) return;
    const inc = await incidents.createFromAlert(liveSel, {
      well: replay.dataset!.well, type: MECH_TYPE[replay.dataset!.mechanism] ?? replay.dataset!.mechanism,
      params: [
        { label: "Detected", value: liveSel.at },
        { label: replay.dataset!.units.indexLabel, value: replay.fmtIdx(liveSel.idx) },
        { label: "Fused risk", value: String(Math.round(replay.current?.risk ?? 0)) },
      ],
    });
    router.push(`/incidents/view?id=${inc.id}`);
  };
  const liveCounts = replay.dataset ? {
    high: replay.alerts.filter((a) => a.sev === "high").length,
    medium: replay.alerts.filter((a) => a.sev === "medium").length,
    low: replay.alerts.filter((a) => a.sev === "low").length,
    ack: replay.alerts.filter((a) => a.acknowledged).length,
  } : null;
  return (
    <>
      <PageHeader
        title={d.header.title}
        subtitle={d.header.subtitle}
        rigLabel={d.header.rigLabel}
        rangeLabel={d.header.rangeLabel}
        bellCount={d.header.bellCount}
        action={
          <Button icon={<Filter size={16} />} onClick={cycleFilter}>
            {sevFilter ? `${sevFilter[0].toUpperCase()}${sevFilter.slice(1)} only` : d.header.action}
          </Button>
        }
      />
      <ReplayBar />

      <div className="space-y-4 p-5">
        {/* ---- Row 1: KPI cards --------------------------------------- */}
        <div className="grid grid-cols-4 gap-4">
          {d.kpis.map((k, ki) => (
            <Card key={k.title}>
              <div className="flex items-start gap-4">
                <IconTile sev={k.sev} size={36}>
                  {kpiIcon[k.icon]}
                </IconTile>
                <div>
                  <div className="text-[14px] font-medium text-text-2">{k.title}</div>
                  <div className="mt-1 text-[30px] font-extrabold leading-none tnum">{liveCounts ? [liveCounts.high, liveCounts.medium, liveCounts.low, liveCounts.ack][ki] : k.value}</div>
                  <div className={clsx("mt-2 text-[12px] font-medium", kpiSubColor[k.sev])}>{k.sub}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* ---- Row 2: Alerts list / Alert details --------------------- */}
        <div className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.5fr)] gap-4">
          {/* Alerts list */}
          <Card className="flex flex-col">
            <CardTitle right={<InlineSelect label={d.list.sortLabel} value={d.list.sortValue} boxed={false} />}>
              {d.list.title}
            </CardTitle>
            <div className="space-y-2.5">
              {replay.loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Skeleton w={32} h={32} rounded="rounded-full" />
                    <div className="flex-1 space-y-2"><Skeleton w={140} h={11} /><Skeleton w={200} h={10} /></div>
                  </div>
                ))
              ) : liveAlerts && liveAlerts.length === 0 ? (
                <EmptyState compact icon={<BellOff size={24} />} title="No alerts yet"
                  desc="The well is drilling within normal range. Alerts appear here as the replay advances." />
              ) : (
              alertsToShow.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => selectAlert(a.id)}
                  className={clsx(
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                    a.id === selId
                      ? "border-high bg-high-soft"
                      : "border-border bg-surface-2 hover:bg-surface"
                  )}
                >
                  <IconTile sev={a.sev} size={32}>
                    {listIcon[a.icon]}
                  </IconTile>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold uppercase tracking-wide text-text">{a.title}</div>
                    <div className="mt-1 text-[12px] text-text-2">{a.desc}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-[11px] text-muted">{a.time}</span>
                    <Badge sev={a.sev}>{a.sev}</Badge>
                  </div>
                </button>
              )))}
            </div>
            <div className="mt-auto pt-3">
              <Pager text={liveAlerts ? `Showing ${Math.min(7, replay.alerts.length)} of ${replay.alerts.length} replay alerts` : d.list.footer} pages={d.list.pages} />
            </div>
          </Card>

          {/* Alert details */}
          <Card className="flex flex-col">
            <CardTitle
              right={
                <button type="button" aria-label="Close" className="text-text-2">
                  <X size={18} />
                </button>
              }
            >
              {detail.cardTitle}
            </CardTitle>

            <div className="overflow-hidden rounded-xl border border-border">
              {/* red header block */}
              <div className="flex items-center gap-4 bg-high-soft px-5 py-4">
                <IconTile sev={detail.sev} size={40}>
                  <AlertTriangle size={18} />
                </IconTile>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold uppercase tracking-wide text-text">{detail.title}</div>
                  <div className="mt-1 text-[12px] text-text-2">{detail.desc}</div>
                </div>
                <Badge sev={detail.sev} solid size="md">
                  {detail.badge}
                </Badge>
              </div>

              {/* key / value grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-border px-5 py-5">
                {detail.fields.map((f) => (
                  <div key={f.k} className="flex items-center gap-3 text-[12px]">
                    <span className="text-muted">{fieldIcon[f.icon]}</span>
                    <span className="w-[92px] shrink-0 text-muted">{f.k}</span>
                    <span className="font-semibold text-text">{f.v}</span>
                  </div>
                ))}
              </div>

              {/* trend */}
              <div className="border-b border-border px-5 pt-4 pb-3">
                <CardTitle sub={detail.trend.sub} className="mb-2">
                  {detail.trend.title}
                </CardTitle>
                <TorqueTrendChart
                  data={detailTrend}
                  xTicks={detail.trend.xTicks}
                  yDomain={detail.trend.yDomain}
                  yTicks={detail.trend.yTicks}
                  unit={detail.trend.unit}
                />
              </div>

              {/* causes / actions */}
              <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] px-5 py-4">
                <div className="pr-4">
                  <h4 className="section-label">{detail.causes.title}</h4>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-[12px] text-text-2">
                    {detail.causes.items.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div className="border-l border-border pl-5">
                  <h4 className="section-label">{detail.actions.title}</h4>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-[12px] text-text-2">
                    {detail.actions.items.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            {/* footer */}
            <div className="mt-auto flex items-center justify-between pt-4 text-[12px]">
              <div className="flex items-start gap-10">
                <div>
                  <div className="text-muted">{detail.footer.alertId.label}</div>
                  <div className="mt-1 font-semibold text-text">{detail.footer.alertId.value}</div>
                </div>
                <div>
                  <div className="text-muted">{detail.footer.status.label}</div>
                  <div className="mt-1 flex items-center gap-1.5 font-semibold text-text">
                    <Dot sev={detail.sev} size={9} />
                    {detail.footer.status.value}
                  </div>
                </div>
                <div>
                  <div className="text-muted">{detail.footer.acknowledgedBy.label}</div>
                  <div className="mt-1 font-semibold text-text">{detail.footer.acknowledgedBy.value}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {liveSel && !liveSel.acknowledged && (
                  <Button variant="outline" icon={<ArrowUpRight size={16} />} onClick={escalate}>Escalate to Incident</Button>
                )}
                <Button icon={<Check size={16} />} onClick={() => liveSel && replay.acknowledge(liveSel.id)}>{detail.footer.button}</Button>
              </div>
            </div>
          </Card>
        </div>

        {/* ---- Row 3: History / Distribution -------------------------- */}
        <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)] gap-4">
          <Card>
            <CardTitle>{d.history.title}</CardTitle>
            <AlertHistoryChart
              data={d.history.data}
              legend={d.history.legend}
              yLabel={d.history.yLabel}
              yDomain={d.history.yDomain}
              yTicks={d.history.yTicks}
            />
          </Card>

          <Card>
            <CardTitle sub={d.distribution.sub}>{d.distribution.title}</CardTitle>
            <div className="flex items-center justify-around gap-6 pt-1">
              <Donut
                slices={d.distribution.slices.map((s) => ({ value: s.value, color: s.color }))}
                size={150}
                thickness={20}
                center={d.distribution.total}
                sub={d.distribution.totalLabel}
              />
              <DotLegend
                className="w-[150px] space-y-5 text-[12px]"
                items={d.distribution.slices.map((s) => ({
                  label: s.label,
                  color: s.color,
                  value: `${s.value} (${s.pct})`,
                }))}
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function AlertsPage() {
  return (
    <Suspense fallback={null}>
      <AlertsInner />
    </Suspense>
  );
}
