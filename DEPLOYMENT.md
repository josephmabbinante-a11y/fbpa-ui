# Deployment Guide

This guide covers deploying the FBPA UI application to Render.com and other hosting platforms.

## 🚨 CRITICAL SECURITY NOTICE

**The MongoDB credentials that were previously hardcoded in this repository have been PUBLICLY EXPOSED and MUST be rotated immediately.**

### Immediate Actions Required:

1. **Rotate MongoDB Credentials:**
   - Log into your MongoDB Atlas account
   - Navigate to Database Access
   - Delete the user `josephmabbinante_db_user`
   - Create a new database user with a strong password
   - Update the connection string in your Render environment variables

2. **Rotate JWT Secret:**
   - Generate a new strong random secret (use: `openssl rand -base64 32`)
   - Update the JWT_SECRET in your Render environment variables

3. **Review Access Logs:**
   - Check MongoDB Atlas access logs for any suspicious activity
   - Review application logs for unauthorized access attempts

## Deployment to Vercel (Frontend)

The frontend is a static Vite/React SPA deployed on **Vercel**. The backend API runs separately on Railway.

### Vercel project settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite (or Other) |
| **Build Command** | `npm run build:frontend` |
| **Output Directory** | `frontend/dist` |
| **Root Directory** | *(leave empty — repo root)* |

### `vercel.json` — SPA rewrite

The repository ships a `vercel.json` that tells Vercel to serve the Vite output directory and fall back to `index.html` for client-side routes:

```json
{
  "version": 2,
  "buildCommand": "npm run build:frontend",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Vercel serves static files (including `/assets/*.css` and `/assets/*.js`) **before** applying rewrites, so the SPA fallback never intercepts built assets.

### Environment variable — API URL

Set the following variable in the Vercel dashboard under **Project → Settings → Environment Variables**:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL (no trailing slash) | `https://fbpa-api-production.up.railway.app` |

> **Do not** set `VITE_API_URL` to a path that should serve frontend assets. Vite's `base` is independently set to `/` in `vite.config.js`, ensuring all asset URLs are relative to the Vercel domain.

### How API calls work

The frontend fetches data using the `VITE_API_URL` env var **only for API requests** (e.g. `${VITE_API_URL}/api/shipments`). Asset files (`/assets/*.css`, `/assets/*.js`) are always served by Vercel from its own CDN — they never go to the Railway domain.

### Local development

```bash
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local and set VITE_API_URL=http://localhost:4000
cd frontend && npm run dev
```

---

## Deployment to Render

### Prerequisites

- A Render account (https://render.com)
- A MongoDB Atlas account with a database cluster
- Your application code pushed to a Git repository

### Step 1: Configure Environment Variables in Render

After connecting your repository to Render, you MUST set the following environment variables in the Render dashboard (do NOT put these in render.yml):

#### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string from Atlas | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Strong random secret for JWT signing | Generate with: `openssl rand -base64 32` |
| `NODE_ENV` | Environment (set in render.yml) | `production` |
| `CORS_ORIGIN` | Frontend URL(s), comma-separated | `https://your-app.onrender.com` |
| `SERVE_STATIC` | Serve frontend files (set in render.yml) | `true` |

#### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` (Render auto-assigns) |
| `DEV_AUTH_ALLOW_ANY` | Allow any login (dev only) | `false` |
| `SMTP_HOST` | SMTP server for emails | `smtp.ethereal.email` |
| `SMTP_USER` | SMTP username | (empty) |
| `SMTP_PASS` | SMTP password | (empty) |
| `SMTP_FROM` | Email from address | `noreply@audit-iq.com` |

### Step 2: Deploy from Dashboard

1. **Create a New Web Service:**
   - Go to your Render dashboard
   - Click "New +" → "Web Service"
   - Connect your Git repository

2. **Configure the Service:**
   - Render will automatically detect `render.yml`
   - Review the configuration
   - Add all required environment variables (see Step 1)

3. **Deploy:**
   - Click "Create Web Service"
   - Render will build and deploy your application
   - Monitor the logs for any errors

### Step 3: Verify Deployment

1. **Check Application Logs:**
   ```
   ✅ Connected to MongoDB
   Server running on port 4000
   ```

2. **Test the Application:**
   - Visit your Render URL
   - Try logging in
   - Verify database connectivity

## Local Development Setup

### Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)

### Setup Steps

1. **Clone the Repository:**
   ```bash
   git clone <repository-url>
   cd fbpa-ui
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Create Environment File:**
   ```bash
   cp .env.example .env
   ```

4. **Configure Environment Variables:**
   Edit `.env` and add your configuration:
   ```env
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
   JWT_SECRET=your-local-secret
   PORT=4000
   CORS_ORIGIN=http://localhost:5173
   SERVE_STATIC=false
   ```

5. **Start Development Server:**
   ```bash
   # Start backend
   npm run dev:server
   
   # In another terminal, start frontend
   npm run dev
   ```

6. **Access the Application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000

## Security Best Practices

### 1. Never Commit Secrets
- ✅ Use `.env` files for local development
- ✅ Add `.env` to `.gitignore`
- ❌ Never commit `.env` files or hardcode credentials
- ❌ Never put secrets in `render.yml` or other config files

### 2. Use Strong Secrets
- Generate JWT secrets with: `openssl rand -base64 32`
- Use complex MongoDB passwords (20+ characters)
- Rotate secrets regularly (every 90 days minimum)

### 3. Environment Variable Management
- Use Render's environment variable dashboard for production
- Use `sync: false` in `render.yml` for sensitive variables
- Document required variables in this file

### 4. MongoDB Security
- Enable IP whitelisting in MongoDB Atlas
- Use dedicated database users per environment
- Enable audit logging in MongoDB Atlas
- Regularly review access logs

### 5. Monitor for Exposed Secrets
- Use tools like `git-secrets` or `truffleHog`
- Enable GitHub secret scanning
- Review pull requests for accidental commits

### 6. Incident Response
If credentials are exposed:
1. Rotate affected credentials immediately
2. Review access logs for suspicious activity
3. Update all environments with new credentials
4. Document the incident
5. Review security practices to prevent recurrence

## Troubleshooting

### MongoDB Connection Issues

**Error: `MongoServerError: Authentication failed`**
- Verify MONGODB_URI is correct
- Check username and password
- Ensure database user has proper permissions

**Error: `MongoNetworkError: connection timeout`**
- Check MongoDB Atlas IP whitelist
- Verify network connectivity
- Confirm cluster is running

### CORS Issues

**Error: `CORS policy: No 'Access-Control-Allow-Origin' header`**
- Verify CORS_ORIGIN includes your frontend URL
- Check for trailing slashes
- Ensure protocol (http/https) matches

### Build Failures

**Error: `npm install` fails**
- Check Node.js version (18+ required)
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Environment Variables Best Practices](https://12factor.net/config)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)

## Support

For deployment issues:
1. Check Render logs in the dashboard
2. Review MongoDB Atlas metrics
3. Consult this documentation
4. Contact the development team

---

**Last Updated:** 2026-02-11  
**Version:** 1.0.0
# Deployment Guide for Render

This guide provides step-by-step instructions for deploying the FBPA UI application to Render. The application consists of two separate services: a Node.js backend API and a React frontend static site.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Variables Setup](#environment-variables-setup)
- [Render Dashboard Setup](#render-dashboard-setup)
- [Deployment Checklist](#deployment-checklist)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:
- A GitHub account with access to this repository
- A Render account (free tier is sufficient)
- MongoDB Atlas account with a database set up
- All security credentials rotated (see PR #4)

## Environment Variables Setup

### Backend Service Environment Variables

The following environment variables must be set in the Render dashboard for the **backend service**:

| Variable | Description | Example/Instructions |
|----------|-------------|---------------------|
| `MONGODB_URI` | MongoDB connection string with NEW rotated credentials | `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key for JWT token signing | Generate with: `openssl rand -base64 32` |
| `NODE_ENV` | Environment mode | `production` |
| `CORS_ORIGIN` | Frontend URL for CORS | `https://fbpa-frontend.onrender.com` (use your actual frontend URL) |
| `SERVE_STATIC` | Whether backend serves static files | `false` (backend and frontend are separate) |
| `PORT` | Port number | Render sets this automatically - don't override |

#### Generating a Secure JWT Secret

Run this command in your terminal to generate a secure JWT secret:
```bash
openssl rand -base64 32
```

Copy the output and use it as the `JWT_SECRET` value in Render.

### Frontend Service Environment Variables

The following environment variables must be set in the Render dashboard for the **frontend service**:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://fbpa-backend.onrender.com` (use your actual backend URL) |

**Important:** Do not include a trailing slash in `VITE_API_URL`.

## Render Dashboard Setup

Follow these steps to deploy both services to Render:

### Step 1: Create Backend Service

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository (`josephmabbinante-a11y/fbpa-ui`)
4. Configure the service:
   - **Name:** `fbpa-backend` (or your preferred name)
   - **Region:** Oregon (or closest to your users)
   - **Branch:** `main` (or your production branch)
   - **Root Directory:** Leave empty
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server/index.js`
   - **Plan:** Free
5. Click **"Advanced"** to add environment variables
6. Add all backend environment variables from the table above
7. Click **"Create Web Service"**
8. Wait for the deployment to complete
9. **Copy the service URL** (e.g., `https://fbpa-backend.onrender.com`) - you'll need this for the frontend

### Step 2: Create Frontend Service

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect the same GitHub repository
3. Configure the service:
   - **Name:** `fbpa-frontend` (or your preferred name)
   - **Region:** Oregon (same as backend)
   - **Branch:** `main` (or your production branch)
   - **Root Directory:** Leave empty
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Click **"Advanced"** to add environment variables
5. Add the frontend environment variable:
   - Key: `VITE_API_URL`
   - Value: Your backend URL from Step 1 (e.g., `https://fbpa-backend.onrender.com`)
6. Click **"Create Static Site"**
7. Wait for the deployment to complete

### Step 3: Update Backend CORS Settings

After the frontend is deployed:

1. Go to your backend service in Render Dashboard
2. Navigate to **"Environment"** tab
3. Update the `CORS_ORIGIN` variable with your actual frontend URL
4. Save changes - this will trigger a redeployment

### Step 4: Configure Custom Domains (Optional)

To use custom domains:

1. Go to the service in Render Dashboard
2. Navigate to **"Settings"** tab
3. Scroll to **"Custom Domain"** section
4. Click **"Add Custom Domain"**
5. Enter your domain name
6. Follow the DNS configuration instructions provided by Render
7. Repeat for both frontend and backend services if desired

### Step 5: Monitor Deployment

1. In Render Dashboard, select your service
2. Navigate to **"Logs"** tab to view real-time logs
3. Check for any errors or warnings
4. Verify successful startup messages:
   - Backend: "Auth server running on http://localhost:XXXX"
   - Backend: "✅ Connected to MongoDB"

## Deployment Checklist

Use this checklist to ensure a successful deployment:

### Pre-Deployment
- [x] MongoDB credentials rotated (DONE ✅)
- [x] PR #4 merged (removes hardcoded credentials)
- [ ] Generated secure JWT secret using `openssl rand -base64 32`
- [ ] Collected MongoDB connection string with new credentials
- [ ] Tested application locally with production-like environment variables

### Backend Deployment
- [ ] Backend service created in Render
- [ ] All backend environment variables set correctly:
  - [ ] `MONGODB_URI` (with rotated credentials)
  - [ ] `JWT_SECRET` (generated secure value)
  - [ ] `NODE_ENV=production`
  - [ ] `CORS_ORIGIN` (placeholder initially)
  - [ ] `SERVE_STATIC=false`
- [ ] Backend service deployed successfully
- [ ] Backend logs show "✅ Connected to MongoDB"
- [ ] Health check endpoint accessible: `https://your-backend.onrender.com/health`

### Frontend Deployment
- [ ] Frontend service created in Render
- [ ] Frontend environment variables set:
  - [ ] `VITE_API_URL` (backend URL from previous step)
- [ ] Frontend deployed successfully
- [ ] Frontend accessible in browser

### Post-Deployment
- [ ] Updated backend `CORS_ORIGIN` with actual frontend URL
- [ ] Backend redeployed after CORS update
- [ ] Tested login functionality
- [ ] Tested API endpoints (dashboard, customers, etc.)
- [ ] Verified CORS is working (no console errors)
- [ ] Checked both services' logs for errors

### Optional
- [ ] Custom domain configured for frontend
- [ ] Custom domain configured for backend
- [ ] SSL certificates verified
- [ ] Monitoring/alerting set up

## Troubleshooting

### Common Issues and Solutions

#### Issue: CORS Errors in Browser Console

**Symptoms:**
- Error: "CORS origin not allowed: https://..."
- Frontend cannot make API calls

**Solution:**
1. Verify `CORS_ORIGIN` in backend environment matches your frontend URL exactly
2. Ensure no trailing slash in `CORS_ORIGIN`
3. Redeploy backend after updating environment variables

#### Issue: "Cannot connect to backend" or 404 errors

**Symptoms:**
- Login doesn't work
- API calls fail with 404

**Solution:**
1. Check `VITE_API_URL` is set correctly in frontend environment
2. Verify backend service is running (check Render dashboard)
3. Test backend health endpoint directly: `https://your-backend.onrender.com/health`
4. Check frontend logs to see what URL it's trying to call

#### Issue: MongoDB Connection Failed

**Symptoms:**
- Backend logs show "❌ MongoDB connection error"
- Database operations fail

**Solution:**
1. Verify `MONGODB_URI` is correct in backend environment
2. Check MongoDB Atlas network access settings (allow Render IPs or allow all)
3. Ensure database user credentials are correct
4. Verify database user has read/write permissions

#### Issue: JWT/Authentication Errors

**Symptoms:**
- Login fails with 500 error
- "Invalid token" errors

**Solution:**
1. Ensure `JWT_SECRET` is set in backend environment
2. Verify it's not the default placeholder value
3. Redeploy backend after setting `JWT_SECRET`

#### Issue: Frontend Shows Blank Page

**Symptoms:**
- White/blank screen on frontend
- No errors in browser console

**Solution:**
1. Check browser console for errors
2. Verify `dist` folder was created during build
3. Check Render build logs for errors
4. Ensure `npm run build` completes successfully

#### Issue: Free Tier Sleep (Service Unavailable)

**Symptoms:**
- First request after inactivity is slow or times out
- Service "wakes up" after a delay

**Context:**
Render's free tier spins down services after 15 minutes of inactivity.

**Solution:**
- This is expected behavior on free tier
- First request may take 30-60 seconds to wake the service
- Consider upgrading to paid tier for production use
- Or use an uptime monitor (e.g., UptimeRobot) to ping health endpoint periodically

### Viewing Logs

To debug issues:

1. Go to Render Dashboard
2. Select the service (backend or frontend)
3. Click **"Logs"** tab
4. View real-time logs or filter by time period
5. Look for error messages or stack traces

### Testing the Health Check

To verify your backend is running:

```bash
curl https://your-backend-url.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-11T08:57:39.954Z"
}
```

### Redeploying Services

If you need to redeploy:

**Manual Redeploy:**
1. Go to service in Render Dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

**Automatic Redeploy:**
- Push changes to your connected branch
- Render automatically detects and deploys

### Getting Help

If you continue to experience issues:

1. Check [Render documentation](https://render.com/docs)
2. Review [Render community forum](https://community.render.com)
3. Check service logs for detailed error messages
4. Verify all environment variables are set correctly

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Express CORS Configuration](https://expressjs.com/en/resources/middleware/cors.html)
