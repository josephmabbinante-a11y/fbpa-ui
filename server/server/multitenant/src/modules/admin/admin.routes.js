import { Router } from 'express';
import * as ctrl from './admin.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isSuperAdmin } from '../../middleware/role.middleware.js';

const router = Router();
router.use(authenticate, isSuperAdmin);

router.patch('/tenant/:tenantId/feature', ctrl.handleToggleFeature);
router.patch('/tenant/:tenantId/settings', ctrl.handleAdminUpdateSettings);
router.get('/tenant/:tenantId/features', ctrl.handleGetFeatures);
router.get('/activity', ctrl.handleGetActivityLog);
router.get('/activity/:tenantId', ctrl.handleGetActivityLog);

export default router;
