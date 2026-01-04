.PHONY: help setup install test lint format docker-build docker-up docker-down migrate seed clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Initial setup - install dependencies and setup environment
	@echo "Setting up development environment..."
	@./scripts/setup/setup_local.sh

install: ## Install all dependencies
	@echo "Installing Python dependencies..."
	@pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	@cd frontend/web-dashboard && npm install

test: ## Run all tests
	@echo "Running tests..."
	@pytest services/ tests/ -v --cov=services --cov-report=html
	@cd frontend/web-dashboard && npm test

lint: ## Run linters
	@echo "Running linters..."
	@flake8 services/ shared/
	@cd frontend/web-dashboard && npm run lint

format: ## Format code
	@echo "Formatting code..."
	@black services/ shared/ ml-pipeline/
	@cd frontend/web-dashboard && npm run format

docker-build: ## Build all Docker images
	@echo "Building Docker images..."
	@docker-compose build

docker-up: ## Start all services with Docker Compose
	@echo "Starting services..."
	@docker-compose up -d

docker-down: ## Stop all services
	@echo "Stopping services..."
	@docker-compose down

migrate: ## Run database migrations
	@echo "Running migrations..."
	@./scripts/database/migrate.sh

seed: ## Seed database with sample data
	@echo "Seeding database..."
	@./scripts/database/seed.sh

clean: ## Clean temporary files and caches
	@echo "Cleaning..."
	@find . -type d -name __pycache__ -exec rm -r {} +
	@find . -type f -name "*.pyc" -delete
	@find . -type d -name ".pytest_cache" -exec rm -r {} +
	@find . -type d -name ".mypy_cache" -exec rm -r {} +
	@rm -rf htmlcov/ .coverage

