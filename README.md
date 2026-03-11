# FBPA — Freight Bill Payment & Audit

This is the FBPA monorepo containing the frontend app, backend services, and API.

## Structure

| Directory | Description |
|-----------|-------------|
| `frontend/` | React + Vite frontend application |
| `server/` | Express server and internal microservices (route-intelligence, capacity-worker, ml-shadow, tracking) |
| `api/` | Standalone REST API service (FBPA-api, Express + MongoDB) |

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for running all services)
- MongoDB
- PostgreSQL

### Run Everything with Docker

> **Before running:** copy `api/.env.example` to `api/.env` and fill in the values.

```bash
docker-compose up
```

### Run Frontend Only

```bash
cd frontend
npm install
npm run dev
```

### Run API Only

```bash
cd api
npm install
cp .env.example .env
# fill in .env values
npm run dev
```

## Workspaces

This repo uses npm workspaces. From the root you can run:

```bash
npm run dev:frontend   # Start the Vite frontend
npm run dev:server     # Start the Express server with nodemon
npm run dev:api        # Start the API with nodemon
npm run dev            # Start all three concurrently
```

## Notes

- `api/` was previously the standalone `FBPA-api` repository. To pull in the full API source run:
  ```bash
  git subtree add --prefix=api https://github.com/josephmabbinante-a11y/FBPA-api main --squash
  ```
- `server/` contains the internal backend services that were previously at the root of `fbpa-ui`
- `frontend/` contains the React/Vite app that was previously at the root of `fbpa-ui`

## Security Notice

**Important:** Never commit `.env` files. See [DEPLOYMENT.md](./DEPLOYMENT.md) for security and deployment instructions.

## Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Production deployment and security best practices

## License

Private - All Rights Reserved

