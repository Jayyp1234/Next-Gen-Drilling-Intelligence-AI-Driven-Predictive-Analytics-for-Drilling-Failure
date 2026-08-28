"""
DTW shape-matcher (S_DTW) with a Sakoe-Chiba band, plus the template bank.

INDEPENDENT PROVENANCE IS THE POINT (step7_model_physics_alignment.md §7.2):
every template below is derived either from the §2 mechanism physics or from a
DOCUMENTED event's measured shape — never from anything a learned model
flagged. Provenance is recorded on the template object and travels into the
training logs, so the independence claim is auditable.

DTW distance uses the classic O(n*m) dynamic program constrained to a
Sakoe-Chiba band (Sakoe & Chiba 1978, doi:10.1109/tassp.1978.1163055), band
radius 10% of template length — wide enough for rate variation (the physical
motivation for DTW: same morphology, different speed), narrow enough to stop
pathological warping.

Sequences and templates are z-normalised per channel before matching, so the
templates encode SHAPE (a ramp, a crossover), not absolute levels — levels are
the RF's job; this separation keeps the paradigms complementary.
"""

import numpy as np

SAKOE_CHIBA_FRACTION = 0.10


class Template:
    def __init__(self, name, mechanism, channels, curves, provenance, note=""):
        self.name = name
        self.mechanism = mechanism
        self.channels = list(channels)          # channel names, order = curves rows
        self.curves = np.asarray(curves, float)  # (n_channels, length)
        self.provenance = provenance             # 'physics' | 'documented'
        self.note = note

    def meta(self):
        return dict(name=self.name, mechanism=self.mechanism,
                    channels=self.channels, length=int(self.curves.shape[1]),
                    provenance=self.provenance, note=self.note)


def _znorm(x):
    x = np.asarray(x, float)
    sd = np.nanstd(x)
    return (x - np.nanmean(x)) / (sd if sd > 0 else 1.0)


def dtw_distance(a, b, band_frac=SAKOE_CHIBA_FRACTION):
    """Banded DTW between 1-D sequences (both already z-normalised).

    Two rolling 1-D rows in pure Python instead of a full numpy matrix with
    per-element indexing — numerically IDENTICAL to the textbook 2-D form
    (verified bit-for-bit), several times faster (no np scalar-indexing
    overhead in the hot loop; the recurrence is inherently sequential)."""
    n, m = len(a), len(b)
    band = max(1, int(round(band_frac * max(n, m))))
    # adjust band so the corner is reachable when n != m
    band = max(band, abs(n - m) + 1)
    INF = float("inf")
    a = a.tolist() if hasattr(a, "tolist") else list(a)
    b = b.tolist() if hasattr(b, "tolist") else list(b)
    prev = [INF] * (m + 1)
    prev[0] = 0.0
    for i in range(1, n + 1):
        curr = [INF] * (m + 1)
        lo = max(1, i - band)
        hi = min(m, i + band)
        ai = a[i - 1]
        for j in range(lo, hi + 1):
            d = ai - b[j - 1]
            best = prev[j]                 # D[i-1, j]
            left = curr[j - 1]             # D[i, j-1]  (already filled this row)
            if left < best:
                best = left
            diag = prev[j - 1]             # D[i-1, j-1]
            if diag < best:
                best = diag
            curr[j] = d * d + best
        prev = curr
    return (prev[m] ** 0.5) / (n + m)   # path-length-ish normalisation


def match(window_2d, channel_names, template):
    """Mean per-channel banded DTW distance between a (win, f) window and the
    template's channels (matched by name). Lower = closer to the failure
    shape. Channels the window lacks are skipped; if none overlap -> inf."""
    dists = []
    for ch, curve in zip(template.channels, template.curves):
        if ch not in channel_names:
            continue
        col = window_2d[:, channel_names.index(ch)]
        if not np.isfinite(col).all():
            continue
        dists.append(dtw_distance(_znorm(col), _znorm(curve)))
    return float(np.mean(dists)) if dists else np.inf


def dtw_scores(windows, channel_names, templates):
    """Anomaly score per window = -min distance over the bank (closer to any
    known failure shape = more anomalous). Calibrated later like every score."""
    out = np.full(len(windows), np.nan)
    for i, w in enumerate(windows):
        d = min(match(w, channel_names, t) for t in templates)
        out[i] = -d if np.isfinite(d) else np.nan
    return out


# ------------------------------------------------------------ the bank ----
def _ramp(n, start=0.0, end=1.0):
    return np.linspace(start, end, n)


def _late_ramp(n, knee=0.6):
    """Flat baseline, then accelerating rise — the 'onset' morphology."""
    x = np.linspace(0, 1, n)
    y = np.where(x < knee, 0.0, ((x - knee) / (1 - knee)) ** 2)
    return y


def bank_bit_wear(win):
    """§2 bit wear: MSE rises monotonically as the cutting structure dulls
    while ROP falls at fixed parameters — the MSE-up/ROP-down crossover."""
    return [Template(
        "bitwear_crossover", "bit_wear", ["mse_psi", "rop"],
        [_ramp(win), _ramp(win, 1.0, 0.0)],
        "physics",
        "Teale MSE monotone rise + ROP monotone fall (step2 §bit wear)")]


def bank_hole_drag(win, exclude_documented=False):
    """Stuck pipe / hole drag on Bilabri. Two templates, two provenances:
    the §2 physics ramp (torque/WOB up while WOB collapses — the verified
    post-QC D4 signature), and a DOCUMENTED-EVENT-INFORMED idealized
    morphology from D2-1659: parametric _late_ramp curves — NO measured
    samples embedded — on the channel pair the anchor analysis showed
    accelerating into that event (SPP/GPM z~1->6, torque/WOB x1.59).

    exclude_documented=True MUST be passed when BILABRI-D2 is the held-out
    test well: the channel selection and onset morphology of that template
    were informed by the very 60 m window the D2 fold evaluates, so keeping
    it there is a matched filter built from the test example — partial
    evaluation-set leakage. For any other fold (e.g. D4) it is the legitimate
    cross-event library case.
    """
    bank = [
        Template("holedrag_physics", "stuck_pipe", ["torque_wob", "wob"],
                 [_ramp(win), _ramp(win, 1.0, 0.2)],
                 "physics",
                 "friction ratio rises as weight transfer fails (step2)"),
    ]
    if not exclude_documented:
        bank.append(
            Template("d2_1659_documented", "stuck_pipe", ["spp_gpm", "torque_wob"],
                     [_late_ramp(win), _late_ramp(win)],
                     "documented",
                     "documented-event-informed idealized morphology (parametric "
                     "ramp; no measured samples embedded): D2 2006-08-17 stuck "
                     "pipe @1659 m, hydraulic resistance + friction accelerating "
                     "into the event (events_anchors.csv)"))
    return bank


def bank_stick_slip(win):
    """Stick-slip onset: the oscillation severity index grows from quiet to
    sustained over minutes (self-diagnostic channel, Foundations §3)."""
    return [Template(
        "stickslip_onset", "stick_slip", ["stick_slip_index"],
        [_late_ramp(win)],
        "physics",
        "severity index ramps from quiet baseline to sustained oscillation")]
