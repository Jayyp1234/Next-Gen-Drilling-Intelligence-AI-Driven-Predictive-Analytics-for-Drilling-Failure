# Risk & Alerting Service

Service responsible for generating alerts, routing notifications, and managing alert lifecycle.

## Features

- Alert generation from risk assessments
- Multi-channel notifications (Email, SMS, Push, WebSocket)
- Alert deduplication
- Escalation logic
- User preference management

## Alert Levels

- **WATCH** (Score 30-50): Informational, logged only
- **ELEVATED** (Score 51-70): Dashboard notification
- **ACTION** (Score 71-100): Push notification + SMS + dashboard

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables (see `.env.example`)

3. Start Celery worker:
```bash
celery -A app.celery_app worker --loglevel=info
```

4. Start the service:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload
```

## API Endpoints

- `GET /api/v1/alerts` - List alerts
- `GET /api/v1/alerts/{alert_id}` - Get alert details
- `PATCH /api/v1/alerts/{alert_id}/acknowledge` - Acknowledge alert
- `POST /api/v1/notifications/test` - Test notification delivery

## Notification Channels

- Email (SendGrid)
- SMS (Twilio)
- Push (Firebase Cloud Messaging)
- WebSocket (real-time dashboard updates)
- Slack/Teams webhooks
