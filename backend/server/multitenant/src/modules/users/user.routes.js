import { Router } from 'express';
import { handleCreateUser, handleListUsers, handleGetUser } from './user.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenant } from '../../middleware/tenant.middleware.js';
import { startImpersonation } from '../../middleware/impersonation.middleware.js';
import { isTenantAdmin } from '../../middleware/role.middleware.js';

const router = Router();
router.use(authenticate, startImpersonation, resolveTenant, requireTenant, isTenantAdmin);

router.get('/', handleListUsers);
router.get('/:id', handleGetUser);
router.post('/', handleCreateUser);

export default router;
