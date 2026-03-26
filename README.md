# Process Automation Backend

A **Decision Support Platform for Business Process Analysis and Automation** built with Node.js, Express, and MongoDB Atlas.

## Features

- Submit business process descriptions (text / user story format)
- Automatic analysis: detect steps, actors, actions, repetitive tasks, and human interventions
- Automation scoring engine (weighted 6-criteria score out of 30)
- Improvement recommendations generator
- Dashboard statistics API

## Tech Stack

- **Runtime**: Node.js (≥18)
- **Framework**: Express
- **Database**: MongoDB Atlas (via Mongoose)
- **Extras**: cors, dotenv, helmet, morgan

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A MongoDB Atlas cluster (free tier works)

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (default `5000`) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `NODE_ENV` | `development` or `production` |

### Running the server

```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/processes` | Create a new process |
| `GET` | `/api/processes` | List all processes |
| `GET` | `/api/processes/:id` | Get a single process |
| `PUT` | `/api/processes/:id` | Update a process |
| `DELETE` | `/api/processes/:id` | Delete a process |
| `POST` | `/api/processes/:id/analyze` | Trigger / re-trigger analysis |
| `GET` | `/api/dashboard/stats` | Dashboard statistics |
| `GET` | `/api/dashboard/overview` | All processes with scores |

## Scoring Criteria

Each criterion is scored out of 5 (total max = 30):

| Criterion | Description |
|-----------|-------------|
| Nombre d'étapes | Process complexity |
| Tâches répétitives | Automation potential |
| Intervention humaine | Human dependency (inverse) |
| Volume | Process frequency |
| Règles métier | Decision clarity |
| Données | Data structuring level |

**Classification:**
- **Automatisable**: total score > 20
- **Semi-automatisable**: score 10–20
- **Non automatisable**: score < 10

## Project Structure

```
├── server.js
├── src/
│   ├── config/database.js
│   ├── models/Process.js
│   ├── routes/processRoutes.js
│   ├── controllers/processController.js
│   ├── services/
│   │   ├── analysisService.js
│   │   ├── scoringService.js
│   │   └── recommendationService.js
│   └── middleware/errorHandler.js
```