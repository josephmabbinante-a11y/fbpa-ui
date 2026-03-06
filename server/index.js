// In-memory reset tokens (for demo; use DB or cache for production)
// In-memory reset tokens (for demo; use DB or cache for production)
const passwordResetTokens = {};

// DEBUG: Startup and route mounting diagnostics
console.log('[DEBUG] Running file: server/index.js');
process.on('uncaughtException', (err) => {
  console.error('[DEBUG] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[DEBUG] Unhandled Rejection:', reason);
});



/* global process */
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import path from 'path';

// Log all route mounts and keep a list (after app is defined)
let mountedRoutes = [];
let originalUse;
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
import loadLifecycleRoutes from './loadLifecycleRoutes.js';

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

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

function respondDatabaseUnavailable(res) {
  return res.status(503).json({
    error: 'Database unavailable',
    details: mongoLastError || 'MongoDB is not connected',
  });
}

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
  'https://fbpa-dgt9p9xe9-josephmabbinante-a11ys-projects.vercel.app',
  'https://fbpa-pqhb5nod7-josephmabbinante-a11ys-projects.vercel.app',
  'https://fbpa-cxhcpym98-josephmabbinante-a11ys-projects.vercel.app',
  'https://fbpa-96un8xi2g-josephmabbinante-a11ys-projects.vercel.app',
  'https://fbpa-a744vgv53-josephmabbinante-a11ys-projects.vercel.app',
  'https://fbpa-3o2xyfwkj-josephmabbinante-a11ys-projects.vercel.app',
  'https://fbpa-jkqd3brbc-josephmabbinante-a11ys-projects.vercel.app',
  /^https:\/\/.*\.vercel\.app$/
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
app.use('/api', loadLifecycleRoutes);

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
// Mount document management endpoints before the main documentsRouter to avoid shadowing
app.get('/api/documents', documentsRouter);
app.delete('/api/documents/:id', documentsRouter);
app.get('/api/documents/:id/download', documentsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/email-templates', emailTemplatesRouter);

// Fleet data routers
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/tracker', trackerRouter);

app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'ok', dbStatus });
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

// Remove in-memory users array. Use MongoDB User model instead.

const handleLogin = (req, res) => {
  console.log('[DEBUG] Login req.body:', req.body);
  if (!isMongoConnected()) {
    return respondDatabaseUnavailable(res);
  }
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Valid email and password are required' });
  }
    User.findOne({ email: email.toLowerCase() }).then(userDoc => {
      console.log('[DEBUG] Login attempt for email:', email);
      console.log('[DEBUG] UserDoc found:', userDoc);
      if (!userDoc) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      // Debug logging for password comparison
      console.log('[DEBUG] Login password:', password);
      console.log('[DEBUG] Stored hash:', userDoc.passwordHash);
        // TEMP: Allow plain-text and plainPassword comparison for debugging
        let passwordMatch = false;
        if (userDoc.passwordHash === password) {
          passwordMatch = true;
          console.log('[DEBUG] Plain-text password matched (passwordHash)');
        } else if (userDoc.plainPassword && userDoc.plainPassword === password) {
          passwordMatch = true;
          console.log('[DEBUG] Plain-text password matched (plainPassword)');
        } else {
          // Fallback to bcrypt comparison
          const bcryptResult = bcrypt.compareSync(password, userDoc.passwordHash);
          console.log('[DEBUG] Bcrypt comparison result:', bcryptResult);
          passwordMatch = bcryptResult;
        }
        if (!passwordMatch) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      if (!userDoc.verified) {
        return res.status(403).json({ error: 'Email not verified. Please check your inbox.' });
      }
      const accessToken = jwt.sign(
        { sub: userDoc._id, email: userDoc.email, role: userDoc.role },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      return res.json({
        accessToken,
        user: { id: userDoc._id, email: userDoc.email, role: userDoc.role },
        password: password // Optionally send password for display
      });
    }).catch(err => {
      return res.status(500).json({ error: 'Login failed', details: err.message });
    });
};

app.post('/auth/login', handleLogin);
app.post('/api/auth/login', handleLogin);

const handleRegister = (req, res) => {
  console.log('[DEBUG] Register req.body:', req.body);
  if (!isMongoConnected()) {
    return respondDatabaseUnavailable(res);
  }
  const { email, password, role, name } = req.body || {};
  console.log('[DEBUG] Registration payload:', req.body);
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const passwordText = String(password || '');
  if (!normalizedEmail || !passwordText) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  let passwordHash = '';
  try {
    passwordHash = bcrypt.hashSync(passwordText, 10);
  } catch (err) {
    return res.status(400).json({ error: 'Password hashing failed.' });
  }
  // Password requirements
  const minLength = 8;
  const complexityRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/;
  if (passwordText.length < minLength) {
    return res.status(400).json({ error: `Password must be at least ${minLength} characters.` });
  }
  if (!complexityRegex.test(passwordText)) {
    return res.status(400).json({ error: 'Password must contain at least one letter and one number.' });
  }
  User.findOne({ email: normalizedEmail }).then(existingUser => {
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
      console.log('[DEBUG] Register password:', passwordText);
      console.log('[DEBUG] Register passwordHash:', passwordHash);
      const newUser = new User({
        email: normalizedEmail,
        name: String(name || '').trim() || null,
        role: role === 'admin' ? 'admin' : 'user',
        passwordHash: passwordHash || '',
        plainPassword: passwordText,
        verified: true,
      });
    return newUser.save().then(savedUser => {
      return res.status(201).json({
        user: {
          id: savedUser._id,
          email: savedUser.email,
          name: savedUser.name,
          role: savedUser.role,
          plainPassword: savedUser.plainPassword
        },
        password: passwordText // Optionally send password for display
      });
    });
  }).catch(err => {
    return res.status(500).json({ error: 'Registration failed', details: err.message });
  });
};

const handleListUsers = async (_req, res) => {
  if (!isMongoConnected()) {
    return respondDatabaseUnavailable(res);
  }

  try {
    const docs = await User.find({}, { email: 1, name: 1, role: 1, plainPassword: 1 }).lean();
    return res.json({
      users: docs.map((doc) => ({
        id: String(doc._id),
        email: doc.email,
        name: doc.name || '',
        role: doc.role || 'user',
        plainPassword: doc.plainPassword || '',
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list users', details: err.message });
  }
app.get('/api/auth/list-users', handleListUsers);
};

const handleUpdateUser = async (req, res) => {
  if (!isMongoConnected()) {
    return respondDatabaseUnavailable(res);
  }

  const userId = String(req.params.id || '').trim();
  const { name, role } = req.body || {};

  if (!userId) {
    return res.status(400).json({ error: 'User id is required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (typeof name === 'string') {
      user.name = name.trim() || null;
    }

    if (typeof role === 'string') {
      user.role = role === 'admin' ? 'admin' : 'user';
    }

    await user.save();

    return res.json({
      user: { id: String(user._id), email: user.email, name: user.name || '', role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user', details: err.message });
  }
};

app.post('/api/auth/register', handleRegister);
app.post('/auth/register', handleRegister);
app.get('/api/auth/users', handleListUsers);
app.get('/auth/users', handleListUsers);
app.patch('/api/auth/users/:id', handleUpdateUser);
app.patch('/auth/users/:id', handleUpdateUser);

app.post('/api/auth/forgot-password', async (req, res) => {
  if (!isMongoConnected()) {
    return respondDatabaseUnavailable(res);
  }
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
  if (!isMongoConnected()) {
    return respondDatabaseUnavailable(res);
  }
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
  if (!isMongoConnected()) {
    return respondDatabaseUnavailable(res);
  }
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
  if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const entry = resetTokens[token];
    if (!entry || entry.expires < Date.now()) return res.status(400).json({ error: 'Invalid or expired token' });

    const user = await User.findOne({ email: entry.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.passwordHash = hashPassword(password);
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
  console.log(`[DEBUG] Auth server running on http://localhost:${PORT}`);
  console.log(`[DEBUG] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[DEBUG] VITE_API_URL: ${process.env.VITE_API_URL}`);
  console.log(`[DEBUG] MONGODB_URI configured: ${Boolean(process.env.MONGODB_URI)}`);
});
