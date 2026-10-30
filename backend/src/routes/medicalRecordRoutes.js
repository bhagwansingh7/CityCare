import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { listRecords, getRecord, createRecord, updateRecord } from '../controllers/medicalRecordController.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize('admin', 'doctor', 'patient'), listRecords);
router.get('/:id', authorize('admin', 'doctor', 'patient'), getRecord);
router.post('/', authorize('doctor'), createRecord);
router.put('/:id', authorize('doctor'), updateRecord);
export default router;
