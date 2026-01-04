# ML Pipeline

Machine learning training, evaluation, and model management for the EDIM platform.

## Structure

- `training/` - Model training scripts
- `models/` - Model definitions
- `evaluation/` - Model evaluation scripts
- `notebooks/` - Jupyter notebooks for exploration
- `data/` - Training data (gitignored)
- `config/` - ML configuration files

## Training Models

### Baseline Models
```bash
python training/baseline/train_drilling_baseline.py
python training/baseline/train_tripping_baseline.py
python training/baseline/train_circulating_baseline.py
```

### Anomaly Detection
```bash
python training/anomaly/train_isolation_forest.py
python training/anomaly/train_lstm_autoencoder.py
python training/anomaly/train_ensemble.py
```

### Pattern Matching
```bash
python training/pattern_matching/extract_event_signatures.py
python training/pattern_matching/build_similarity_index.py
```

## Model Evaluation

```bash
python evaluation/evaluate_baselines.py
python evaluation/evaluate_anomaly_detection.py
python evaluation/evaluate_pattern_matching.py
```

## MLflow Integration

All models are tracked in MLflow. Set `MLFLOW_TRACKING_URI` environment variable.

## Data Requirements

- Minimum 20+ wells of normal operations
- 50+ labeled historical events
- Data quality >95% completeness
