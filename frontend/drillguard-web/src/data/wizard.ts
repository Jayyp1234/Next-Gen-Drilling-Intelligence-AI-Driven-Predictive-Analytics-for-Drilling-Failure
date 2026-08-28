/**
 * "Initialize Well" wizard fixtures — every string transcribed from
 * 03_Well_Initialization/Step_01..Step_05 PNGs, in drawn order.
 * DESIGN FIXTURE, not live model output.
 */
import type { Severity } from "@/components/ui/primitives";

/* ------------------------------------------------------------------ */
/* Shared: stepper + routes                                             */
/* ------------------------------------------------------------------ */
export const routes = {
  runMode: "/initialize/run-mode",
  wellInformation: "/initialize/well-information",
  configuration: "/initialize/configuration",
  dataConnection: "/initialize/data-connection",
  review: "/initialize/review",
  liveMonitoring: "/live-monitoring",
} as const;

export const steps = [
  { n: 1, title: "Run Mode", subtitle: "Choose how to run this well", doneSubtitle: "Simulation / Test Mode", href: routes.runMode },
  { n: 2, title: "Well Information", subtitle: "Basic well details", href: routes.wellInformation },
  { n: 3, title: "Configuration", subtitle: "Drilling & operational settings", href: routes.configuration },
  { n: 4, title: "Data Connection", subtitle: "Connect or load data", href: routes.dataConnection },
  { n: 5, title: "Review & Initialize", subtitle: "Validate and start", href: routes.review },
] as const;

export const headerTitle = "Initialize Well";

/* ------------------------------------------------------------------ */
/* STEP 1 — Run Mode                                                    */
/* ------------------------------------------------------------------ */
export const step1 = {
  header: {
    subtitle: "Set up your well and choose how you want to run DrillGuard.",
    rigLabel: "Select Well",
    rangeLabel: "Apr 20 – May 24, 2025",
  },
  heading: "How would you like to run this well?",
  sub: "Choose between live operations (real-time data) or simulation mode (historical or demo data).",
  options: [
    {
      key: "live",
      title: "Live Operations",
      description: "Connect DrillGuard to a live rig and monitor in real-time.",
      bullets: ["Connect to live data stream", "Map drilling parameters", "Validate incoming data quality", "Start real-time monitoring"],
      button: "Set Up Live Connection",
      selected: false,
    },
    {
      key: "sim",
      title: "Simulation / Test Mode",
      description: "Load historical or prepared data and run DrillGuard as if it were live.",
      bullets: ["Upload or select a dataset", "Replay drilling operations", "Test different scenarios", "Analyze with full DrillGuard capabilities"],
      button: "Choose or Upload Dataset",
      selected: true,
    },
  ],
  datasets: {
    title: "Simulation / Test Mode",
    description: "Select a dataset to replay or upload your own.",
    importButton: "Import from Library",
    searchPlaceholder: "Search datasets...",
    tabs: ["Demo Datasets", "Upload Dataset", "My Datasets"],
    activeTab: "Demo Datasets",
    head: ["Dataset Name", "Well", "Field / Location", "Scenario", "Duration", "Data Range", "Status", "Actions"],
    rows: [
      { name: "Volve Well A", well: "VOLVE-A-01", field: "North Sea", scenario: "Normal Drilling", scenarioSev: "good" as Severity, duration: "2h 14m", range: "May 10, 2024 08:00 – 10:14", status: "Ready", statusSev: "good" as Severity, action: "Select" },
      { name: "Volve Well B", well: "VOLVE-B-12", field: "North Sea", scenario: "Stuck Pipe Event", scenarioSev: "medium" as Severity, duration: "1h 42m", range: "May 12, 2024 14:30 – 16:12", status: "Ready", statusSev: "good" as Severity, action: "Select" },
      { name: "Volve Well C", well: "VOLVE-C-07", field: "North Sea", scenario: "Well Control Event", scenarioSev: "high" as Severity, duration: "58m", range: "May 15, 2024 09:10 – 10:08", status: "Ready", statusSev: "good" as Severity, action: "Select" },
      { name: "DeepWater Test", well: "DW-TEST-01", field: "Gulf of Mexico", scenario: "High Torque Trend", scenarioSev: "info" as Severity, duration: "1h 15m", range: "May 18, 2024 11:00 – 12:15", status: "Ready", statusSev: "good" as Severity, action: "Select" },
      { name: "Custom Dataset", well: "—", field: "—", scenario: "User Uploaded", scenarioSev: "purple" as Severity, duration: "—", range: "—", status: "Not Uploaded", statusSev: "medium" as Severity, action: "Upload" },
    ],
    banner: "Selected dataset will be replayed as if it were live data. All alerts, incidents and KPIs will be generated during the simulation.",
  },
  settings: {
    title: "Simulation Settings",
    playbackLabel: "Playback Speed",
    playbackValue: "10×",
    ticks: ["0.5×", "1×", "5×", "10×", "50×", "100×"],
    activeTick: "10×",
    startTime: { label: "Start Time", value: "May 10, 2024 08:00 AM" },
    timeZone: { label: "Time Zone", value: "(UTC+01:00) West Africa Time" },
    endCondition: { label: "End Condition", value: "Run full duration" },
    continue: "Continue to Well Information",
  },
};

/* ------------------------------------------------------------------ */
/* STEP 2 — Well Information                                            */
/* ------------------------------------------------------------------ */
export const wizardHeader = {
  rigLabel: "Volve Well A",
  rangeLabel: "May 10, 2024 08:00 AM",
};

export const step2 = {
  header: { subtitle: "Provide basic information about the well you are initializing." },
  heading: "Well Information",
  sub: "Enter the basic details of the well. This information helps DrillGuard contextualize data and generate accurate insights.",
  sections: [
    {
      title: "General Information",
      rows: [
        [
          { label: "Well Name", value: "Volve Well A", required: true, select: false },
          { label: "Well ID / UWI", value: "VOLVE-A-01", select: false },
          { label: "Field / Location", value: "Volve Field", required: true, select: true },
        ],
        [
          { label: "Country", value: "Norway", select: true },
          { label: "Asset / Block", value: "15/9-A", select: true },
          { label: "Operator", value: "Volve Energy", select: true },
        ],
        [
          { label: "Rig", value: "Volve Drilling Rig 1", select: true },
          { label: "Rig Type", value: "Land", select: true },
          { label: "Spud Date", value: "May 8, 2024 06:00 AM", select: false, icon: "calendar" as const },
        ],
      ],
    },
    {
      title: "Well Classification",
      rows: [
        [
          { label: "Well Type", value: "Development", required: true, select: true },
          { label: "Well Category", value: "Oil", select: true },
          { label: "Well Objective", value: "Primary Production", required: true, select: true },
        ],
      ],
    },
    {
      title: "Depth Information",
      rows: [
        [
          { label: "KB (TVD)", value: "25.0", suffix: "m", select: false },
          { label: "Ground Elevation", value: "18.5", suffix: "m", select: false },
          { label: "Planned TD (TVD)", value: "3,250.0", suffix: "m", select: false },
          { label: "Current Depth (TVD)", value: "0.0", suffix: "m", select: false },
        ],
      ],
    },
    {
      title: "Geographical Information",
      rows: [
        [
          { label: "Latitude", value: "60.123456", suffix: "°", select: false },
          { label: "Longitude", value: "2.987654", suffix: "°", select: false },
          { label: "Water Depth", value: "120.0", suffix: "m", select: false },
          { label: "Time Zone", value: "(UTC+01:00) Oslo", select: true },
        ],
      ],
    },
  ],
  summary: {
    title: "Well Summary",
    description: "Review your well information",
    banner: "You can edit this information anytime from Well Settings after initialization.",
  },
  back: "Back to Run Mode",
  next: "Save & Continue",
};

/** Well Summary KV list — shared by Step 2 and Step 5 (same values in both images). */
export const wellSummary = [
  { k: "Well Name", v: "Volve Well A" },
  { k: "Well ID", v: "VOLVE-A-01" },
  { k: "Field / Location", v: "Volve Field, North Sea" },
  { k: "Operator", v: "Volve Energy" },
  { k: "Rig", v: "Volve Drilling Rig 1" },
  { k: "Well Type", v: "Development" },
  { k: "Well Objective", v: "Primary Production" },
  { k: "Planned TD (TVD)", v: "3,250.0 m" },
  { k: "Spud Date", v: "May 8, 2024 06:00 AM" },
  { k: "Time Zone", v: "(UTC+01:00) Oslo" },
];

/* ------------------------------------------------------------------ */
/* STEP 3 — Configuration                                               */
/* ------------------------------------------------------------------ */
export const step3 = {
  header: { subtitle: "Configure drilling and operational settings for this well." },
  heading: "Drilling & Operational Configuration",
  sub: "Define the drilling setup, equipment, fluids and expected operating ranges.",
  holeSections: {
    title: "Hole Sections & Geometry",
    head: ["Section", "Hole Size (in)", "Top Depth (m)", "Section TD (m)", "Inclination (°)", "Azimuth (°)", "Actions"],
    rows: [
      { section: "1", holeSize: "26.000", top: "0.0", td: "300.0", inc: "0.00", az: "0.00" },
      { section: "2", holeSize: "17.500", top: "0.0", td: "1,200.0", inc: "0.50", az: "15.00" },
      { section: "3", holeSize: "12.250", top: "0.0", td: "2,300.0", inc: "1.20", az: "25.00" },
      { section: "4", holeSize: "8.500", top: "0.0", td: "3,250.0", inc: "2.00", az: "35.00" },
    ],
    addButton: "Add Section",
  },
  drillingParams: {
    title: "Drilling Parameters",
    titleSuffix: "(Planned Ranges)",
    ranges: [
      { label: "Weight on Bit (kN)", min: "20", max: "120" },
      { label: "Rotary Speed (RPM)", min: "60", max: "180" },
      { label: "Pump Rate (L/min)", min: "400", max: "1,200" },
      { label: "Surface Torque (kN·m)", min: "5", max: "40" },
      { label: "Standpipe Pressure (bar)", min: "20", max: "120" },
    ],
  },
  mudSystem: {
    title: "Mud System",
    fields: [
      { label: "Mud Type", value: "Water Based", select: true },
      { label: "Mud Weight (SG)", value: "1.05" },
      { label: "Viscosity (mPa·s)", value: "35" },
      { label: "pH", value: "9.5" },
      { label: "PV (cP)", value: "20" },
      { label: "YP (lb/100ft²)", value: "12" },
      { label: "Gel Strength (10s/10m)", value: "6 / 12" },
      { label: "Filtration (mL)", value: "8.0" },
    ],
  },
  pressureTemp: {
    title: "Pressure & Temperature",
    titleSuffix: "(Expected Ranges)",
    ranges: [
      { label: "Formation Pressure (bar)", min: "100", max: "450" },
      { label: "Bottom Hole Temperature (°C)", min: "20", max: "120" },
      { label: "Fracture Gradient (ppg)", min: "1.60", max: "2.20" },
    ],
  },
  formation: {
    title: "Formation & Lithology",
    titleSuffix: "(Planned)",
    fields: [
      { label: "Primary Formation", value: "Sandstone", select: true },
      { label: "Secondary Formation", value: "Shale", select: true },
      { label: "Tertiary Formation", value: "Limestone", select: true },
    ],
    hazardsLabel: "Expected Hazards",
    hazards: ["High Pressure", "Lost Circulation"],
  },
  equipment: {
    title: "Equipment Configuration",
    fields: [
      { label: "Top Drive Model", value: "Varco TDS-11SA", select: true },
      { label: "BOP Stack", value: '18 3/4" 10K', select: true },
      { label: "Mud Pumps", value: "(2) × 1,600 HP", select: true },
      { label: "Kelly Size (in)", value: "4.5" },
      { label: "Drill Pipe OD (in)", value: "5.000" },
      { label: "HWDP OD (in)", value: "5.000" },
    ],
  },
  summary: {
    title: "Configuration Summary",
    description: "Review your configuration",
    geometryLabel: "Hole Geometry",
    geometryCount: "4 sections",
    geometry: [
      { size: "26.000 in", range: "0.0 m – 300.0 m" },
      { size: "17.500 in", range: "300.0 m – 1,200.0 m" },
      { size: "12.250 in", range: "1,200.0 m – 2,300.0 m" },
      { size: "8.500 in", range: "2,300.0 m – 3,250.0 m" },
    ],
    kv: [
      { k: "Planned TD (TVD)", v: "3,250.0 m" },
      { k: "Well Type", v: "Development" },
      { k: "Mud Type", v: "Water Based (SG 1.05)" },
      { k: "Min – Max MW", v: "1.05 – 1.20 SG" },
      { k: "Target Formation", v: "Sandstone / Shale" },
    ],
    hazardsLabel: "Expected Hazards",
    hazards: ["High Pressure", "Lost Circulation"],
    banner: "You can modify these settings later in Well Settings.",
  },
  back: "Back to Well Information",
  next: "Save & Continue",
};

/* ------------------------------------------------------------------ */
/* STEP 4 — Data Connection                                             */
/* ------------------------------------------------------------------ */
export const step4 = {
  header: { subtitle: "Connect or load data to power DrillGuard for this well." },
  heading: { plain: "Data", accent: "Connection" },
  sub: "Connect live data from a rig source or load a dataset for simulation. Then map the required parameters.",
  source: {
    title: "1. Select Data Source",
    options: [
      { title: "Simulation / Historical Data", description: "Load a dataset and replay as live data.", selected: true },
      { title: "Live Data Connection", description: "Connect to a rig or real-time data stream.", selected: false },
    ],
    datasetLabel: "Select Dataset",
    datasetValue: "Volve Well B – Stuck Pipe Event",
    datasetChip: "Recommended",
    info: [
      { icon: "clock", label: "Duration", value: "1h 42m" },
      { icon: "calendar", label: "Start Time", value: "May 10, 2024 08:00 AM" },
      { icon: "activity", label: "Data Frequency", value: "1 sec" },
      { icon: "table", label: "Records", value: "6,120" },
      { icon: "flag", label: "Scenario", value: "Stuck Pipe", sev: "high" as Severity },
      { icon: "database", label: "Source", value: "Volve Historical Library" },
    ],
    playbackTitle: "Playback Settings",
    playbackSpeed: { label: "Playback Speed", value: "10× (Fast)" },
    startFrom: { label: "Start From", value: "Beginning" },
    previewButton: "Preview Data",
    connectionType: { label: "Connection Type", value: "WITSML 2.1" },
    endpoint: { label: "Endpoint / Server URL", value: "witsml://rig12.volve.com:8080" },
    auth: { label: "Authentication", value: "Token / API Key" },
    connectButton: "Connect",
  },
  mapping: {
    title: "2. Map Drilling Parameters",
    description: "Map incoming data fields to DrillGuard parameters.",
    autoMap: "Auto Map",
    reset: "Reset Mapping",
    searchPlaceholder: "Search parameters...",
    head: ["DrillGuard Parameter", "Description", "Data Source Field", "Unit", "Sample Value", "Data Quality", "Status", ""],
    rows: [
      { param: "Hook Load", desc: "Weight on bit / Hook load", field: "hkld", unit: "kN", sample: "89.5", quality: "100%", status: "Mapped" },
      { param: "Weight on Bit", desc: "Downward force on bit", field: "wob", unit: "kN", sample: "45.2", quality: "100%", status: "Mapped" },
      { param: "Rotary Speed", desc: "Top drive rotary speed", field: "rpm", unit: "RPM", sample: "120", quality: "100%", status: "Mapped" },
      { param: "Pump Pressure", desc: "Mud pump standpipe pressure", field: "spp", unit: "bar", sample: "95.0", quality: "100%", status: "Mapped" },
      { param: "Flow Rate", desc: "Total circulating flow rate", field: "flow", unit: "L/min", sample: "620", quality: "98%", status: "Mapped" },
      { param: "Torque", desc: "Top drive torque", field: "torq", unit: "kN·m", sample: "8.7", quality: "98%", status: "Mapped" },
      { param: "Block Position", desc: "Block height above bottom", field: "block_pos", unit: "m", sample: "28.5", quality: "100%", status: "Mapped" },
      { param: "Standpipe Temp.", desc: "Mud temperature at standpipe", field: "temp", unit: "°C", sample: "32.1", quality: "96%", status: "Mapped" },
    ],
    addButton: "Add Custom Parameter",
  },
  status: {
    title: "Connection Status",
    chip: "Ready",
    checks: [
      { label: "Dataset loaded successfully", value: "6,120 records" },
      { label: "Time range validated", value: "May 10, 08:00 – 09:42" },
      { label: "All required parameters mapped", value: "8 / 8" },
      { label: "Data quality verified", value: "96% average" },
      { label: "System ready for replay", value: "OK" },
    ],
    banner: "You can review the data quality or er-map parameters if needed.",
    bannerButton: "View Data Quality Report",
  },
  coverage: {
    title: "Data Coverage",
    chip: "Good (96%)",
    rows: [
      { k: "Total Parameters", v: "8" },
      { k: "Mapped", v: "8" },
      { k: "Unmapped", v: "0" },
      { k: "Optional", v: "2" },
    ],
    pct: 96,
    ticks: ["0%", "50%", "100%"],
  },
  preview: {
    title: "Sample Data Preview",
    head: ["Time", "WOB (kN)", "RPM", "Pump Pres. (bar)", "Flow (L/min)"],
    rows: [
      ["08:00:00", "45.2", "120", "95.0", "620"],
      ["08:00:01", "44.8", "121", "95.5", "618"],
      ["08:00:02", "45.6", "120", "95.8", "621"],
      ["...", "...", "...", "...", "..."],
    ],
    footer: "Previewing first 3 of 6,120 records",
    moreButton: "View More",
  },
  back: "Back to Configuration",
  next: "Save & Continue",
};

/* ------------------------------------------------------------------ */
/* STEP 5 — Review & Initialize                                         */
/* ------------------------------------------------------------------ */
export const step5 = {
  header: { subtitle: "Review all settings and initialize the well." },
  heading: "5. Review & Initialize",
  sub: "Review all information below. Once confirmed, DrillGuard will initialize the well and begin monitoring.",
  ready: {
    title: "All systems ready",
    description: "Your well is ready to be initialized. All required information has been provided and validated.",
    button: "Pre-Initialization Check",
  },
  cards: [
    {
      icon: "run" as const,
      title: "Run Mode",
      subtitle: "Simulation / Test Mode",
      stacked: true,
      kv: [
        { k: "Dataset", v: "Volve Well B – Stuck Pipe Event" },
        { k: "Duration", v: "1h 42m" },
        { k: "Start Time", v: "May 10, 2024 08:00 AM" },
        { k: "Playback Speed", v: "10x (Fast)" },
        { k: "Records", v: "6,120" },
      ],
      link: routes.runMode,
    },
    {
      icon: "well" as const,
      title: "Well Information",
      stacked: false,
      kv: [
        { k: "Well Name", v: "Volve Well A" },
        { k: "Well ID", v: "VOLVE-A-01" },
        { k: "Field / Location", v: "Volve Field, North Sea" },
        { k: "Operator", v: "Volve Energy" },
        { k: "Rig", v: "Volve Drilling Rig 1" },
        { k: "Well Type", v: "Development" },
        { k: "Well Objective", v: "Primary Production" },
      ],
      link: routes.wellInformation,
    },
    {
      icon: "config" as const,
      title: "Configuration",
      stacked: false,
      kv: [
        { k: "Hole Sections", v: "4" },
        { k: "Planned TD (TVD)", v: "3,250.0 m" },
        { k: "Mud System", v: "Water Based (SG 1.05)" },
        { k: "Min – Max MW", v: "1.05 – 1.20 SG" },
        { k: "Target Formation", v: "Sandstone / Shale" },
      ],
      hazardsLabel: "Expected Hazards",
      hazards: ["High Pressure", "Lost Circulation"],
      link: routes.configuration,
    },
    {
      icon: "data" as const,
      title: "Data Connection",
      stacked: false,
      kv: [
        { k: "Connection Type", v: "WITSML 2.1" },
        { k: "Endpoint", v: "witsml://rig12.volve.com:8080" },
        { k: "Authentication", v: "Token / API Key" },
        { k: "Parameters Mapped", v: "8 / 8" },
        { k: "Data Quality", v: "96% average" },
      ],
      link: routes.dataConnection,
    },
  ],
  viewDetails: "View Details",
  alerts: {
    title: "Alerts & Notifications",
    kv: [
      { k: "Alert Profiles", v: "Default Drilling Risk Profile" },
      { k: "Alert Thresholds", v: "8 Active" },
      { k: "Notification Channels", v: "Email, In-App, SMS", mail: true },
      { k: "Escalation Contacts", v: "3 Users" },
    ],
    link: "View / Edit Alert Settings",
  },
  initSummary: {
    title: "Initialization Summary",
    checks: [
      "Run mode validated",
      "Well information validated",
      "Configuration validated",
      "Data connection verified",
      "Parameter mapping complete",
      "Data quality check passed",
      "Alert profile loaded",
    ],
    readyTitle: "Ready to Initialize",
    readyDescription: "DrillGuard will start processing data and monitoring the well.",
    estimatedLabel: "Estimated Start",
    estimatedValue: "May 10, 2024 08:00 AM",
    estimatedSub: "(In 2 min)",
  },
  warning: "Once initialized, you can start monitoring immediately. You can modify most settings later in Well Settings.",
  back: "Back to Data Connection",
  next: "Initialize Well & Start Monitoring",
  summary: {
    title: "Well Summary",
    nextTitle: "What happens next?",
    next: [
      "Data playback will start at the selected start time.",
      "Real-time monitoring, risk scoring and alerts will be active.",
      "All events and KPIs will be recorded in the incident log.",
    ],
    banner: "You can pause/stop the simulation at any time from Live Monitoring.",
  },
};
