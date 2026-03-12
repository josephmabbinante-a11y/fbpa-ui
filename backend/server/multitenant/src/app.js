import express from 'express';
import cors from 'cors';
import { notFound, errorHandler } from './utils/errorHandler.js';
import { ENV } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';
import tenantRoutes from './modules/tenants/tenant.routes.js';
import userRoutes from './modules/users/user.routes.js';
import loadRoutes from './modules/loads/load.routes.js';
import bidRoutes from './modules/bids/bid.routes.js';
import carrierRoutes from './modules/carriers/carrier.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

const app = express();

app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'opscale-multitenant' }));

app.use('/auth', authRoutes);
app.use('/tenants', tenantRoutes);
app.use('/users', userRoutes);
app.use('/loads', loadRoutes);
app.use('/', bidRoutes);
app.use('/carriers', carrierRoutes);
app.use('/settings', settingsRoutes);
app.use('/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
