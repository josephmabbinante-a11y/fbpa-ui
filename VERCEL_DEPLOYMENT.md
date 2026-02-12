# Vercel Deployment Guide

This repository has been configured for deployment on Vercel.

## Configuration Files

- **vercel.json**: Main Vercel configuration file
- **.vercelignore**: Files to exclude from deployment
- **api/index.js**: Serverless API handler for backend routes

## Deployment Steps

### 1. Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import this repository from GitHub

### 2. Configure Environment Variables

In the Vercel project settings, add the following environment variables:

- `MONGODB_URI`: Your MongoDB connection string
  - Example: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
  
- `JWT_SECRET`: Your JWT secret key
  - Example: `your_secret_key_change_in_production`
  
- `NODE_ENV`: Set to `production`

**Important**: In vercel.json, environment variables are referenced as `@mongodb_uri` and `@jwt_secret`. These need to be configured as Vercel Secrets:

```bash
# Using Vercel CLI
vercel secrets add mongodb_uri "your-mongodb-connection-string"
vercel secrets add jwt_secret "your-secret-key"
```

### 3. Build Configuration

Vercel will automatically:
- Run `npm run build` to build the React frontend
- Deploy the frontend static files from the `dist` directory
- Deploy the API routes as serverless functions

### 4. API Routes

The following routes will be handled by the serverless API:
- `/api/*` - All API endpoints (customers, messages, rate-logic)
- `/auth/*` - Authentication endpoints

All other routes will serve the React frontend.

## Comparison with Render Configuration

The `render.yml` configuration has been adapted for Vercel:

| Render | Vercel |
|--------|--------|
| Single Node.js service | Static frontend + Serverless API |
| `node server/index.js` | `api/index.js` (serverless) |
| Environment variables set in render.yml | Environment variables set in Vercel dashboard |
| Builds from `npm install` | Builds from `npm run build` (Vite) |

## Local Development

Local development remains unchanged:
```bash
# Start the development server
npm run dev

# Start the backend server
npm run server
```

## Notes

- The `api/index.js` file imports the Express app logic from the `server/` directory
- The serverless function maintains the same functionality as the standalone server
- CORS configuration allows localhost origins for local development
