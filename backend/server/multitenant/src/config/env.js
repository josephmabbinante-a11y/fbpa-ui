import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.MT_PORT || 4001,
  JWT_SECRET: process.env.MT_JWT_SECRET || 'opscale_multitenant_secret_change_me',
  JWT_EXPIRES_IN: process.env.MT_JWT_EXPIRES_IN || '8h',
  DATABASE_URL: process.env.MT_DATABASE_URL || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
