# Intelligence Engine Service

ML-powered service for baseline learning, anomaly detection, pattern matching, and risk assessment.

## Features

- Baseline learning (drilling, tripping, circulating)
- Multi-algorithm anomaly detection
- Historical pattern matching
- Risk scoring and time-to-impact estimation
- Real-time inference

## ML Components

1. **Baseline Learning**: Gaussian Process Regression, Moving Averages
2. **Anomaly Detection**: Isolation Forest, LSTM Autoencoders, Control Charts
3. **Pattern Matching**: Dynamic Time Warping (DTW)
4. **Risk Engine**: Rule-based fusion of ML outputs

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables (see `.env.example`)

3. Start MLflow tracking server:
```bash
mlflow server --backend-store-uri postgresql://... --default-artifact-root s3://...
```

4. Start the service:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
```

## API Endpoints

- `POST /api/v1/inference/predict` - Run inference on sensor data
- `GET /api/v1/baselines/{well_id}` - Get baseline models for well
- `GET /api/v1/inference/health` - Health check

## Model Training

See `ml-pipeline/training/` for training scripts.
