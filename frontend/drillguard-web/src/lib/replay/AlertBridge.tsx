"use client";

/**
 * AlertBridge — closes the loop from live risk escalation to the backend.
 *
 * When the replay stream ESCALATES into Elevated or Action while playing, this
 * POSTs the alert to the PHP API, which records it in MariaDB and dispatches
 * email/SMS to the signed-in engineer (Termii "N-Alert" when configured; the
 * dry-run log otherwise). Historical crossings that appear from a seek/jump are
 * marked as seen but never fired — only crossings the user watched happen live
 * become notifications.
 */
import { useEffect, useRef } from "react";
import { useReplay } from "./ReplayProvider";
import { api, apiEnabled, getToken } from "@/lib/api/client";

const POSTED_KEY = "dg-posted-alerts";
const NOTIFY_TIERS = new Set(["Elevated", "Action"]);

function loadPosted(): Set<string> {
  try {
    return new Set(JSON.parse(window.sessionStorage.getItem(POSTED_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}
function savePosted(s: Set<string>) {
  try {
    window.sessionStorage.setItem(POSTED_KEY, JSON.stringify([...s].slice(-200)));
  } catch {
    /* storage unavailable — dedupe falls back to in-memory */
  }
}

export function AlertBridge() {
  const r = useReplay();
  const seen = useRef<Set<string>>(new Set());
  const posted = useRef<Set<string> | null>(null);
  // Reset the "seen" ledger whenever the dataset changes.
  const dsRef = useRef<string | null>(null);

  useEffect(() => {
    if (!apiEnabled || !getToken()) return;
    if (posted.current === null) posted.current = loadPosted();

    const ds = r.dataset?.id ?? null;
    if (ds !== dsRef.current) {
      dsRef.current = ds;
      seen.current = new Set(r.alerts.map((a) => a.id));
      return;
    }

    for (const a of r.alerts) {
      if (seen.current.has(a.id)) continue;
      seen.current.add(a.id);
      // Only fire crossings observed live (playing), for notify-worthy tiers,
      // and never twice in a browser session.
      if (!r.playing || !NOTIFY_TIERS.has(a.tier) || posted.current.has(a.id)) continue;
      posted.current.add(a.id);
      savePosted(posted.current);

      const row = r.current;
      const timeIndexed = r.dataset?.indexKind === "time_1900_days";
      api
        .createAlert({
          dataset_id: ds,
          mechanism: r.dataset?.mechanism ?? "unknown",
          tier: a.tier,
          severity: a.sev,
          risk_score: Math.round(row?.risk ?? 0),
          // Time-indexed wells: the raw 1900-days serial is meaningless to read,
          // so carry the formatted time in the description instead.
          index_label: timeIndexed ? null : (r.dataset?.units?.indexLabel ?? "Index"),
          index_value: timeIndexed ? null : a.idx,
          title: a.title,
          description: timeIndexed ? `${a.desc} at ${a.at}` : a.desc,
          active_monitors: row?.active ?? null,
          source: "replay",
        })
        .catch(() => {
          /* backend unreachable — the in-app alert still shows; retry on next crossing */
        });
    }
  }, [r.alerts, r.playing, r.dataset, r]);

  return null;
}
