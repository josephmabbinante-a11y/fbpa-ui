import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import customersRouter from './customers.js';
import messagesRouter from './messages.js';
import rateLogicRouter from './rateLogic.js';
import healthRoutes from './routes.js';
import nodemailer from 'nodemailer';
import { User } from './models.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const MONGODB_URI = process.env.MONGODB_URI;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

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

// JWT authentication middleware
function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
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
app.use('/api/customers', authenticateJWT, customersRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/rate-logic', authenticateJWT, rateLogicRouter);
app.use('/api', healthRoutes);

// Real user authentication using MongoDB
app.post('/api/auth/login', async (req, res) => {
  console.log('Login request body:', req.body);
  const { email, password } = req.body || {};
  if (!email || !password) {
    console.log('Login error: Email and password required');
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      console.log('Login error: Invalid credentials for', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const accessToken = jwt.sign(
      { sub: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('Login success for', email);
    return res.json({
      accessToken,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Registration endpoint for creating users (must be after app is defined)
app.post('/api/auth/register', async (req, res) => {
  console.log('Register request body:', req.body);
  const { email, password, role } = req.body || {};
  if (!email || !password) {
    console.log('Register error: Email and password required');
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Register error: User already exists for', email);
      return res.status(409).json({ error: 'User already exists' });
    }
    const user = await User.create({ email, password, role: role || 'user' });
    console.log('Register success for', email);
    res.json({ success: true, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Register server error:', err);
    res.status(500).json({ error: 'Server error' });
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
