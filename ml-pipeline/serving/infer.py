"""
Phase A · step 2 — LIVE INFERENCE.

DrillGuardModel loads the persisted artifacts and scores a WINDOW of raw
drilling telemetry — the last `win` samples — through the three real models
(RF point classifier, LSTM-AE trend detector, DTW shape matcher), calibrates
each against the training-normal distribution, and fuses them coverage-aware
into a 0-100 risk + tier.

This computes the prediction; it does not replay a stored score. Feed it new
data and it produces a fresh answer — the difference between a demo and a
prototype.
"""
import os
import sys

import joblib
import numpy as np
import pandas as pd
import torch

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(REPO, "ml-pipeline", "training", "step4"))
sys.path.insert(0, os.path.join(REPO, "ml-pipeline", "etl"))

from models_step4 import LSTMAutoencoder, rf_scores, lstm_scores  # noqa: E402
import dtw_bank  # noqa: E402


def _tier(risk, tiers):
    if not np.isfinite(risk):
        return ""
    for lo, name in tiers:
        if risk >= lo:
            return name
    return "Normal"


class DrillGuardModel:
    def __init__(self, model_dir):
        self.dir = model_dir
        self.rf = joblib.load(os.path.join(model_dir, "rf.joblib"))
        a = joblib.load(os.path.join(model_dir, "artifacts.joblib"))
        self.feats = a["feats"]
        self.win = int(a["win"])
        self.mu = np.asarray(a["scaler_mu"], float)
        self.sd = np.asarray(a["scaler_sd"], float)
        self.cal_rf_ref = a["cal_rf_ref"]
        self.cal_lstm_ref = a["cal_lstm_ref"]
        self.cal_dtw_ref = a["cal_dtw_ref"]
        self.bank = a["bank"]
        self.weights = a["monitor_weights"]
        self.tiers = a["tiers"]
        self.recipe = a.get("recipe", "ratio_d2")
        self.history = int(a.get("history", 0))
        self.z_win = int(a.get("z_win", 120))
        self.meta = {k: a.get(k) for k in ("well", "anchor", "event_depth", "mechanism",
                                           "label_tier", "raw_inputs", "recipe", "index_kind")}
        ck = torch.load(os.path.join(model_dir, "lstm_ae.pt"), weights_only=True)
        self.lstm = LSTMAutoencoder(ck["n_features"])
        self.lstm.load_state_dict(ck["state_dict"])
        self.lstm.eval()

    # -- calibration: empirical CDF vs training-normal (searchsorted) ------
    @staticmethod
    def _cal(ref, x):
        if not np.isfinite(x) or len(ref) == 0:
            return np.nan
        return float(np.searchsorted(ref, x, side="right") / len(ref))

    @staticmethod
    def _cal_arr(ref, arr):
        out = np.full(len(arr), np.nan)
        if len(ref) == 0:
            return out
        m = np.isfinite(arr)
        out[m] = np.searchsorted(ref, arr[m], side="right") / len(ref)
        return out

    def _renorm(self, active):
        act = {k: w for k, w in self.weights.items() if k in active}
        tot = sum(act.values())
        return {k: w / tot for k, w in act.items()} if tot else {}

    def _feature_matrix(self, window):
        """Derive the model's feature columns from the raw telemetry window,
        per the model's recipe. robust-z is unit-invariant (z of a scaled
        channel is unchanged), so field vs SI units don't matter."""
        df = pd.DataFrame(window)
        if self.recipe == "ratio_d2":
            df["torque_wob"] = df["torque"] / df["wob"].replace(0, np.nan)
            df["spp_gpm"] = df["spp"] / df["gpm"].replace(0, np.nan)
        elif self.recipe == "robust_z":
            df["sppflow"] = df["spp"] / df["flow"].replace(0, np.nan)
            for c in ("spp", "torque", "sppflow"):
                med = df[c].rolling(self.z_win, min_periods=40).median()
                mad = (df[c] - med).abs().rolling(self.z_win, min_periods=40).median() * 1.4826
                mad = np.maximum(mad, 0.005 * med.abs())
                df[f"{c}_z"] = ((df[c] - med) / mad.replace(0, np.nan)).clip(-8, 8)
        # "identity": feats are already raw columns
        return df[self.feats].to_numpy(dtype=float)

    def score_window(self, window):
        """`window`: an iterable of the last `win` samples, each carrying the raw
        channels in meta['raw_inputs']. Returns the fused risk + per-model scores."""
        M = self._feature_matrix(window)              # (n, f)
        latest = M[-1]

        # RF — instantaneous operating point (raw features, latest row)
        sb = np.nan
        if np.isfinite(latest).all():
            sb = self._cal(self.cal_rf_ref, float(rf_scores(self.rf, latest.reshape(1, -1))[0]))

        # LSTM-AE + DTW — the sequence (standardised full window)
        sl = sd = np.nan
        if len(M) >= self.win and np.isfinite(M[-self.win:]).all():
            std = (M[-self.win:] - self.mu) / self.sd
            wins = std[None, ...]
            sl = self._cal(self.cal_lstm_ref, float(lstm_scores(self.lstm, wins)[0]))
            sd = self._cal(self.cal_dtw_ref, float(dtw_bank.dtw_scores(wins, self.feats, self.bank)[0]))

        # coverage-aware fusion over active monitors
        active = {}
        if np.isfinite(sb): active["RF"] = sb
        if np.isfinite(sl): active["LSTM"] = sl
        if np.isfinite(sd): active["DTW"] = sd
        risk, act = np.nan, ""
        if active:
            w = self._renorm(set(active))
            risk = 100.0 * sum(w[k] * active[k] for k in active)
            act = "|".join(sorted(active))

        return {
            "risk": None if not np.isfinite(risk) else round(risk, 3),
            "tier": _tier(risk, self.tiers),
            "S_baseline": None if not np.isfinite(sb) else round(sb, 4),
            "S_LSTM": None if not np.isfinite(sl) else round(sl, 4),
            "S_DTW": None if not np.isfinite(sd) else round(sd, 4),
            "active_monitors": act,
        }


    def score_run(self, rows):
        """Score a WHOLE run efficiently: derive features once over the full
        record (correct for robust-z, which is a trailing per-well statistic),
        then BATCH the RF and LSTM. Returns per-row dicts aligned to `rows`.
        Much faster than looping score_window (one torch/RF call, not thousands)."""
        M = self._feature_matrix(rows)          # (N, f)
        N = len(M)
        win = self.win
        row_ok = np.isfinite(M).all(axis=1)

        sb = np.full(N, np.nan)
        if row_ok.any():
            sb[row_ok] = self._cal_arr(self.cal_rf_ref, rf_scores(self.rf, M[row_ok]))

        std = (M - self.mu) / self.sd
        sl = np.full(N, np.nan)
        sd = np.full(N, np.nan)
        ends = [e for e in range(win - 1, N) if np.isfinite(std[e - win + 1:e + 1]).all()]
        if ends:
            W = np.stack([std[e - win + 1:e + 1] for e in ends])
            sl_e = self._cal_arr(self.cal_lstm_ref, lstm_scores(self.lstm, W))
            sd_e = self._cal_arr(self.cal_dtw_ref, dtw_bank.dtw_scores(W, self.feats, self.bank))
            for k, e in enumerate(ends):
                sl[e] = sl_e[k]
                sd[e] = sd_e[k]

        out = []
        for i in range(N):
            active = {}
            if np.isfinite(sb[i]): active["RF"] = sb[i]
            if np.isfinite(sl[i]): active["LSTM"] = sl[i]
            if np.isfinite(sd[i]): active["DTW"] = sd[i]
            risk, act = np.nan, ""
            if active:
                w = self._renorm(set(active))
                risk = 100.0 * sum(w[k] * active[k] for k in active)
                act = "|".join(sorted(active))
            out.append({
                "risk": None if not np.isfinite(risk) else round(risk, 3),
                "tier": _tier(risk, self.tiers),
                "S_baseline": None if not np.isfinite(sb[i]) else round(float(sb[i]), 4),
                "S_LSTM": None if not np.isfinite(sl[i]) else round(float(sl[i]), 4),
                "S_DTW": None if not np.isfinite(sd[i]) else round(float(sd[i]), 4),
                "active_monitors": act,
            })
        return out


_CACHE = {}


def get_model(model_id="bilabri-d2"):
    if model_id not in _CACHE:
        _CACHE[model_id] = DrillGuardModel(os.path.join(HERE, "models", model_id))
    return _CACHE[model_id]
