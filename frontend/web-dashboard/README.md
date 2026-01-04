# Web Dashboard

React-based web application for monitoring drilling operations and viewing alerts.

## Features

- Well list and timeline views
- Real-time risk monitoring
- Historical event analysis
- Alert management
- Responsive design

## Tech Stack

- React 18
- TypeScript
- Material-UI
- Recharts
- Socket.IO client

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables (see `.env.example`):
```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
```

3. Start development server:
```bash
npm start
```

## Available Scripts

- `npm start` - Start development server
- `npm test` - Run tests
- `npm run build` - Build for production
- `npm run lint` - Run linter
- `npm run format` - Format code

## Project Structure

- `src/pages/` - Page components
- `src/components/` - Reusable components
- `src/api/` - API client
- `src/hooks/` - Custom React hooks
- `src/store/` - State management
- `src/types/` - TypeScript types
