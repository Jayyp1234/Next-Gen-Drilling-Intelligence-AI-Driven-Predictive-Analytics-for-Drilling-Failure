"""
STEP 0 on VOLVE proper: mine the official daily drilling reports (DDRS WITSML,
via the Equinor Volve release) for documented events, and map them into the
depth intervals the USROP time-series actually covers.

Source: ml-pipeline/data/volve_ddr/volve_ddr_all.parquet — all 1,759 DDRs
(HuggingFace mirror bengsoon/volve_daily_drilling_report of the Equinor Volve
data-sharing release). LICENCE: Equinor Open Data Licence (attribution,
non-commercial, share-alike) — the mirror's cc-by-4.0 relabel is not
authoritative; cite "Equinor Volve data sharing".

Why this beats the Bilabri GEOL mining: each DDR carries per-ACTIVITY records
with their own measured depth and start/end timestamps, plus a daily summary
(sum24Hr) and structured state fields — so an event candidate here has
activity-level depth/time provenance, not a 24-h daily interval.

Identity handling: operator wellbore names (USROP file names) do not all match
Sodir registry names — "15/9-F-15 S" is registry 15/9-F-15 A. Rather than trust
any mapping, this script EMPIRICALLY matches each DDR wellbore's drilled MD
range/dates against each USROP file's MD range and reports the overlap, then
uses the confirmed mapping.

Same honesty rule as the Bilabri extractor: keyword hits are CANDIDATES with
verbatim quotes for human adjudication, not labels. The negation and
false-positive classes found there (kick-off = sidetrack op; flow check =
routine; swab on pump = component) are carried over, plus DDRS-specific
vocabulary (overpull, took weight, tight spot, wash & ream, ballooning, gain).

Run:
    .venv/bin/python ml-pipeline/etl/volve_ddr_step0.py
"""

import os
import re

import numpy as np
import pandas as pd

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ART = os.path.join(REPO, "ml-pipeline", "artifacts")
PARQUET = os.path.join(REPO, "ml-pipeline", "data", "volve_ddr",
                       "volve_ddr_all.parquet")

# USROP file -> MD interval covered (from data_inventory.csv)
USROP_INTERVALS = {
    "15/9-F-5": (2828.2, 3792.2),
    "15/9-F-7": (301.2, 633.5),
    "15/9-F-9": (225.2, 633.5),
    "15/9-F-9 A": (491.0, 1206.0),
    "15/9-F-14": (987.9, 3466.0),
    "15/9-F-15": (1306.5, 4065.3),
    "15/9-F-15 S(reg. A)": (1400.5, 4090.0),
}

EVENT_LEXICON = {
    "stuck_pipe": ("HIGH", [r"\bstuck\b", r"stuck\s+pipe", r"differentially\s+stuck"]),
    "pack_off": ("HIGH", [r"pack(?:ed)?[\s\-]?off", r"packoff", r"bridg(?:e|ed|ing)"]),
    "lost_circulation": ("HIGH", [r"lost\s+(?:circulation|returns)", r"total\s+loss",
                                  r"\bLCM\b", r"los(?:s|ses|ing)\s+(?:of\s+)?(?:mud|returns)",
                                  r"mud\s+loss(?:es)?"]),
    "well_control": ("HIGH", [r"\bkick(?![\s\-]?off)\b", r"\binflux\b", r"\bgain(?:ed)?\b",
                              r"shut[\s\-]?in\b", r"well\s+control",
                              r"\bswab(?:bed|bing)?\b(?!\s+on\b)(?![^.]{0,20}\bpump)"]),
    "twist_off_fishing": ("HIGH", [r"twist[\s\-]?off", r"\bfishing\b", r"\bfish\b",
                                   r"back[\s\-]?off", r"washout", r"\bjunk\b"]),
    "tight_hole_overpull": ("PRECURSOR", [r"tight\s+(?:hole|spot)", r"over[\s\-]?pull",
                                          r"took\s+weight", r"excessive\s+drag",
                                          r"high\s+drag", r"\bjar(?:red|ring)?\b"]),
    "hole_cleaning": ("PRECURSOR", [r"back[\s\-]?ream", r"wash(?:ed)?\s*(?:&|and)\s*ream",
                                    r"hole\s+cleaning", r"cuttings\s+bed",
                                    r"poor\s+returns", r"\bfill\b(?=[^.]{0,30}bottom)"]),
    "ballooning_seepage": ("PRECURSOR", [r"balloon(?:ing)?", r"seepage",
                                         r"minor\s+loss(?:es)?"]),
    "equipment_failure": ("HIGH", [r"(?:mud\s+)?motor\s+fail", r"MWD\s+fail",
                                   r"tool\s+fail", r"pump\s+fail", r"wash[\s\-]?out\s+in\s+string"]),
}
NEGATION_CUES = r"\b(?:no|not|nil|none|without|free\s+of|clear\s+of)\b"


def _norm(v):
    return "" if v is None else str(v).strip()


def _scan(text):
    hits = []
    for sent in re.split(r"(?<=[.;])\s+|\n", text or ""):
        low = sent.lower().strip()
        if not low:
            continue
        for etype, (sev, pats) in EVENT_LEXICON.items():
            for pat in pats:
                m = re.search(pat, low, re.IGNORECASE)
                if m:
                    before = " ".join(low[:m.start()].split()[-5:])
                    hits.append(dict(event_type=etype, severity=sev,
                                     matched=m.group(0), quote=sent.strip()[:400],
                                     negated=bool(re.search(NEGATION_CUES, before))))
                    break
    return hits


def main():
    df = pd.read_parquet(PARQUET)

    # ---- empirical wellbore -> USROP identity mapping ----------------------
    print("=" * 84)
    print("DDR wellbore drilled ranges vs USROP file intervals (identity check)")
    print("=" * 84)
    ranges = {}
    for wb, grp in df.groupby("nameWellbore"):
        mds = []
        for st in grp["statusInfo"]:
            for s in (st if st is not None else []):
                try:
                    v = float(s.get("md") or "nan")
                    if np.isfinite(v) and 0 < v < 6000:
                        mds.append(v)
                except (TypeError, ValueError):
                    pass
        if mds:
            ranges[wb] = (min(mds), max(mds), len(grp))
    # Identity is by NAME, never by depth-range overlap — different wells reach
    # similar depths, so geometric matching maps everything to something. The
    # one alias is operator "15/9-F-15 S" = registry/DDR "15/9-F-15 A"
    # (established from Sodir: KOP 1381 m vs USROP start 1400.55, TD 4095 vs
    # 4090). Geometry is printed as CONFIRMATION of the named pairs only.
    NAME_MAP = {
        "NO 15/9-F-5": "15/9-F-5",
        "NO 15/9-F-7": "15/9-F-7",
        "NO 15/9-F-9": "15/9-F-9",
        "NO 15/9-F-9 A": "15/9-F-9 A",
        "NO 15/9-F-14": "15/9-F-14",
        "NO 15/9-F-15": "15/9-F-15",
        "NO 15/9-F-15 A": "15/9-F-15 S(reg. A)",
    }
    mapping = {}
    for wb, (lo, hi, n) in sorted(ranges.items()):
        uf = NAME_MAP.get(wb)
        tag = ""
        if uf:
            mapping[wb] = uf
            ulo, uhi = USROP_INTERVALS[uf]
            ov = max(0.0, min(hi, uhi) - max(lo, ulo))
            frac = ov / (uhi - ulo)
            tag = (f"  -> USROP {uf} (covers {frac:.0%} of its interval"
                   f"{'' if frac > 0.8 else ' — CHECK'}）").replace("）", ")")
        print(f"  {wb:18s} md {lo:7.1f}-{hi:7.1f}  ({n:3d} reports){tag}")

    # ---- mine events -------------------------------------------------------
    events = []
    for _, r in df.iterrows():
        wb = r["nameWellbore"]
        usrop = mapping.get(wb)
        st = (r["statusInfo"][0] if r["statusInfo"] is not None
              and len(r["statusInfo"]) else {})
        report_md = st.get("md")
        date = _norm(r["dTimStart"])[:10]
        # daily summary (report-level depth resolution)
        for h in _scan(_norm(st.get("sum24Hr"))):
            events.append(dict(wellbore=wb, date=date, source="sum24Hr",
                               md=report_md, usrop_file=usrop or "", **h))
        # per-activity comments (activity-level depth resolution — the prize)
        for a in (r["activity"] if r["activity"] is not None else []):
            for h in _scan(_norm(a.get("comments"))):
                events.append(dict(wellbore=wb, date=date, source="activity",
                                   md=a.get("md"),
                                   t_start=_norm(a.get("dTimStart")),
                                   usrop_file=usrop or "", **h))

    ev = pd.DataFrame(events)
    if len(ev):
        ev["md_num"] = pd.to_numeric(ev["md"], errors="coerce")

        def inside(row):
            uf = row["usrop_file"]
            if not uf or not np.isfinite(row["md_num"]):
                return False
            lo, hi = USROP_INTERVALS[uf]
            return lo <= row["md_num"] <= hi
        ev["inside_usrop"] = ev.apply(inside, axis=1)

    out_csv = os.path.join(ART, "volve_events.csv")
    ev.to_csv(out_csv, index=False)

    # ---- report ------------------------------------------------------------
    print("\n" + "=" * 84)
    print("VOLVE DDR EVENT CANDIDATES (keyword hits with verbatim quotes — "
          "adjudicate before use)")
    print("=" * 84)
    if not len(ev):
        print("  none found")
        return 0
    n_neg = int(ev["negated"].sum())
    print(f"  total candidates: {len(ev)}  (negation-flagged: {n_neg})")
    print(f"  on USROP-mapped wellbores: {int((ev.usrop_file != '').sum())}")
    print(f"  INSIDE a USROP interval with a depth: {int(ev.inside_usrop.sum())}")
    print("\n  by type (non-negated):")
    for (t, sev), n in (ev[~ev.negated].groupby(["event_type", "severity"])
                        .size().sort_values(ascending=False).items()):
        n_in = int(ev[(ev.event_type == t) & ~ev.negated & ev.inside_usrop]
                   .shape[0])
        print(f"    {sev:9s} {t:22s} {n:4d}   (inside USROP intervals: {n_in})")

    md = os.path.join(ART, "volve_event_inventory.md")
    with open(md, "w", encoding="utf-8") as fh:
        fh.write("# Volve DDR Event Inventory — STEP 0 on the real Volve wells\n\n")
        fh.write("Source: Equinor Volve data sharing DDRs (Equinor Open Data "
                 "Licence; HF mirror bengsoon/volve_daily_drilling_report). "
                 "Candidates, NOT labels — every row carries its verbatim "
                 "sentence; adjudicate by hand before training/evaluating.\n\n")
        fh.write(f"- reports mined: {len(df)}; candidates: {len(ev)}; "
                 f"inside USROP intervals: {int(ev.inside_usrop.sum())}\n\n")
        fh.write("## HIGH candidates inside USROP intervals\n\n")
        sel = ev[(ev.severity == "HIGH") & ev.inside_usrop & ~ev.negated]
        fh.write("| wellbore | date | md | type | quote |\n|---|---|---|---|---|\n")
        for _, r in sel.iterrows():
            fh.write(f"| {r.wellbore} | {r.date} | {r.md} | {r.event_type} | "
                     f"{str(r.quote)[:220].replace('|', ';')} |\n")
        fh.write("\n## PRECURSOR candidates inside USROP intervals\n\n")
        sel = ev[(ev.severity == "PRECURSOR") & ev.inside_usrop & ~ev.negated]
        fh.write("| wellbore | date | md | type | quote |\n|---|---|---|---|---|\n")
        for _, r in sel.iterrows():
            fh.write(f"| {r.wellbore} | {r.date} | {r.md} | {r.event_type} | "
                     f"{str(r.quote)[:220].replace('|', ';')} |\n")
    print(f"\nwrote {os.path.relpath(out_csv, REPO)}")
    print(f"wrote {os.path.relpath(md, REPO)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
