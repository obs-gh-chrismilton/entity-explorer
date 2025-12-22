# Agent Handoff: Entity Explorer

## Project Overview

**Entity Explorer** is a web application that connects to Observe's observability platform and provides a visual interface for exploring datasets, dashboards, monitors, and their relationships. It includes an AI-powered chat feature using OpenAI.

**Tech Stack:**
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Infrastructure**: Docker Compose
- **AI**: OpenAI GPT-4

## Current State

✅ **Working Pages:**
- Dashboard (shows entity counts)
- Datasets (387 entities)
- Dashboards (200 entities)
- Monitors (5 entities)
- Search (OPAL code search)
- AI Chat (OpenAI integration)

⚠️ **Limited Functionality:**
- Relationships page loads but shows 0 entities (see Known Limitations below)

## Recent Work

**PR #1**: https://github.com/obs-gh-chrismilton/entity-explorer/pull/1

This PR documents 4 major issues that were fixed:

1. **Observe API Authentication** - Fixed Customer ID vs Workspace ID confusion
2. **AI Chat API Mismatch** - Fixed frontend/backend message format
3. **Docker Dev Environment** - Added hot-reloading support
4. **GraphQL Query Fixes** - Corrected type fragment errors

**Read the PR for detailed technical explanations of each issue.**

## Getting Started

### 1. Start the Development Environment

```bash
cd /Users/chris.milton/TekionWork/entity-explorer/new-app
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### 2. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### 3. Login Credentials

Use Observe credentials for the Tekion production environment:
- URL: `https://156247313073.observeinc.com`
- Username: Your Observe email
- API Token: Your Observe API token

### 4. Key Files

| File | Purpose |
|------|---------|
| `backend/src/services/observe-client.ts` | Observe GraphQL API client |
| `backend/src/routes/entities.ts` | Entity CRUD endpoints |
| `backend/src/routes/ai.ts` | AI chat endpoints |
| `backend/src/services/ai-service.ts` | OpenAI integration |
| `frontend/src/pages/*.tsx` | React page components |
| `frontend/src/lib/api.ts` | Frontend API client |

### 5. Environment Variables

The `.env` file contains:
- `OPENAI_API_KEY` - Required for AI Chat feature
- `SESSION_SECRET` - For cookie signing
- `PORT` - Backend port (3001)

## Known Limitations

### Relationships Page Shows 0 Entities

**Root Cause:** The `getRelationships()` method in `observe-client.ts` extracts relationships from dataset stages. However, Observe's GraphQL schema doesn't expose `stages` on the Dataset type (only on types implementing `IWorksheetLike` like Dashboards and Worksheets).

**Potential Solutions:**
1. Extract relationships from Dashboard/Worksheet stages instead (they DO have stage data)
2. Query Observe for a native relationships API if one exists
3. Build relationships from dataset metadata (inputDataset references, etc.)

### AI Chat Context Limitations

The AI receives a summary of entities but doesn't have access to:
- Full OPAL pipeline code for each entity
- Real-time query execution
- Entity modification capabilities

## Architecture Notes

### Observe API ID System

```
Customer ID: 156247313073
├── Used in: API URL, Bearer token format
└── Example: Authorization: Bearer 156247313073 {token}

Workspace ID: 42016002
├── Used in: GraphQL query filters
├── Contains: All dashboards, monitors, worksheets
└── Fetched from: currentUser.workspaceId
```

### Session Management

Sessions are stored in-memory and cleared on backend restart. For production:
- Consider Redis for persistent sessions
- Implement token refresh logic

## Suggested Next Steps

1. **Fix Relationships Page** - Extract relationships from dashboards/worksheets that have stage data
2. **Add Worksheet Support** - Currently not displayed in UI
3. **Improve AI Context** - Include more entity details for better AI responses
4. **Add Tests** - No test coverage currently exists
5. **Production Deployment** - Create production Docker configuration

## Useful Commands

```bash
# View backend logs
docker-compose logs -f backend

# Rebuild containers
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Check git status
git status

# View recent commits
git log --oneline -10
```

## Contact

Repository: https://github.com/obs-gh-chrismilton/entity-explorer
Branch: `claude/rebuild-app-docker-01XME9xHg8v7KrNnNHAdNV2i`
