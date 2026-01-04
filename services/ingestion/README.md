# Data Ingestion Service

Service responsible for ingesting, parsing, validating, and storing drilling data from various sources.

## Features

- CSV mud log parsing
- PDF daily drilling report (DDA) extraction
- WITSML data ingestion
- Real-time sensor data processing
- Time alignment and synchronization
- Data validation and quality scoring
- Storage to TimescaleDB

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables (see `.env.example`)

3. Run migrations:
```bash
alembic upgrade head
```

4. Start the service:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## API Endpoints

- `POST /api/v1/ingestion/upload` - Upload data file
- `GET /api/v1/ingestion/status/{job_id}` - Check ingestion status
- `GET /api/v1/ingestion/health` - Health check

## Development

Run tests:
```bash
pytest tests/ -v
```
