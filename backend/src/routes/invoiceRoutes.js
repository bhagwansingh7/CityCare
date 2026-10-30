import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  listInvoices, billableAppointments, getInvoice, createInvoice,
  cancelInvoice, listPayments, recordPayment,
} from '../controllers/invoiceController.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize('admin', 'billing', 'patient'), listInvoices);
router.get('/billable-appointments', authorize('billing'), billableAppointments); // must stay above '/:id'
router.get('/:id', authorize('admin', 'billing', 'patient'), getInvoice);
router.post('/', authorize('billing'), createInvoice);
router.put('/:id/cancel', authorize('billing'), cancelInvoice);
router.get('/:id/payments', authorize('admin', 'billing', 'patient'), listPayments);
router.post('/:id/payments', authorize('billing'), recordPayment);
export default router;
