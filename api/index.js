import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import customersRouter from '../server/customers.js';
import messagesRouter from '../server/messages.js';
import rateLogicRouter from '../server/rateLogic.js';

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const MONGODB_URI = process.env.MONGODB_URI;

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
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
    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use('/api/customers', customersRouter);
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

export default app;
