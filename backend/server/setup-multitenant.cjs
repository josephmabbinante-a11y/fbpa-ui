#!/usr/bin/env node
// Run this to set up the multitenant backend:
//   node server/setup-multitenant.cjs
// (from the repository root)

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const base = path.resolve(__dirname, 'multitenant');

const dirs = [
  '',
  'migrations',
  'src',
  'src/config',
  'src/utils',
  'src/middleware',
  'src/modules',
  'src/modules/admin',
  'src/modules/auth',
  'src/modules/tenants',
  'src/modules/users',
  'src/modules/notifications',
  'src/modules/loads',
  'src/modules/bids',
  'src/modules/carriers',
  'src/modules/settings',
  'src/modules/features',
];
dirs.forEach(d => fs.mkdirSync(path.join(base, d), { recursive: true }));
console.log('✓ Directories created');

function w(rel, content) {
  const full = path.join(base, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('  created:', rel);
}

w('package.json', `{
  "name": "opscale-multitenant-api",
  "version": "1.0.0",
  "type": "module",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "pg": "^8.11.0",
    "uuid": "^9.0.0"
  }
}
`);

w('migrations/001_initial_schema.sql', `-- Opscale Multi-Tenant Schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'TENANT_ADMIN', 'OPS', 'CARRIER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT non_super_admin_has_tenant CHECK (
    role = 'SUPER_ADMIN' OR tenant_id IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  loadboard_enabled BOOLEAN NOT NULL DEFAULT true,
  bidding_enabled BOOLEAN NOT NULL DEFAULT true,
  bid_expiration_hours INT NOT NULL DEFAULT 24,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  sms_notifications BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(tenant_id, feature_name)
);

CREATE TABLE IF NOT EXISTS carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  mc_number VARCHAR(50),
  insurance_status VARCHAR(50) DEFAULT 'unknown',
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reference_number VARCHAR(100),
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  equipment_type VARCHAR(100),
  pickup_date DATE,
  delivery_date DATE,
  target_rate NUMERIC(10,2),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'awarded', 'covered')),
  bidding_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS load_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  bid_amount NUMERIC(10,2) NOT NULL,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100),
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loads_tenant_id ON loads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_load_bids_load_id ON load_bids(load_id);
CREATE INDEX IF NOT EXISTS idx_load_bids_tenant_id ON load_bids(tenant_id);
CREATE INDEX IF NOT EXISTS idx_carriers_tenant_id ON carriers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_features_tenant_id ON tenant_features(tenant_id);
CREATE INDEX IF NOT EXISTS idx_admin_log_admin_user ON admin_activity_log(admin_user_id);
`);

w('src/config/env.js', `/* global process */
import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.MT_PORT || 4001,
  JWT_SECRET: process.env.MT_JWT_SECRET || (() => { throw new Error('MT_JWT_SECRET must be set'); })(),
  JWT_EXPIRES_IN: process.env.MT_JWT_EXPIRES_IN || '8h',
  DATABASE_URL: process.env.MT_DATABASE_URL || (() => { throw new Error('MT_DATABASE_URL must be set'); })(),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.MT_CORS_ORIGIN || 'http://localhost:5173',
};
`);

w('src/config/database.js', `import pg from 'pg';
import { ENV } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  ssl: ENV.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[db] Unexpected pool error', err.message);
});

export async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
`);

w('src/utils/logger.js', `/* global process */
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const levels = { error: 0, warn: 1, info: 2, debug: 3 };

function log(level, message, meta = {}) {
  if (levels[level] <= levels[LOG_LEVEL]) {
    const entry = { timestamp: new Date().toISOString(), level, message, ...meta };
    if (level === 'error') {
      console.error(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }
}

export const logger = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};
`);

w('src/utils/errorHandler.js', `import { logger } from './logger.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }
  logger.error('Unhandled error', { message: err.message, stack: err.stack, path: req.originalUrl });
  return res.status(500).json({ error: 'Internal server error' });
}
`);

w('src/middleware/auth.middleware.js', `import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { AppError } from '../utils/errorHandler.js';

export function authenticate(req, _res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Missing or invalid authorization header', 401, 'UNAUTHORIZED'));
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, ENV.JWT_SECRET);
    req.user = payload;
    return next();
  } catch {
    return next(new AppError('Invalid or expired token', 401, 'TOKEN_INVALID'));
  }
}
`);

w('src/middleware/tenant.middleware.js', `import { AppError } from '../utils/errorHandler.js';

export function resolveTenant(req, _res, next) {
  const user = req.user;
  if (!user) return next(new AppError('User not authenticated', 401, 'UNAUTHORIZED'));

  if (user.role === 'SUPER_ADMIN' && req.impersonatedTenantId) {
    req.tenantId = req.impersonatedTenantId;
  } else if (user.role === 'SUPER_ADMIN') {
    req.tenantId = null;
  } else {
    if (!user.tenant_id) {
      return next(new AppError('User has no tenant assigned', 403, 'NO_TENANT'));
    }
    req.tenantId = user.tenant_id;
  }
  return next();
}

export function requireTenant(req, _res, next) {
  if (!req.tenantId) {
    return next(new AppError('Tenant context required. Use impersonation or log in as tenant user.', 403, 'NO_TENANT_CONTEXT'));
  }
  return next();
}
`);

w('src/middleware/role.middleware.js', `import { AppError } from '../utils/errorHandler.js';

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError('Not authenticated', 401, 'UNAUTHORIZED'));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(\`Access denied. Required role: \${roles.join(' or ')}\`, 403, 'FORBIDDEN'));
    }
    return next();
  };
}

export const isSuperAdmin = requireRole('SUPER_ADMIN');
export const isTenantAdmin = requireRole('SUPER_ADMIN', 'TENANT_ADMIN');
export const isOpsOrAbove = requireRole('SUPER_ADMIN', 'TENANT_ADMIN', 'OPS');
`);

w('src/middleware/feature.middleware.js', `import { query } from '../config/database.js';
import { AppError } from '../utils/errorHandler.js';

export function requireFeature(featureName) {
  return async (req, _res, next) => {
    const tenantId = req.tenantId;
    if (!tenantId) return next(); // Super admin bypasses feature checks

    try {
      const result = await query(
        'SELECT enabled FROM tenant_features WHERE tenant_id = $1 AND feature_name = $2',
        [tenantId, featureName]
      );
      const row = result.rows[0];
      if (!row || !row.enabled) {
        return next(new AppError(\`Feature '\${featureName}' is not enabled for this tenant\`, 403, 'FEATURE_DISABLED'));
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}
`);

w('src/middleware/impersonation.middleware.js', `import { query } from '../config/database.js';
import { AppError } from '../utils/errorHandler.js';
import { logger } from '../utils/logger.js';

export async function startImpersonation(req, _res, next) {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') return next();

  const tenantId = req.headers['x-impersonate-tenant'];
  if (!tenantId) return next();

  try {
    const result = await query('SELECT id FROM tenants WHERE id = $1', [tenantId]);
    if (!result.rows[0]) {
      return next(new AppError('Tenant not found for impersonation', 404, 'TENANT_NOT_FOUND'));
    }
    req.impersonatedTenantId = tenantId;
    logger.info('Super admin impersonation', { adminId: req.user.sub, tenantId });
    return next();
  } catch (err) {
    return next(err);
  }
}
`);

w('src/modules/admin/admin.service.js', `import { query } from '../../config/database.js';

export async function logAdminActivity({ adminUserId, tenantId, action, entity, entityId }) {
  await query(
    'INSERT INTO admin_activity_log (admin_user_id, tenant_id, action, entity, entity_id) VALUES ($1,$2,$3,$4,$5)',
    [adminUserId, tenantId || null, action, entity || null, entityId || null]
  );
}

export async function getActivityLog(tenantId) {
  const result = await query(
    'SELECT * FROM admin_activity_log WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 200',
    [tenantId]
  );
  return result.rows;
}

export async function getAllActivityLog() {
  const result = await query('SELECT * FROM admin_activity_log ORDER BY created_at DESC LIMIT 500');
  return result.rows;
}
`);

w('src/modules/auth/auth.service.js', `import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../config/database.js';
import { ENV } from '../../config/env.js';
import { AppError } from '../../utils/errorHandler.js';
import { logAdminActivity } from '../admin/admin.service.js';

export async function login(email, password) {
  const result = await query(
    'SELECT id, email, password_hash, tenant_id, role FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  const user = result.rows[0];
  if (!user) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tenant_id: user.tenant_id || null,
  };

  const accessToken = jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN });
  return { accessToken, user: { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id } };
}

export async function impersonate(adminUserId, targetTenantId) {
  const tenantResult = await query('SELECT id, name FROM tenants WHERE id = $1', [targetTenantId]);
  const tenant = tenantResult.rows[0];
  if (!tenant) throw new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND');

  await logAdminActivity({
    adminUserId,
    tenantId: targetTenantId,
    action: 'IMPERSONATE',
    entity: 'tenant',
    entityId: targetTenantId,
  });

  return { tenantId: tenant.id, tenantName: tenant.name };
}
`);

w('src/modules/auth/auth.controller.js', `import { login, impersonate } from './auth.service.js';
import { AppError } from '../../utils/errorHandler.js';

export async function handleLogin(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) throw new AppError('Email and password required', 400, 'VALIDATION_ERROR');
    const result = await login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleImpersonate(req, res, next) {
  try {
    const { tenantId } = req.body || {};
    if (!tenantId) throw new AppError('tenantId required', 400, 'VALIDATION_ERROR');
    const result = await impersonate(req.user.sub, tenantId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
`);

w('src/modules/auth/auth.routes.js', `import { Router } from 'express';
import { handleLogin, handleImpersonate } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isSuperAdmin } from '../../middleware/role.middleware.js';

const router = Router();

router.post('/login', handleLogin);
router.post('/impersonate', authenticate, isSuperAdmin, handleImpersonate);

export default router;
`);

w('src/modules/tenants/tenant.service.js', `import { query } from '../../config/database.js';
import { AppError } from '../../utils/errorHandler.js';

const DEFAULT_FEATURES = [
  'internal_load_board',
  'bidding',
  'sms_notifications',
  'advanced_rate_logic',
];

export async function createTenant(name) {
  const result = await query(
    'INSERT INTO tenants (name) VALUES ($1) RETURNING *',
    [name]
  );
  const tenant = result.rows[0];

  await query('INSERT INTO tenant_settings (tenant_id) VALUES ($1)', [tenant.id]);

  for (const feature of DEFAULT_FEATURES) {
    await query(
      'INSERT INTO tenant_features (tenant_id, feature_name, enabled) VALUES ($1, $2, true)',
      [tenant.id, feature]
    );
  }

  return tenant;
}

export async function listTenants() {
  const result = await query('SELECT * FROM tenants ORDER BY created_at DESC');
  return result.rows;
}

export async function getTenant(id) {
  const result = await query('SELECT * FROM tenants WHERE id = $1', [id]);
  if (!result.rows[0]) throw new AppError('Tenant not found', 404, 'NOT_FOUND');
  return result.rows[0];
}

export async function updateTenantStatus(id, status) {
  const result = await query(
    'UPDATE tenants SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  if (!result.rows[0]) throw new AppError('Tenant not found', 404, 'NOT_FOUND');
  return result.rows[0];
}
`);

w('src/modules/tenants/tenant.controller.js', `import { createTenant, listTenants, getTenant, updateTenantStatus } from './tenant.service.js';
import { AppError } from '../../utils/errorHandler.js';

export async function handleCreateTenant(req, res, next) {
  try {
    const { name } = req.body || {};
    if (!name) throw new AppError('name required', 400, 'VALIDATION_ERROR');
    res.status(201).json(await createTenant(name));
  } catch (err) { next(err); }
}

export async function handleListTenants(req, res, next) {
  try { res.json(await listTenants()); } catch (err) { next(err); }
}

export async function handleGetTenant(req, res, next) {
  try { res.json(await getTenant(req.params.id)); } catch (err) { next(err); }
}

export async function handleUpdateTenantStatus(req, res, next) {
  try {
    const { status } = req.body || {};
    if (!status) throw new AppError('status required', 400, 'VALIDATION_ERROR');
    res.json(await updateTenantStatus(req.params.id, status));
  } catch (err) { next(err); }
}
`);

w('src/modules/tenants/tenant.routes.js', `import { Router } from 'express';
import { handleCreateTenant, handleListTenants, handleGetTenant, handleUpdateTenantStatus } from './tenant.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isSuperAdmin } from '../../middleware/role.middleware.js';

const router = Router();
router.use(authenticate, isSuperAdmin);

router.post('/', handleCreateTenant);
router.get('/', handleListTenants);
router.get('/:id', handleGetTenant);
router.patch('/:id/status', handleUpdateTenantStatus);

export default router;
`);

w('src/modules/users/user.service.js', `import bcrypt from 'bcryptjs';
import { query } from '../../config/database.js';
import { AppError } from '../../utils/errorHandler.js';

export async function createUser({ email, password, role, tenantId }) {
  if (role !== 'SUPER_ADMIN' && !tenantId) {
    throw new AppError('tenant_id required for non-super-admin users', 400, 'VALIDATION_ERROR');
  }

  const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows[0]) throw new AppError('Email already in use', 409, 'CONFLICT');

  const password_hash = await bcrypt.hash(password, 12);
  const result = await query(
    'INSERT INTO users (email, password_hash, tenant_id, role) VALUES ($1, $2, $3, $4) RETURNING id, email, tenant_id, role, created_at',
    [email.toLowerCase(), password_hash, tenantId || null, role]
  );
  return result.rows[0];
}

export async function listUsers(tenantId) {
  const result = await query(
    'SELECT id, email, tenant_id, role, created_at FROM users WHERE tenant_id = $1 ORDER BY created_at DESC',
    [tenantId]
  );
  return result.rows;
}

export async function getUser(id, tenantId) {
  const result = await query(
    'SELECT id, email, tenant_id, role, created_at FROM users WHERE id = $1 AND tenant_id = $2',
    [id, tenantId]
  );
  if (!result.rows[0]) throw new AppError('User not found', 404, 'NOT_FOUND');
  return result.rows[0];
}
`);

w('src/modules/users/user.controller.js', `import { createUser, listUsers, getUser } from './user.service.js';
import { AppError } from '../../utils/errorHandler.js';

export async function handleCreateUser(req, res, next) {
  try {
    const { email, password, role } = req.body || {};
    if (!email || !password || !role) throw new AppError('email, password, role required', 400, 'VALIDATION_ERROR');
    res.status(201).json(await createUser({ email, password, role, tenantId: req.tenantId }));
  } catch (err) { next(err); }
}

export async function handleListUsers(req, res, next) {
  try { res.json(await listUsers(req.tenantId)); } catch (err) { next(err); }
}

export async function handleGetUser(req, res, next) {
  try { res.json(await getUser(req.params.id, req.tenantId)); } catch (err) { next(err); }
}
`);

w('src/modules/users/user.routes.js', `import { Router } from 'express';
import { handleCreateUser, handleListUsers, handleGetUser } from './user.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenant } from '../../middleware/tenant.middleware.js';
import { startImpersonation } from '../../middleware/impersonation.middleware.js';
import { isTenantAdmin } from '../../middleware/role.middleware.js';

const router = Router();
router.use(authenticate, startImpersonation, resolveTenant, requireTenant, isTenantAdmin);

router.get('/', handleListUsers);
router.get('/:id', handleGetUser);
router.post('/', handleCreateUser);

export default router;
`);

w('src/modules/notifications/notification.service.js', `import { query } from '../../config/database.js';

export async function createNotification({ userId, type, message, link }) {
  await query(
    'INSERT INTO notifications (user_id, type, message, link) VALUES ($1,$2,$3,$4)',
    [userId, type, message, link || null]
  );
}

export async function createNotificationsForLoadPosted(load) {
  const carriers = await query(
    "SELECT id FROM users WHERE tenant_id = $1 AND role = 'CARRIER'",
    [load.tenant_id]
  );
  for (const row of carriers.rows) {
    await createNotification({
      userId: row.id,
      type: 'LOAD_POSTED',
      message: \`New load posted: \${load.origin} \u2192 \${load.destination}\`,
      link: \`/loads/\${load.id}\`,
    });
  }
}

export async function getNotifications(userId) {
  const result = await query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

export async function markRead(id, userId) {
  await query('UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2', [id, userId]);
}
`);

w('src/modules/loads/load.service.js', `import { query } from '../../config/database.js';
import { AppError } from '../../utils/errorHandler.js';
import { createNotificationsForLoadPosted } from '../notifications/notification.service.js';

export async function createLoad(tenantId, data) {
  const { reference_number, origin, destination, equipment_type, pickup_date, delivery_date, target_rate, bidding_enabled } = data;
  if (!origin || !destination) throw new AppError('origin and destination required', 400, 'VALIDATION_ERROR');
  const result = await query(
    \`INSERT INTO loads (tenant_id, reference_number, origin, destination, equipment_type, pickup_date, delivery_date, target_rate, bidding_enabled)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *\`,
    [tenantId, reference_number || null, origin, destination, equipment_type || null, pickup_date || null, delivery_date || null, target_rate || null, bidding_enabled !== false]
  );
  return result.rows[0];
}

export async function listLoads(tenantId) {
  const result = await query('SELECT * FROM loads WHERE tenant_id = $1 ORDER BY created_at DESC', [tenantId]);
  return result.rows;
}

export async function getLoad(id, tenantId) {
  const result = await query('SELECT * FROM loads WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  if (!result.rows[0]) throw new AppError('Load not found', 404, 'NOT_FOUND');
  return result.rows[0];
}

export async function updateLoad(id, tenantId, data) {
  const load = await getLoad(id, tenantId);
  if (load.status === 'awarded' || load.status === 'covered') {
    throw new AppError('Cannot update awarded or covered load', 400, 'INVALID_STATE');
  }
  const { origin, destination, equipment_type, pickup_date, delivery_date, target_rate, reference_number } = data;
  const result = await query(
    \`UPDATE loads SET
      origin = COALESCE($1, origin),
      destination = COALESCE($2, destination),
      equipment_type = COALESCE($3, equipment_type),
      pickup_date = COALESCE($4, pickup_date),
      delivery_date = COALESCE($5, delivery_date),
      target_rate = COALESCE($6, target_rate),
      reference_number = COALESCE($7, reference_number)
     WHERE id = $8 AND tenant_id = $9 RETURNING *\`,
    [origin, destination, equipment_type, pickup_date, delivery_date, target_rate, reference_number, id, tenantId]
  );
  return result.rows[0];
}

export async function postLoad(id, tenantId) {
  const load = await getLoad(id, tenantId);
  if (load.status !== 'draft') throw new AppError('Only draft loads can be posted', 400, 'INVALID_STATE');
  const result = await query(
    "UPDATE loads SET status = 'posted' WHERE id = $1 AND tenant_id = $2 RETURNING *",
    [id, tenantId]
  );
  const updated = result.rows[0];
  await createNotificationsForLoadPosted(updated);
  return updated;
}

export async function awardLoad(id, tenantId, carrierId, bidId) {
  const result = await query(
    "UPDATE loads SET status = 'awarded' WHERE id = $1 AND tenant_id = $2 AND status = 'posted' RETURNING *",
    [id, tenantId]
  );
  if (!result.rows[0]) throw new AppError('Load not found or not in posted state', 400, 'INVALID_STATE');
  return result.rows[0];
}
`);

w('src/modules/loads/load.controller.js', `import * as loadService from './load.service.js';
import { AppError } from '../../utils/errorHandler.js';

export async function handleListLoads(req, res, next) {
  try { res.json(await loadService.listLoads(req.tenantId)); } catch (err) { next(err); }
}

export async function handleCreateLoad(req, res, next) {
  try { res.status(201).json(await loadService.createLoad(req.tenantId, req.body || {})); } catch (err) { next(err); }
}

export async function handleUpdateLoad(req, res, next) {
  try { res.json(await loadService.updateLoad(req.params.id, req.tenantId, req.body || {})); } catch (err) { next(err); }
}

export async function handlePostLoad(req, res, next) {
  try { res.json(await loadService.postLoad(req.params.id, req.tenantId)); } catch (err) { next(err); }
}

export async function handleAwardLoad(req, res, next) {
  try {
    const { carrierId, bidId } = req.body || {};
    if (!carrierId || !bidId) throw new AppError('carrierId and bidId required', 400, 'VALIDATION_ERROR');
    res.json(await loadService.awardLoad(req.params.id, req.tenantId, carrierId, bidId));
  } catch (err) { next(err); }
}
`);

w('src/modules/loads/load.routes.js', `import { Router } from 'express';
import * as ctrl from './load.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenant } from '../../middleware/tenant.middleware.js';
import { startImpersonation } from '../../middleware/impersonation.middleware.js';
import { isOpsOrAbove } from '../../middleware/role.middleware.js';
import { requireFeature } from '../../middleware/feature.middleware.js';

const router = Router();
router.use(authenticate, startImpersonation, resolveTenant, requireTenant, requireFeature('internal_load_board'));

router.get('/', ctrl.handleListLoads);
router.post('/', isOpsOrAbove, ctrl.handleCreateLoad);
router.patch('/:id', isOpsOrAbove, ctrl.handleUpdateLoad);
router.post('/:id/post', isOpsOrAbove, ctrl.handlePostLoad);
router.post('/:id/award', isOpsOrAbove, ctrl.handleAwardLoad);

export default router;
`);

w('src/modules/bids/bid.service.js', `import { query } from '../../config/database.js';
import { AppError } from '../../utils/errorHandler.js';
import { createNotification } from '../notifications/notification.service.js';

export async function listBids(loadId, tenantId) {
  const result = await query(
    'SELECT * FROM load_bids WHERE load_id = $1 AND tenant_id = $2 ORDER BY created_at DESC',
    [loadId, tenantId]
  );
  return result.rows;
}

export async function submitBid(loadId, tenantId, carrierId, bidAmount, message) {
  const loadResult = await query(
    "SELECT * FROM loads WHERE id = $1 AND tenant_id = $2 AND status = 'posted' AND bidding_enabled = true",
    [loadId, tenantId]
  );
  if (!loadResult.rows[0]) throw new AppError('Load is not available for bidding', 400, 'INVALID_STATE');

  const carrierResult = await query(
    'SELECT * FROM carriers WHERE id = $1 AND tenant_id = $2 AND approved = true',
    [carrierId, tenantId]
  );
  if (!carrierResult.rows[0]) throw new AppError('Carrier not found or not approved', 403, 'CARRIER_NOT_APPROVED');

  const result = await query(
    'INSERT INTO load_bids (load_id, tenant_id, carrier_id, bid_amount, message) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [loadId, tenantId, carrierId, bidAmount, message || null]
  );
  const bid = result.rows[0];

  const opsUsers = await query(
    "SELECT id FROM users WHERE tenant_id = $1 AND role IN ('TENANT_ADMIN','OPS')",
    [tenantId]
  );
  for (const user of opsUsers.rows) {
    await createNotification({
      userId: user.id,
      type: 'BID_SUBMITTED',
      message: \`New bid of $\${bidAmount} submitted for load \${loadId}\`,
      link: \`/loads/\${loadId}/bids\`,
    });
  }

  return bid;
}

export async function acceptBid(bidId, tenantId) {
  const bidResult = await query(
    "SELECT * FROM load_bids WHERE id = $1 AND tenant_id = $2 AND status = 'pending'",
    [bidId, tenantId]
  );
  const bid = bidResult.rows[0];
  if (!bid) throw new AppError('Bid not found or not pending', 404, 'NOT_FOUND');

  await query("UPDATE load_bids SET status = 'accepted' WHERE id = $1", [bidId]);
  await query(
    "UPDATE load_bids SET status = 'rejected' WHERE load_id = $1 AND id != $2 AND status = 'pending'",
    [bid.load_id, bidId]
  );
  await query(
    "UPDATE loads SET status = 'awarded' WHERE id = $1 AND tenant_id = $2",
    [bid.load_id, tenantId]
  );

  const winnerUser = await query(
    "SELECT u.id FROM users u WHERE u.tenant_id = $1 AND u.role = 'CARRIER' LIMIT 1",
    [tenantId]
  );
  if (winnerUser.rows[0]) {
    await createNotification({
      userId: winnerUser.rows[0].id,
      type: 'BID_ACCEPTED',
      message: \`Your bid on load \${bid.load_id} was accepted\`,
      link: \`/loads/\${bid.load_id}\`,
    });
  }

  const result = await query('SELECT * FROM load_bids WHERE id = $1', [bidId]);
  return result.rows[0];
}

export async function rejectBid(bidId, tenantId) {
  const result = await query(
    "UPDATE load_bids SET status = 'rejected' WHERE id = $1 AND tenant_id = $2 AND status = 'pending' RETURNING *",
    [bidId, tenantId]
  );
  if (!result.rows[0]) throw new AppError('Bid not found or not pending', 404, 'NOT_FOUND');
  return result.rows[0];
}
`);

w('src/modules/bids/bid.controller.js', `import * as bidService from './bid.service.js';
import { AppError } from '../../utils/errorHandler.js';

export async function handleListBids(req, res, next) {
  try { res.json(await bidService.listBids(req.params.loadId, req.tenantId)); } catch (err) { next(err); }
}

export async function handleSubmitBid(req, res, next) {
  try {
    const { carrierId, bidAmount, message } = req.body || {};
    if (!carrierId || !bidAmount) throw new AppError('carrierId and bidAmount required', 400, 'VALIDATION_ERROR');
    res.status(201).json(await bidService.submitBid(req.params.loadId, req.tenantId, carrierId, bidAmount, message));
  } catch (err) { next(err); }
}

export async function handleAcceptBid(req, res, next) {
  try { res.json(await bidService.acceptBid(req.params.id, req.tenantId)); } catch (err) { next(err); }
}

export async function handleRejectBid(req, res, next) {
  try { res.json(await bidService.rejectBid(req.params.id, req.tenantId)); } catch (err) { next(err); }
}
`);

w('src/modules/bids/bid.routes.js', `import { Router } from 'express';
import * as ctrl from './bid.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenant } from '../../middleware/tenant.middleware.js';
import { startImpersonation } from '../../middleware/impersonation.middleware.js';
import { isOpsOrAbove } from '../../middleware/role.middleware.js';
import { requireFeature } from '../../middleware/feature.middleware.js';

const router = Router();
router.use(authenticate, startImpersonation, resolveTenant, requireTenant, requireFeature('bidding'));

router.get('/loads/:loadId/bids', ctrl.handleListBids);
router.post('/loads/:loadId/bids', ctrl.handleSubmitBid);
router.patch('/bids/:id/accept', isOpsOrAbove, ctrl.handleAcceptBid);
router.patch('/bids/:id/reject', isOpsOrAbove, ctrl.handleRejectBid);

export default router;
`);

w('src/modules/carriers/carrier.service.js', `import { query } from '../../config/database.js';
import { AppError } from '../../utils/errorHandler.js';

export async function createCarrier(tenantId, data) {
  const { company_name, mc_number, insurance_status } = data;
  if (!company_name) throw new AppError('company_name required', 400, 'VALIDATION_ERROR');
  const result = await query(
    'INSERT INTO carriers (tenant_id, company_name, mc_number, insurance_status) VALUES ($1,$2,$3,$4) RETURNING *',
    [tenantId, company_name, mc_number || null, insurance_status || 'unknown']
  );
  return result.rows[0];
}

export async function approveCarrier(id, tenantId) {
  const result = await query(
    'UPDATE carriers SET approved = true WHERE id = $1 AND tenant_id = $2 RETURNING *',
    [id, tenantId]
  );
  if (!result.rows[0]) throw new AppError('Carrier not found', 404, 'NOT_FOUND');
  return result.rows[0];
}

export async function listCarriers(tenantId) {
  const result = await query('SELECT * FROM carriers WHERE tenant_id = $1 ORDER BY created_at DESC', [tenantId]);
  return result.rows;
}
`);

w('src/modules/carriers/carrier.controller.js', `import * as svc from './carrier.service.js';

export async function handleCreateCarrier(req, res, next) {
  try { res.status(201).json(await svc.createCarrier(req.tenantId, req.body || {})); } catch (err) { next(err); }
}

export async function handleApproveCarrier(req, res, next) {
  try { res.json(await svc.approveCarrier(req.params.id, req.tenantId)); } catch (err) { next(err); }
}

export async function handleListCarriers(req, res, next) {
  try { res.json(await svc.listCarriers(req.tenantId)); } catch (err) { next(err); }
}
`);

w('src/modules/carriers/carrier.routes.js', `import { Router } from 'express';
import * as ctrl from './carrier.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenant } from '../../middleware/tenant.middleware.js';
import { startImpersonation } from '../../middleware/impersonation.middleware.js';
import { isOpsOrAbove, isTenantAdmin } from '../../middleware/role.middleware.js';

const router = Router();
router.use(authenticate, startImpersonation, resolveTenant, requireTenant);

router.get('/', isOpsOrAbove, ctrl.handleListCarriers);
router.post('/', isOpsOrAbove, ctrl.handleCreateCarrier);
router.patch('/:id/approve', isTenantAdmin, ctrl.handleApproveCarrier);

export default router;
`);

w('src/modules/settings/settings.service.js', `import { query } from '../../config/database.js';
import { AppError } from '../../utils/errorHandler.js';
import { logAdminActivity } from '../admin/admin.service.js';

export async function getSettings(tenantId) {
  const result = await query('SELECT * FROM tenant_settings WHERE tenant_id = $1', [tenantId]);
  if (!result.rows[0]) throw new AppError('Settings not found', 404, 'NOT_FOUND');
  return result.rows[0];
}

export async function updateSettings(tenantId, data, actorUserId) {
  const allowed = ['loadboard_enabled', 'bidding_enabled', 'bid_expiration_hours', 'email_notifications', 'sms_notifications'];
  const sets = [];
  const values = [];
  let i = 1;
  for (const key of allowed) {
    if (data[key] !== undefined) {
      sets.push(\`\${key} = $\${i++}\`);
      values.push(data[key]);
    }
  }
  if (!sets.length) throw new AppError('No valid fields to update', 400, 'VALIDATION_ERROR');
  sets.push('updated_at = NOW()');
  values.push(tenantId);

  const result = await query(
    \`UPDATE tenant_settings SET \${sets.join(', ')} WHERE tenant_id = $\${i} RETURNING *\`,
    values
  );
  if (!result.rows[0]) throw new AppError('Settings not found', 404, 'NOT_FOUND');

  await logAdminActivity({ adminUserId: actorUserId, tenantId, action: 'UPDATE_SETTINGS', entity: 'tenant_settings', entityId: tenantId });
  return result.rows[0];
}
`);

w('src/modules/settings/settings.controller.js', `import { getSettings, updateSettings } from './settings.service.js';

export async function handleGetSettings(req, res, next) {
  try { res.json(await getSettings(req.tenantId)); } catch (err) { next(err); }
}

export async function handleUpdateSettings(req, res, next) {
  try { res.json(await updateSettings(req.tenantId, req.body || {}, req.user.sub)); } catch (err) { next(err); }
}
`);

w('src/modules/settings/settings.routes.js', `import { Router } from 'express';
import { handleGetSettings, handleUpdateSettings } from './settings.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenant } from '../../middleware/tenant.middleware.js';
import { startImpersonation } from '../../middleware/impersonation.middleware.js';
import { isTenantAdmin } from '../../middleware/role.middleware.js';

const router = Router();
router.use(authenticate, startImpersonation, resolveTenant, requireTenant, isTenantAdmin);

router.get('/', handleGetSettings);
router.patch('/', handleUpdateSettings);

export default router;
`);

w('src/modules/features/feature.service.js', `import { query } from '../../config/database.js';

export async function getFeatures(tenantId) {
  const result = await query('SELECT * FROM tenant_features WHERE tenant_id = $1', [tenantId]);
  return result.rows;
}

export async function setFeature(tenantId, featureName, enabled) {
  const result = await query(
    \`INSERT INTO tenant_features (tenant_id, feature_name, enabled)
     VALUES ($1, $2, $3)
     ON CONFLICT (tenant_id, feature_name) DO UPDATE SET enabled = EXCLUDED.enabled
     RETURNING *\`,
    [tenantId, featureName, enabled]
  );
  return result.rows[0];
}
`);

w('src/modules/admin/admin.controller.js', `import { setFeature, getFeatures } from '../features/feature.service.js';
import { updateSettings } from '../settings/settings.service.js';
import { getActivityLog, getAllActivityLog, logAdminActivity } from './admin.service.js';
import { AppError } from '../../utils/errorHandler.js';

export async function handleToggleFeature(req, res, next) {
  try {
    const { featureName, enabled } = req.body || {};
    if (!featureName || enabled === undefined) throw new AppError('featureName and enabled required', 400, 'VALIDATION_ERROR');
    const feature = await setFeature(req.params.tenantId, featureName, enabled);
    await logAdminActivity({
      adminUserId: req.user.sub,
      tenantId: req.params.tenantId,
      action: enabled ? 'ENABLE_FEATURE' : 'DISABLE_FEATURE',
      entity: 'tenant_features',
      entityId: req.params.tenantId,
    });
    res.json(feature);
  } catch (err) { next(err); }
}

export async function handleAdminUpdateSettings(req, res, next) {
  try {
    res.json(await updateSettings(req.params.tenantId, req.body || {}, req.user.sub));
  } catch (err) { next(err); }
}

export async function handleGetFeatures(req, res, next) {
  try { res.json(await getFeatures(req.params.tenantId)); } catch (err) { next(err); }
}

export async function handleGetActivityLog(req, res, next) {
  try {
    const { tenantId } = req.params;
    res.json(tenantId ? await getActivityLog(tenantId) : await getAllActivityLog());
  } catch (err) { next(err); }
}
`);

w('src/modules/admin/admin.routes.js', `import { Router } from 'express';
import * as ctrl from './admin.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isSuperAdmin } from '../../middleware/role.middleware.js';

const router = Router();
router.use(authenticate, isSuperAdmin);

router.patch('/tenant/:tenantId/feature', ctrl.handleToggleFeature);
router.patch('/tenant/:tenantId/settings', ctrl.handleAdminUpdateSettings);
router.get('/tenant/:tenantId/features', ctrl.handleGetFeatures);
router.get('/activity', ctrl.handleGetActivityLog);
router.get('/activity/:tenantId', ctrl.handleGetActivityLog);

export default router;
`);

w('src/app.js', `import express from 'express';
import cors from 'cors';
import { notFound, errorHandler } from './utils/errorHandler.js';
import { ENV } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';
import tenantRoutes from './modules/tenants/tenant.routes.js';
import userRoutes from './modules/users/user.routes.js';
import loadRoutes from './modules/loads/load.routes.js';
import bidRoutes from './modules/bids/bid.routes.js';
import carrierRoutes from './modules/carriers/carrier.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

const app = express();

app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'opscale-multitenant' }));

app.use('/auth', authRoutes);
app.use('/tenants', tenantRoutes);
app.use('/users', userRoutes);
app.use('/loads', loadRoutes);
app.use('/', bidRoutes);
app.use('/carriers', carrierRoutes);
app.use('/settings', settingsRoutes);
app.use('/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
`);

w('src/server.js', `/* global process */
import app from './app.js';
import { ENV } from './config/env.js';
import { pool } from './config/database.js';
import { logger } from './utils/logger.js';

async function start() {
  try {
    await pool.query('SELECT 1');
    logger.info('Database connection established');
  } catch (err) {
    logger.error('Database connection failed - check MT_DATABASE_URL', { message: err.message });
    process.exit(1);
  }

  app.listen(ENV.PORT, () => {
    logger.info(\`Opscale multitenant API running on port \${ENV.PORT}\`);
  });
}

start();
`);

console.log('\n✓ All 39 files created in server/multitenant/');
console.log('\nRunning npm install in server/multitenant...');
try {
  execSync('npm install', { cwd: base, stdio: 'inherit' });
  console.log('\n✓ npm install complete');
} catch (e) {
  console.error('\n✗ npm install failed:', e.message);
  process.exit(1);
}
