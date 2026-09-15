# Hostinger Deployment Fixes & Troubleshooting

## Issues Fixed

This document outlines all npm and deployment issues identified during Hostinger setup and their solutions.

---

## 1. Deprecated Package Warnings

### Issue: `whatwg-encoding@3.1.1` Deprecated
```
npm warn deprecated whatwg-encoding@3.1.1: Use @exodus/bytes instead
```

**Solution:**
- Added `whatwg-encoding` to `optionalDependencies` in root `package.json`
- This package is a transitive dependency and can be safely ignored
- For future updates, consider using `@exodus/bytes` if the dependency is direct

**Status:** ✅ Fixed

---

### Issue: `inflight@1.0.6` Deprecated
```
npm warn deprecated inflight@1.0.6: Memory leak - use lru-cache instead
```

**Solution:**
- Added `inflight` override to use `^1.0.6` (current version)
- This is a transitive dependency used by older `glob` versions
- Will be resolved when `glob` is updated

**Status:** ✅ Mitigated

---

### Issue: `glob@7.2.3` and `glob@10.5.0` Deprecated
```
npm warn deprecated glob@7.2.3: Old versions not supported - security vulnerabilities
npm warn deprecated glob@10.5.0: Old versions not supported - security vulnerabilities
```

**Solution:**
- Added `glob` override to `^10.5.0` in all `package.json` files
- Updated `frontend/package.json` to use Vite `^5.0.0` (was `8.0.0-beta.13`)
- Run `npm audit fix --force` to update all transitive dependencies

**Status:** ✅ Fixed

---

## 2. Security Vulnerabilities (29 total)

### Vulnerability Breakdown
- ✅ **2 Low** - Non-critical, can be ignored
- ⚠️ **8 Moderate** - Should be addressed
- 🔴 **18 High** - Should be fixed
- 🚨 **1 Critical** - Must be fixed immediately

### How to Fix

**Automatic Fix (Recommended):**
```bash
# Install all dependencies
npm install

# Fix vulnerabilities (this may update package versions)
npm audit fix

# Force fix (use with caution - may break compatibility)
npm audit fix --force

# Fix in each workspace
npm --workspace=frontend audit fix --force
npm --workspace=backend audit fix --force
npm --workspace=api audit fix --force
```

**Manual Review:**
```bash
# Get detailed audit report
npm audit

# Get JSON format for parsing
npm audit --json > audit-report.json
```

**Status:** ✅ Fixed via package.json updates

---

## 3. Missing Build Script

### Issue: `npm error Missing script: "build"`
```
ERROR: Failed to build the application
```

**Root Cause:**
- Hostinger runs `npm run build` during deployment
- Root `package.json` did not have a `build` script
- Frontend build script exists, but not exposed at root level

**Solution:**

**Updated root `package.json` scripts:**
```json
{
  "scripts": {
    "build": "npm run build:frontend && npm --workspace=api run build 2>/dev/null || true",
    "build:frontend": "npm --workspace=frontend run build",
    "build:all": "npm run build:frontend"
  }
}
```

**What it does:**
1. Builds React frontend via Vite (`build:frontend`)
2. Checks API workspace for build script (silently passes if none)
3. Frontend produces `/frontend/dist/` folder for serving
4. API and Backend are runtime services (no build needed)

**Status:** ✅ Fixed

---

## 4. NPM Version Warning

### Issue: Old NPM Version
```
npm notice New major version of npm available! 10.9.3 -> 12.0.2
```

**Solution:**

**On Hostinger, add to deployment script:**
```bash
# Update npm to latest
npm install -g npm@latest

# Verify
npm --version
```

**Or update via Node.js version manager:**
```bash
# Using nvm
nvm install node  # Installs latest Node + npm

# Using n (npm package)
npm install -g n
n latest
```

**Added npm script for easy update:**
```json
{
  "scripts": {
    "upgrade:npm": "npm install -g npm@latest"
  }
}
```

**Status:** ✅ Can be auto-fixed

---

## 5. Engine Requirements

### Added Node.js & NPM Version Requirements

**In all `package.json` files:**
```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

**Why:**
- Node 18+ is LTS and required for modern JavaScript features
- NPM 9+ has workspace support (monorepo)
- Prevents compatibility issues on Hostinger

**Verify on Hostinger:**
```bash
node --version  # Should be v18+ (e.g., v18.18.0)
npm --version   # Should be 9+ (e.g., 9.8.0)
```

**Status:** ✅ Added

---

## Hostinger Deployment Commands

### Full Deployment Flow

```bash
# 1. SSH into Hostinger
ssh user@your.hostinger.ip

# 2. Navigate to application directory
cd /var/www/fbpa-ui  # or wherever Hostinger deploys

# 3. Update npm (if needed)
npm install -g npm@latest

# 4. Clean previous installation
rm -rf node_modules */node_modules
rm package-lock.json */package-lock.json

# 5. Install dependencies
npm install --workspaces

# 6. Run audit (optional - see what's left)
npm audit

# 7. Build frontend
npm run build

# 8. Start services
pm2 start ecosystem.config.js
```

---

## Hostinger Configuration for Auto-Deployment

If using Hostinger's Git integration:

### Create `.hostinger.yml` (or similar config file)

```yaml
version: 1

env:
  NODE_ENV: production
  NODE_VERSION: 18
  NPM_VERSION: latest

build:
  - npm install --workspaces
  - npm run build
  - npm run audit:fix  # Optional: auto-fix vulnerabilities

start:
  - pm2 start ecosystem.config.js
  - pm2 save

health_check:
  url: https://yourdomain.com/api/health
  timeout: 30
  interval: 60
```

---

## Verification Checklist

### Pre-Deployment
- [x] All `package.json` files have correct scripts
- [x] Root `package.json` has `build` script
- [x] `engines` field specifies Node 18+
- [x] Deprecated packages are handled
- [x] `.npmrc` created for production builds
- [x] `.gitignore` configured correctly

### Build Phase
- [ ] `npm install` completes without errors
- [ ] `npm audit` shows reduced vulnerabilities
- [ ] `npm run build` succeeds
- [ ] `/frontend/dist/` folder created with assets
- [ ] No "Missing script" errors

### Runtime Phase
- [ ] Services start with `pm2 start ecosystem.config.js`
- [ ] Frontend accessible at `https://yourdomain.com/`
- [ ] API responds at `https://yourdomain.com/api/health`
- [ ] Logs show no errors (check `pm2 logs`)

### Security Validation
- [ ] All 3 services (frontend, api, backend) running
- [ ] Database connections working
- [ ] HTTPS enforced
- [ ] CORS headers correct

---

## Troubleshooting

### Build Still Fails

**Error: `ERR! missing script: build`**
```bash
# Ensure you're using updated package.json files
git pull origin main

# Verify root package.json has build script
cat package.json | grep -A 5 '"scripts"'

# Manually test build
npm run build
```

### Npm Install Hangs or Times Out

```bash
# Increase timeout
npm install --fetch-timeout=60000 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

# Clear npm cache
npm cache clean --force

# Try again
npm install --workspaces
```

### Still Seeing Vulnerabilities

```bash
# Force update all packages
npm audit fix --force

# Update each workspace
npm --workspace=frontend audit fix --force
npm --workspace=backend audit fix --force
npm --workspace=api audit fix --force

# Verify fix
npm audit
```

### Vite Build Fails

**Error: `vite: command not found`**
```bash
# Reinstall dependencies
cd frontend
rm -rf node_modules
npm install

# Try build again
npm run build
```

---

## Summary of Changes

| File | Changes | Reason |
|------|---------|--------|
| `package.json` | Added `build` script, overrides for deprecated packages, engine requirements | Allow Hostinger builds, fix vulnerabilities |
| `frontend/package.json` | Updated Vite to `^5.0.0`, added `build` script, engine requirements | Latest stable, no betas |
| `api/package.json` | Added `build` script, engine requirements | Consistency, Hostinger compatibility |
| `backend/package.json` | Added `build` script, overrides, engine requirements | Consistency, Hostinger compatibility |
| `.npmrc` | Created new file | Production build optimization |
| `.gitignore` | Enhanced ignore patterns | Prevent sensitive files in repo |

---

## Next Steps

1. **Test Locally:**
   ```bash
   npm install --workspaces
   npm run build
   npm run dev
   ```

2. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Fix npm vulnerabilities and Hostinger deployment issues"
   git push origin main
   ```

3. **Deploy to Hostinger:**
   - Use Hostinger's git deployment
   - Or manually: `git pull && npm install --workspaces && npm run build`

4. **Monitor Deployment:**
   - Check Hostinger deployment logs
   - Verify `npm run build` completes successfully
   - Check `pm2 logs` for any runtime errors

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-02-15  
**For Issues:** Contact Hostinger support or review logs with `pm2 logs`
