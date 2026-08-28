"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Logo } from "./Logo";

/** Gate for app routes: redirects to /login when unauthenticated. Renders a
 *  brand splash until the localStorage session is resolved, so a refresh never
 *  flashes the app or bounces an authenticated user. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-sidebar" data-sidebar="navy">
        <div className="animate-pulse opacity-80"><Logo /></div>
      </div>
    );
  }
  return <>{children}</>;
}
