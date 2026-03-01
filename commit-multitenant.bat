@echo off
cd /d "%~dp0"
echo Running setup script...
node server/setup-multitenant.cjs
echo.
echo Staging files...
git add server/multitenant server/setup-multitenant.cjs server/create_dirs.js server/.gitkeep package.json cspell.json
echo.
echo Committing...
git commit -m "feat: add Opscale multi-tenant backend" -m "- Postgres schema: tenants, users, settings, features, loads, bids, carriers, notifications, admin_log" -m "- Middleware: JWT auth, tenant isolation, RBAC, feature flags, super-admin impersonation" -m "- Modules: auth, tenants, users, loads, bids, carriers, notifications, settings, features, admin" -m "- Setup script: node server/setup-multitenant.cjs" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
echo.
echo Pushing...
git push origin copilot-worktree-2026-03-01T02-05-01
echo.
echo Done! Press any key to close.
pause
