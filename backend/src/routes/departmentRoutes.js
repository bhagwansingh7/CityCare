import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { listDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController.js';

const router = Router();
router.use(authenticate);
router.get('/', listDepartments);
router.post('/', authorize('admin'), createDepartment);
router.put('/:id', authorize('admin'), updateDepartment);
router.delete('/:id', authorize('admin'), deleteDepartment);
export default router;
