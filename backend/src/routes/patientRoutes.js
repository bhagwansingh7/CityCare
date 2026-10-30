import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { listPatients, getPatient, createPatient, updatePatient } from '../controllers/patientController.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize('admin', 'receptionist', 'doctor', 'billing'), listPatients);
router.get('/:id', getPatient); // patients: own record only (checked in controller)
router.post('/', authorize('admin', 'receptionist'), createPatient);
router.put('/:id', updatePatient); // staff or the patient themself (checked in controller)
export default router;
