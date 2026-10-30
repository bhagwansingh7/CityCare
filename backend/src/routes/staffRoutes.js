import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { listStaff, createStaff, setStaffStatus } from '../controllers/staffController.js';

const router = Router();
router.use(authenticate, authorize('admin'));
router.get('/', listStaff);
router.post('/', createStaff);
router.put('/:id/status', setStaffStatus);
export default router;
