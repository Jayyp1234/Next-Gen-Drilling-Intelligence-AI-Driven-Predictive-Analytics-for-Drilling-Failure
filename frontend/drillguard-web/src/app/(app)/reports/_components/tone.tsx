"use client";

import clsx from "clsx";
import {
  FileText,
  CalendarDays,
  File,
  Hourglass,
  Shield,
  AlertTriangle,
  DollarSign,
  SlidersHorizontal,
  Download,
} from "lucide-react";
import type { Severity } from "@/components/ui/primitives";
import type { Tone, TemplateIcon } from "@/data/reports";

/** Design colour → shared Severity token. Teal has no Severity; handled locally. */
export const toneSev: Record<Exclude<Tone, "teal">, Severity> = {
  blue: "info",
  green: "good",
  purple: "purple",
  orange: "medium",
  red: "high",
  grey: "grey",
};

/** Text colour class for the small frequency label under each template. */
export const toneText: Record<Tone, string> = {
  blue: "text-primary",
  green: "text-good",
  purple: "text-purple",
  orange: "text-medium",
  red: "text-high",
  teal: "text-teal",
  grey: "text-muted",
};

/** Pastel (soft) tile classes by tone. */
const softCls: Record<Tone, string> = {
  blue: "bg-primary-soft text-primary",
  green: "bg-good-soft text-good",
  purple: "bg-purple-soft text-purple",
  orange: "bg-medium-soft text-medium",
  red: "bg-high-soft text-high",
  teal: "bg-teal/10 text-teal",
  grey: "bg-surface-2 text-muted",
};

/** Solid tile classes by tone (KPI icon squares). */
const solidCls: Record<Tone, string> = {
  blue: "bg-primary text-white",
  green: "bg-good text-white",
  purple: "bg-purple text-white",
  orange: "bg-medium text-white",
  red: "bg-high text-white",
  teal: "bg-teal text-white",
  grey: "bg-muted text-white",
};

/** Icon tile coloured by design tone; `solid` = white icon on solid colour. */
export function ToneTile({
  tone,
  children,
  size = 44,
  square = false,
  solid = false,
}: {
  tone: Tone;
  children: React.ReactNode;
  size?: number;
  square?: boolean;
  solid?: boolean;
}) {
  return (
    <span
      className={clsx(
        "grid shrink-0 place-items-center",
        square ? "rounded-lg" : "rounded-full",
        solid ? solidCls[tone] : softCls[tone]
      )}
      style={{ width: size, height: size }}
    >
      {children}
    </span>
  );
}

/** Report-type glyph by key. */
export function ReportIcon({ icon, size = 16 }: { icon: TemplateIcon | "download"; size?: number }) {
  switch (icon) {
    case "doc":
      return <FileText size={size} />;
    case "calendar":
      return <CalendarDays size={size} />;
    case "file":
      return <File size={size} />;
    case "hourglass":
      return <Hourglass size={size} />;
    case "shield":
      return <Shield size={size} />;
    case "warning":
      return <AlertTriangle size={size} />;
    case "dollar":
      return <DollarSign size={size} />;
    case "sliders":
      return <SlidersHorizontal size={size} />;
    case "download":
      return <Download size={size} />;
  }
}
