/* global process */
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from './models.js';

import customersRouter from './customers.js';
import carriersRouter from './carriers.js';
import invoicesRouter from './invoices.js';
import exceptionsRouter from './exceptions.js';
import messagesRouter from './messages.js';
import rateLogicRouter from './rateLogic.js';
import dashboardRouter from './dashboard.js';
import reportsRouter from './reports.js';
import uploadsRouter from './uploads.js';
import invoiceImagesRouter from './invoiceImages.js';
import ediRouter from './edi.js';
import loadsRouter from './loads.js';
import locationsRouter from './locations.js';
import documentsRouter from './documents.js';
import emailTemplatesRouter from './emailTemplates.js';

import vehiclesRouter from './vehicles.js';
import driversRouter from './drivers.js';
import tripsRouter from './trips.js';
import trackerRouter from './tracker.js';
import { getSaiaHealthStatus } from './services/carriers/saia/saiaRateService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const resetTokens = {};
let mongoLastError = '';
const PASSWORD_HASH_SALT = process.env.PASSWORD_HASH_SALT || 'fbpa-default-salt';
const allowVercelOrigins = true;

function hashPassword(password) {
  return crypto
    .createHash('sha256')
    .update(`${PASSWORD_HASH_SALT}:${String(password || '')}`)
    .digest('hex');
}

function buildMongoUri() {
  const explicitUri = (process.env.MONGODB_URI || '').trim();
  if (explicitUri) return explicitUri;

  const user = process.env.MONGODB_USER;
  const password = process.env.MONGODB_PASSWORD;
  const host = process.env.MONGODB_HOST;
  const db = process.env.MONGODB_DB || 'fbpa-db';

  if (!user || !password || !host) return '';

  const encodedUser = encodeURIComponent(String(user));
  const encodedPassword = encodeURIComponent(String(password));
  return `mongodb+srv://${encodedUser}:${encodedPassword}@${host}/${db}?retryWrites=true&w=majority`;
}

const MONGODB_URI = buildMongoUri();
const hasUriPlaceholders = /<[^>]+>/.test(MONGODB_URI);

mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);

if (MONGODB_URI && !hasUriPlaceholders) {
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  })
    .then(() => {
      mongoLastError = '';
      console.log('[mongodb] Connected');
    })
    .catch((err) => {
      mongoLastError = err.message;
      console.error('[mongodb] Connection error:', err.message);
    });

  mongoose.connection.on('disconnected', () => {
    console.warn('[mongodb] Disconnected');
  });

  mongoose.connection.on('error', (err) => {
    mongoLastError = err.message;
    console.error('[mongodb] Error:', err.message);
  });
} else if (hasUriPlaceholders) {
  mongoLastError = 'MONGODB_URI contains placeholder brackets';
  console.warn('[mongodb] MONGODB_URI contains placeholder brackets. Update .env with real credentials.');
} else {
  mongoLastError = 'MONGODB_URI is not set';
  console.warn('[mongodb] MONGODB_URI not set, running without database');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'https://fbpa-f073sj7mi-josephmabbinante-a11ys-projects.vercel.app',
  'https://fbpa-e3wffttsx-josephmabbinante-a11ys-projects.vercel.app',
  'https://fbpa-ui-git-fbpa-josephmabbinante-a11ys-projects.vercel.app',
  /^https:\/\/.*\.vercel\.app$/,
];

const envAllowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];
function isOriginAllowed(origin) {
  return allowedOrigins.some((entry) => (entry instanceof RegExp ? entry.test(origin) : entry === origin));
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    if (allowVercelOrigins) {
      try {
        const hostname = new URL(origin).hostname;
        if (hostname.endsWith('.vercel.app')) {
          callback(null, true);
          return;
        }
      } catch {
        // Ignore invalid origin format and fall through to denial.
      }
    }

    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());


app.use('/api/customers', customersRouter);
app.use('/api/carriers', carriersRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/exceptions', exceptionsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/rate-logic', rateLogicRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/invoice-images', invoiceImagesRouter);
app.use('/api/edi', ediRouter);
app.use('/api/loads', loadsRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/email-templates', emailTemplatesRouter);

// Fleet data routers
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/tracker', trackerRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health/saia', async (_req, res) => {
  const health = await getSaiaHealthStatus();
  const statusCode = health.status === 'OFFLINE' ? 503 : 200;
  return res.status(statusCode).json(health);
});

app.get('/health/saia', async (_req, res) => {
  const health = await getSaiaHealthStatus();
  const statusCode = health.status === 'OFFLINE' ? 503 : 200;
  return res.status(statusCode).json(health);
});

const users = [
  { id: 'u-1', email: 'admin@opscale.ai', role: 'admin', password: 'password123' },
];

const handleLogin = (req, res) => {
  const { email, password } = req.body || {};
  const allowAny = process.env.DEV_AUTH_ALLOW_ANY === 'true';
  const user = users.find((u) => u.email === email && u.password === password);
  const authedUser = user || (allowAny && email && password
    ? { id: `u-${Date.now()}`, email, role: 'admin' }
    : null);

  if (!authedUser) return res.status(401).json({ error: 'Invalid credentials' });

  const accessToken = jwt.sign(
    { sub: authedUser.id, email: authedUser.email, role: authedUser.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return res.json({
    accessToken,
    user: { id: authedUser.id, email: authedUser.email, role: authedUser.role },
  });
};

app.post('/auth/login', handleLogin);
app.post('/api/auth/login', handleLogin);

const handleRegister = (req, res) => {
  const { email, password, role, name } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const passwordText = String(password || '');

  if (!normalizedEmail || !passwordText) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const user = {
    id: `u-${Date.now()}`,
    email: normalizedEmail,
    name: String(name || '').trim() || null,
    role: role === 'admin' ? 'admin' : 'user',
    password: passwordText,
  };
  users.push(user);

  return res.status(201).json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
};

const handleListUsers = (_req, res) => {
  return res.json({
    users: users.map(({ id, email, name, role }) => ({ id, email, name: name || '', role })),
  });
};

const handleUpdateUser = (req, res) => {
  const userId = String(req.params.id || '').trim();
  const { name, role } = req.body || {};

  if (!userId) {
    return res.status(400).json({ error: 'User id is required' });
  }

  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (typeof name === 'string') {
    user.name = name.trim() || null;
  }

  if (typeof role === 'string') {
    user.role = role === 'admin' ? 'admin' : 'user';
  }

  return res.json({
    user: { id: user.id, email: user.email, name: user.name || '', role: user.role },
  });
};

app.post('/api/auth/register', handleRegister);
app.post('/auth/register', handleRegister);
app.get('/api/auth/users', handleListUsers);
app.get('/auth/users', handleListUsers);
app.patch('/api/auth/users/:id', handleUpdateUser);
app.patch('/auth/users/:id', handleUpdateUser);

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  const token = Math.random().toString(36).slice(2) + Date.now();
  resetTokens[email] = { token, expires: Date.now() + 1000 * 60 * 15 };
  const resetUrl = `${process.env.VITE_API_URL || 'http://localhost:4000'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@audit-iq.com',
      to: email,
      subject: 'Password Reset',
      text: `Reset your password: ${resetUrl}`,
    });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = crypto.randomBytes(24).toString('hex');
    resetTokens[token] = { email: normalizedEmail, expires: Date.now() + 3600 * 1000 };
    return res.json({ ok: true, token });
  } catch (err) {
    return res.status(500).json({ error: 'Forgot password failed', details: err.message });
  }
});

app.post('/auth/reset-password', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
  if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const entry = resetTokens[token];
    if (!entry || entry.expires < Date.now()) return res.status(400).json({ error: 'Invalid or expired token' });

    const user = await User.findOne({ email: entry.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.password = hashPassword(password);
    await user.save();
    delete resetTokens[token];
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Reset password failed', details: err.message });
  }
});

if (process.env.SERVE_STATIC === 'true') {
  app.use(express.static(distPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
      next();
      return;
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});
