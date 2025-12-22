# Entity Explorer

A powerful web application for exploring and analyzing entities in the Observe platform, featuring AI-powered insights and interactive visualizations.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Overview

Entity Explorer is a modern full-stack application that provides:

- **Interactive Entity Exploration**: Browse and search through Observe entities with a intuitive interface
- **AI-Powered Insights**: Get intelligent analysis and recommendations using OpenAI
- **Relationship Visualization**: See connections between entities with interactive graph views
- **Real-time Data**: Live updates from the Observe platform
- **Rich Analytics**: Detailed metrics and dashboards for entity analysis

## Features

- Modern React frontend with TypeScript and Tailwind CSS
- Express.js backend API with TypeScript
- Docker-based deployment for consistent environments
- Hot-reload development environment
- Production-optimized builds with multi-stage Docker
- Nginx reverse proxy with SPA routing
- Health checks and logging
- OpenAI integration for AI features
- Observe platform integration

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Docker Desktop                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Docker Network                         │ │
│  │                                                           │ │
│  │  ┌──────────────────┐         ┌──────────────────┐      │ │
│  │  │    Frontend      │         │     Backend      │      │ │
│  │  │                  │         │                  │      │ │
│  │  │  React + Vite    │◄────────┤  Express.js      │      │ │
│  │  │  TypeScript      │  API    │  TypeScript      │      │ │
│  │  │  Tailwind CSS    │  Proxy  │                  │      │ │
│  │  │                  │         │  ┌────────────┐  │      │ │
│  │  │  Nginx (Prod)    │         │  │  OpenAI    │  │      │ │
│  │  │  Port: 80/5173   │         │  │  Client    │  │      │ │
│  │  │                  │         │  └────────────┘  │      │ │
│  │  │                  │         │                  │      │ │
│  │  │                  │         │  ┌────────────┐  │      │ │
│  │  │                  │         │  │  Observe   │  │      │ │
│  │  │                  │         │  │  Client    │  │      │ │
│  │  │                  │         │  └────────────┘  │      │ │
│  │  │                  │         │                  │      │ │
│  │  └──────────────────┘         │  Port: 3001      │      │ │
│  │                               └──────────────────┘      │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Volumes                                │ │
│  │  • backend-node-modules   (dev dependencies)             │ │
│  │  • frontend-node-modules  (dev dependencies)             │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ External APIs
                              ▼
                    ┌──────────────────┐
                    │  Observe API     │
                    │  OpenAI API      │
                    └──────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for fast builds and HMR
- Tailwind CSS for styling
- React Router for navigation
- TanStack Query for data fetching
- Zustand for state management
- ReactFlow for graph visualization
- Recharts for analytics
- Framer Motion for animations

**Backend:**
- Node.js 20 with Express
- TypeScript for type safety
- Axios for API calls
- OpenAI SDK for AI features
- Zod for validation
- Helmet for security
- Morgan for logging
- Compression for responses

**Infrastructure:**
- Docker with multi-stage builds
- Nginx for static file serving and reverse proxy
- Docker Compose for orchestration
- Health checks and auto-restart

## Prerequisites

- **Docker Desktop** (version 20.10 or later)
  - [Download for Mac](https://docs.docker.com/desktop/mac/install/)
  - [Download for Windows](https://docs.docker.com/desktop/windows/install/)
  - [Download for Linux](https://docs.docker.com/desktop/linux/install/)
- **Make** (optional, for convenience commands)
  - macOS: Pre-installed
  - Windows: Install via chocolatey `choco install make` or use WSL
  - Linux: `sudo apt-get install make`

### API Keys Required

1. **Observe API Token** - Get from your Observe account settings
2. **OpenAI API Key** - Get from [OpenAI Platform](https://platform.openai.com/api-keys)

## Quick Start

### 1. Clone and Navigate

```bash
cd /home/user/entity-explorer/new-app
```

### 2. Setup Environment

```bash
# Copy the example environment file
make setup
# or manually:
cp .env.example .env

# Edit .env and add your API keys
nano .env  # or use your preferred editor
```

Required configuration in `.env`:
```env
OBSERVE_API_URL=https://your-tenant.observeinc.com/v1/meta
OBSERVE_API_TOKEN=your_observe_api_token_here
OPENAI_API_KEY=sk-your_openai_api_key_here
SESSION_SECRET=generate_a_random_string_here
```

### 3. Start Development Environment

```bash
# Using Make (recommended)
make dev

# Or using docker-compose directly
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### 4. Access the Application

- **Frontend**: http://localhost:5173 (development) or http://localhost (production)
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

### 5. Stop the Application

```bash
# Stop containers
make down

# Or press Ctrl+C if running in foreground
```

## Configuration

### Environment Variables

All configuration is done through environment variables in the `.env` file:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment (development/production) | No | production |
| `OBSERVE_API_URL` | Observe API endpoint URL | Yes | - |
| `OBSERVE_API_TOKEN` | Observe authentication token | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes | - |
| `SESSION_SECRET` | Secret for session encryption | Yes | - |
| `PORT` | Backend server port | No | 3001 |
| `CORS_ORIGIN` | Allowed CORS origin | No | http://localhost |
| `LOG_LEVEL` | Logging level | No | info |

### Generating Session Secret

```bash
# Generate a secure random string
openssl rand -base64 32
```

## Development

### Development Mode Features

- **Hot Module Replacement (HMR)**: Frontend changes reflect instantly
- **Auto-restart**: Backend restarts on file changes
- **Source Maps**: Full debugging support
- **Volume Mounts**: Code changes sync to containers
- **Debug Port**: Node.js debugger on port 9229

### Development Commands

```bash
# Start development environment
make dev

# View logs
make logs                # All services
make logs-backend        # Backend only
make logs-frontend       # Frontend only

# Access container shell
make shell-backend       # Backend container
make shell-frontend      # Frontend container

# Run tests
make test                # All tests
make test-backend        # Backend tests only
make test-frontend       # Frontend tests only

# Restart services
make restart             # All services
make rebuild-backend     # Rebuild backend only
make rebuild-frontend    # Rebuild frontend only

# Check status
make ps                  # Show running containers
make health              # Health check status
make stats               # Resource usage
```

### Project Structure

```
new-app/
├── backend/                 # Backend Node.js application
│   ├── src/
│   │   ├── index.ts        # Entry point
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── middleware/     # Express middleware
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # Frontend React application
│   ├── src/
│   │   ├── App.tsx         # Main component
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API clients
│   │   └── utils/          # Utilities
│   ├── package.json
│   └── vite.config.ts
├── docker/                 # Docker configuration
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── docker-compose.yml      # Production compose
├── docker-compose.dev.yml  # Development overrides
├── .env.example            # Example environment
├── Makefile                # Convenience commands
└── README.md               # This file
```

### Adding New Dependencies

**Backend:**
```bash
# Enter backend container
make shell-backend

# Install package
npm install package-name

# Exit container and rebuild
exit
make rebuild-backend
```

**Frontend:**
```bash
# Enter frontend container
make shell-frontend

# Install package
npm install package-name

# Exit container and rebuild
exit
make rebuild-frontend
```

## Production Deployment

### Building Production Images

```bash
# Build optimized images
make build
```

This creates:
- Multi-stage optimized Docker images
- Minified frontend assets
- Compiled TypeScript backend
- Production-only dependencies

### Starting Production

```bash
# Start in production mode
make up

# View logs
make logs

# Check health
make health
```

### Production Features

- **Optimized Images**: Multi-stage builds with minimal size
- **Security**: Non-root users, security headers, minimal attack surface
- **Performance**: Gzip compression, asset caching, optimized nginx
- **Reliability**: Health checks, auto-restart, proper signal handling
- **Monitoring**: JSON logs with rotation

### Performance Optimizations

1. **Frontend**:
   - Static asset caching (1 year)
   - Gzip compression
   - Code splitting
   - Lazy loading
   - CDN-ready assets

2. **Backend**:
   - Response compression
   - Connection pooling
   - Efficient logging
   - Optimized dependencies

3. **Nginx**:
   - Sendfile enabled
   - Keepalive connections
   - Gzip compression
   - Static file caching

## API Documentation

### Health Check

```http
GET /api/health
```

Returns the health status of the backend service.

### Entities

```http
GET /api/entities
```

Retrieve list of all entities.

```http
GET /api/entities/:id
```

Get details for a specific entity.

### AI Analysis

```http
POST /api/analyze
Content-Type: application/json

{
  "entityId": "string",
  "prompt": "string"
}
```

Get AI-powered analysis for an entity.

### Search

```http
GET /api/search?q=query&type=entity_type
```

Search entities with filters.

For complete API documentation, see the OpenAPI specification in the backend service.

## Troubleshooting

### Common Issues

**Issue: Port already in use**
```bash
# Check what's using the port
lsof -i :3001  # Backend
lsof -i :80    # Frontend (production)
lsof -i :5173  # Frontend (development)

# Kill the process or change port in docker-compose
```

**Issue: Cannot connect to Docker daemon**
```bash
# Make sure Docker Desktop is running
# On Mac/Windows: Open Docker Desktop application
# On Linux:
sudo systemctl start docker
```

**Issue: Permission denied errors**
```bash
# On Linux, add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

**Issue: Frontend cannot reach backend**
- Check that both containers are on the same network
- Verify CORS_ORIGIN in .env matches frontend URL
- Check backend logs: `make logs-backend`

**Issue: Build fails with memory error**
```bash
# Increase Docker memory limit in Docker Desktop settings
# Preferences > Resources > Memory (recommend 4GB+)
```

**Issue: Hot reload not working**
- Make sure you're using dev mode: `make dev`
- Check volume mounts in docker-compose.dev.yml
- Try rebuilding: `make rebuild`

### Logs and Debugging

```bash
# View all logs
make logs

# View specific service logs
make logs-backend
make logs-frontend

# Follow logs for specific container
docker logs -f entity-explorer-backend

# Check container status
make ps
make health

# Inspect container
make inspect-backend
make inspect-frontend

# Access container shell for debugging
make shell-backend
make shell-frontend
```

### Clean Reset

If you encounter persistent issues:

```bash
# Stop everything and clean up
make clean

# Remove volumes (WARNING: deletes all data)
make down-volumes

# Rebuild from scratch
make setup
make build
make up
```

## Screenshots

### Dashboard View
![Dashboard](docs/screenshots/dashboard.png)

### Entity Graph
![Entity Graph](docs/screenshots/entity-graph.png)

### AI Analysis
![AI Analysis](docs/screenshots/ai-analysis.png)

*Note: Add actual screenshots to the `docs/screenshots/` directory*

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly (`make test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow the existing code style
- Ensure Docker builds succeed

## License

[Add your license here]

## Support

For issues and questions:
- Open an issue in the repository
- Contact the development team
- Check the troubleshooting section above

## Acknowledgments

- Built with React, Express, and Docker
- Powered by Observe and OpenAI APIs
- Uses open-source libraries and tools

---

**Made with ❤️ by the Entity Explorer Team**
