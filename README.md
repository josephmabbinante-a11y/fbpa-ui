# FBPA — Freight Bill Payment & Audit (Monorepo)

A monorepo containing the full FBPA platform: React/Vite frontend, Express backend/microservices, and the standalone FBPA API.

## 🚨 Security Notice

**Important:** Never commit secrets or credentials. Use `.env` files (see `.env.example` in each package) and configure sensitive values via your deployment platform's dashboard. See [DEPLOYMENT.md](./DEPLOYMENT.md) for details.

---

## Repository Structure

```
fbpa-ui/
├── frontend/          ← React/Vite UI application
├── backend/           ← Express server & microservices
├── api/               ← FBPA API (sourced from josephmabbinante-a11y/FBPA-api)
├── postman/           ← Postman collections
├── docker-compose.yml ← Orchestrates all services
├── package.json       ← Root npm workspace config
└── README.md
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm 7+ (for workspaces support)
- MongoDB Atlas account (or local MongoDB)
- Docker & Docker Compose (optional, for containerised setup)

### Install all dependencies

```bash
# From the monorepo root:
npm install
```

Or install per package:

```bash
cd frontend && npm install
cd ../backend && npm install
cd ../api && npm install
```

### Environment variables

Each package has its own `.env.example`:

```bash
cp frontend/.env.example frontend/.env
cp api/.env.example api/.env
cp backend/.env.example backend/.env   # create if needed
```

Edit each `.env` with your configuration values.

---

## Running the application

### All services at once (from root)

```bash
npm run dev
```

This runs `frontend`, `api`, and `backend` concurrently.

### Individual services

```bash
npm run dev:frontend   # Vite dev server  → http://localhost:5173
npm run dev:api        # FBPA API server  → http://localhost:5000
npm run dev:backend    # Express server   → http://localhost:4000
```

---

## Running with Docker

```bash
docker-compose up
```

Services exposed:
| Service    | URL                      |
|------------|--------------------------|
| Frontend   | http://localhost:3000    |
| API        | http://localhost:5000    |
| Backend    | http://localhost:4000    |
| ML service | http://localhost:8000    |

---

## Available root scripts

| Script               | Description                                  |
|----------------------|----------------------------------------------|
| `npm run dev`        | Run all services concurrently                |
| `npm run dev:frontend` | Start the Vite frontend dev server         |
| `npm run dev:api`    | Start the FBPA API                           |
| `npm run dev:backend`| Start the backend Express server            |
| `npm run build:frontend` | Build the frontend for production        |
| `npm run install:all`| Install deps in all workspaces              |

---

## Package details

### `frontend/`
React 19 + Vite application. See `frontend/package.json` for available scripts.

### `backend/`
Node.js/Express server and microservices (route intelligence, ML shadow, tracking, capacity worker). See `backend/package.json`.

### `api/`
Standalone FBPA REST API sourced from [`josephmabbinante-a11y/FBPA-api`](https://github.com/josephmabbinante-a11y/FBPA-api). See [`api/README.md`](./api/README.md) for sync instructions.

---

## Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Pre-Flight Checklist](./Pre-Flight-Deployment-Checklist.md)
- [API README](./api/README.md)
- [Structure Notes](./FBPA_v1.2_structure.md)

---

## Postman collections

Postman collections for API testing are in the [`postman/`](./postman/) directory.

---

## Tech Stack

- **Frontend:** React 19, Vite, React Router, Recharts
- **Backend:** Node.js, Express 4, Socket.IO
- **API:** Node.js, Express 5, Mongoose
- **Database:** MongoDB (Mongoose), PostgreSQL (pg)
- **Auth:** JWT, bcryptjs
- **Infrastructure:** Docker Compose, Render, Vercel

## License

Private — All Rights Reserved


