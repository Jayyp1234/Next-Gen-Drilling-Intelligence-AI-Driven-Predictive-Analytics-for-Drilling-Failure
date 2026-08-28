"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, apiEnabled, getToken, type ApiUser } from "@/lib/api/client";

export type AuthUser = { id?: number; name: string; email: string; role: string; team: string; initials: string };

type Ctx = {
  user: AuthUser | null;
  ready: boolean;              // session read has completed (avoids redirect flash)
  /** Sign in. With the PHP backend enabled this authenticates for real and may reject. */
  signIn: (email: string, password?: string, opts?: { role?: string; team?: string }) => Promise<AuthUser>;
  signOut: () => void;
};

const AuthCtx = createContext<Ctx | null>(null);
const KEY = "dg-auth";

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "DE";

/** Derive a display identity from an email — used when no backend is configured. */
function identity(email: string, opts?: { role?: string; team?: string }): AuthUser {
  const local = email.split("@")[0] || "engineer";
  const name = /^engineer$/i.test(local)
    ? "Drilling Engineer"
    : local.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { name, email, role: opts?.role ?? "Drilling Engineer", team: opts?.team ?? "Drilling Team", initials: initials(name) };
}

/** Map a PHP user record to the app's display user. */
function fromApi(u: ApiUser): AuthUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role === "engineer" ? "Drilling Engineer" : u.role,
    team: "Drilling Team",
    initials: initials(u.name),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // deferred one tick so the session read is not a synchronous setState in
    // the effect body; RequireAuth shows the brand splash until `ready`.
    const t = window.setTimeout(async () => {
      try {
        if (apiEnabled && getToken()) {
          // Real session: validate the stored JWT against the backend.
          const u = await api.me();
          setUser(fromApi(u));
        } else if (!apiEnabled) {
          const raw = localStorage.getItem(KEY);
          if (raw) setUser(JSON.parse(raw));
        }
      } catch {
        // Expired/invalid token — drop it so the user is sent to /login.
        api.logout();
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const signIn = useCallback(async (email: string, password?: string, opts?: { role?: string; team?: string }) => {
    let u: AuthUser;
    if (apiEnabled) {
      u = fromApi(await api.login(email, password ?? ""));
    } else {
      u = identity(email, opts);
    }
    localStorage.setItem(KEY, JSON.stringify(u)); // display copy (token is stored separately)
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(() => {
    if (apiEnabled) api.logout();
    localStorage.removeItem(KEY);
    setUser(null);
  }, []);

  return <AuthCtx.Provider value={{ user, ready, signIn, signOut }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
}
