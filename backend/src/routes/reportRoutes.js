import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { dashboard, myStats } from '../controllers/reportController.js';

const router = Router();
router.use(authenticate);
router.get('/dashboard', authorize('admin'), dashboard);
router.get('/my-stats', myStats);
export default router;
