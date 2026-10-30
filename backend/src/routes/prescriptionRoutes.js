import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { listPrescriptions, getPrescription, createPrescription } from '../controllers/prescriptionController.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize('admin', 'doctor', 'patient'), listPrescriptions);
router.get('/:id', authorize('admin', 'doctor', 'patient'), getPrescription);
router.post('/', authorize('doctor'), createPrescription);
export default router;
