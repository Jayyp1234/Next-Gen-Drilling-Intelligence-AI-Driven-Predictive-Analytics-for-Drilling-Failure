/**
 * Settings fixtures — values exactly as drawn in
 * 02_Core_App_Screens/08_Settings.png.
 * DESIGN FIXTURE. Only the Theme segmented control and the (extra) "Light
 * sidebar" toggle are wired to real app state (src/lib/theme.tsx); every
 * other field, toggle and link is static.
 */

/* ---- Header -------------------------------------------------------- */
export const header = {
  title: "Settings",
  subtitle: "Manage your account, system preferences and configurations",
  rigLabel: "OML18-W12",
  rangeLabel: "Apr 20 – May 24, 2025",
  action: "Save Changes",
};

/* ---- Tabs ---------------------------------------------------------- */
export const tabs = [
  "General",
  "Notifications",
  "Users & Access",
  "Data & Integrations",
  "Alerts & Thresholds",
  "System",
  "Security",
  "Audit Log",
];
export const activeTab = "General";

/* ---- Shared row shapes --------------------------------------------- */
export type FieldFixture = { label: string; value: string; select?: boolean };
export type ToggleFixture = { label: string; description: string; on: boolean };

/* ---- Card 1: General Settings -------------------------------------- */
export const general = {
  title: "General Settings",
  description: "Configure basic system and display preferences.",
  /** Each entry is one row; a row with two fields renders as a 2-col grid. */
  rows: [
    [{ label: "System Name", value: "DrillGuard", select: false }],
    [{ label: "Company", value: "DrilCorp Energy", select: false }],
    [{ label: "Time Zone", value: "(UTC+01:00) West Africa Time" }],
    [
      { label: "Date Format", value: "May 24, 2025" },
      { label: "Time Format", value: "12 Hour (02:30 PM)" },
    ],
    [
      { label: "Units System", value: "Field Units (ft, bbl, psi)" },
      { label: "Language", value: "English (US)" },
    ],
  ] as FieldFixture[][],
  toggles: [
    { label: "Enable compact mode", description: "Reduce spacing for more data on screen", on: false },
  ] as ToggleFixture[],
  banner: "Changes to general settings are applied immediately.",
};

/* ---- Card 2: Display Preferences ----------------------------------- */
export const display = {
  title: "Display Preferences",
  description: "Customize how information is displayed across the system.",
  themeLabel: "Theme",
  themeOptions: [
    { id: "light" as const, label: "Light", icon: "sun" as const },
    { id: "system" as const, label: "System", icon: "monitor" as const },
  ],
  colorLabel: "Primary Color",
  colors: [
    { name: "Blue", hex: "#1d5af0", selected: true },
    { name: "Green", hex: "#15803d", selected: false },
    { name: "Purple", hex: "#7c3aed", selected: false },
    { name: "Orange", hex: "#f59e0b", selected: false },
    { name: "Red", hex: "#e53935", selected: false },
    { name: "Slate", hex: "#475569", selected: false },
  ],
  fields: [
    { label: "Dashboard Default View", value: "Overview" },
    { label: "Default Data Refresh Interval", value: "30 seconds" },
  ] as FieldFixture[],
  toggles: [
    { label: "Show animations", description: "Enable subtle animations across the platform", on: true },
    { label: "Show help tips", description: "Display contextual help and tips", on: true },
    { label: "Confirm before deleting", description: "Show confirmation dialog before deleting data", on: true },
  ] as ToggleFixture[],
  /** Not in the design — wired to useTheme().setSidebar (on = light sidebar). */
  sidebarToggle: { label: "Light sidebar", description: "Use the white sidebar style" },
};

/* ---- Card 3: Regional & Operational Defaults ----------------------- */
export const regional = {
  title: "Regional & Operational Defaults",
  description: "Set defaults for operations and calculations.",
  fields: [
    { label: "Depth Reference", value: "TVD" },
    { label: "Pressure Gradient Unit", value: "psi/ft" },
    { label: "Temperature Unit", value: "°F" },
    { label: "Volume Unit", value: "bbl" },
    { label: "Weight Unit", value: "lb" },
  ] as FieldFixture[],
  checkbox: {
    checked: true,
    label: "Use well-specific defaults when available",
    description: "Override global defaults with well configuration when available",
  },
};

/* ---- Right column: Account Information ----------------------------- */
export const account = {
  title: "Account Information",
  rows: [
    { k: "Name", v: "Drilling Engineer" },
    { k: "Email", v: "engineer@drilcorp.com" },
    { k: "Role", v: "Drilling Engineer" },
    { k: "Team", v: "Drilling Team" },
  ],
  link: "Manage Account",
};

/* ---- Right column: System Information ------------------------------ */
export const system = {
  title: "System Information",
  rows: [
    { k: "Version", v: "v2.4.1" },
    { k: "Environment", v: "Production" },
    { k: "Last Updated", v: "May 24, 2025 10:24 AM" },
    { k: "Data Center", v: "Lagos, Nigeria" },
  ],
  link: "View System Status",
};

/* ---- Right column: Support & Resources ----------------------------- */
export type SupportIcon = "guide" | "help" | "contact" | "new" | "replay";
export const support = {
  title: "Support & Resources",
  items: [
    { label: "Replay intro tour", icon: "replay" as SupportIcon, action: "welcome" as const },
    { label: "User Guide", icon: "guide" as SupportIcon },
    { label: "Help Center", icon: "help" as SupportIcon },
    { label: "Contact Support", icon: "contact" as SupportIcon },
    { label: "What's New", icon: "new" as SupportIcon },
  ],
};
