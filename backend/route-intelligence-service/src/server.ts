import app from './app';
import { env } from './config/env';
import { ensureSchema } from './config/database';

async function bootstrap(): Promise<void> {
  await ensureSchema();

  app.listen(env.PORT, () => {
    console.log(`[route-intelligence-service] listening on :${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('[route-intelligence-service] startup failed', error);
  process.exit(1);
});
