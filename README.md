# ChatSQL-ui

A React-based frontend for ChatSQL that provides a modern interface for database interaction with natural language queries.

## Features

- **Natural Language to SQL**: Convert natural language queries to SQL
- **Database Sidebar**: Browse database tables, view data, and download results
- **Real-time Query Execution**: Execute SQL queries and view results instantly
- **Environment-based Configuration**: Easy switching between development and production backends
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## Environment Setup

The application uses environment-based configuration to switch between development and production backends.

### Environment Files

- `.env` - Default environment variables
- `.env.development` - Development-specific variables (auto-loaded in dev mode)
- `.env.production` - Production-specific variables (auto-loaded in production)
- `.env.local.example` - Template for local overrides

### Backend API Configuration

The application expects a backend API running at:

- **Development**: `http://localhost:8080/api`
- **Production**: `https://api.chatsql.ayanmn18.live/api`

You can override these URLs by creating a `.env.local` file:

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit the file with your local settings
VITE_API_BASE_URL=http://your-local-backend:8080/api
```

### Required Backend APIs

The frontend expects the following backend endpoints:

1. `POST /api/getTables` - Fetch database tables and metadata
2. `POST /api/getTableData` - Fetch paginated table data with filtering/sorting

See `docs/BACKEND_API_PROMPT.md` for complete API specifications.

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Development

```bash
# Start development server (uses .env.development)
npm run dev

# Type checking
npm run type-check

# Lint code
npm run lint
```

## Production

```bash
# Build for production (uses .env.production)
npm run build

# Preview production build locally
npm run preview
```

## Backend Integration

The application integrates with a backend API that provides:

- Database connection management
- SQL query execution
- Table metadata retrieval
- Paginated data fetching

See the `docs/` folder for complete backend API specifications and integration guides.

## Technology Stack

- **React 18** - Frontend framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool and dev server
- **Lucide React** - Icons

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── services/           # API service layer
├── lib/                # Utility functions
└── types.ts            # TypeScript type definitions
```
