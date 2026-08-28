/**
 * DrillGuard PHP backend client (mobile).
 * Same API as the web app. Override the base with EXPO_PUBLIC_API_BASE.
 *
 * Default http://localhost:8077 works on the iOS Simulator (it shares the Mac's
 * localhost). For a physical phone over Expo Go, set EXPO_PUBLIC_API_BASE to the
 * Mac's LAN IP, e.g. http://192.168.1.20:8077, in a .env file.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE = (process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:8077").replace(/\/$/, "");
const TOKEN_KEY = "dg-token";

let cachedToken: string | null = null;

export async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}
export async function setToken(token: string | null): Promise<void> {
  cachedToken = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = await getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, data?.error ?? res.statusText);
  return data as T;
}

export type ApiUser = { id: number; name: string; email: string; role: string };

export const api = {
  async login(email: string, password: string) {
    const r = await request<{ token: string; user: ApiUser }>("/api/auth/login", {
      method: "POST", body: JSON.stringify({ email, password }),
    });
    await setToken(r.token);
    return r.user;
  },
  async me() {
    return (await request<{ user: ApiUser }>("/api/auth/me")).user;
  },
  async logout() {
    await setToken(null);
  },
  health: () => request<{ ok: boolean }>("/api/health"),
  alerts: (status?: string) =>
    request<{ alerts: ApiAlert[] }>(`/api/alerts${status ? `?status=${status}` : ""}`).then((r) => r.alerts),
  messages: (channel: string, afterId?: number) =>
    request<{ messages: CrewMessage[] }>(
      `/api/messages?channel=${encodeURIComponent(channel)}${afterId ? `&after_id=${afterId}` : ""}`
    ).then((r) => r.messages),
  postMessage: (channel: string, body: string) =>
    request<{ message: CrewMessage }>("/api/messages", { method: "POST", body: JSON.stringify({ channel, body }) })
      .then((r) => r.message),
  ackAlert: (id: number) => request<{ alert: ApiAlert }>(`/api/alerts/${id}/ack`, { method: "POST" }),
  replayCatalog: () => request<{ datasets: Dataset[] }>("/api/replay"),
  replay: (id: string) => request<{ dataset: Dataset; rows: ReplayRow[] }>(`/api/replay/${id}`),
  incidents: () => request<{ incidents: Incident[] }>("/api/incidents"),
  incident: (idOrCode: string) => request<{ incident: Incident; activity: Activity[] }>(`/api/incidents/${idOrCode}`),
  createIncident: (body: Record<string, unknown>) =>
    request<{ incident: Incident }>("/api/incidents", { method: "POST", body: JSON.stringify(body) }),
  updateIncident: (idOrCode: string, body: Record<string, unknown>) =>
    request<{ incident: Incident }>(`/api/incidents/${idOrCode}`, { method: "PATCH", body: JSON.stringify(body) }),
};

/* ---- shared types (mirror the PHP / replay JSON) ---- */
export type Channels = Partial<Record<
  "hookload" | "torque" | "spp" | "rop" | "wob" | "flow" | "rpm" | "gas" | "ecd" | "dhap" | "stick" | "crpm" | "mse",
  number
>>;
export type ReplayRow = {
  i: number; idx: number; onb: number;
  sb: number | null; sl: number | null; sd: number | null;
  active: string; risk: number | null; tier: string; label: number | null; ch: Channels;
};
export type Anchor = { id: string; mechanism: string; eventIdx: number; quote: string; note: string };
export type Dataset = {
  id: string; name: string; well: string; field: string; scenario: string;
  mechanism: string; indexKind: "depth_m" | "time_1900_days"; n: number;
  lo: number; hi: number; labelTier: string; evidence: string; anchors: Anchor[];
  units: { index: string; indexLabel: string };
};
export type CrewMessage = {
  id: number; channel: string; user_id: number | null; author: string; role: string | null;
  body: string; is_system: boolean; alert_id: number | null; created_at: string;
};
export type ApiAlert = {
  id: number; well_id: number | null; well: string | null; dataset_id: string | null;
  mechanism: string; tier: string; severity: string; risk_score: number | null;
  index_label: string | null; index_value: number | null; title: string;
  description: string | null; active_monitors: string | null; status: string;
  acknowledged_by: number | null; acknowledged_at: string | null; source: string; created_at: string;
};
export type Incident = {
  id: number; code: string; title: string; description: string | null; type: string;
  severity: string; status: string; well: string | null; origin: string;
  detected_at: string | null; owner: string | null; created_at: string; updated_at: string;
};
export type Activity = { actor: string | null; action: string; note: string | null; created_at: string };
