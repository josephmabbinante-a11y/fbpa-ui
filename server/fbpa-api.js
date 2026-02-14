/* global process */
// FBPA API repository starter file for Render deployment
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import customersRouter from './customers.js';
import carriersRouter from './carriers.js';
import invoicesRouter from './invoices.js';
import exceptionsRouter from './exceptions.js';
// ...existing code...

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

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

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('[mongodb] Connected'))
    .catch((err) => console.error('[mongodb] Connection error:', err.message));
}

app.use(cors());
app.use(express.json());
app.use('/api/customers', customersRouter);
app.use('/api/carriers', carriersRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/exceptions', exceptionsRouter);
// ...add other routers as needed...

app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`FBPA API running on http://localhost:${PORT}`);
});
