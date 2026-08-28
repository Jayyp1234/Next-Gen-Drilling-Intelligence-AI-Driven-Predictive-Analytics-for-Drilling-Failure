"use client";

/**
 * Crew Channel — REAL team messaging, shared by web and mobile.
 * One thread per loaded well (falls back to the "ops" channel). Polls the PHP
 * API incrementally; DrillGuard posts system lines here when an Elevated or
 * Action alert fires, so incident coordination lives in the same thread.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, Badge } from "@/components/ui/primitives";
import { api, apiEnabled, getToken, type CrewMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useReplay } from "@/lib/replay/ReplayProvider";
import { Send, ShieldAlert, MessagesSquare } from "lucide-react";
import clsx from "clsx";

const POLL_MS = 2500;

export default function MessagesPage() {
  const r = useReplay();
  const { user } = useAuth();
  const channel = r.dataset?.id ?? "ops";
  const channelLabel = r.dataset?.well ?? "Operations";

  const [msgs, setMsgs] = useState<CrewMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastId = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true); // keep pinned to the bottom unless the user scrolled up

  const append = useCallback((rows: CrewMessage[]) => {
    if (!rows.length) return;
    setMsgs((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const fresh = rows.filter((m) => !seen.has(m.id));
      if (!fresh.length) return prev;
      lastId.current = Math.max(lastId.current, ...fresh.map((m) => m.id));
      return [...prev, ...fresh];
    });
  }, []);

  // Initial load + reset when the channel (well) changes.
  useEffect(() => {
    if (!apiEnabled || !getToken()) return;
    lastId.current = 0;
    setMsgs([]);
    setError(null);
    api
      .messages(channel)
      .then(append)
      .catch(() => setError("Could not reach the crew channel API."));
  }, [channel, append]);

  // Incremental polling.
  useEffect(() => {
    if (!apiEnabled || !getToken()) return;
    const t = window.setInterval(() => {
      api.messages(channel, lastId.current).then(append).catch(() => {});
    }, POLL_MS);
    return () => window.clearInterval(t);
  }, [channel, append]);

  // Auto-scroll to the newest message while pinned to the bottom.
  useEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const m = await api.postMessage(channel, body);
      setDraft("");
      append([m]);
    } catch {
      setError("Message not sent — check the API connection.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Crew Channel"
        subtitle="Team coordination for the active well — shared with the mobile app"
        rangeLabel={undefined}
      />
      <div className="flex h-[calc(100vh-140px)] flex-col gap-4 p-5">
        <Card className="flex min-h-0 flex-1 flex-col !p-0">
          {/* Channel header */}
          <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
            <MessagesSquare size={18} className="text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">Crew Channel — {channelLabel}</p>
              <p className="text-[12px] text-muted">
                {r.dataset ? "One thread per well · alerts post here automatically" : "Default operations channel"}
              </p>
            </div>
            <Badge sev="good">LIVE · DB-backed</Badge>
          </div>

          {/* Messages */}
          <div
            ref={scroller}
            onScroll={(e) => {
              const el = e.currentTarget;
              stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
            }}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4"
          >
            {msgs.length === 0 && (
              <p className="pt-10 text-center text-[13.5px] text-muted">
                No messages in this channel yet — start the conversation below.
              </p>
            )}
            {msgs.map((m) =>
              m.is_system ? (
                <div key={m.id} className="flex items-start gap-2.5 rounded-lg border border-medium/30 bg-medium-soft px-3.5 py-2.5">
                  <ShieldAlert size={16} className="mt-0.5 shrink-0 text-medium" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-text">
                      DrillGuard <span className="ml-1 text-[11px] font-medium uppercase tracking-wide text-medium">system</span>
                    </p>
                    <p className="text-[13.5px] text-text-2">{m.body}</p>
                    <p className="mt-0.5 text-[11.5px] text-muted">{m.created_at}</p>
                  </div>
                </div>
              ) : (
                <div key={m.id} className={clsx("flex", m.user_id === user?.id && "justify-end")}>
                  <div
                    className={clsx(
                      "max-w-[78%] rounded-xl px-3.5 py-2.5",
                      m.user_id === user?.id ? "bg-primary text-white" : "border border-border bg-surface-2"
                    )}
                  >
                    <p className={clsx("text-[12.5px] font-semibold", m.user_id === user?.id ? "text-white/90" : "text-text")}>
                      {m.author}
                      {m.role && (
                        <span className={clsx("ml-1.5 text-[10.5px] font-medium uppercase tracking-wide", m.user_id === user?.id ? "text-white/70" : "text-muted")}>
                          {m.role}
                        </span>
                      )}
                    </p>
                    <p className={clsx("text-[13.5px]", m.user_id === user?.id ? "text-white" : "text-text-2")}>{m.body}</p>
                    <p className={clsx("mt-0.5 text-[11px]", m.user_id === user?.id ? "text-white/60" : "text-muted")}>{m.created_at}</p>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-border px-4 py-3">
            {error && <p className="pb-2 text-[12.5px] text-high">{error}</p>}
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder={`Message ${channelLabel}…`}
                className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3.5 text-[14px] text-text outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => void send()}
                className={clsx(
                  "grid h-11 w-11 place-items-center rounded-lg bg-primary text-white transition-opacity",
                  (sending || !draft.trim()) && "opacity-50"
                )}
                aria-label="Send message"
              >
                <Send size={17} />
              </button>
            </div>
            <p className="mt-1.5 text-[11.5px] text-muted">
              Stored in the operations database · visible to the whole crew on web and mobile.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
