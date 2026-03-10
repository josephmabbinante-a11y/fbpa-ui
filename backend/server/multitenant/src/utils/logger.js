const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const levels = { error: 0, warn: 1, info: 2, debug: 3 };

function log(level, message, meta = {}) {
  if (levels[level] <= levels[LOG_LEVEL]) {
    const entry = { timestamp: new Date().toISOString(), level, message, ...meta };
    if (level === 'error') {
      console.error(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }
}

export const logger = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};
