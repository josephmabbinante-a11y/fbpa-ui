import { Router } from 'express';
import * as ctrl from './carrier.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenant } from '../../middleware/tenant.middleware.js';
import { startImpersonation } from '../../middleware/impersonation.middleware.js';
import { isOpsOrAbove, isTenantAdmin } from '../../middleware/role.middleware.js';

const router = Router();
router.use(authenticate, startImpersonation, resolveTenant, requireTenant);

router.get('/', isOpsOrAbove, ctrl.handleListCarriers);
router.post('/', isOpsOrAbove, ctrl.handleCreateCarrier);
router.patch('/:id/approve', isTenantAdmin, ctrl.handleApproveCarrier);

export default router;
