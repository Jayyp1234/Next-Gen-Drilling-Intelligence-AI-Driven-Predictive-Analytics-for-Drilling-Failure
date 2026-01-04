# System Architecture

## Overview

The EDIM platform follows a microservices architecture with clear separation of concerns.

## Architecture Layers

### 1. Presentation Layer
- **Web Dashboard**: React-based web application
- **Mobile Companion**: React Native mobile app (Phase 2)

### 2. API Gateway Layer
- **API Gateway Service**: Single entry point for all client requests
- Handles authentication, authorization, rate limiting, and routing

### 3. Application Services Layer
- **Data Ingestion Service**: Handles data ingestion and processing
- **Intelligence Engine**: ML-powered risk detection
- **Risk & Alerting Service**: Alert generation and notification routing

### 4. Data Layer
- **PostgreSQL**: Operational data (wells, users, alerts)
- **TimescaleDB**: Time-series sensor data
- **Redis**: Caching and real-time features
- **MLflow + S3**: ML model storage

### 5. Infrastructure Layer
- **Docker**: Containerization
- **Kubernetes**: Orchestration (production)
- **Terraform**: Infrastructure as Code
- **Airflow**: Data pipeline orchestration

## Service Communication

- **Synchronous**: REST APIs via API Gateway
- **Asynchronous**: RabbitMQ message queue
- **Real-time**: WebSocket connections
- **Background Tasks**: Celery workers

## Data Flow

1. Raw data → Ingestion Service → Validation → TimescaleDB
2. Sensor data → Intelligence Engine → Risk Assessment
3. Risk Assessment → Alert Service → Notifications
4. All data → API Gateway → Frontend

## Scalability

- Horizontal scaling via Kubernetes
- Stateless services for easy scaling
- Database read replicas for high read loads
- Caching layer (Redis) for performance
