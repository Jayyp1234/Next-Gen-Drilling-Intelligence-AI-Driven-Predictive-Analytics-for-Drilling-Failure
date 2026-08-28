"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import { Toggle } from "@/components/ui/primitives";

/** "Label / description ........ [toggle]" row used in General + Display cards. */
export function ToggleRow({
  label,
  description,
  on,
  onToggle,
}: {
  label: string;
  description: string;
  on: boolean;
  onToggle?: (next: boolean) => void;
}) {
  const inner = (
    <>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-text">{label}</span>
        <span className="mt-0.5 block text-[13px] text-muted">{description}</span>
      </span>
      <Toggle on={on} />
    </>
  );
  if (onToggle) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onToggle(!on)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        {inner}
      </button>
    );
  }
  return <div className="flex items-center justify-between gap-4">{inner}</div>;
}

/** Two-column "key   value" row (left-aligned value column, no divider). */
export function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[128px_1fr] items-center gap-3 py-1.5 text-[13px]">
      <span className="text-text-2">{k}</span>
      <span className="font-semibold text-text">{v}</span>
    </div>
  );
}

/** Two-option segmented control (Theme: Light | System). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; icon: React.ReactNode }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.id)}
            className={clsx(
              "flex h-11 items-center justify-center gap-2.5 rounded-lg border text-[14px] font-medium transition-colors",
              active
                ? "border-primary bg-primary-soft text-primary"
                : "border-border bg-surface text-text-2 hover:bg-surface-2"
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Primary-colour swatch row (visual only). */
export function ColorSwatches({
  colors,
}: {
  colors: { name: string; hex: string; selected: boolean }[];
}) {
  return (
    <div className="flex items-center gap-4">
      {colors.map((c) => (
        <span
          key={c.name}
          title={c.name}
          className={clsx(
            "grid h-[42px] w-[42px] place-items-center rounded-lg",
            c.selected && "border-2 border-primary bg-surface p-1"
          )}
        >
          <span
            className={clsx(
              "grid place-items-center rounded-md text-white",
              c.selected ? "h-full w-full" : "h-8 w-8"
            )}
            style={{ background: c.hex }}
          >
            {c.selected && <Check size={16} strokeWidth={3} />}
          </span>
        </span>
      ))}
    </div>
  );
}
