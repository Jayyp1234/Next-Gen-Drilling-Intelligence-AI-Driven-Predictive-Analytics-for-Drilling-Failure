"use client";

/**
 * Shared pieces for the incident detail + report routes.
 * Kept out of the page files so the routes stay thin and the helpers are
 * unit-obvious. Nothing here reads Date.now()/Math.random() during render —
 * the trend series is a deterministic representative curve keyed off severity.
 */
import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Card, Button, type Severity } from "@/components/ui/primitives";
import type { IncidentStatus, Sev } from "@/lib/incidents/store";
import { TorqueTrend } from "./charts";

/* ---- status → chip colour ------------------------------------------- */
export const statusSev: Record<IncidentStatus, Severity> = {
  Open: "high",
  "Under Investigation": "medium",
  Resolved: "good",
  Closed: "grey",
};

/* ---- causes / actions per mechanism --------------------------------- */
type CA = { causes: string[]; actions: string[] };

const GENERIC: CA = {
  causes: [
    "Abnormal parameter trend versus the drilling baseline",
    "Sensor or telemetry anomaly",
    "Operational change not yet logged",
  ],
  actions: [
    "Verify the signal against baseline and thresholds",
    "Escalate to the drilling engineer",
    "Continue monitoring the trend closely",
    "Document findings in the incident log",
  ],
};

const BY_TYPE: Record<string, CA> = {
  "Stuck Pipe": {
    causes: [
      "Differential sticking against a permeable formation",
      "Pack-off from inadequate hole cleaning",
      "Mechanical restriction — ledge, key-seat or dogleg",
    ],
    actions: [
      "Reduce weight on bit and pick up off bottom",
      "Monitor torque and drag closely",
      "Work pipe up and down gently",
      "Prepare for back-off if the trend continues",
    ],
  },
  "Bit Wear": {
    causes: [
      "Dull or broken PDC cutters",
      "Elevated mechanical specific energy (MSE)",
      "Falling ROP at constant weight on bit",
    ],
    actions: [
      "Re-baseline MSE and ROP for the section",
      "Optimise WOB / RPM to reduce specific energy",
      "Plan a bit trip if ROP keeps falling",
      "Record dull grading on the next trip",
    ],
  },
  "Stick-Slip": {
    causes: [
      "Torsional oscillation of the drillstring",
      "BHA harmonic resonance",
      "High bit friction at low rotary speed",
    ],
    actions: [
      "Increase RPM and reduce weight on bit",
      "Enable soft-torque / anti-stick control",
      "Improve mud lubricity",
      "Monitor surface torque oscillation",
    ],
  },
  "Pack-Off": {
    causes: [
      "Cuttings accumulation in the annulus",
      "Insufficient annular velocity",
      "Wellbore instability / sloughing shale",
    ],
    actions: [
      "Increase flow rate to improve hole cleaning",
      "Circulate bottoms-up before drilling ahead",
      "Perform wiper trips across the interval",
      "Watch standpipe pressure for restriction",
    ],
  },
  "Differential Sticking": {
    causes: [
      "Overbalanced mud across a permeable zone",
      "Thick filter-cake build-up",
      "Stationary pipe held against the wall",
    ],
    actions: [
      "Reduce overbalance where safe to do so",
      "Spot a lubricant / spotting pill",
      "Keep the pipe moving and rotating",
      "Work pipe within safe tension limits",
    ],
  },
  "Loss Circulation": {
    causes: [
      "Fractured or vugular formation",
      "Excessive equivalent circulating density",
      "Depleted / low-pressure zone",
    ],
    actions: [
      "Reduce ECD and pump rate",
      "Spot a lost-circulation-material pill",
      "Monitor returns and pit volume",
      "Prepare to set casing if losses persist",
    ],
  },
  "Kick / Well Control": {
    causes: [
      "Formation pressure exceeding hydrostatic",
      "Insufficient mud weight",
      "Swabbing while tripping out",
    ],
    actions: [
      "Shut in the well per the well-control procedure",
      "Read SIDPP and SICP",
      "Weight up the active mud system",
      "Initiate the driller's method to circulate out",
    ],
  },
  "Equipment Failure": {
    causes: [
      "Mechanical fatigue or wear",
      "Loss of hydraulic or electrical supply",
      "Sensor or control-system fault",
    ],
    actions: [
      "Switch to the standby / redundant unit",
      "Isolate the failed component",
      "Raise a maintenance work order",
      "Inspect before returning to service",
    ],
  },
};

export function causesActions(type: string): CA {
  return BY_TYPE[type] ?? GENERIC;
}

/* ---- representative trend (Last 30 rows) ----------------------------- */
// Fixed 0..1 ramp — scaled by severity so higher-severity incidents show a
// steeper rise. Integer output only (no SVG-float hydration hazard).
const SHAPE = [
  0.24, 0.22, 0.26, 0.23, 0.21, 0.25, 0.27, 0.24, 0.22, 0.28,
  0.26, 0.3, 0.28, 0.33, 0.31, 0.36, 0.4, 0.44, 0.48, 0.53,
  0.57, 0.62, 0.66, 0.71, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0,
];

export function DetailTrend({ sev }: { sev: Sev }) {
  const peak = sev === "high" ? 92 : sev === "medium" ? 68 : 44;
  const data = SHAPE.map((s, i) => ({ i, v: Math.round(peak * s) }));
  return (
    <TorqueTrend
      data={data}
      tickIdx={[0, 9, 19, 29]}
      tickLabels={["−30", "−20", "−10", "now"]}
      yTicks={[0, 25, 50, 75, 100]}
      height={185}
    />
  );
}

/* ---- not-found empty state ------------------------------------------ */
export function IncidentNotFound() {
  return (
    <div className="p-5">
      <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-muted">
          <FileQuestion size={26} />
        </span>
        <h3 className="text-[17px] font-semibold text-text">Incident not found</h3>
        <p className="max-w-md text-[13px] leading-relaxed text-muted">
          This incident isn&rsquo;t in the current session. Documented incidents come
          from the loaded replay dataset — load one from the run-mode screen, or head
          back to the incidents list.
        </p>
        <Link href="/incidents" className="mt-1">
          <Button variant="outline">Back to Incidents</Button>
        </Link>
      </Card>
    </div>
  );
}
