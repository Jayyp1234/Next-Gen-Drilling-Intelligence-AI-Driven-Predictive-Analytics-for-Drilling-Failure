"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useReplay } from "@/lib/replay/ReplayProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { api, apiEnabled } from "@/lib/api/client";

export type IncidentStatus = "Open" | "Under Investigation" | "Resolved" | "Closed";
export type Sev = "high" | "medium" | "low";

export type Incident = {
  id: string;
  title: string;
  desc: string;
  type: string;          // Stuck Pipe / Bit Wear / Stick-Slip …
  sev: Sev;
  well: string;
  detected: string;      // display timestamp / depth
  status: IncidentStatus;
  owner: string;
  source: "documented" | "escalated" | "manual";
  quote?: string;        // documented anchor verbatim, if any
  atIdx?: number;        // replay index (depth m / time)
  params?: { label: string; value: string }[];
  activity: { time: string; title: string; by: string; tone: Sev | "grey" }[];
  createdAt: number;
};

type Ctx = {
  incidents: Incident[];
  get: (id: string) => Incident | undefined;
  createFromAlert: (a: {
    id: string; title: string; desc: string; sev: Sev; at: string; idx: number;
  }, meta: { well: string; type: string; params?: Incident["params"] }) => Promise<Incident>;
  createManual: (f: {
    title: string; desc: string; type: string; sev: Sev; well: string;
  }) => Promise<Incident>;
  update: (id: string, patch: Partial<Incident>) => void;
};

const IncCtx = createContext<Ctx | null>(null);
const KEY = "dg-incidents";
const MECH_TYPE: Record<string, string> = {
  stuck_pipe: "Stuck Pipe", bit_wear: "Bit Wear", stick_slip: "Stick-Slip",
  pack_off: "Pack-Off", differential_sticking: "Differential Sticking",
};

let seq = 0;
const newId = () => `INC-${Date.now().toString(36).toUpperCase().slice(-6)}-${(seq++).toString().padStart(2, "0")}`;

// ---- PHP <-> frontend mapping (apiEnabled mode) --------------------------
type PhpIncident = {
  id: number; code: string; title: string; description: string | null; type: string;
  severity: Sev; status: string; well: string | null; origin: string;
  detected_at: string | null; owner: string | null; created_at: string; updated_at: string;
};
const STATUS_FROM_PHP: Record<string, IncidentStatus> = {
  open: "Open", investigating: "Under Investigation", "under investigation": "Under Investigation",
  resolved: "Resolved", closed: "Closed",
};
const STATUS_TO_PHP: Record<IncidentStatus, string> = {
  "Open": "open", "Under Investigation": "investigating", "Resolved": "resolved", "Closed": "closed",
};
const clean = (s: string | null | undefined) => (s ?? "").replace("T", " ").slice(0, 16);

function fromPhp(p: PhpIncident): Incident {
  const sev = (["high", "medium", "low"].includes(p.severity) ? p.severity : "medium") as Sev;
  const activity: Incident["activity"] = [{
    time: clean(p.created_at),
    title: p.origin === "escalated" ? "Escalated from alert"
      : p.origin === "documented" ? "Documented event" : "Reported",
    by: p.owner ?? "System",
    tone: sev,
  }];
  if ((p.status || "").toLowerCase() === "resolved") {
    activity.push({ time: clean(p.updated_at), title: "Resolved", by: p.owner ?? "System", tone: "grey" });
  }
  return {
    id: p.code,
    title: p.title,
    desc: p.description ?? "",
    type: p.type,
    sev,
    well: p.well ?? "",
    detected: clean(p.detected_at || p.created_at),
    status: STATUS_FROM_PHP[(p.status || "").toLowerCase()] ?? "Open",
    owner: p.owner ?? "Drilling Engineer",
    source: (["documented", "escalated", "manual"].includes(p.origin) ? p.origin : "manual") as Incident["source"],
    params: [],
    activity,
    createdAt: p.created_at ? Date.parse(p.created_at) : Date.now(),
  };
}

export function IncidentProvider({ children }: { children: React.ReactNode }) {
  const replay = useReplay();
  const { user } = useAuth();
  const [created, setCreated] = useState<Incident[]>([]);   // local mode
  const [remote, setRemote] = useState<Incident[]>([]);     // apiEnabled mode

  // ---- apiEnabled: load incidents from the PHP backend -------------------
  const refresh = useCallback(async () => {
    const list = (await api.incidents()) as PhpIncident[];
    setRemote(list.map(fromPhp).sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  useEffect(() => {
    if (!apiEnabled) return;
    // Deferred so the (re)fetch/reset is not a synchronous setState in the effect body.
    const t = window.setTimeout(() => {
      if (!user) { setRemote([]); return; }   // refetch whenever the signed-in user changes
      refresh().catch(() => { /* ignore transient load errors */ });
    }, 0);
    return () => window.clearTimeout(t);
  }, [user, refresh]);

  // ---- local mode: restore user-created / escalated incidents ------------
  useEffect(() => {
    if (apiEnabled) return;
    const t = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) setCreated(JSON.parse(raw));
      } catch { /* ignore */ }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);
  const persist = useCallback((next: Incident[]) => {
    setCreated(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  // Documented incidents = the loaded dataset's anchors (local mode only).
  const documented = useMemo<Incident[]>(() => {
    if (apiEnabled || !replay.dataset) return [];
    return replay.dataset.anchors.map((a, i) => ({
      id: a.id,
      title: `${MECH_TYPE[a.mechanism] ?? a.mechanism} — documented event`,
      desc: a.quote,
      type: MECH_TYPE[a.mechanism] ?? a.mechanism,
      sev: "high" as Sev,
      well: replay.dataset!.well,
      detected: replay.fmtIdx(a.eventIdx),
      status: "Under Investigation" as IncidentStatus,
      owner: "Drilling Engineer",
      source: "documented" as const,
      quote: a.quote,
      atIdx: a.eventIdx,
      params: [
        { label: "Mechanism", value: (MECH_TYPE[a.mechanism] ?? a.mechanism) },
        { label: "Anchor ID", value: a.id },
        { label: "Label tier", value: replay.dataset!.labelTier },
        { label: "Event depth / time", value: replay.fmtIdx(a.eventIdx) },
      ],
      activity: [
        { time: replay.fmtIdx(a.eventIdx), title: `Documented in ${a.id}`, by: "GEOL / DDR record", tone: "high" as const },
        { time: "—", title: a.note || "Awaiting adjudication", by: "System", tone: "grey" as const },
      ],
      createdAt: 0 - i,
    }));
  }, [replay]);

  const incidents = useMemo<Incident[]>(() => {
    if (apiEnabled) return remote;
    const overrides = new Map(created.map((c) => [c.id, c]));
    const merged = documented.map((d) => overrides.get(d.id) ?? d);
    const extra = created.filter((c) => !documented.some((d) => d.id === c.id));
    return [...extra, ...merged].sort((a, b) => b.createdAt - a.createdAt);
  }, [documented, created, remote]);

  const createFromAlert: Ctx["createFromAlert"] = useCallback(async (a, meta) => {
    if (apiEnabled) {
      const { incident } = await api.createIncident({
        title: a.title, description: a.desc, type: meta.type, severity: a.sev,
        well_label: meta.well, origin: "escalated",
      });
      const inc = fromPhp(incident as PhpIncident);
      await refresh();
      return inc;
    }
    const inc: Incident = {
      id: newId(), title: a.title, desc: a.desc, type: meta.type, sev: a.sev,
      well: meta.well, detected: a.at, status: "Open", owner: "Drilling Engineer",
      source: "escalated", atIdx: a.idx, params: meta.params ?? [],
      activity: [
        { time: a.at, title: `Escalated from alert ${a.id}`, by: "Drilling Engineer", tone: a.sev },
        { time: a.at, title: "Incident opened", by: "System", tone: "grey" },
      ],
      createdAt: Date.now(),
    };
    persist([inc, ...created]);
    return inc;
  }, [created, persist, refresh]);

  const createManual: Ctx["createManual"] = useCallback(async (f) => {
    if (apiEnabled) {
      const { incident } = await api.createIncident({
        title: f.title, description: f.desc, type: f.type, severity: f.sev,
        well_label: f.well, origin: "manual",
      });
      const inc = fromPhp(incident as PhpIncident);
      await refresh();
      return inc;
    }
    const now = new Date();
    const at = now.toISOString().slice(11, 16);
    const inc: Incident = {
      id: newId(), title: f.title, desc: f.desc, type: f.type, sev: f.sev,
      well: f.well, detected: at, status: "Open", owner: "Drilling Engineer",
      source: "manual", params: [],
      activity: [{ time: at, title: "Reported manually", by: "Drilling Engineer", tone: f.sev }],
      createdAt: Date.now(),
    };
    persist([inc, ...created]);
    return inc;
  }, [created, persist, refresh]);

  const update: Ctx["update"] = useCallback((id, patch) => {
    if (apiEnabled) {
      const body: Record<string, unknown> = {};
      if (patch.status) body.status = STATUS_TO_PHP[patch.status];
      if (patch.owner) body.owner = patch.owner;
      if (patch.title) body.title = patch.title;
      if (patch.desc !== undefined) body.description = patch.desc;
      if (patch.activity) body.note = "Note added";
      api.updateIncident(id, body).then(() => refresh()).catch(() => { /* ignore */ });
      return;
    }
    const base = created.find((c) => c.id === id) ?? documented.find((d) => d.id === id);
    if (!base) return;
    persist([{ ...base, ...patch }, ...created.filter((c) => c.id !== id)]);
  }, [created, documented, persist, refresh]);

  const value: Ctx = { incidents, get: (id) => incidents.find((x) => x.id === id), createFromAlert, createManual, update };
  return <IncCtx.Provider value={value}>{children}</IncCtx.Provider>;
}

export function useIncidents() {
  const c = useContext(IncCtx);
  if (!c) throw new Error("useIncidents outside IncidentProvider");
  return c;
}
