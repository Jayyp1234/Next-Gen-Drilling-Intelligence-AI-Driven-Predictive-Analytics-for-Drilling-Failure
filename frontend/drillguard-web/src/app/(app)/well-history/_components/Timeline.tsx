"use client";

import clsx from "clsx";

/**
 * Horizontal well timeline: milestone name above, dot on the line, date
 * below. Completed segments are green; the segment into the in-progress
 * milestone and the trailing arrow are blue.
 */
export function Timeline({
  items,
}: {
  items: { name: string; date: string; done: boolean }[];
}) {
  const n = items.length;
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
      {items.map((m, i) => {
        const leftDone = i === 0 ? true : items[i - 1].done && m.done;
        const rightDone = i === n - 1 ? false : m.done && items[i + 1].done;
        const last = i === n - 1;
        return (
          <div key={m.name} className="flex flex-col items-center text-center">
            <div className={clsx("text-[12px] font-semibold", m.done ? "text-good" : "text-primary")}>
              {m.name}
            </div>
            <div className="relative my-2 flex h-4 w-full items-center justify-center">
              <span
                className={clsx("absolute left-0 top-1/2 h-[2px] w-1/2 -translate-y-1/2", leftDone ? "bg-good" : "bg-primary")}
              />
              <span
                className={clsx("absolute right-0 top-1/2 h-[2px] w-1/2 -translate-y-1/2", rightDone ? "bg-good" : "bg-primary")}
              />
              {last && (
                <span
                  className="absolute right-0 top-1/2 h-0 w-0 -translate-y-1/2 border-y-[5px] border-l-[7px] border-y-transparent border-l-primary"
                  aria-hidden
                />
              )}
              <span className={clsx("relative z-10 h-3 w-3 rounded-full", m.done ? "bg-good" : "bg-primary")} />
            </div>
            <div className="text-[12px] text-muted">{m.date}</div>
          </div>
        );
      })}
    </div>
  );
}
