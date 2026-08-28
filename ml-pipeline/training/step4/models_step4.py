"""
The two learned paradigms: RF point classifier (S_baseline) and LSTM
autoencoder (S_LSTM).

Paradigm competences (step7 §7.1): the RF scores the instantaneous
multivariate operating point against labelled state; the LSTM-AE scores a
SEQUENCE's departure from learned normal dynamics — the trend detector that
carries the 0.45 weight because the headline precursors are trends.

The LSTM-AE trains on NORMAL windows only (per the brief). What counts as
"normal" for training selection may use labels, but only labels whose tier the
caller passes in — the caller states provenance; this module just refuses
label-free supervised fits.
"""

import numpy as np
import torch
from sklearn.ensemble import RandomForestClassifier
from torch import nn

SEED = 42


# ------------------------------------------------------------------- RF ----
def fit_rf(X_train, y_train, label_tier):
    """S_baseline. label_tier must be declared; refuse silently-sourced labels."""
    if label_tier not in ("documented", "instrument", "physics_consistency", "weak"):
        raise ValueError(f"undeclared label tier {label_tier!r}")
    rf = RandomForestClassifier(
        n_estimators=300, max_depth=12, min_samples_leaf=5,
        class_weight="balanced", random_state=SEED, n_jobs=-1)
    rf.fit(X_train, y_train)
    rf.label_tier_ = label_tier
    return rf


def rf_scores(rf, X):
    """P(anomalous) — already 0-1 but still passed through the same
    NormalCalibrator as the others so all three scores share a scale."""
    return rf.predict_proba(X)[:, 1]


# -------------------------------------------------------------- LSTM-AE ----
class LSTMAutoencoder(nn.Module):
    def __init__(self, n_features, hidden=32, latent=8):
        super().__init__()
        self.encoder = nn.LSTM(n_features, hidden, batch_first=True)
        self.to_latent = nn.Linear(hidden, latent)
        self.from_latent = nn.Linear(latent, hidden)
        self.decoder = nn.LSTM(hidden, hidden, batch_first=True)
        self.head = nn.Linear(hidden, n_features)

    def forward(self, x):
        _, (h, _) = self.encoder(x)
        z = self.to_latent(h[-1])
        h0 = self.from_latent(z)
        rep = h0.unsqueeze(1).repeat(1, x.shape[1], 1)
        dec, _ = self.decoder(rep)
        return self.head(dec)


def fit_lstm_ae(train_windows, epochs=15, batch=64, lr=1e-3, seed=SEED):
    """Train on NORMAL windows only. Input (m, win, f), already standardised
    by the caller (per-channel, training statistics). Returns (model, log).

    Zero training windows -> (None, log): the LSTM monitor is INACTIVE for
    that fold and the coverage-aware fusion renormalises over what remains --
    exactly the step7 degradation path ("no history" scenario), not an error.
    """
    if len(train_windows) == 0:
        return None, dict(epochs=0, n_train_windows=0,
                          note="no normal training windows — monitor inactive")
    torch.manual_seed(seed)
    np.random.seed(seed)
    X = torch.tensor(np.asarray(train_windows, dtype=np.float32))
    model = LSTMAutoencoder(X.shape[2])
    opt = torch.optim.Adam(model.parameters(), lr=lr)
    lossf = nn.MSELoss()
    log = []
    model.train()
    for ep in range(epochs):
        perm = torch.randperm(len(X))
        tot = 0.0
        for i in range(0, len(X), batch):
            xb = X[perm[i:i + batch]]
            opt.zero_grad()
            loss = lossf(model(xb), xb)
            loss.backward()
            opt.step()
            tot += float(loss.detach()) * len(xb)
        log.append(round(tot / len(X), 6))
    model.eval()
    return model, dict(epochs=epochs, batch=batch, lr=lr,
                       n_train_windows=int(len(X)), loss_curve=log)


def lstm_scores(model, windows, batch=256):
    """Per-window reconstruction error (raw; calibrate downstream)."""
    if model is None:
        return np.full(len(windows), np.nan)
    if len(windows) == 0:
        return np.array([])
    X = torch.tensor(np.asarray(windows, dtype=np.float32))
    errs = []
    with torch.no_grad():
        for i in range(0, len(X), batch):
            xb = X[i:i + batch]
            rec = model(xb)
            errs.append(((rec - xb) ** 2).mean(dim=(1, 2)).numpy())
    return np.concatenate(errs)


class ChannelScaler:
    """Per-channel standardisation fitted on TRAINING rows only."""

    def __init__(self, train_rows):
        self.mu = np.nanmean(train_rows, axis=0)
        self.sd = np.nanstd(train_rows, axis=0)
        self.sd[~np.isfinite(self.sd) | (self.sd == 0)] = 1.0

    def __call__(self, rows):
        return (rows - self.mu) / self.sd
