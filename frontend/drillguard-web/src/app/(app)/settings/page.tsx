"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardHeading,
  Button,
  Field,
  Tabs,
  Checkbox,
  InfoBanner,
  ArrowLink,
} from "@/components/ui/primitives";
import { useTheme } from "@/lib/theme";
import {
  Save,
  Settings as SettingsIcon,
  Monitor,
  Sun,
  Globe,
  User,
  Server,
  HelpCircle,
  BookOpen,
  LifeBuoy,
  MessageCircle,
  Sparkles,
  PlayCircle,
  ArrowRight,
  Check,
} from "lucide-react";
import * as d from "@/data/settings";
import { resetOnboarding } from "@/lib/onboarding";
import { ToggleRow, InfoRow, Segmented, ColorSwatches } from "./_components/SettingsRows";
import { NotificationsCard } from "./_components/NotificationsCard";

const themeIcon = {
  sun: <Sun size={18} />,
  monitor: <Monitor size={18} />,
};

const supportIcon: Record<d.SupportIcon, React.ReactNode> = {
  guide: <BookOpen size={18} className="text-text-2" />,
  help: <LifeBuoy size={18} className="text-text-2" />,
  contact: <MessageCircle size={18} className="text-text-2" />,
  new: <Sparkles size={18} className="text-text-2" />,
  replay: <PlayCircle size={18} className="text-primary" />,
};

type ThemeMode = "light" | "system";

export default function SettingsPage() {
  const { sidebar, setTheme, setSidebar } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState(d.activeTab);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  const replayIntro = () => {
    resetOnboarding();
    router.push("/welcome");
  };

  const [saved, setSaved] = useState(false);
  const saveSettings = () => {
    // Display + sidebar prefs already persist live; this confirms the action.
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const onThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    if (mode === "light") {
      setTheme("light");
      return;
    }
    // "System": follow the OS preference. window is only touched inside the
    // click handler, so there is no hydration hazard.
    const prefersDark =
      typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  };

  return (
    <>
      <PageHeader
        title={d.header.title}
        subtitle={d.header.subtitle}
        rigLabel={d.header.rigLabel}
        rangeLabel={d.header.rangeLabel}
        rangeIcon="calendar"
        action={
          <Button icon={saved ? <Check size={16} /> : <Save size={16} />} onClick={saveSettings}>
            {saved ? "Saved" : d.header.action}
          </Button>
        }
      />

      <div className="space-y-4 p-5">
        {/* ---- Tabs --------------------------------------------------- */}
        <Tabs items={d.tabs} active={tab} onChange={setTab} />

        {/* ---- Body grid: [General | Display | right col] / [Regional] -- */}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.85fr)] items-start gap-4">
          {/* ---- General Settings -------------------------------------- */}
          <Card>
            <CardHeading
              icon={<SettingsIcon size={22} />}
              title={d.general.title}
              description={d.general.description}
            />
            <div className="space-y-4">
              {d.general.rows.map((row, i) =>
                row.length === 1 ? (
                  <Field key={i} label={row[0].label} value={row[0].value} select={row[0].select ?? true} />
                ) : (
                  <div key={i} className="grid grid-cols-2 gap-4">
                    {row.map((f) => (
                      <Field key={f.label} label={f.label} value={f.value} select={f.select ?? true} />
                    ))}
                  </div>
                )
              )}
              {d.general.toggles.map((t) => (
                <ToggleRow key={t.label} label={t.label} description={t.description} on={t.on} />
              ))}
              <InfoBanner>{d.general.banner}</InfoBanner>
            </div>
          </Card>

          {/* ---- Display Preferences ----------------------------------- */}
          <Card>
            <CardHeading
              icon={<Monitor size={22} />}
              title={d.display.title}
              description={d.display.description}
            />
            <div className="space-y-4">
              <div>
                <span className="mb-1.5 block text-[13px] font-medium text-text-2">{d.display.themeLabel}</span>
                <Segmented
                  options={d.display.themeOptions.map((o) => ({ id: o.id, label: o.label, icon: themeIcon[o.icon] }))}
                  value={themeMode}
                  onChange={onThemeChange}
                />
              </div>
              <div>
                <span className="mb-1.5 block text-[13px] font-medium text-text-2">{d.display.colorLabel}</span>
                <ColorSwatches colors={d.display.colors} />
              </div>
              {d.display.fields.map((f) => (
                <Field key={f.label} label={f.label} value={f.value} />
              ))}
              {d.display.toggles.map((t) => (
                <ToggleRow key={t.label} label={t.label} description={t.description} on={t.on} />
              ))}
              {/* Extra row (not in the design): wired to the app's sidebar style */}
              <ToggleRow
                label={d.display.sidebarToggle.label}
                description={d.display.sidebarToggle.description}
                on={sidebar === "light"}
                onToggle={(next) => setSidebar(next ? "light" : "navy")}
              />
            </div>
          </Card>

          {/* ---- Right column: stacked cards --------------------------- */}
          <div className="row-span-2 space-y-4">
            {/* REAL delivery settings — phone, provider status, live test */}
            <NotificationsCard />

            <Card>
              <CardHeading icon={<User size={22} />} title={d.account.title} />
              <div>
                {d.account.rows.map((r) => (
                  <InfoRow key={r.k} k={r.k} v={r.v} />
                ))}
              </div>
              <div className="mt-4">
                <ArrowLink boxed center>
                  {d.account.link}
                </ArrowLink>
              </div>
            </Card>

            <Card>
              <CardHeading icon={<Server size={22} />} title={d.system.title} />
              <div>
                {d.system.rows.map((r) => (
                  <InfoRow key={r.k} k={r.k} v={r.v} />
                ))}
              </div>
              <div className="mt-4">
                <ArrowLink boxed center>
                  {d.system.link}
                </ArrowLink>
              </div>
            </Card>

            <Card>
              <CardHeading icon={<HelpCircle size={22} />} title={d.support.title} />
              <div className="space-y-2.5">
                {d.support.items.map((it) => {
                  const cls =
                    "flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-left text-[14px] font-medium text-text transition-colors hover:bg-surface-2";
                  return "action" in it && it.action === "welcome" ? (
                    <button key={it.label} type="button" onClick={replayIntro} className={cls}>
                      {supportIcon[it.icon]}
                      <span className="flex-1">{it.label}</span>
                      <ArrowRight size={16} className="text-primary" />
                    </button>
                  ) : (
                    <a key={it.label} href="#" className={cls}>
                      {supportIcon[it.icon]}
                      <span className="flex-1">{it.label}</span>
                      <ArrowRight size={16} className="text-primary" />
                    </a>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ---- Regional & Operational Defaults (spans cols 1–2) ------ */}
          <Card className="col-span-2">
            <CardHeading
              icon={<Globe size={22} />}
              title={d.regional.title}
              description={d.regional.description}
            />
            <div className="grid grid-cols-5 gap-4">
              {d.regional.fields.map((f) => (
                <Field key={f.label} label={f.label} value={f.value} />
              ))}
            </div>
            <div className="mt-5">
              <Checkbox checked={d.regional.checkbox.checked} label={d.regional.checkbox.label} />
              <p className="mt-1 pl-[26px] text-[13px] text-muted">{d.regional.checkbox.description}</p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
