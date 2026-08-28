"""
Extract operational events + daily context from Bilabri AM GEOL daily reports.

Implements STEP 0 of the DrillGuard handoff brief: determine whether the data
contains timestamped failure / NPT events. The answer decides the whole
experimental design -- documented anchors support a *validation* claim,
physics-derived anchors only support a *demonstration* claim.

These reports are legacy OLE2 .xls on a shared PEAK Petroleum template. The
template is consistent across wells but COLUMN POSITIONS DRIFT (e.g. PREVIOUS
DEPTH sits at col 5 in D4 and col 6 in D2/D3), so every field is located by
searching for its label and taking the next non-empty cell to the right --
never by fixed coordinates.

Two outputs:
  geol_reports.csv    one row per daily report: the depth<->date map, plus mud
                      weight and bit size (needed for d-exponent and MSE, and
                      not present in the DRLPAR channel data at all)
  event_inventory.md  candidate events with verbatim quotes, per the brief

IMPORTANT: the event scan produces CANDIDATES, not labels. Keyword matching
cannot resolve negation ("no losses observed") or routine mentions ("wiper trip
as per program"). Every hit carries its verbatim sentence so a human can
adjudicate. Do not train on these without that pass.
"""

import csv
import glob
import json
import os
import re
import sys
import zipfile
from datetime import datetime, timedelta

import xlrd

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(REPO, "actual data")
OUT = os.path.join(REPO, "ml-pipeline", "artifacts")

# Report globs per well. D4 has reports in two places; the PLOG zips are handled
# separately by _iter_zipped_reports.
REPORT_GLOBS = [
    ("BILABRI-D2", os.path.join(DATA, "Bilabri D2", "AM GEOL REPORTS", "*.xls")),
    ("BILABRI-D3", os.path.join(DATA, "Bilabri D3", "AM GEOL RPTs", "*.xls")),
    ("BILABRI-D4", os.path.join(DATA, "Bilabri D4", "AM GEOL REPORTS", "*.xls")),
    # DEEP-1 keeps its reports loose in a mixed folder, so match on GEOL in the
    # filename -- an unrestricted *.xls sweep drags in encrypted cost sheets.
    ("BILABRI-DEEP-1", os.path.join(DATA, "BILABRI DEEP -1 FINAL REPORT", "**", "*GEOL*.xls")),
]

# Severity tiers. HIGH = the failure actually occurred and cost time. PRECURSOR =
# the leading indicator the physics predicts *before* a HIGH event -- these are
# the ones that make lead-time measurable. ROUTINE = normal operations that share
# vocabulary with failures; captured only so a human can rule them out.
EVENT_LEXICON = {
    "stuck_pipe": (
        "HIGH",
        [r"stuck\s+pipe", r"\bstuck\b", r"differentially\s+stuck", r"pipe\s+stuck"],
    ),
    "pack_off": ("HIGH", [r"pack(?:ed)?[\s\-]?off", r"packoff", r"bridg(?:e|ed|ing)\s+over"]),
    "lost_circulation": (
        "HIGH",
        [r"lost\s+circulation", r"lost\s+returns", r"total\s+loss", r"severe\s+loss",
         r"partial\s+loss", r"\bLCM\b", r"loss(?:es)?\s+of\s+(?:mud|returns)"],
    ),
    # Three vocabulary traps here, all found by reading the actual quotes:
    #   "kick-off"      -> sidetrack/directional op, not well control. The D2
    #                      sidetrack reports are full of it; a bare \bkick\b
    #                      inflated this class ~5x.
    #   "flow check"    -> routine verification on every trip. Demoted to
    #                      ROUTINE below; it only means something alongside a
    #                      real indicator, which the other patterns catch.
    #   "swab on mud pump" -> a pump component, not swabbing the well.
    "well_control": (
        "HIGH",
        [r"\bkick(?![\s\-]?off)\b", r"\binflux\b", r"shut[\s\-]?in\b",
         r"\bSI\s+well\b", r"well\s+control",
         r"\bswab(?:bed|bing)?\b(?!\s+on\b)(?![^.]{0,20}\bpump)"],
    ),
    "twist_off_fishing": (
        "HIGH",
        [r"twist[\s\-]?off", r"\bfishing\b", r"\bfish\b", r"back[\s\-]?off", r"washout"],
    ),
    "tight_hole_overpull": (
        "PRECURSOR",
        [r"tight\s+(?:hole|spot)", r"over[\s\-]?pull", r"excessive\s+drag",
         r"high\s+drag", r"hole\s+drag"],
    ),
    "gas_cut": (
        "PRECURSOR",
        [r"gas[\s\-]?cut", r"trip\s+gas", r"connection\s+gas", r"background\s+gas\s+increase"],
    ),
    "seepage": ("PRECURSOR", [r"seepage", r"mud\s+loss(?:es)?", r"losing\s+mud"]),
    "hole_cleaning": (
        "PRECURSOR",
        [r"back[\s\-]?ream", r"hole\s+cleaning", r"cuttings\s+bed", r"poor\s+returns"],
    ),
    "equipment_failure": (
        "HIGH",
        [r"(?:mud\s+)?motor\s+fail", r"MWD\s+fail", r"bit\s+fail", r"pump\s+fail",
         r"tool\s+fail", r"rig\s+repair", r"\bNPT\b", r"down\s?time"],
    ),
    "routine_reaming": ("ROUTINE", [r"wiper\s+trip", r"\bream(?:ed|ing)?\b", r"circulat"]),
    "routine_flow_check": ("ROUTINE", [r"flow\s+check"]),
}

# Negation is checked in the WINDOW IMMEDIATELY BEFORE the matched term, not
# anywhere in the sentence -- a whole-sentence check both misses "confirmed no
# pressure washout" (the qualifier is unlisted) and over-fires on long sentences
# where an unrelated clause happens to contain "no".
NEGATION_CUES = r"\b(?:no|not|nil|none|without|free\s+of|clear\s+of|avoid(?:ed|ing)?)\b"
NEGATION_WINDOW_WORDS = 5

# Whole-sentence markers that make any hit routine rather than incidental.
ROUTINE_CONTEXT = [r"\bas\s+per\s+program\b", r"\bgood\s+condition\b", r"\bno\s+problem"]

LABELS = {
    "report_date": ["REPORT DATE"],
    "report_no": ["REPORT NO"],
    "well_name": ["WELL NAME"],
    "depth_2400": ["DEPTH @ 2400", "DEPTH@2400"],
    "previous_depth": ["PREVIOUS DEPTH"],
    "meters_drilled": ["METERS DRILLED", "METRES DRILLED"],
    "tvd": ["TVD"],
    "mud_type_wt": ["MUD TYPE & WT", "MUD TYPE AND WT", "MUD TYPE"],
    "avg_rop": ["AVG ROP"],
    "drill_rate": ["DRILL RATE"],
    "geologist": ["GEOLOGIST"],
    "spud_date": ["SPUD DATE"],
    "bit": ["BIT #", "BIT#", "BIT NO", "BIT TYPE"],
    "csg": ["CSG"],
}


def _norm(v):
    if v is None:
        return ""
    if isinstance(v, float):
        return str(int(v)) if v == int(v) else str(v)
    return str(v).strip()


def _grid(sheet):
    return [[_norm(sheet.cell_value(r, c)) for c in range(sheet.ncols)]
            for r in range(sheet.nrows)]


def _find_label(grid, needles):
    """Locate a label cell. Returns (row, col) of the first match, else None."""
    ups = [n.upper() for n in needles]
    for r, row in enumerate(grid):
        for c, cell in enumerate(row):
            up = cell.upper()
            for n in ups:
                if n in up:
                    return r, c
    return None


def _value_right(grid, rc, max_span=6):
    """Take the next non-empty cell to the right of a label.

    Handles the column drift between wells. Also handles the case where the
    value is packed into the label cell itself ("BIT #,TYPE & SIZE: #2, HCMXL,
    17 1/2''"), which the D2 template does but D4 does not.
    """
    if rc is None:
        return ""
    r, c = rc
    row = grid[r]
    own = row[c]
    if ":" in own:
        tail = own.split(":", 1)[1].strip()
        if tail:
            return tail
    for cc in range(c + 1, min(c + 1 + max_span, len(row))):
        if row[cc]:
            return row[cc]
    return ""


def _excel_date(v):
    """Excel serial -> ISO date. Epoch is 1899-12-30 on the 1900 system."""
    try:
        n = float(v)
    except (TypeError, ValueError):
        return ""
    if not (20000 < n < 60000):
        return ""
    return (datetime(1899, 12, 30) + timedelta(days=n)).strftime("%Y-%m-%d")


def _parse_date(raw):
    """Report dates are DD-MM-YY on this template (verified against the DRLPAR
    filename stamps and the recorded drill-out dates)."""
    raw = raw.strip()
    if not raw:
        return ""
    iso = _excel_date(raw)
    if iso:
        return iso
    m = re.search(r"(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})", raw)
    if not m:
        return ""
    d, mo, y = (int(x) for x in m.groups())
    if y < 100:
        y += 2000 if y < 70 else 1900
    try:
        return datetime(y, mo, d).strftime("%Y-%m-%d")
    except ValueError:
        return ""


def _num(raw):
    m = re.search(r"(-?\d+(?:\.\d+)?)", raw.replace(",", ""))
    return float(m.group(1)) if m else None


def _mud_weight_ppg(raw):
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:PPG|ppg|Ppg)", raw)
    if not m:
        return None
    v = float(m.group(1))
    # Plausibility band: drilling mud is ~7-20 ppg. DEEP-1 report 29 reads
    # "SOBM 107 PPG" verbatim -- a missing decimal (neighbouring reports say
    # 10.6-10.9). We do NOT silently correct source data; out-of-band values
    # return None and the verbatim survives in mud_raw for the audit trail.
    return v if 6.0 <= v <= 20.0 else None


def _bit_diameter_in(raw):
    """Parse bit size, e.g. 12-1/4'' / 17 1/2'' / 8.5\" -> inches (float).

    This is the value that makes MSE computable on Bilabri -- the DRLPAR channel
    files carry no bit diameter at all.
    """
    if not raw:
        return None
    s = raw.replace("''", '"').replace("’’", '"').replace("”", '"')
    m = re.search(r"(\d+)\s*[-\s]\s*(\d+)\s*/\s*(\d+)", s)
    if m:
        whole, num, den = (int(x) for x in m.groups())
        return round(whole + num / den, 4) if den else None
    m = re.search(r"(\d+)\s*/\s*(\d+)", s)
    if m and not re.search(r"\d\s*[-\s]\s*\d+\s*/", s):
        num, den = int(m.group(1)), int(m.group(2))
        if den and num < den:
            return round(num / den, 4)
    m = re.search(r"(\d+(?:\.\d+)?)\s*\"", s)
    if m:
        return float(m.group(1))
    return None


def _narrative(grid):
    """Collect the OPERATIONS SUMMARY free text.

    Starts at the summary label and runs until the lithology table header, which
    is the next structured section on every variant of the template.
    """
    rc = _find_label(grid, ["OPERATIONS SUMMARY"])
    if rc is None:
        return ""
    start = rc[0]
    stop = len(grid)
    for r in range(start + 1, len(grid)):
        joined = " ".join(grid[r]).upper()
        if "LITHOLOGICAL DESCRIPTION" in joined or re.match(r"^\s*FROM\s", joined):
            stop = r
            break
    parts = []
    for r in range(start, stop):
        for c, cell in enumerate(grid[r]):
            if r == start and c == rc[1]:
                continue  # skip the label itself
            if cell and not re.fullmatch(r"[\s.]*", cell):
                parts.append(cell)
    text = " ".join(parts)
    return re.sub(r"\s+", " ", text).strip()


def _sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.;])\s+|\n", text) if s.strip()]


def _is_negated(sentence_low, match_start):
    """True if a negation cue sits within a few words before the match."""
    before = sentence_low[:match_start].split()
    window = " ".join(before[-NEGATION_WINDOW_WORDS:])
    return bool(re.search(NEGATION_CUES, window))


def scan_events(text):
    """Keyword scan -> candidate events, each with its verbatim sentence."""
    hits = []
    for sent in _sentences(text):
        low = sent.lower()
        routine_ctx = any(re.search(p, low) for p in ROUTINE_CONTEXT)
        for etype, (severity, pats) in EVENT_LEXICON.items():
            for pat in pats:
                m = re.search(pat, low, re.IGNORECASE)
                if m:
                    hits.append({
                        "event_type": etype,
                        "severity": severity,
                        "matched": m.group(0),
                        "quote": sent,
                        "possible_negation": _is_negated(low, m.start()) or routine_ctx,
                    })
                    break
    return hits


def parse_report(path, well_hint, book=None):
    try:
        book = book or xlrd.open_workbook(path)
    except Exception as exc:  # noqa: BLE001 - corrupt legacy files are expected
        return None, f"UNREADABLE: {os.path.basename(path)} ({exc})"
    grid = _grid(book.sheet_by_index(0))
    if not grid:
        return None, f"EMPTY: {os.path.basename(path)}"

    g = lambda k: _value_right(grid, _find_label(grid, LABELS[k]))  # noqa: E731

    mud_raw = g("mud_type_wt")
    bit_raw = g("bit")
    if not _bit_diameter_in(bit_raw):
        # D4 splits the bit label and value across two cells further right.
        rc = _find_label(grid, LABELS["bit"])
        if rc:
            bit_raw = " ".join(x for x in grid[rc[0]][rc[1]:rc[1] + 5] if x) or bit_raw

    narrative = _narrative(grid)
    rec = {
        "well": (g("well_name") or well_hint).strip() or well_hint,
        "well_key": well_hint,
        "source_file": os.path.relpath(path, REPO),
        "report_no": _num(g("report_no")),
        "date": _parse_date(g("report_date")),
        "spud_date": _parse_date(g("spud_date")),
        "depth_2400_m": _num(g("depth_2400")),
        "previous_depth_m": _num(g("previous_depth")),
        "meters_drilled_m": _num(g("meters_drilled")),
        "tvd_m": _num(g("tvd")),
        "mud_raw": mud_raw,
        "mud_weight_ppg": _mud_weight_ppg(mud_raw),
        "bit_raw": bit_raw,
        "bit_diameter_in": _bit_diameter_in(bit_raw),
        "avg_rop_m_hr": _num(g("avg_rop")),
        "geologist": g("geologist"),
        "narrative": narrative,
        "narrative_chars": len(narrative),
    }
    rec["events"] = scan_events(narrative)
    return rec, None


def _iter_zipped_reports():
    """Some GEOL reports are zipped. Yield (well, name, workbook)."""
    for zpath in glob.glob(os.path.join(DATA, "**", "*.zip"), recursive=True):
        base = os.path.basename(zpath).upper()
        if "GEOL" not in base and "GEOL" not in zpath.upper():
            continue
        well = "UNKNOWN"
        for key in ("D2", "D3", "D4", "DEEP"):
            if key in zpath.upper():
                well = "BILABRI-DEEP-1" if key == "DEEP" else f"BILABRI-{key}"
                break
        try:
            with zipfile.ZipFile(zpath) as zf:
                for name in zf.namelist():
                    if name.lower().endswith(".xls"):
                        try:
                            wb = xlrd.open_workbook(file_contents=zf.read(name))
                        except Exception:  # noqa: BLE001
                            continue
                        yield well, f"{zpath}::{name}", wb
        except zipfile.BadZipFile:
            continue


def main():
    os.makedirs(OUT, exist_ok=True)
    records, problems = [], []

    for well, pattern in REPORT_GLOBS:
        for path in sorted(glob.glob(pattern, recursive=True)):
            if os.path.basename(path).startswith("~$"):
                continue
            rec, err = parse_report(path, well)
            (problems.append(err) if err else records.append(rec))

    for well, label, wb in _iter_zipped_reports():
        rec, err = parse_report(label, well, book=wb)
        if err:
            problems.append(err)
        elif rec:
            records.append(rec)

    records.sort(key=lambda r: (r["well_key"], r["date"] or "", r["report_no"] or 0))

    # ---- geol_reports.csv : the depth<->date map + mud weight + bit size ----
    csv_path = os.path.join(OUT, "geol_reports.csv")
    cols = ["well_key", "well", "date", "report_no", "previous_depth_m", "depth_2400_m",
            "meters_drilled_m", "tvd_m", "mud_weight_ppg", "bit_diameter_in",
            "avg_rop_m_hr", "n_events", "source_file"]
    with open(csv_path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for r in records:
            w.writerow({**r, "n_events": len([e for e in r["events"]
                                              if e["severity"] != "ROUTINE"])})

    # ---- event_inventory.md : per the brief's STEP 0 schema ----
    md_path = os.path.join(OUT, "event_inventory.md")
    by_sev = {"HIGH": [], "PRECURSOR": [], "ROUTINE": []}
    for r in records:
        for e in r["events"]:
            by_sev[e["severity"]].append((r, e))

    with open(md_path, "w", encoding="utf-8") as fh:
        fh.write("# Event Inventory — Bilabri AM GEOL Daily Reports\n\n")
        fh.write("STEP 0 of the DrillGuard handoff brief. Generated by "
                 "`ml-pipeline/etl/extract_geol_events.py`.\n\n")
        fh.write("> **These are CANDIDATES, not labels.** Keyword matching cannot resolve "
                 "negation or routine mentions. Every row carries its verbatim quote so it "
                 "can be adjudicated by hand. Do not train on them before that pass.\n\n")
        fh.write(f"- Reports parsed: **{len(records)}**\n")
        fh.write(f"- Reports with a dated depth interval: "
                 f"**{sum(1 for r in records if r['date'] and r['depth_2400_m'])}**\n")
        fh.write(f"- HIGH-severity candidates: **{len(by_sev['HIGH'])}**\n")
        fh.write(f"- PRECURSOR candidates: **{len(by_sev['PRECURSOR'])}**\n")
        if problems:
            fh.write(f"- Files that failed to parse: **{len(problems)}**\n")
        fh.write("\n---\n\n")

        for sev in ("HIGH", "PRECURSOR"):
            fh.write(f"## {sev} severity candidates\n\n")
            if not by_sev[sev]:
                fh.write("_None found._\n\n")
                continue
            fh.write("| well | date | depth interval (m) | type | matched | negation? | quote | source |\n")
            fh.write("|---|---|---|---|---|---|---|---|\n")
            for r, e in by_sev[sev]:
                interval = (f"{r['previous_depth_m']:.0f}–{r['depth_2400_m']:.0f}"
                            if r["previous_depth_m"] and r["depth_2400_m"] else "?")
                quote = e["quote"].replace("|", "\\|")[:300]
                fh.write(f"| {r['well_key']} | {r['date'] or '?'} | {interval} | "
                         f"{e['event_type']} | `{e['matched']}` | "
                         f"{'⚠️ yes' if e['possible_negation'] else ''} | {quote} | "
                         f"`{os.path.basename(r['source_file'])}` |\n")
            fh.write("\n")

        if problems:
            fh.write("## Parse failures\n\n")
            for p in problems:
                fh.write(f"- {p}\n")

    with open(os.path.join(OUT, "geol_reports.json"), "w", encoding="utf-8") as fh:
        json.dump(records, fh, indent=2)

    # ---- console summary ----
    print(f"parsed {len(records)} reports; {len(problems)} failures")
    print(f"  dated + depth-bounded : {sum(1 for r in records if r['date'] and r['depth_2400_m'])}")
    print(f"  mud weight recovered  : {sum(1 for r in records if r['mud_weight_ppg'])}")
    print(f"  bit diameter recovered: {sum(1 for r in records if r['bit_diameter_in'])}")
    print(f"  HIGH candidates       : {len(by_sev['HIGH'])}")
    print(f"  PRECURSOR candidates  : {len(by_sev['PRECURSOR'])}")
    print(f"\nwrote {os.path.relpath(csv_path, REPO)}")
    print(f"wrote {os.path.relpath(md_path, REPO)}")
    for p in problems[:10]:
        print("  !", p)
    return 0


if __name__ == "__main__":
    sys.exit(main())
