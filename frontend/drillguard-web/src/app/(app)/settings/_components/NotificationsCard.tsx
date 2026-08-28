"use client";

/**
 * Alert Notifications — REAL delivery settings, not a fixture.
 * Reads provider status from the PHP API, saves the crew phone to the profile,
 * and fires a live test through the same Notifier path real alerts use.
 */
import { useCallback, useEffect, useState } from "react";
import { Card, CardHeading, Button, Badge } from "@/components/ui/primitives";
import { api, apiEnabled, getToken, type NotifyStatus, type NotifyChannelResult } from "@/lib/api/client";
import { BellRing, Send, Check, Loader2 } from "lucide-react";

const statusSev = { sent: "good", dryrun: "info", failed: "high" } as const;

export function NotificationsCard() {
  const [status, setStatus] = useState<NotifyStatus | null>(null);
  const [phone, setPhone] = useState("");
  const [savedPhone, setSavedPhone] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<Record<string, NotifyChannelResult> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    api
      .notifyStatus()
      .then((s) => {
        setStatus(s);
        setSavedPhone(s.recipient.phone);
        setPhone((p) => p || s.recipient.phone || "");
      })
      .catch(() => setStatus(null));
  }, []);
  useEffect(() => {
    if (apiEnabled && getToken()) refresh();
  }, [refresh]);

  if (!apiEnabled || !getToken()) return null;

  const savePhone = async () => {
    setSaving(true);
    setError(null);
    try {
      const u = await api.updateMe({ phone: phone.trim() });
      setSavedPhone(u.phone ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save phone");
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    setResult(null);
    setError(null);
    try {
      setResult(await api.testNotification(phone.trim() || undefined));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Test failed");
    } finally {
      setTesting(false);
    }
  };

  const dirty = phone.trim() !== (savedPhone ?? "");

  return (
    <Card>
      <CardHeading
        icon={<BellRing size={22} />}
        title="Alert Notifications"
        description="Elevated and Action alerts are delivered to this phone by SMS."
      />
      <div className="space-y-3">
        {status && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge sev={status.sms.live ? "good" : "grey"}>
              SMS {status.sms.live ? `LIVE · ${status.sms.provider} · ${status.sms.sender}` : "dry-run"}
            </Badge>
            <Badge sev={status.email.live ? "good" : "grey"}>
              Email {status.email.live ? "LIVE" : "dry-run"}
            </Badge>
            {status.queued_sms > 0 && (
              <button
                type="button"
                onClick={async () => {
                  await api.retryNotifications().catch(() => null);
                  refresh();
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-medium/40 bg-medium-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-medium"
                title="SMS queued while the link was down — click to re-send now"
              >
                {status.queued_sms} queued offline · retry
              </button>
            )}
          </div>
        )}

        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-text-2">Crew phone (SMS)</span>
          <div className="flex gap-2">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0903 221 0788"
              inputMode="tel"
              className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-[14px] text-text outline-none focus:border-primary"
            />
            <Button
              onClick={() => {
                if (!saving && dirty) void savePhone();
              }}
              className={saving || !dirty ? "opacity-60" : undefined}
              icon={saving ? <Loader2 size={15} className="animate-spin" /> : dirty ? undefined : <Check size={15} />}
            >
              {dirty ? "Save" : "Saved"}
            </Button>
          </div>
        </div>

        <Button
          variant="outline"
          className={testing ? "w-full opacity-60" : "w-full"}
          onClick={() => {
            if (!testing) void sendTest();
          }}
          icon={testing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        >
          {testing ? "Sending…" : "Send test notification"}
        </Button>

        {error && <p className="text-[13px] text-high">{error}</p>}

        {result && (
          <div className="space-y-1.5 rounded-lg border border-border bg-surface-2 p-3">
            {Object.values(result).map((c) => (
              <div key={c.channel} className="flex items-center gap-2 text-[13px]">
                <Badge sev={statusSev[c.status] ?? "grey"}>{c.channel.toUpperCase()}</Badge>
                <span className="font-medium text-text">{c.status}</span>
                <span className="min-w-0 flex-1 truncate text-muted">→ {c.recipient}</span>
              </div>
            ))}
            <p className="pt-1 text-[12px] leading-4 text-muted">
              Sent through the same delivery path as a real Action alert.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
