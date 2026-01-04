# API Gateway Service

Main entry point for all client requests. Handles authentication, authorization, rate limiting, and routing.

## Features

- OAuth 2.0 / JWT authentication
- Role-Based Access Control (RBAC)
- Rate limiting
- Request routing to backend services
- Audit logging
- CORS handling

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
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

- `POST /api/v1/auth/login` - User login
- `GET /api/v1/wells` - List wells
- `GET /api/v1/wells/{well_id}` - Get well details
- `GET /api/v1/monitoring/{well_id}/status` - Get current risk status
- `GET /api/v1/alerts` - List alerts
- `GET /api/v1/insights/{well_id}/historical` - Historical events

## Authentication

The API uses JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

## Roles

- **Viewer**: Read-only access
- **Engineer**: View + acknowledge alerts
- **Admin**: Full access + user management
