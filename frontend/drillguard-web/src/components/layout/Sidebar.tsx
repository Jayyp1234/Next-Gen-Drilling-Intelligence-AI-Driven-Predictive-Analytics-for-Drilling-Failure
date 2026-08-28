"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Activity,
  Bell,
  AlertTriangle,
  Database,
  BarChart3,
  FileText,
  Leaf,
  Settings,
  ChevronDown,
  ArrowRight,
  Plus,
  CheckCircle2,
  Cpu,
  MessagesSquare,
} from "lucide-react";
import clsx from "clsx";
import { Logo } from "./Logo";
import { selection, systemStatus, user as fallbackUser } from "@/data/shell";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useReplay } from "@/lib/replay/ReplayProvider";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/live-monitoring", label: "Live Monitoring", icon: Activity },
  { href: "/analyze", label: "Analyze Well", icon: Cpu },
  { href: "/alerts", label: "Alerts", icon: Bell, badge: 6 },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/messages", label: "Crew Channel", icon: MessagesSquare },
  { href: "/well-history", label: "Well History", icon: Database },
  { href: "/performance", label: "Performance", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/sustainability", label: "Sustainability", icon: Leaf },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Small "label over value" select, as drawn in the ACTIVE SELECTION card. */
function MiniSelect({ label, value }: { label: string; value: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between rounded-lg border border-sidebar-border bg-sidebar-card px-3 py-2 text-left"
    >
      <span>
        <span className="block text-[11px] leading-3 text-sidebar-muted">{label}</span>
        <span className="block text-[13px] font-medium text-sidebar-text">{value}</span>
      </span>
      <ChevronDown size={14} className="text-sidebar-muted" />
    </button>
  );
}

export function Sidebar({
  /** the wizard screens replace "View Well Details" with "Initialize New Well" */
  wizard = false,
}: {
  wizard?: boolean;
}) {
  const path = usePathname();
  const { user: authUser, signOut } = useAuth();
  const router = useRouter();
  const replay = useReplay();
  const [menu, setMenu] = useState(false);

  // When a replay dataset is loaded, the active selection reflects THAT well —
  // so the sidebar never contradicts what is actually playing.
  const ds = replay.dataset;
  const selRigLabel = ds ? "Field" : "Rig";
  const selRigValue = ds ? ds.field : selection.rig;
  const selWellValue = wizard ? "No Well Selected" : ds ? ds.well : selection.well;
  const selDepthValue = ds && replay.current ? replay.fmtIdx(replay.current.idx) : selection.depth;
  const u = authUser ?? fallbackUser;
  return (
    <aside className="sticky top-0 hidden h-screen w-[216px] shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar text-sidebar-text scroll-thin lg:flex">
      <div className="px-4 pt-4 pb-3">
        <Logo />
      </div>

      <nav className="px-3">
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "mb-1 flex items-center gap-3 rounded-lg px-3 py-[9px] text-[14px] font-medium transition-colors",
                active
                  ? "bg-sidebar-active text-sidebar-active-text"
                  : "text-sidebar-text hover:bg-sidebar-card"
              )}
              data-active={active}
            >
              <Icon size={18} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {badge ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-high px-1 text-[11px] font-bold text-white">
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* ACTIVE SELECTION / WELL SELECTOR */}
      <div className="mx-3 mt-3 rounded-xl border border-sidebar-border bg-sidebar-card/60 p-3">
        <div className="mb-2 text-[11px] font-bold tracking-wide text-sidebar-text">
          {wizard ? "ACTIVE SELECTION" : selection.cardTitle}
        </div>
        <div className="space-y-2">
          <MiniSelect label={selRigLabel} value={selRigValue} />
          <MiniSelect label="Well" value={selWellValue} />
          {!wizard && selDepthValue ? (
            <MiniSelect label={ds ? ds.units.indexLabel : "Depth (TVD)"} value={selDepthValue} />
          ) : null}
        </div>
        <Link
          href={wizard ? "/initialize/run-mode" : "/well-history"}
          className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-card px-3 py-2 text-[13px] font-medium text-primary"
        >
          {wizard ? (
            <>
              <Plus size={14} /> Initialize New Well
            </>
          ) : (
            <>
              View Well Details <ArrowRight size={14} />
            </>
          )}
        </Link>
      </div>

      {/* user card + sign-out menu */}
      <div className="relative mx-3 mt-3">
        <button type="button" onClick={() => setMenu((m) => !m)} className="flex w-full items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-card/60 px-3 py-3 text-left">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-[12px] font-bold text-primary">
            {u.initials}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[12.5px] font-semibold">{u.name}</div>
            <div className="truncate text-[11.5px] text-sidebar-muted">{u.team}</div>
          </div>
          <ChevronDown size={16} className="text-sidebar-muted" />
        </button>
        {menu && (
          <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-lg border border-sidebar-border bg-sidebar-card shadow-lg">
            <div className="border-b border-sidebar-border px-3 py-2 text-[11px] text-sidebar-muted">{("email" in u ? u.email : "")}</div>
            <button type="button" onClick={() => { setMenu(false); signOut(); router.replace("/login"); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-high hover:bg-sidebar-bg/40">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </div>

      {/* system status */}
      <div className="mx-3 mt-auto mb-4 rounded-xl border border-sidebar-border bg-sidebar-card/60 p-3">
        <div className="mb-2 text-[11px] font-bold tracking-wide">SYSTEM STATUS</div>
        <div className="flex items-center gap-2 whitespace-nowrap text-[12.5px] font-medium text-good">
          <CheckCircle2 size={15} className="fill-good text-sidebar" />
          {systemStatus.label}
        </div>
        <div className="mt-2 text-[12px] text-sidebar-muted">
          Last update: {systemStatus.lastUpdate}
        </div>
      </div>
    </aside>
  );
}
