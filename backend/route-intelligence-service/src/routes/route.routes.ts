import { Router } from 'express';
import { getRoute } from '../controllers/route.controller';

const router = Router();

router.post('/calculate', getRoute);

export default router;
