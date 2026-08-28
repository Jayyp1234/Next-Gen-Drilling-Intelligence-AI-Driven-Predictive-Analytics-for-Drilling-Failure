"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, ShieldCheck, Database, Gauge, Bell, ClipboardList,
  ArrowRight, ArrowLeft, Check, Cpu, Waypoints, PlayCircle,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { RiskGauge } from "@/components/ui/gauges";
import { useAuth } from "@/lib/auth/AuthProvider";
import { setOnboarded } from "@/lib/onboarding";

/* ------------------------------------------------------------------ */
/* Step content                                                         */
/* ------------------------------------------------------------------ */
function StepWelcome({ name }: { name: string }) {
  const props = [
    { icon: Activity, title: "Real-time risk scoring", desc: "Physics-informed monitors on live drilling telemetry, fused into one 0–100 score." },
    { icon: ShieldCheck, title: "Documented-event validation", desc: "Every detection is anchored to real GEOL / DDR field records — not synthetic labels." },
    { icon: Database, title: "Field-data replay", desc: "Volve, Bilabri and Eos wells streamed as if live, so you can see the model work." },
  ];
  return (
    <div>
      <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-[12px] font-semibold text-primary">Welcome aboard</span>
      <h2 className="mt-4 text-[30px] font-extrabold leading-tight">Hi {name.split(" ")[0]}, meet DrillGuard.</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        DrillGuard predicts drilling failures — stuck pipe, pack-off, bit wear, stick-slip — before they
        escalate, and warns the crew with lead time to act. Here is how it works in 60 seconds.
      </p>
      <ul className="mt-8 space-y-5">
        {props.map(({ icon: Icon, title, desc }) => (
          <li key={title} className="flex items-start gap-4">
            <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><Icon size={21} /></span>
            <span>
              <span className="block text-[15px] font-semibold">{title}</span>
              <span className="block text-[13px] text-muted">{desc}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepRisk() {
  const models = [
    { icon: Cpu, k: "Random Forest", v: "point classifier — the instantaneous operating state" },
    { icon: Activity, k: "LSTM autoencoder", v: "trend detector — a sequence departing from normal (0.45 weight)" },
    { icon: Waypoints, k: "DTW shape matcher", v: "morphology — the physics-derived failure waveform" },
  ];
  return (
    <div>
      <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-[12px] font-semibold text-primary">Reading the score</span>
      <h2 className="mt-4 text-[28px] font-extrabold leading-tight">One risk score, three models.</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        The gauge fuses three independent monitors into a single coverage-aware score. Tiers escalate
        <span className="font-semibold text-text"> Normal → Watch → Elevated → Action</span> as the physics-predicted pattern builds.
      </p>
      <div className="mt-6 flex items-center gap-8">
        <div className="shrink-0"><RiskGauge value={82} label="HIGH RISK" size={170} showScale denominator={false} labelColor="#e53935" /></div>
        <ul className="space-y-4">
          {models.map(({ icon: Icon, k, v }) => (
            <li key={k} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-primary"><Icon size={17} /></span>
              <span><span className="block text-[14px] font-semibold">{k}</span><span className="block text-[12.5px] text-muted">{v}</span></span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StepLifecycle() {
  const steps = [
    { icon: Gauge, k: "Monitor", v: "Watch the live risk gauge and parameter trends as the well drills." },
    { icon: Bell, k: "Get alerted", v: "When a tier is crossed, an alert fires with its cause and lead time." },
    { icon: ClipboardList, k: "Escalate & resolve", v: "Turn a real alert into an incident, investigate, and close it out." },
  ];
  return (
    <div>
      <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-[12px] font-semibold text-primary">The workflow</span>
      <h2 className="mt-4 text-[28px] font-extrabold leading-tight">From signal to closed incident.</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        DrillGuard connects the whole loop — the alert that fires is traceable all the way to the
        documented field event and the incident you resolve.
      </p>
      <ol className="mt-8 space-y-4">
        {steps.map(({ icon: Icon, k, v }, i) => (
          <li key={k} className="flex items-start gap-4">
            <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-white"><Icon size={20} /></span>
            <span>
              <span className="block text-[15px] font-semibold">{i + 1}. {k}</span>
              <span className="block text-[13px] text-muted">{v}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StepStart({ onInit, onExplore }: { onInit: () => void; onExplore: () => void }) {
  return (
    <div>
      <span className="inline-block rounded-full bg-good-soft px-3 py-1 text-[12px] font-semibold text-good">You’re ready</span>
      <h2 className="mt-4 text-[28px] font-extrabold leading-tight">Choose how to start.</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">Set up a well with the guided wizard, or jump straight in with a real replay dataset.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <button type="button" onClick={onInit} className="group rounded-xl border border-border bg-surface p-5 text-left transition-colors hover:border-primary">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-white"><Waypoints size={22} /></span>
          <div className="mt-4 text-[16px] font-semibold">Initialize a well</div>
          <div className="mt-1 text-[13px] text-muted">Run the 5-step wizard: run mode, well info, configuration, data connection, review.</div>
          <div className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">Start setup <ArrowRight size={15} /></div>
        </button>
        <button type="button" onClick={onExplore} className="group rounded-xl border border-border bg-surface p-5 text-left transition-colors hover:border-primary">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-good text-white"><PlayCircle size={22} /></span>
          <div className="mt-4 text-[16px] font-semibold">Explore with sample data</div>
          <div className="mt-1 text-[13px] text-muted">Jump into Live Monitoring now and load a real Volve / Bilabri replay whenever you like.</div>
          <div className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-good">Open the dashboard <ArrowRight size={15} /></div>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
export default function WelcomePage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const last = 3;

  useEffect(() => { if (ready && !user) router.replace("/login"); }, [ready, user, router]);

  const finish = (dest: string) => { setOnboarded(); router.push(dest); };
  const name = user?.name ?? "there";

  if (!ready || !user) {
    return <div className="grid min-h-screen place-items-center bg-sidebar" data-sidebar="navy"><div className="animate-pulse opacity-80"><Logo /></div></div>;
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
      {/* brand rail */}
      <div data-sidebar="navy" className="relative hidden flex-col justify-between overflow-hidden bg-sidebar px-10 py-10 text-sidebar-text lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-[0.14]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #3b5a94 1px, transparent 0)", backgroundSize: "22px 22px" }} />
        <div className="relative"><Logo /></div>
        <div className="relative">
          <div className="text-[13px] font-semibold uppercase tracking-wide text-sidebar-muted">Getting started</div>
          <ol className="mt-5 space-y-4">
            {["Welcome", "Reading the risk score", "The alert → incident workflow", "Choose how to start"].map((label, i) => (
              <li key={label} className="flex items-center gap-3">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${i < step ? "bg-good text-white" : i === step ? "bg-primary text-white" : "border border-sidebar-border text-sidebar-muted"}`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </span>
                <span className={i === step ? "text-[14px] font-semibold text-sidebar-text" : "text-[14px] text-sidebar-muted"}>{label}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="relative text-[12px] text-sidebar-muted">Validated on Volve, Bilabri &amp; 31/5-7 Eos field data.</div>
      </div>

      {/* content */}
      <div className="flex flex-col bg-bg">
        <div className="flex items-center justify-between px-8 py-5">
          <div className="lg:hidden"><Logo /></div>
          <span className="hidden lg:block" />
          <button type="button" onClick={() => finish("/live-monitoring")} className="text-[13px] font-medium text-muted hover:text-text">Skip intro</button>
        </div>

        <div className="flex flex-1 items-center justify-center px-8 pb-6">
          <div className="w-full max-w-[560px]">
            {step === 0 && <StepWelcome name={name} />}
            {step === 1 && <StepRisk />}
            {step === 2 && <StepLifecycle />}
            {step === 3 && <StepStart onInit={() => finish("/initialize/run-mode")} onExplore={() => finish("/live-monitoring")} />}
          </div>
        </div>

        {/* footer nav */}
        <div className="flex items-center justify-between border-t border-border px-8 py-5">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface px-5 text-[14px] font-medium text-text-2 disabled:opacity-40">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-2 bg-border-strong"}`} />
            ))}
          </div>
          {step < last ? (
            <button type="button" onClick={() => setStep((s) => s + 1)}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-[14px] font-semibold text-white hover:bg-primary-hover">
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={() => finish("/live-monitoring")}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface px-5 text-[14px] font-medium text-primary">
              Do this later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
