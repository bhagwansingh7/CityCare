import pool from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

async function adminReport() {
  const [[totals]] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM patients) AS total_patients,
       (SELECT COUNT(*) FROM doctors) AS total_doctors,
       (SELECT COUNT(*) FROM appointments) AS total_appointments,
       (SELECT COUNT(*) FROM appointments WHERE status = 'Completed') AS completed_appointments,
       (SELECT COUNT(*) FROM appointments WHERE status = 'Cancelled') AS cancelled_appointments,
       (SELECT COUNT(*) FROM invoices) AS total_invoices,
       (SELECT COALESCE(SUM(amount_paid), 0) FROM invoices WHERE status <> 'Cancelled') AS paid_amount,
       (SELECT COALESCE(SUM(total_amount - amount_paid), 0) FROM invoices WHERE status IN ('Pending', 'Partially Paid')) AS pending_amount`
  );
  const [appointmentsByStatus] = await pool.query('SELECT status, COUNT(*) AS count FROM appointments GROUP BY status');
  const [invoicesByStatus] = await pool.query('SELECT status, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS amount FROM invoices GROUP BY status');
  return { ...totals, appointments_by_status: appointmentsByStatus, invoices_by_status: invoicesByStatus };
}

// GET /api/reports/dashboard  (admin)
export const dashboard = asyncHandler(async (req, res) => res.json(await adminReport()));

// GET /api/reports/my-stats  (any role - the numbers shown on each role's dashboard)
export const myStats = asyncHandler(async (req, res) => {
  const { role, patient_id, doctor_id } = req.user;
  let stats = {};

  if (role === 'admin') {
    stats = await adminReport();
  } else if (role === 'doctor') {
    const [[s]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM appointments WHERE doctor_id = ? AND appointment_date = CURDATE() AND status NOT IN ('Cancelled')) AS today_appointments,
         (SELECT COUNT(*) FROM appointments WHERE doctor_id = ? AND status = 'Requested') AS pending_requests,
         (SELECT COUNT(DISTINCT patient_id) FROM appointments WHERE doctor_id = ?) AS my_patients,
         (SELECT COUNT(*) FROM prescriptions WHERE doctor_id = ?) AS prescriptions_written`,
      [doctor_id, doctor_id, doctor_id, doctor_id]
    );
    stats = s;
  } else if (role === 'receptionist') {
    const [[s]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM appointments WHERE appointment_date = CURDATE() AND status <> 'Cancelled') AS today_appointments,
         (SELECT COUNT(*) FROM appointments WHERE status = 'Requested') AS pending_requests,
         (SELECT COUNT(*) FROM patients) AS total_patients,
         (SELECT COUNT(*) FROM doctors WHERE is_active = 1) AS active_doctors`
    );
    stats = s;
  } else if (role === 'billing') {
    const [[s]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM appointments a WHERE a.status = 'Completed'
            AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.appointment_id = a.id AND i.status <> 'Cancelled')) AS awaiting_invoice,
         (SELECT COUNT(*) FROM invoices WHERE status IN ('Pending', 'Partially Paid')) AS open_invoices,
         (SELECT COALESCE(SUM(total_amount - amount_paid), 0) FROM invoices WHERE status IN ('Pending', 'Partially Paid')) AS pending_amount,
         (SELECT COALESCE(SUM(amount_paid), 0) FROM invoices WHERE status <> 'Cancelled') AS collected_amount`
    );
    stats = s;
  } else {
    const [[s]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM appointments WHERE patient_id = ? AND appointment_date >= CURDATE() AND status IN ('Requested','Confirmed','Rescheduled')) AS upcoming_appointments,
         (SELECT COUNT(*) FROM prescriptions WHERE patient_id = ?) AS prescriptions,
         (SELECT COUNT(*) FROM medical_records WHERE patient_id = ?) AS medical_records,
         (SELECT COALESCE(SUM(total_amount - amount_paid), 0) FROM invoices WHERE patient_id = ? AND status IN ('Pending', 'Partially Paid')) AS balance_due`,
      [patient_id, patient_id, patient_id, patient_id]
    );
    stats = s;
  }
  res.json(stats);
});
