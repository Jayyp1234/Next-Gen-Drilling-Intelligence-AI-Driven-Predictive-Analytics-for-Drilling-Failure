"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutGrid, Activity, Bell, AlertTriangle, Database, BarChart3,
  FileText, Leaf, Settings, Menu, X, LogOut, ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useReplay } from "@/lib/replay/ReplayProvider";
import { user as fallbackUser } from "@/data/shell";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/live-monitoring", label: "Live Monitoring", icon: Activity },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/well-history", label: "Well History", icon: Database },
  { href: "/performance", label: "Performance", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/sustainability", label: "Sustainability", icon: Leaf },
  { href: "/settings", label: "Settings", icon: Settings },
];
// Primary bottom-bar destinations (the rest live behind "More").
const TABS = [
  { href: "/live-monitoring", label: "Live", icon: Activity },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/well-history", label: "History", icon: Database },
];

/** Mobile-only app shell: top bar + bottom tab bar + slide-in drawer (hidden on lg+). */
export function MobileNav() {
  const path = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const replay = useReplay();
  const [open, setOpen] = useState(false);
  const u = user ?? fallbackUser;
  const ds = replay.dataset;

  return (
    <>
      {/* ---- Top bar ---- */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="grid h-9 w-9 place-items-center rounded-lg text-text-2">
          <Menu size={20} />
        </button>
        <Logo />
        <NotificationBell fallbackCount={6} />
      </header>

      {/* ---- Bottom tab bar ---- */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href);
          return (
            <Link key={href} href={href} className={clsx("flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium", active ? "text-primary" : "text-muted")}>
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
        <button type="button" onClick={() => setOpen(true)} className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted">
          <Menu size={20} />
          More
        </button>
      </nav>

      {/* ---- Drawer ---- */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/50" />
          <div data-sidebar="navy" className="absolute inset-y-0 left-0 flex w-[82%] max-w-[320px] flex-col overflow-y-auto bg-sidebar text-sidebar-text">
            <div className="flex items-center justify-between px-4 py-4">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-lg text-sidebar-muted">
                <X size={20} />
              </button>
            </div>

            {ds && (
              <div className="mx-3 mb-3 rounded-xl border border-sidebar-border bg-sidebar-card/60 p-3 text-[12px]">
                <div className="text-sidebar-muted">{ds.field}</div>
                <div className="text-[15px] font-semibold text-sidebar-text">{ds.well}</div>
                <div className="mt-0.5 text-sidebar-muted">
                  {replay.current ? `${ds.units.indexLabel} ${replay.fmtIdx(replay.current.idx)}` : ds.labelTier}
                </div>
              </div>
            )}

            <nav className="flex-1 px-3">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = path.startsWith(href);
                return (
                  <Link key={href} href={href} onClick={() => setOpen(false)}
                    className={clsx("mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium", active ? "bg-sidebar-active text-sidebar-active-text" : "text-sidebar-text hover:bg-sidebar-card")}>
                    <Icon size={19} className="shrink-0" />
                    <span className="flex-1">{label}</span>
                    {active && <ChevronRight size={16} />}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-sidebar-border p-3">
              <div className="mb-2 flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-[13px] font-bold text-primary">{u.initials}</div>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-[13px] font-semibold">{u.name}</div>
                  <div className="truncate text-[12px] text-sidebar-muted">{u.team}</div>
                </div>
              </div>
              <button type="button" onClick={() => { setOpen(false); signOut(); router.replace("/login"); }}
                className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border px-3 py-2.5 text-[14px] font-medium text-high">
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
