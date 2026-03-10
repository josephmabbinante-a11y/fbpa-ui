# FBPA API

This is the standalone API service for the FBPA (Freight Bill Payment & Audit) platform.

## Setup

1. Copy `.env.example` to `.env` and fill in values
2. `npm install`
3. `npm run dev` — starts with nodemon
4. `npm start` — production start

## Structure

- `index.js` — Express app entry point
- `routes/` — API route handlers
- `models/` — Mongoose models
- `middleware/` — Auth and other middleware
- `src/` — Additional source files
- `scripts/` — Utility scripts
- `seed.js` / `seedData.js` — Database seeding

## Pulling in Full API Source

To pull in the full source code from the original FBPA-api repository, run:

```bash
git subtree add --prefix=api https://github.com/josephmabbinante-a11y/FBPA-api main --squash
```

This will merge the full FBPA-api history into the `api/` directory.
