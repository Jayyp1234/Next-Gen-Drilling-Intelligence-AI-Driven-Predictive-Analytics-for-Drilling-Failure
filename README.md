# EDIM Platform - Execution-phase Drilling Intelligence Module

Enterprise MVP for early drilling risk detection using ML-powered pattern recognition.

## Project Structure

```
edim-platform/
|-- services/              # Backend microservices
|-- frontend/             # Frontend applications
|-- ml-pipeline/          # ML training and inference
|-- shared/               # Shared libraries and utilities
|-- infrastructure/       # Infrastructure as code
|-- database/             # Database migrations and schemas
|-- scripts/              # Utility scripts
|-- tests/                # Integration and E2E tests
|-- docs/                 # Documentation
`-- config/               # Configuration files
```

## Quick Start

See individual service READMEs for setup instructions.

## Technology Stack

- **Backend**: Python 3.11+, FastAPI, Celery, Apache Airflow
- **ML**: TensorFlow, PyTorch, Scikit-learn, MLflow
- **Frontend**: React 18, TypeScript, Material-UI
- **Databases**: PostgreSQL, TimescaleDB, Redis
- **Infrastructure**: AWS, Docker, Kubernetes, Terraform

## Development

1. Clone the repository
2. Set up environment variables (see `.env.example`)
3. Run `docker-compose up` for local development
4. See individual service READMEs for specific setup

## License

Proprietary - All rights reserved
