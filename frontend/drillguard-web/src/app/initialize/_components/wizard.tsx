"use client";

import Link from "next/link";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, ChevronDown, Play, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Stepper } from "./Stepper";
import { headerTitle } from "@/data/wizard";

/** Page header (well select + date/time, help, user chip — no bell/action) + stepper. */
export function WizardTop({
  current,
  subtitle,
  rigLabel,
  rangeLabel,
}: {
  current: 1 | 2 | 3 | 4 | 5;
  subtitle: string;
  rigLabel: string;
  rangeLabel: string;
}) {
  return (
    <>
      <PageHeader
        title={headerTitle}
        subtitle={subtitle}
        rigLabel={rigLabel}
        rangeLabel={rangeLabel}
        rangeIcon="calendar"
        showHelp
        userChip
      />
      <Stepper current={current} />
    </>
  );
}

/** Section heading under the stepper: "How would you like to run this well?" + sub. */
export function StepHeading({ children, sub }: { children: React.ReactNode; sub: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[20px] font-semibold leading-tight">{children}</h2>
      <p className="mt-1 text-[13px] text-muted">{sub}</p>
    </div>
  );
}

/** Bottom "← Back to …" outline link + primary "… →" link. */
export function WizardNav({
  backHref,
  backLabel,
  nextHref,
  nextLabel,
  nextIcon = "arrow",
  onNext,
}: {
  backHref: string;
  backLabel: string;
  nextHref: string;
  nextLabel: string;
  nextIcon?: "arrow" | "play";
  /** optional side effect before navigating (e.g. start the replay) */
  onNext?: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-border pt-4">
      <Link
        href={backHref}
        className="inline-flex h-11 items-center gap-3 rounded-lg border border-border bg-surface px-5 text-[14px] font-medium text-primary hover:bg-primary-soft"
      >
        <ArrowLeft size={16} /> {backLabel}
      </Link>
      <Link
        href={nextHref}
        onClick={onNext}
        className="inline-flex h-11 items-center gap-3 rounded-lg bg-primary px-5 text-[14px] font-semibold text-white hover:bg-primary-hover"
      >
        {nextLabel}
        {nextIcon === "play" ? <Play size={14} fill="currentColor" /> : <ArrowRight size={16} />}
      </Link>
    </div>
  );
}

/** Static bordered input box with a small label (Hole Size / Mud Weight etc). */
export function InputBox({
  label,
  value,
  className,
  suffix,
}: {
  label?: string;
  value: string;
  className?: string;
  suffix?: string;
}) {
  return (
    <label className={clsx("block", className)}>
      {label && <span className="mb-1.5 block whitespace-nowrap text-[12px] font-medium text-text-2">{label}</span>}
      <span className="flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-2.5 text-[13px]">
        <span className="flex-1 truncate">{value}</span>
        {suffix && <span className="text-muted">{suffix}</span>}
      </span>
    </label>
  );
}

/** Compact static select shell (13px) for the dense configuration cards. */
export function SelectBox({ label, value, className }: { label?: string; value: string; className?: string }) {
  return (
    <label className={clsx("block", className)}>
      {label && <span className="mb-1.5 block whitespace-nowrap text-[12px] font-medium text-text-2">{label}</span>}
      <span className="flex h-9 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-[13px]">
        <span className="flex-1 truncate">{value}</span>
        <ChevronDown size={14} className="shrink-0 text-muted" />
      </span>
    </label>
  );
}

/** "Min – Max" pair of input boxes under one label. */
export function RangePair({ label, min, max }: { label: string; min: string; max: string }) {
  return (
    <div>
      <span className="mb-1.5 block text-[12.5px] font-medium text-text-2">{label}</span>
      <div className="flex items-center gap-3">
        <span className="flex h-9 flex-1 items-center rounded-lg border border-border bg-surface px-3 text-[13px]">{min}</span>
        <span className="text-muted">–</span>
        <span className="flex h-9 flex-1 items-center rounded-lg border border-border bg-surface px-3 text-[13px]">{max}</span>
      </div>
    </div>
  );
}

/** Search box with trailing magnifier. */
export function SearchBox({ placeholder, className }: { placeholder: string; className?: string }) {
  return (
    <label
      className={clsx(
        "flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[13px]",
        className
      )}
    >
      <input
        type="text"
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted"
      />
      <Search size={15} className="shrink-0 text-muted" />
    </label>
  );
}

/** Sub-section heading inside a card: "General Information". */
export function SubHeading({ children, suffix }: { children: React.ReactNode; suffix?: string }) {
  return (
    <h3 className="mb-3 text-[15px] font-semibold">
      {children}
      {suffix && <span className="ml-1 whitespace-nowrap text-[13px] font-normal text-text-2">{suffix}</span>}
    </h3>
  );
}

/** Search icon re-export used by step pages. */
export { Search };

/** Two-column summary row as drawn in the Well/Configuration Summary cards: label left, value left-aligned in 2nd column. */
export function SummaryKV({
  k,
  v,
  labelWidth = 120,
  className,
}: {
  k: string;
  v: React.ReactNode;
  labelWidth?: number;
  className?: string;
}) {
  return (
    <div
      className={clsx("grid items-start gap-2 py-2 text-[13px]", className)}
      style={{ gridTemplateColumns: `${labelWidth}px 1fr` }}
    >
      <span className="whitespace-nowrap text-text-2">{k}</span>
      <span className="font-semibold text-text">{v}</span>
    </div>
  );
}
