import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  listAppointments, getOneAppointment, createAppointment,
  updateAppointment, updateStatus, cancelAppointment,
} from '../controllers/appointmentController.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize('admin', 'receptionist', 'doctor', 'patient'), listAppointments);
router.get('/:id', authorize('admin', 'receptionist', 'doctor', 'patient'), getOneAppointment);
router.post('/', authorize('admin', 'receptionist', 'patient'), createAppointment);
router.put('/:id', authorize('admin', 'receptionist', 'patient'), updateAppointment);          // reschedule
router.put('/:id/status', authorize('admin', 'receptionist', 'doctor'), updateStatus);
router.put('/:id/cancel', authorize('admin', 'receptionist', 'patient'), cancelAppointment);
export default router;
