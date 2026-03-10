import { Router } from 'express';
import { handleLogin, handleImpersonate } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isSuperAdmin } from '../../middleware/role.middleware.js';

const router = Router();

router.post('/login', handleLogin);
router.post('/impersonate', authenticate, isSuperAdmin, handleImpersonate);

export default router;
