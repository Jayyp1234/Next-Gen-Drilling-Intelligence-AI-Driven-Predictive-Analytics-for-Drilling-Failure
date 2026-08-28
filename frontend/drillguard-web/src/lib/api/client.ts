/**
 * DrillGuard PHP backend client.
 *
 * Set NEXT_PUBLIC_API_BASE (e.g. http://localhost:8077 in dev, https://api.yourhost
 * in prod) to point the app at the PHP API. When it is unset, `apiEnabled` is false
 * and callers should fall back to the current local behaviour — so adding this file
 * changes nothing until you opt in.
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ?? "";
const TOKEN_KEY = "dg-api-token";

export const apiEnabled = BASE !== "";

/** Prefix a path with the PHP API base when configured; otherwise return it unchanged. */
export function apiUrl(path: string): string {
  return apiEnabled ? `${BASE}${path}` : path;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!apiEnabled) throw new ApiError(0, "API base not configured (NEXT_PUBLIC_API_BASE)");
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, data?.error ?? res.statusText);
  return data as T;
}

export type ApiUser = { id: number; name: string; email: string; phone?: string | null; role: string };

export type NotifyChannelResult = {
  channel: string;
  recipient: string;
  status: "sent" | "dryrun" | "failed";
  provider: string;
  detail: string | null;
};
export type NotifyStatus = {
  queued_sms: number;
  sms: { live: boolean; provider: string; sender: string; channel: string; key_present: boolean };
  email: { live: boolean; from: string };
  recipient: { email: string; phone: string | null };
};
export type CrewMessage = {
  id: number;
  channel: string;
  user_id: number | null;
  author: string;
  role: string | null;
  body: string;
  is_system: boolean;
  alert_id: number | null;
  created_at: string;
};
export type NotificationRow = {
  id: number;
  alert_id: number | null;
  alert_title: string | null;
  alert_tier: string | null;
  channel: string;
  recipient: string;
  status: string;
  provider: string | null;
  detail: string | null;
  created_at: string;
};

export const api = {
  // ---- auth ----
  async login(email: string, password: string) {
    const r = await request<{ token: string; user: ApiUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(r.token);
    return r.user;
  },
  async register(name: string, email: string, password: string) {
    const r = await request<{ token: string; user: ApiUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setToken(r.token);
    return r.user;
  },
  async me() {
    return request<{ user: ApiUser }>("/api/auth/me").then((r) => r.user);
  },
  updateMe: (body: { phone?: string; name?: string }) =>
    request<{ user: ApiUser }>("/api/auth/me", { method: "PATCH", body: JSON.stringify(body) }).then((r) => r.user),
  logout() {
    setToken(null);
  },

  // ---- crew channel (team messaging) ----
  messages: (channel: string, afterId?: number) =>
    request<{ messages: CrewMessage[] }>(
      `/api/messages?channel=${encodeURIComponent(channel)}${afterId ? `&after_id=${afterId}` : ""}`
    ).then((r) => r.messages),
  postMessage: (channel: string, body: string) =>
    request<{ message: CrewMessage }>("/api/messages", {
      method: "POST",
      body: JSON.stringify({ channel, body }),
    }).then((r) => r.message),

  // ---- notifications (SMS / email delivery) ----
  notifyStatus: () => request<{ status: NotifyStatus }>("/api/notifications/status").then((r) => r.status),
  notifications: () => request<{ notifications: NotificationRow[] }>("/api/notifications").then((r) => r.notifications),
  testNotification: (phone?: string) =>
    request<{ result: Record<string, NotifyChannelResult> }>("/api/notifications/test", {
      method: "POST",
      body: JSON.stringify(phone ? { phone } : {}),
    }).then((r) => r.result),
  retryNotifications: () =>
    request<{ flushed: { retried: number; sent: number; still_queued: number; expired: number } }>(
      "/api/notifications/retry",
      { method: "POST", body: JSON.stringify({}) }
    ).then((r) => r.flushed),

  // ---- wells ----
  wells: () => request<{ wells: unknown[] }>("/api/wells").then((r) => r.wells),

  // ---- alerts ----
  alerts: (status?: string) =>
    request<{ alerts: unknown[] }>(`/api/alerts${status ? `?status=${status}` : ""}`).then((r) => r.alerts),
  createAlert: (body: Record<string, unknown>) =>
    request<{ alert: unknown; notified: unknown }>("/api/alerts", { method: "POST", body: JSON.stringify(body) }),
  ackAlert: (id: number) => request<{ alert: unknown }>(`/api/alerts/${id}/ack`, { method: "POST" }),

  // ---- incidents ----
  incidents: () => request<{ incidents: unknown[] }>("/api/incidents").then((r) => r.incidents),
  incident: (idOrCode: string) => request<{ incident: unknown; activity: unknown[] }>(`/api/incidents/${idOrCode}`),
  createIncident: (body: Record<string, unknown>) =>
    request<{ incident: unknown }>("/api/incidents", { method: "POST", body: JSON.stringify(body) }),
  updateIncident: (idOrCode: string, body: Record<string, unknown>) =>
    request<{ incident: unknown }>(`/api/incidents/${idOrCode}`, { method: "PATCH", body: JSON.stringify(body) }),

  // ---- replay ----
  replayCatalog: () => request<{ datasets: unknown[] }>("/api/replay-catalog"),
  replay: (id: string) => request<{ dataset: unknown; rows: unknown[] }>(`/api/replay/${id}`),
};
