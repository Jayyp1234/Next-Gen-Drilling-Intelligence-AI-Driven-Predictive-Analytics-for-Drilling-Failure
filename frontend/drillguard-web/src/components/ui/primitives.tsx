"use client";

import clsx from "clsx";
import Link from "next/link";
import { ArrowRight, ChevronDown, Check, Info } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Card + titles                                                        */
/* ------------------------------------------------------------------ */
export function Card({
  className,
  children,
  padded = true,
}: {
  className?: string;
  children: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <section className={clsx("card", padded && "p-5", className)}>{children}</section>
  );
}

/** "SECTION LABEL" row with optional right slot (legend, "View all", select). */
export function CardTitle({
  children,
  right,
  info,
  className,
  sub,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  info?: boolean;
  className?: string;
  sub?: string;
}) {
  return (
    <div className={clsx("mb-4 flex items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-2">
        <h3 className="section-label">{children}</h3>
        {sub && <span className="text-[12px] font-normal text-muted">{sub}</span>}
        {info && <Info size={14} className="text-muted-2" />}
      </div>
      {right}
    </div>
  );
}

/** Sentence-case card heading with description (Reports / Settings style). */
export function CardHeading({
  title,
  description,
  icon,
  right,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon && <span className="mt-0.5 text-primary">{icon}</span>}
        <div>
          <h3 className="text-[16px] font-semibold">{title}</h3>
          {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

/** "View Well Details →" blue link, centred or inline. */
export function ArrowLink({
  href = "#",
  children,
  center = false,
  boxed = false,
  className,
}: {
  href?: string;
  children: React.ReactNode;
  center?: boolean;
  boxed?: boolean;
  className?: string;
}) {
  const cls = clsx(
    "inline-flex items-center gap-2 text-[13px] font-medium text-primary",
    center && "w-full justify-center",
    boxed && "rounded-lg border border-border px-4 py-2.5",
    className
  );
  // No real destination yet → render a non-navigating label (avoids a dead "#" link).
  if (!href || href === "#") {
    return <span className={clsx(cls, "cursor-default")}>{children} <ArrowRight size={14} /></span>;
  }
  return (
    <Link href={href} className={cls}>
      {children} <ArrowRight size={14} />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons + selects                                                    */
/* ------------------------------------------------------------------ */
export function Button({
  variant = "primary",
  icon,
  children,
  className,
  size = "md",
  onClick,
}: {
  variant?: "primary" | "navy" | "outline" | "ghost" | "green" | "primary-soft";
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors",
        size === "sm" && "h-8 px-3 text-[12px]",
        size === "md" && "h-11 px-5 text-[14px]",
        size === "lg" && "h-12 px-6 text-[15px]",
        variant === "primary" && "bg-primary text-white hover:bg-primary-hover",
        variant === "navy" && "bg-navy-btn text-white",
        variant === "green" && "bg-[#15803d] text-white",
        variant === "outline" &&
          "border border-border bg-surface text-primary hover:bg-primary-soft",
        variant === "primary-soft" && "border border-primary/30 bg-surface text-primary",
        variant === "ghost" && "text-primary",
        className
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/** Labelled form select / input shell (static, design-faithful). */
export function Field({
  label,
  value,
  required,
  select = true,
  suffix,
  className,
  icon,
}: {
  label: string;
  value: string;
  required?: boolean;
  select?: boolean;
  suffix?: string;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className={clsx("block", className)}>
      <span className="mb-1.5 block text-[13px] font-medium text-text-2">
        {label}
        {required && <span className="ml-0.5 text-high">*</span>}
      </span>
      <span className="flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[14px]">
        {icon}
        <span className="flex-1 truncate">{value}</span>
        {suffix && <span className="text-muted">{suffix}</span>}
        {select && <ChevronDown size={16} className="text-muted" />}
      </span>
    </label>
  );
}

/** Inline pill select "Sort by: Newest ▾" / "Severity: All ▾" */
export function InlineSelect({
  label,
  value,
  boxed = true,
}: {
  label?: string;
  value: string;
  boxed?: boolean;
}) {
  return (
    <button
      type="button"
      className={clsx(
        "inline-flex h-9 items-center gap-1.5 text-[13px]",
        boxed ? "rounded-lg border border-border bg-surface px-3" : "px-1"
      )}
    >
      {label && <span className="text-muted">{label}</span>}
      <span className="font-medium">{value}</span>
      <ChevronDown size={14} className="text-muted" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Badges                                                               */
/* ------------------------------------------------------------------ */
export type Severity = "high" | "medium" | "low" | "good" | "info" | "purple" | "grey";

const SEV: Record<Severity, string> = {
  high: "bg-high-soft text-high",
  medium: "bg-medium-soft text-medium",
  low: "bg-low-soft text-low",
  good: "bg-good-soft text-good",
  info: "bg-primary-soft text-primary",
  purple: "bg-purple-soft text-purple",
  grey: "bg-surface-2 text-muted",
};

export function Badge({
  sev = "info",
  children,
  solid = false,
  className,
  size = "sm",
}: {
  sev?: Severity;
  children: React.ReactNode;
  solid?: boolean;
  className?: string;
  size?: "xs" | "sm" | "md";
}) {
  const solidCls: Record<Severity, string> = {
    high: "bg-high text-white",
    medium: "bg-medium text-white",
    low: "bg-low text-white",
    good: "bg-good text-white",
    info: "bg-primary text-white",
    purple: "bg-purple text-white",
    grey: "bg-muted text-white",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md font-semibold uppercase tracking-wide",
        size === "xs" && "px-1.5 py-0.5 text-[10px]",
        size === "sm" && "px-2 py-0.5 text-[11px]",
        size === "md" && "px-2.5 py-1 text-[12px]",
        solid ? solidCls[sev] : SEV[sev],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Status chip with sentence case (Open / Resolved / In Progress…) */
export function Chip({
  sev = "info",
  children,
  dot = false,
}: {
  sev?: Severity;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-semibold",
        SEV[sev]
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Coloured status dot (•) */
export function Dot({ sev = "good", size = 8 }: { sev?: Severity; size?: number }) {
  const c: Record<Severity, string> = {
    high: "bg-high",
    medium: "bg-medium",
    low: "bg-low",
    good: "bg-good",
    info: "bg-primary",
    purple: "bg-purple",
    grey: "bg-muted-2",
  };
  return (
    <span
      className={clsx("inline-block shrink-0 rounded-full", c[sev])}
      style={{ width: size, height: size }}
    />
  );
}

/** Round icon tile (alerts / KPI icons) */
export function IconTile({
  sev = "info",
  children,
  size = 36,
  square = false,
}: {
  sev?: Severity;
  children: React.ReactNode;
  size?: number;
  square?: boolean;
}) {
  const solid: Record<Severity, string> = {
    high: "bg-high text-white",
    medium: "bg-medium text-white",
    low: "bg-low text-white",
    good: "bg-good text-white",
    info: "bg-primary text-white",
    purple: "bg-purple text-white",
    grey: "bg-muted text-white",
  };
  return (
    <span
      className={clsx(
        "grid shrink-0 place-items-center",
        square ? "rounded-lg" : "rounded-full",
        solid[sev]
      )}
      style={{ width: size, height: size }}
    >
      {children}
    </span>
  );
}

/** Soft round icon tile (pastel bg, coloured icon) */
export function SoftTile({
  sev = "info",
  children,
  size = 44,
  square = false,
}: {
  sev?: Severity;
  children: React.ReactNode;
  size?: number;
  square?: boolean;
}) {
  return (
    <span
      className={clsx(
        "grid shrink-0 place-items-center",
        square ? "rounded-lg" : "rounded-full",
        SEV[sev]
      )}
      style={{ width: size, height: size }}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs / toggle / checkbox / stepper                                   */
/* ------------------------------------------------------------------ */
export function Tabs({
  items,
  active,
  onChange,
  className,
}: {
  items: string[];
  active: string;
  onChange?: (t: string) => void;
  className?: string;
}) {
  return (
    <div className={clsx("flex gap-8 border-b border-border", className)}>
      {items.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange?.(t)}
          className={clsx(
            "-mb-px border-b-2 pb-3 text-[14px] font-medium transition-colors",
            t === active
              ? "border-primary text-primary"
              : "border-transparent text-text-2 hover:text-text"
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on = true }: { on?: boolean }) {
  return (
    <span
      className={clsx(
        "relative inline-block h-6 w-11 rounded-full transition-colors",
        on ? "bg-primary" : "bg-border-strong"
      )}
    >
      <span
        className={clsx(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
          on ? "left-[22px]" : "left-0.5"
        )}
      />
    </span>
  );
}

export function GreenToggle({ on = true }: { on?: boolean }) {
  return (
    <span
      className={clsx(
        "relative inline-block h-6 w-11 rounded-full",
        on ? "bg-good" : "bg-border-strong"
      )}
    >
      <span
        className={clsx(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow",
          on ? "left-[22px]" : "left-0.5"
        )}
      />
    </span>
  );
}

export function Checkbox({ checked = true, label }: { checked?: boolean; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={clsx(
          "grid h-[18px] w-[18px] place-items-center rounded border",
          checked ? "border-primary bg-primary text-white" : "border-border-strong bg-surface"
        )}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      {label && <span className="text-[14px]">{label}</span>}
    </span>
  );
}

/** Green check in a circle (list bullets / summary lines) */
export function CheckDot({ size = 16, sev = "good" as Severity }) {
  const c: Record<string, string> = {
    good: "bg-good",
    info: "bg-primary",
  };
  return (
    <span
      className={clsx("grid shrink-0 place-items-center rounded-full text-white", c[sev])}
      style={{ width: size, height: size }}
    >
      <Check size={size * 0.62} strokeWidth={3.5} />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Key/value rows (Well Summary, Alert Details)                         */
/* ------------------------------------------------------------------ */
export function KV({
  k,
  v,
  divider = true,
  className,
}: {
  k: string;
  v: React.ReactNode;
  divider?: boolean;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between py-2 text-[13px]",
        divider && "border-b border-border last:border-0",
        className
      )}
    >
      <span className="text-text-2">{k}</span>
      <span className="font-semibold text-text">{v}</span>
    </div>
  );
}

/** Simple HTML table with design header styling */
export function Table({
  head,
  rows,
  className,
  compact = false,
}: {
  head: React.ReactNode[];
  rows: React.ReactNode[][];
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className="overflow-x-auto scroll-thin">
    <table className={clsx("w-full text-left text-[13px]", className)}>
      <thead>
        <tr className="text-[12px] text-muted">
          {head.map((h, i) => (
            <th key={i} className={clsx("whitespace-nowrap pr-2 font-medium last:pr-0", compact ? "pb-2" : "pb-3")}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-border">
            {r.map((c, j) => (
              <td key={j} className={clsx("align-middle whitespace-nowrap pr-2 last:pr-0", compact ? "py-2.5" : "py-3.5")}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

/** "Showing 1 to 7 of 24 alerts" + pager */
export function Pager({ text, pages = [1, 2, 3, 4] }: { text: string; pages?: (number | string)[] }) {
  return (
    <div className="mt-3 flex items-center justify-between text-[12px] text-muted">
      <span>{text}</span>
      <div className="flex items-center gap-1.5">
        {pages.map((p, i) => (
          <span
            key={i}
            className={clsx(
              "grid h-7 min-w-7 place-items-center rounded-md border px-1",
              i === 0 ? "border-primary text-primary" : "border-transparent text-text-2"
            )}
          >
            {p}
          </span>
        ))}
        <span className="grid h-7 w-7 place-items-center text-text-2">›</span>
      </div>
    </div>
  );
}

/** Delta line "▲ 27% vs previous 30 days" */
export function Delta({
  dir,
  value,
  suffix,
  good,
}: {
  dir: "up" | "down";
  value: string;
  suffix?: string;
  /** colour by meaning: good = green, else red */
  good: boolean;
}) {
  return (
    <span className={clsx("inline-flex items-center gap-1 text-[12px]", good ? "text-good" : "text-high")}>
      <span className="text-[10px]">{dir === "up" ? "▲" : "▼"}</span>
      <span className="font-semibold">{value}</span>
      {suffix && <span className="text-muted">{suffix}</span>}
    </span>
  );
}

/** Blue info banner */
export function InfoBanner({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" | "good" }) {
  const cls =
    tone === "info"
      ? "border-primary/20 bg-primary-soft text-primary"
      : tone === "warn"
      ? "border-medium/30 bg-medium-soft text-[#b45309]"
      : "border-good/30 bg-good-soft text-good";
  return (
    <div className={clsx("flex items-center gap-2.5 rounded-lg border px-4 py-3 text-[13px]", cls)}>
      <Info size={16} className="shrink-0" />
      <span>{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton + Empty state                                              */
/* ------------------------------------------------------------------ */
export function Skeleton({ className, w, h, rounded }: { className?: string; w?: number | string; h?: number | string; rounded?: string }) {
  return <div className={clsx("skeleton", rounded ?? "rounded-md", className)} style={{ width: w, height: h }} />;
}

/** Card-shaped skeleton with a title bar and a few lines. */
export function SkeletonCard({ lines = 3, chart = false, className }: { lines?: number; chart?: boolean; className?: string }) {
  return (
    <div className={clsx("card p-5", className)}>
      <Skeleton w={140} h={12} className="mb-4" />
      {chart ? (
        <Skeleton h={160} className="w-full" rounded="rounded-lg" />
      ) : (
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} h={12} className="w-full" />
          ))}
        </div>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  desc,
  action,
  className,
  compact = false,
}: {
  icon?: React.ReactNode;
  title: string;
  desc?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={clsx("flex flex-col items-center justify-center text-center", compact ? "py-10" : "py-16", className)}>
      {icon && (
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-muted-2">
          {icon}
        </span>
      )}
      <h3 className="text-[15px] font-semibold text-text">{title}</h3>
      {desc && <p className="mt-1.5 max-w-[340px] text-[13px] text-muted">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
