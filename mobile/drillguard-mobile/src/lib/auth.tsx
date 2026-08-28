import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getToken, type ApiUser } from "./api";

type AuthUser = { name: string; email: string; role: string; initials: string };

type Ctx = {
  user: AuthUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "DE";
const toUser = (u: ApiUser): AuthUser => ({
  name: u.name, email: u.email,
  role: u.role === "engineer" ? "Drilling Engineer" : u.role, initials: initials(u.name),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (await getToken()) setUser(toUser(await api.me()));
      } catch {
        await api.logout();
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setUser(toUser(await api.login(email, password)));
  }, []);

  const signOut = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  return <AuthCtx.Provider value={{ user, ready, signIn, signOut }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
}
