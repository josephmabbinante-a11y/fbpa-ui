import { Router } from 'express';
import { handleCreateTenant, handleListTenants, handleGetTenant, handleUpdateTenantStatus } from './tenant.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isSuperAdmin } from '../../middleware/role.middleware.js';

const router = Router();
router.use(authenticate, isSuperAdmin);

router.post('/', handleCreateTenant);
router.get('/', handleListTenants);
router.get('/:id', handleGetTenant);
router.patch('/:id/status', handleUpdateTenantStatus);

export default router;
