import express from 'express';
import rateLimit from 'express-rate-limit';
import routeRouter from './routes/route.routes';
import { env } from './config/env';

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/health', (_req, res) => {
  res.json({
    service: 'route-intelligence-service',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/routes', routeRouter);

app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
});

export default app;
