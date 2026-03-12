import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import customersRouter from './routes/customers.js';
import carriersRouter from './routes/carriers.js';
import invoicesRouter from './routes/invoices.js';
import exceptionsRouter from './routes/exceptions.js';
import messagesRouter from './routes/messages.js';
import rateLogicRouter from './routes/rateLogic.js';
import dashboardRouter from './routes/dashboard.js';
import reportsRouter from './routes/reports.js';
import uploadsRouter from './routes/uploads.js';
import invoiceImagesRouter from './routes/invoiceImages.js';
import ediRouter from './routes/edi.js';
import authRouter from './routes/auth.js';
import auditsRouter from './routes/audits.js';
import loadsRouter from './routes/loads.js';
import driversRouter from './routes/drivers.js';
import vehiclesRouter from './routes/vehicles.js';
import tripsRouter from './routes/trips.js';
import locationsRouter from './routes/locations.js';
import shipmentsRouter from './routes/shipments.js';
import carrierProfilesRouter from './routes/carrierProfiles.js';
import auditResultsRouter from './routes/auditResults.js';
import freightIntelligenceRouter from './routes/freightIntelligence.js';
import { verifyToken, requireDatabase } from './middleware/auth.js';

dotenv.config();

const PORT = parseInt(process.env.PORT, 10) || 3000;

// Validate JWT_SECRET at startup
const jwtSecretCheck = typeof process.env.JWT_SECRET === 'string' ? process.env.JWT_SECRET.trim() : '';
if (!jwtSecretCheck || jwtSecretCheck.length < 32) {
  const msg = '[startup] JWT_SECRET is missing or too short (must be at least 32 characters). Authentication will fail.';
  if (process.env.NODE_ENV === 'production') {
    throw new Error(msg);
  }
  console.warn(`[startup] WARNING: ${msg}`);
}

// Locate MongoDB connection URI from supported environment variable names
const mongoUriEnvKeys = ['MONGODB_URI', 'MONGODB_URL', 'MONGO_URL', 'MONGO_URI', 'DATABASE_URL'];
const mongoUriEnvKey = mongoUriEnvKeys.find((key) => {
  const value = process.env[key];
  return typeof value === 'string' && value.trim().length > 0;
});
const MONGODB_URI = (mongoUriEnvKey ? process.env[mongoUriEnvKey] : '').trim();
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '';
const app = express();
app.set('trust proxy', 1);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, 'dist');
const distIndexExists = fs.existsSync(path.join(distPath, 'index.html'));

// Allow only Vercel frontend and custom domains for CORS
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'https://express-git-fbpa-josephmabbinante-a11ys-projects.vercel.app',
  'https://www.hdhtransport.com',
  'https://hdhtransport.com',
  'https://fbpa-f073sj7mi-josephmabbinante-a11ys-projects.vercel.app',
  'https://fbpa-qh4fmw9tg-josephmabbinante-a11ys-projects.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  // Add your deployed frontend URL here, e.g.:
  // 'https://your-app.vercel.app',
  // Add any custom production domains here
];

const envAllowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, '').toLowerCase())
  .filter(Boolean);

const allowedOrigins = new Set(
  [...defaultAllowedOrigins, ...envAllowedOrigins]
    .map((origin) => origin.trim().replace(/\/+$/, '').toLowerCase())
);

const hasUriPlaceholders = /<[^>]+>/.test(MONGODB_URI);

if (MONGODB_URI && !hasUriPlaceholders) {
  if (mongoUriEnvKey !== 'MONGODB_URI') {
    console.warn(`[mongodb] Using ${mongoUriEnvKey} (preferred key is MONGODB_URI).`);
  }
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    heartbeatFrequencyMS: 10000,
    connectTimeoutMS: 10000,
  })
    .then(() => console.log('[mongodb] Connected'))
    .catch((err) => console.error('[mongodb] Connection error:', err.message));

  mongoose.connection.on('disconnected', () => {
    console.warn('[mongodb] Disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[mongodb] Connection error event:', err.message);
  });
} else if (hasUriPlaceholders) {
  console.warn('[mongodb] MONGODB_URI contains placeholder brackets. Update .env with real credentials.');
} else {
  console.warn(`[mongodb] No Mongo URI found. Checked keys: ${mongoUriEnvKeys.join(', ')}. Running without database.`);
}

app.use(helmet());

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = origin.trim().replace(/\/+$/, '').toLowerCase();
    if (allowedOrigins.has(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
}));

// General API rate limiter — 300 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

app.use((req, res, next) => {
  const startedAt = Date.now();
  const origin = req.headers.origin || '-';
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.log(`[http] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms origin=${origin} ip=${ip}`);
  });

  next();
});

// Serve static files from public/ unconditionally (before body parsers and API routes)
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const contentType = req.headers['content-type'] || '';
    console.error(`[bad-json] ${err.message} content-type=${contentType}`);
    return res.status(400).json({
      ok: false,
      error: 'Invalid JSON in request body.',
      hint: 'Send valid JSON like {"email":"name@example.com","password":"..."} with Content-Type: application/json',
    });
  }
  next(err);
});

// Health endpoint — no auth required, before protected API routes
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
  res.json({
    status: 'ok',
    database: dbStatus,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/audits', verifyToken, requireDatabase, auditsRouter);
app.use('/api/customers', verifyToken, requireDatabase, customersRouter);
app.use('/api/carriers', verifyToken, requireDatabase, carriersRouter);
app.use('/api/invoices', verifyToken, requireDatabase, invoicesRouter);
app.use('/api/exceptions', verifyToken, requireDatabase, exceptionsRouter);
app.use('/api/messages', verifyToken, messagesRouter);
app.use('/api/rate-logic', verifyToken, rateLogicRouter);
app.use('/api/dashboard', verifyToken, requireDatabase, dashboardRouter);
app.use('/api/reports', verifyToken, requireDatabase, reportsRouter);
app.use('/api/uploads', verifyToken, uploadsRouter);
app.use('/api/invoice-images', verifyToken, invoiceImagesRouter);
app.use('/api/edi', verifyToken, ediRouter);
app.use('/api/loads', verifyToken, requireDatabase, loadsRouter);
app.use('/api/drivers', verifyToken, requireDatabase, driversRouter);
app.use('/api/vehicles', verifyToken, requireDatabase, vehiclesRouter);
app.use('/api/trips', verifyToken, requireDatabase, tripsRouter);
app.use('/api/locations', verifyToken, requireDatabase, locationsRouter);
app.use('/api/shipments', verifyToken, requireDatabase, shipmentsRouter);
app.use('/api/carrier-profiles', verifyToken, requireDatabase, carrierProfilesRouter);
app.use('/api/audit-results', verifyToken, requireDatabase, auditResultsRouter);
app.use('/api/freight-intelligence', verifyToken, requireDatabase, freightIntelligenceRouter);

// Root route: serve React SPA when built, otherwise redirect to static login
app.get('/', (req, res, next) => {
  if (distIndexExists) {
    next();
  } else {
    res.redirect('/login.html');
  }
});

// Serve the React SPA from dist/ when it has been built.
// This catch-all must be AFTER all API routes but BEFORE error handlers so that
// client-side routes like /loads/loadbuilder are served index.html instead of 404.
if (distIndexExists) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if ((req.method !== 'GET' && req.method !== 'HEAD') || req.path.startsWith('/api')) {
      next();
      return;
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  if (err && typeof err.message === 'string' && err.message.startsWith('CORS origin not allowed:')) {
    return res.status(403).json({ error: err.message });
  }

  return next(err);
});

// Global catch-all error handler — must be after all API routes
app.use((err, req, res, next) => {
  console.error('[error] Unhandled route error:', err.message, err.stack);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    ok: false,
    error: err.message || 'Internal server error',
  });
});

// Only start the HTTP server when running directly (not as a Vercel serverless function)
if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`FBPA API server running on port ${PORT}`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = async (signal) => {
    console.log(`\n[shutdown] Received ${signal}, starting graceful shutdown...`);
    
    // Stop accepting new connections
    server.close(() => {
      console.log('[shutdown] HTTP server closed');
    });
    
    // Close database connections
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.connection.close();
        console.log('[shutdown] MongoDB connection closed');
      } catch (err) {
        console.error('[shutdown] Error closing MongoDB connection:', err.message);
      }
    }
    
    console.log('[shutdown] Graceful shutdown complete');
    process.exit(0);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (err) => {
    console.error('[error] Uncaught exception:', err);
    console.error('[error] Stack:', err.stack);
    gracefulShutdown('uncaughtException').finally(() => process.exit(1));
  });

  // Log unhandled rejections but do NOT exit — transient MongoDB reconnection
  // failures and similar async errors must not crash the running server.
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[error] Unhandled rejection at:', promise, 'reason:', reason);
  });
}
