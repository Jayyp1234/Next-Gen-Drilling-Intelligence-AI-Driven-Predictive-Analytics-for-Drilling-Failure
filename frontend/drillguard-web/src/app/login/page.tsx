"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Activity, Database } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { useAuth } from "@/lib/auth/AuthProvider";
import { isOnboarded, setOnboarded } from "@/lib/onboarding";
import { DEFAULT_DATASET_ID } from "@/lib/replay/ReplayProvider";
import { Play } from "lucide-react";

const DEMO_EMAIL = "engineer@drilcorp.com";
const DEMO_PASS = "drillguard";

const VALUE_PROPS = [
  { icon: Activity, title: "Real-time risk scoring", desc: "Physics-informed monitors on live drilling telemetry" },
  { icon: ShieldCheck, title: "Documented-event validation", desc: "Detections anchored to real GEOL / DDR records" },
  { icon: Database, title: "Field-data replay", desc: "Volve, Bilabri and Eos wells, streamed as if live" },
];

export default function LoginPage() {
  const { user, ready, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // already signed in → straight to the app
  useEffect(() => { if (ready && user) router.replace(isOnboarded() ? "/live-monitoring" : "/welcome"); }, [ready, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) { setError("Enter your email and password."); return; }
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      router.replace(isOnboarded() ? "/live-monitoring" : "/welcome");
    } catch {
      setError("Invalid email or password.");
      setBusy(false);
    }
  };
  const useDemo = () => { setEmail(DEMO_EMAIL); setPassword(DEMO_PASS); };

  // One click → sign in, load the D2 demo well, land on the money moment.
  const launchDemo = async () => {
    setError(null);
    setBusy(true);
    try {
      await signIn(DEMO_EMAIL, DEMO_PASS);
      localStorage.setItem("dg-replay-dataset", DEFAULT_DATASET_ID);
      setOnboarded();
      // sessionStorage (not a URL param) so a redirect race can't strip the demo signal.
      sessionStorage.setItem("dg-demo-launch", "1");
      router.replace("/live-monitoring");
    } catch {
      setError("Demo unavailable — check the backend is running.");
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ---- Brand panel ---- */}
      <div data-sidebar="navy" className="relative hidden flex-col justify-between overflow-hidden bg-sidebar px-12 py-12 text-sidebar-text lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #3b5a94 1px, transparent 0)", backgroundSize: "22px 22px" }}
        />
        <div className="relative"><Logo /></div>
        <div className="relative max-w-md">
          <h1 className="text-[34px] font-extrabold leading-tight">
            Predict drilling failures <span className="text-primary">before</span> they escalate.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-sidebar-muted">
            DrillGuard fuses three physics-informed models into one coverage-aware risk score, validated
            against documented field incidents.
          </p>
          <ul className="mt-9 space-y-5">
            {VALUE_PROPS.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3.5">
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Icon size={20} />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-sidebar-text">{title}</span>
                  <span className="block text-[13px] text-sidebar-muted">{desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-[12px] text-sidebar-muted">
          © 2025 DrillGuard · Execution-phase Drilling Intelligence Module
        </div>
      </div>

      {/* ---- Form panel ---- */}
      <div className="flex items-center justify-center bg-bg px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h2 className="text-[26px] font-bold tracking-tight">Sign in</h2>
          <p className="mt-1.5 text-[14px] text-muted">Welcome back — access your drilling operations.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-text-2">Email</span>
              <span className="flex h-11 items-center gap-2.5 rounded-lg border border-border bg-surface px-3 focus-within:border-primary">
                <Mail size={17} className="text-muted" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com" autoComplete="email"
                  className="h-full flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-2"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-text-2">
                Password
                <span className="font-medium text-muted-2">Demo access</span>
              </span>
              <span className="flex h-11 items-center gap-2.5 rounded-lg border border-border bg-surface px-3 focus-within:border-primary">
                <Lock size={17} className="text-muted" />
                <input
                  type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password"
                  className="h-full flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-2"
                />
                <button type="button" onClick={() => setShow((v) => !v)} className="text-muted" aria-label="Toggle password">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            {error && <div className="rounded-lg bg-high-soft px-3 py-2 text-[13px] font-medium text-high">{error}</div>}

            <label className="flex items-center gap-2 text-[13px] text-text-2">
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#1d5af0]" /> Keep me signed in
            </label>

            <button
              type="submit" disabled={busy}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in"} <ArrowRight size={17} />
            </button>
          </form>

          <div className="mt-5 rounded-lg border border-dashed border-border bg-surface-2 px-4 py-3.5 text-[12px] text-text-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-text">Investor demo</div>
                <div className="mt-0.5">Jump straight to the Bilabri D2 stuck-pipe warning.</div>
              </div>
              <button
                type="button" onClick={launchDemo} disabled={busy}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
              >
                <Play size={14} /> Launch demo
              </button>
            </div>
            <div className="mt-2 text-[11px] text-muted">
              or sign in manually: {DEMO_EMAIL} · {DEMO_PASS} —{" "}
              <button type="button" onClick={useDemo} className="font-medium text-primary">fill it in</button>
            </div>
          </div>

          <p className="mt-6 text-center text-[13px] text-muted">
            Access is provisioned by your drilling operations administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
