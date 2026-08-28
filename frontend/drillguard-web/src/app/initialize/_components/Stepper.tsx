"use client";

import Link from "next/link";
import clsx from "clsx";
import { Check, ChevronDown } from "lucide-react";
import { steps } from "@/data/wizard";

/**
 * 5-step wizard stepper, exactly as drawn:
 * active = solid primary circle with white number; completed = white circle
 * with green check; upcoming = white circle with grey border and number.
 * Title + subtitle sit right of each circle; thin connector lines between.
 */
export function Stepper({ current }: { current: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <ol className="flex items-center gap-2 overflow-hidden border-b border-border px-7 py-5">
      {steps.map((s, i) => {
        const state = s.n < current ? "done" : s.n === current ? "active" : "todo";
        const subtitle = state === "done" && "doneSubtitle" in s ? s.doneSubtitle : s.subtitle;
        return (
          <li key={s.n} className={clsx("flex items-center", i < steps.length - 1 && "flex-1")}>
            <Link href={s.href} className="flex items-center gap-3">
              <span
                className={clsx(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full border text-[14px] font-semibold",
                  state === "active" && "border-primary bg-primary text-white",
                  state === "done" && "border-border-strong bg-surface text-good",
                  state === "todo" && "border-border-strong bg-surface text-text-2"
                )}
              >
                {state === "done" ? <Check size={16} strokeWidth={3} /> : s.n}
              </span>
              <span className="leading-tight">
                <span
                  className={clsx(
                    "block whitespace-nowrap text-[14px] font-semibold",
                    state === "active" ? "text-primary" : "text-text"
                  )}
                >
                  {s.title}
                </span>
                <span className="block text-[13px] text-muted">{subtitle}</span>
              </span>
              {state === "done" && s.n === 1 && (
                <ChevronDown size={14} className="ml-2 text-muted-2" />
              )}
            </Link>
            {i < steps.length - 1 && <span className="mx-3 h-px min-w-3 flex-1 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}
