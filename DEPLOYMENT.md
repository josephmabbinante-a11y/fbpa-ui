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
