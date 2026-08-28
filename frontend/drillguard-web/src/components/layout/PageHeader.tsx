"use client";

import { useState } from "react";
import { ChevronDown, Clock, Calendar, HelpCircle, Check } from "lucide-react";
import { RigIcon } from "@/components/ui/icons";
import { NotificationBell } from "./NotificationBell";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useReplay } from "@/lib/replay/ReplayProvider";
import clsx from "clsx";

/** Pill dropdown used in headers: [icon] Label [chevron] */
export function HeaderSelect({
  icon,
  label,
  className,
}: {
  icon: "rig" | "clock" | "calendar";
  label: string;
  className?: string;
}) {
  const Icon =
    icon === "rig" ? RigIcon : icon === "clock" ? Clock : Calendar;
  return (
    <button
      type="button"
      className={clsx(
        "flex h-11 items-center gap-2.5 rounded-lg border border-border bg-surface px-4 text-[14px] font-medium text-text shadow-[var(--shadow)]",
        className
      )}
    >
      <Icon size={18} className="text-text-2" />
      <span>{label}</span>
      <ChevronDown size={16} className="ml-1 text-muted" />
    </button>
  );
}

/** Rig pill that actually switches the loaded well: lists the replay catalog. */
function WellPicker({ label }: { label: string }) {
  const replay = useReplay();
  const [open, setOpen] = useState(false);
  const mech = (m: string) => m.replace(/_/g, " ");
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 items-center gap-2.5 rounded-lg border border-border bg-surface px-4 text-[14px] font-medium text-text shadow-[var(--shadow)]"
      >
        <RigIcon size={18} className="text-text-2" />
        <span>{label}</span>
        <ChevronDown size={16} className={clsx("ml-1 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close well picker"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
            <p className="border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Load a well · real field data
            </p>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {replay.catalog.map((ds) => {
                const active = replay.dataset?.id === ds.id;
                return (
                  <button
                    key={ds.id}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      void replay.select(ds.id);
                    }}
                    className={clsx(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-2",
                      active && "bg-primary-soft"
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-text">{ds.name}</span>
                      <span className="block truncate text-[12px] text-muted">
                        {ds.well} · {mech(ds.mechanism)}
                        {ds.anchors.length > 0 && " · documented event"}
                      </span>
                    </span>
                    {active && <Check size={16} className="shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  rigLabel,
  rangeLabel,
  rangeIcon = "clock",
  bellCount,
  action,
  beforeBell,
  showHelp = false,
  userChip = false,
}: {
  title: string;
  subtitle: string;
  rigLabel?: string;
  rangeLabel?: string;
  rangeIcon?: "clock" | "calendar";
  bellCount?: number;
  action?: React.ReactNode;
  /** extra controls rendered after the range select and before the bell */
  beforeBell?: React.ReactNode;
  showHelp?: boolean;
  userChip?: boolean;
}) {
  const { user } = useAuth();
  const replay = useReplay();
  const chip = user ?? { initials: "DE", name: "Drilling Engineer", team: "Drilling Team" };
  // Reflect the loaded replay well so the header never contradicts the sidebar.
  const effectiveRig = replay.dataset ? replay.dataset.well : rigLabel;
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border px-7 pt-6 pb-5">
      <div className="shrink-0">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
        <p className="mt-1 text-[15px] text-muted">{subtitle}</p>
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
        {effectiveRig && <WellPicker label={effectiveRig} />}
        {rangeLabel && <HeaderSelect icon={rangeIcon} label={rangeLabel} />}
        {beforeBell}
        {showHelp && (
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-surface"
          >
            <HelpCircle size={18} className="text-text-2" />
          </button>
        )}
        {bellCount !== undefined && (
          <div className="mx-1">
            <NotificationBell fallbackCount={bellCount} />
          </div>
        )}
        {userChip && (
          <button type="button" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-[13px] font-bold text-primary">
              {chip.initials}
            </span>
            <span className="text-left leading-tight">
              <span className="block text-[13px] font-semibold">{chip.name}</span>
              <span className="block text-[12px] text-muted">{chip.team}</span>
            </span>
            <ChevronDown size={16} className="text-muted" />
          </button>
        )}
        {action}
      </div>
    </div>
  );
}
