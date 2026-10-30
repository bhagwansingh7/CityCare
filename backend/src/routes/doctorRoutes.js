import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { listDoctors, getDoctor, createDoctor, updateDoctor, setDoctorStatus } from '../controllers/doctorController.js';

const router = Router();
router.use(authenticate);
router.get('/', listDoctors);
router.get('/:id', getDoctor);
router.post('/', authorize('admin'), createDoctor);
router.put('/:id', authorize('admin'), updateDoctor);
router.put('/:id/status', authorize('admin'), setDoctorStatus);
export default router;
