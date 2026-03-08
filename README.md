# FBPA UI - Freight Bill Payment & Audit System

A modern web application for freight bill auditing and payment management built with React and Node.js.

## 🚨 Security Notice

**Important:** This repository previously contained exposed database credentials. If you are setting up this application, see [DEPLOYMENT.md](./DEPLOYMENT.md) for critical security information and setup instructions.

## Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Local Development

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd fbpa-ui
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development servers:**
   ```bash
   # Terminal 1: Start backend server
   npm run server
   
   # Terminal 2: Start frontend dev server
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000

## Deployment

For production deployment to Render or other platforms, see [DEPLOYMENT.md](./DEPLOYMENT.md) for complete instructions.

## Available Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run server` - Start backend server
- `npm run lint` - Run ESLint

## Tech Stack

- **Frontend:** React 19, Vite, React Router
- **Backend:** Express, Node.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT
- **Styling:** Custom CSS-in-JS

## Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Production deployment and security best practices

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and tests
4. Submit a pull request

## License

Private - All Rights Reserved

---

## Original Vite Template Info

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## Debugging Authentication (Login/Register/Forgot Password)

### Backend (Node/Express)
- All authentication endpoints (`/auth/login`, `/auth/register`, `/auth/forgot-password`) now log incoming request bodies and errors to the server console.
- If you get a 400 or 401 error, check the server logs for details (e.g., missing fields, invalid credentials).
- If you get a 500 error, check for stack traces or error messages in the server logs.

### Frontend (React)
- The login and register forms now display backend error messages directly in the UI.
- The frontend also logs all payloads and errors to the browser console for easier debugging.

### Postman/Curl Testing
- Use the provided `FBPA-auth-api.postman_collection.json` to test endpoints directly.
- Always set `Content-Type: application/json` and provide the required fields in the request body.

### Common Issues
- **400 Bad Request:** Usually means a required field (like `email` or `password`) is missing or empty.
- **401 Unauthorized:** Invalid credentials for login.
- **409 Conflict:** User already exists (register endpoint).
- **500 Server Error:** Check backend logs for details.

### Example Curl for Login
```sh
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

### Example Curl for Forgot Password
```sh
curl -X POST http://localhost:4000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}'
```

---

## Saia Rate Quote API Integration


## Saia Rate Quote API Integration (Auction Board)

**Auction Board endpoints:**
- `POST /auction/saia/quote` — normalized Saia quote for auction board
- `GET /auction/saia/circuit` — Saia circuit breaker state for auction board

**Legacy endpoints (for reference):**
- `POST /api/rate-logic/saia/quote` for normalized Saia quote + pricing inputs
- `GET /api/rate-logic/health/saia` and `GET /health/saia` for carrier health monitoring
- `GET /api/rate-logic/saia/logs` for audit log retrieval

**Integration location:**
- All Saia quoting logic for the auction board is now under `server/multitenant/services/carriers/saia/` and wired via `server/multitenant/src/modules/auction/`.


Required environment variables (never hardcode):
- `SAIA_RATE_QUOTE_URL`
- `SAIA_SUBSCRIPTION_KEY`
- `SAIA_ACCOUNT_NUMBER`
- `SAIA_API_USERNAME` (if required by your Saia tenant)
- `SAIA_API_PASSWORD` (if required by your Saia tenant)
- `SAIA_TIMEOUT_MS` (recommended 5000–8000, default 7000)

Security guidance:
- Store credentials in encrypted environment variables.
- Use a secrets manager in production (Azure Key Vault, AWS Secrets Manager, etc.).
- Do not expose subscription keys, account credentials, or raw carrier responses to frontend users.

