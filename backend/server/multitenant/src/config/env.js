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
