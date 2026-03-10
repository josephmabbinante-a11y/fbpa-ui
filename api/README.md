# FBPA API

This package is sourced from [`josephmabbinante-a11y/FBPA-api`](https://github.com/josephmabbinante-a11y/FBPA-api) and should be kept in sync with that repository.

## Bringing in the full FBPA-api history

To fully populate this directory with the complete source and history from FBPA-api, run:

```bash
git subtree add --prefix=api https://github.com/josephmabbinante-a11y/FBPA-api main --squash
```

To pull future updates from FBPA-api:

```bash
git subtree pull --prefix=api https://github.com/josephmabbinante-a11y/FBPA-api main --squash
```

## Setup

```bash
cd api
cp .env.example .env
# Fill in your environment variables
npm install
npm run dev
```

## Description

The FBPA API provides authentication, invoice management, carrier management, and related endpoints for the Freight Bill Payment and Audit system.

See the [main README](../README.md) and [DEPLOYMENT.md](../DEPLOYMENT.md) for full deployment instructions.
