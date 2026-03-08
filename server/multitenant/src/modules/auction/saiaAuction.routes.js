import { Router } from 'express';
import * as ctrl from './saiaAuction.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { resolveTenant, requireTenant } from '../../middleware/tenant.middleware.js';
import { startImpersonation } from '../../middleware/impersonation.middleware.js';
import { isOpsOrAbove } from '../../middleware/role.middleware.js';

const router = Router();
router.use(authenticate, startImpersonation, resolveTenant, requireTenant);

router.post('/saia/quote', isOpsOrAbove, ctrl.handleQuoteSaiaAuction);
router.get('/saia/circuit', isOpsOrAbove, ctrl.handleGetSaiaAuctionCircuit);

export default router;
