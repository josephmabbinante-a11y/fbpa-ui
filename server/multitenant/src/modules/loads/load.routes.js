import { Router } from 'express';
import * as ctrl from './load.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenant } from '../../middleware/tenant.middleware.js';
import { startImpersonation } from '../../middleware/impersonation.middleware.js';
import { isOpsOrAbove } from '../../middleware/role.middleware.js';
import { requireFeature } from '../../middleware/feature.middleware.js';

const router = Router();
router.use(authenticate, startImpersonation, resolveTenant, requireTenant, requireFeature('internal_load_board'));

router.get('/', ctrl.handleListLoads);
router.post('/', isOpsOrAbove, ctrl.handleCreateLoad);
router.patch('/:id', isOpsOrAbove, ctrl.handleUpdateLoad);
router.post('/:id/post', isOpsOrAbove, ctrl.handlePostLoad);
router.post('/:id/award', isOpsOrAbove, ctrl.handleAwardLoad);

export default router;
