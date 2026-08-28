"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, AlertOctagon, AlertTriangle, Info, AreaChart, CheckCheck } from "lucide-react";
import clsx from "clsx";
import { useReplay } from "@/lib/replay/ReplayProvider";
import { useIncidents } from "@/lib/incidents/store";

type Sev = "high" | "medium" | "low";
type Note = {
  key: string; kind: "alert" | "incident"; sev: Sev; title: string; desc: string;
  time: string; order: number; read: boolean; href: string;
};

const sevTile: Record<Sev, string> = {
  high: "bg-high text-white", medium: "bg-medium text-white", low: "bg-low text-white",
};
const sevIcon: Record<Sev, React.ReactNode> = {
  high: <AlertOctagon size={15} />, medium: <AlertTriangle size={15} />, low: <Info size={15} />,
};

/**
 * Live notifications popover. Replaces the static header bell: the badge and
 * the list are derived from the replay alert stream + the incident store, so
 * every entry is a real event (a tier crossing, an escalation, a resolution).
 */
export function NotificationBell({ fallbackCount }: { fallbackCount?: number }) {
  const replay = useReplay();
  const incidents = useIncidents();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const notes = useMemo<Note[]>(() => {
    if (!replay.dataset) return [];
    const fromAlerts: Note[] = replay.alerts.map((a) => ({
      key: `a-${a.id}`, kind: "alert", sev: a.sev, title: a.title, desc: a.desc, time: a.at,
      order: a.idx, read: a.acknowledged || seen.has(`a-${a.id}`), href: `/alerts?a=${encodeURIComponent(a.id)}`,
    }));
    const fromInc: Note[] = incidents.incidents
      .filter((i) => i.source !== "documented")
      .map((i) => ({
        key: `i-${i.id}`, kind: "incident", sev: i.sev,
        title: i.status === "Resolved" ? `Incident resolved · ${i.id}` : `Incident opened · ${i.id}`,
        desc: i.title, time: i.detected, order: i.createdAt / 1e9,
        read: seen.has(`i-${i.id}`), href: `/incidents/view?id=${i.id}`,
      }));
    return [...fromAlerts, ...fromInc].sort((a, b) => b.order - a.order).slice(0, 20);
  }, [replay.dataset, replay.alerts, incidents.incidents, seen]);

  const unread = notes.filter((n) => !n.read).length;
  const badge = replay.dataset ? unread : fallbackCount ?? 0;

  const go = (n: Note) => { setSeen((p) => new Set([...p, n.key])); setOpen(false); router.push(n.href); };
  const markAll = () => {
    setSeen((p) => new Set([...p, ...notes.map((n) => n.key)]));
    replay.acknowledge();
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="relative grid h-11 w-10 place-items-center" aria-label="Notifications">
        <Bell size={22} className="text-text-2" />
        {badge > 0 && (
          <span className="absolute -top-0.5 right-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-high px-1 text-[11px] font-bold text-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[52px] z-50 w-[360px] overflow-hidden rounded-xl border border-border bg-surface shadow-[0_8px_30px_rgba(15,23,42,0.12)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="text-[14px] font-semibold">Notifications</div>
            <div className="flex items-center gap-3 text-[12px]">
              {unread > 0 && <span className="rounded-full bg-high-soft px-2 py-0.5 font-semibold text-high">{unread} new</span>}
              <button type="button" onClick={markAll} className="inline-flex items-center gap-1 font-medium text-primary">
                <CheckCheck size={13} /> Mark all read
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto scroll-thin">
            {!replay.dataset ? (
              <div className="px-4 py-10 text-center text-[13px] text-muted">
                No live monitoring active.<br />Start a dataset to receive notifications.
              </div>
            ) : notes.length === 0 ? (
              <div className="px-4 py-10 text-center text-[13px] text-muted">
                No notifications yet — the well is drilling within normal range.
              </div>
            ) : (
              notes.map((n) => (
                <button key={n.key} type="button" onClick={() => go(n)}
                  className={clsx("flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-surface-2", !n.read && "bg-primary-soft/40")}>
                  <span className={clsx("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full", n.kind === "incident" ? "bg-primary text-white" : sevTile[n.sev])}>
                    {n.kind === "incident" ? <AreaChart size={15} /> : sevIcon[n.sev]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-text">{n.title}</span>
                    <span className="mt-0.5 block truncate text-[12px] text-muted">{n.desc}</span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-[11px] text-muted">{n.time}</span>
                </button>
              ))
            )}
          </div>

          <button type="button" onClick={() => { setOpen(false); router.push("/alerts"); }}
            className="block w-full border-t border-border py-2.5 text-center text-[13px] font-medium text-primary">
            View all alerts
          </button>
        </div>
      )}
    </div>
  );
}
