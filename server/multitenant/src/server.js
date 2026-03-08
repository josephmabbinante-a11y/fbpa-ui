/* global process */
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
    logger.info(`Opscale multitenant API running on port ${ENV.PORT}`);
  });
}

start();
