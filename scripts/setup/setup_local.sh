#!/bin/bash

set -e

echo "Setting up EDIM Platform local development environment..."

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Install frontend dependencies
if [ -d "frontend/web-dashboard" ]; then
    echo "Installing frontend dependencies..."
    cd frontend/web-dashboard
    npm install
    cd ../..
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please update .env with your configuration"
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p data/raw
mkdir -p data/processed
mkdir -p logs

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your configuration"
echo "2. Run 'make docker-up' to start services"
echo "3. Run 'make migrate' to set up databases"

