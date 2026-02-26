/* global process */
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from './models.js';
import customersRouter from './customers.js';
import carriersRouter from './carriers.js';
import invoicesRouter from './invoices.js';
import exceptionsRouter from './exceptions.js';
import messagesRouter from './messages.js';
import rateLogicRouter from './rateLogic.js';

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
function hashPassword(password) {
  return crypto
    .createHash('sha256')
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
const defaultAllowedOrigins = [
  // Local development
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  // Production web environment (Vercel)
  'https://fbpa-f073sj7mi-josephmabbinante-a11ys-projects.vercel.app',
  'https://fbpa-e3wffttsx-josephmabbinante-a11ys-projects.vercel.app',
  'https://fbpa-ui-git-fbpa-josephmabbinante-a11ys-projects.vercel.app',
  // Allow all Vercel preview/production URLs
  /^https:\/\/.*\.vercel\.app$/,
];
const envAllowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];
const allowVercelOrigins = true;

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
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
app.use('/api', healthRoutes);
// User authentication using bcrypt
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const accessToken = jwt.sign(
  { sub: user._id, email: user.email, role: user.role },
  JWT_SECRET,
  { expiresIn: '1h' }
    );
    return res.json({
      accessToken,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});
app.post('/api/auth/register', async (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || typeof password !== 'string' || password.trim() === '') {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = await User.create({ email, passwordHash, role: role || 'user' });
    res.json({ success: true, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }
  // Demo: Accept any email, generate a token
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
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
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
/* global process */
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from './models.js';
import customersRouter from './customers.js';
import carriersRouter from './carriers.js';
import invoicesRouter from './invoices.js';
import exceptionsRouter from './exceptions.js';
import messagesRouter from './messages.js';
import rateLogicRouter from './rateLogic.js';

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

// Forgot password logic (must be after app is defined)
const resetTokens = {};
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

app.post('/api/auth/forgot-password', async (req, res) => {
  // Log the incoming request body for debugging
  console.log('Forgot password request body:', req.body);
  const { email } = req.body || {};
  if (!email) {
    console.log('Forgot password error: Email required');
    return res.status(400).json({ error: 'Email required' });
  }
  // Demo: Accept any email, generate a token
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
    console.log('Forgot password email sent to:', email);
    res.json({ success: true });
  } catch (e) {
    console.error('Forgot password email error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Allowed origins for CORS
const defaultAllowedOrigins = [
  // Local development
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  // Production web environment (Vercel)
  'https://fbpa-f073sj7mi-josephmabbinante-a11ys-projects.vercel.app',
  'https://fbpa-e3wffttsx-josephmabbinante-a11ys-projects.vercel.app',
  'https://fbpa-ui-git-fbpa-josephmabbinante-a11ys-projects.vercel.app',
  // Allow all Vercel preview/production URLs
  /^https:\/\/.*\.vercel\.app$/,
];
const envAllowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

// Connect to MongoDB
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err.message));
} else {
  console.warn('⚠️ MONGODB_URI not set, running without database');
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
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

const users = [
  { id: 'u-1', email: 'admin@opscale.ai', role: 'admin', password: 'password123' },
];

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const allowAny = process.env.DEV_AUTH_ALLOW_ANY === 'true';
  const user = users.find((u) => u.email === email && u.password === password);
  const authedUser =
    user ||
    (allowAny && email && password
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
  // eslint-disable-next-line no-console
  console.log(`Auth server running on http://localhost:${PORT}`);
});
