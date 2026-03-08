import { Router } from 'express';
import { handleGetSettings, handleUpdateSettings } from './settings.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenant } from '../../middleware/tenant.middleware.js';
import { startImpersonation } from '../../middleware/impersonation.middleware.js';
import { isTenantAdmin } from '../../middleware/role.middleware.js';

const router = Router();
router.use(authenticate, startImpersonation, resolveTenant, requireTenant, isTenantAdmin);

router.get('/', handleGetSettings);
router.patch('/', handleUpdateSettings);

export default router;
