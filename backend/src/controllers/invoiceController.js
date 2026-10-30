import pool, { withTransaction } from '../config/db.js';
import { asyncHandler, httpError } from '../middleware/errorHandler.js';
import { notify } from '../services/notificationService.js';
import { money } from '../services/validators.js';

const METHODS = ['Cash', 'Card', 'UPI'];
const INVOICE_STATUSES = ['Pending', 'Partially Paid', 'Paid', 'Cancelled'];

const SELECT = `SELECT i.id, i.patient_id, i.appointment_id, i.consultation_charge, i.other_charges, i.other_charges_description,
                       i.total_amount, i.amount_paid, (i.total_amount - i.amount_paid) AS balance, i.status, i.created_at,
                       pu.name AS patient_name, a.appointment_date, du.name AS doctor_name
                  FROM invoices i
                  JOIN patients p ON p.id = i.patient_id JOIN users pu ON pu.id = p.user_id
                  LEFT JOIN appointments a ON a.id = i.appointment_id
                  LEFT JOIN doctors d ON d.id = a.doctor_id LEFT JOIN users du ON du.id = d.user_id`;

async function loadInvoice(req, id) {
  const [rows] = await pool.query(`${SELECT} WHERE i.id = ?`, [id]);
  if (!rows.length) throw httpError(404, 'Invoice not found');
  if (req.user.role === 'patient' && rows[0].patient_id !== req.user.patient_id) throw httpError(403, 'This is not your invoice');
  return rows[0];
}

export const listInvoices = asyncHandler(async (req, res) => {
  const where = [];
  const params = [];
  if (req.user.role === 'patient') { where.push('i.patient_id = ?'); params.push(req.user.patient_id); }
  else if (req.query.patient_id) { where.push('i.patient_id = ?'); params.push(req.query.patient_id); }
  if (req.query.status) {
    if (!INVOICE_STATUSES.includes(req.query.status)) throw httpError(400, 'Invalid invoice status');
    where.push('i.status = ?'); params.push(req.query.status);
  }
  const [rows] = await pool.query(`${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY i.created_at DESC, i.id DESC`, params);
  res.json(rows);
});

// Completed appointments that do not have an active invoice yet.
export const billableAppointments = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT a.id AS appointment_id, a.patient_id, a.appointment_date, a.reason, pu.name AS patient_name,
            du.name AS doctor_name, d.consultation_fee
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id JOIN users pu ON pu.id = p.user_id
       JOIN doctors d ON d.id = a.doctor_id JOIN users du ON du.id = d.user_id
      WHERE a.status = 'Completed'
        AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.appointment_id = a.id AND i.status <> 'Cancelled')
      ORDER BY a.appointment_date DESC`
  );
  res.json(rows);
});

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await loadInvoice(req, req.params.id);
  const [payments] = await pool.query(
    `SELECT pay.id, pay.amount, pay.method, pay.paid_at, u.name AS recorded_by_name
       FROM payments pay LEFT JOIN users u ON u.id = pay.recorded_by WHERE pay.invoice_id = ? ORDER BY pay.paid_at, pay.id`, [req.params.id]);
  res.json({ ...invoice, payments });
});

export const createInvoice = asyncHandler(async (req, res) => {
  let { patient_id, appointment_id } = req.body;
  const consultation = money(req.body.consultation_charge || 0);
  const other = money(req.body.other_charges || 0);
  if (isNaN(consultation) || isNaN(other) || consultation < 0 || other < 0) throw httpError(400, 'Charges must be zero or more');
  const total = money(consultation + other);
  if (total <= 0) throw httpError(400, 'Invoice total must be greater than zero');

  if (appointment_id) {
    const [appt] = await pool.query('SELECT patient_id FROM appointments WHERE id = ?', [appointment_id]);
    if (!appt.length) throw httpError(404, 'Appointment not found');
    const [dup] = await pool.query("SELECT id FROM invoices WHERE appointment_id = ? AND status <> 'Cancelled'", [appointment_id]);
    if (dup.length) throw httpError(400, `Invoice #${dup[0].id} already exists for this appointment`);
    patient_id = appt[0].patient_id;
  }
  if (!patient_id) throw httpError(400, 'Patient or appointment is required');
  const [pat] = await pool.query('SELECT user_id FROM patients WHERE id = ?', [patient_id]);
  if (!pat.length) throw httpError(404, 'Patient not found');

  const [r] = await pool.query(
    'INSERT INTO invoices (patient_id, appointment_id, consultation_charge, other_charges, other_charges_description, total_amount) VALUES (?,?,?,?,?,?)',
    [patient_id, appointment_id || null, consultation, other, req.body.other_charges_description || null, total]
  );
  await notify(pat[0].user_id, `Invoice #${r.insertId} of ₹${total} has been generated for you.`, 'invoice');
  res.status(201).json({ message: 'Invoice generated', id: r.insertId });
});

export const cancelInvoice = asyncHandler(async (req, res) => {
  const invoice = await loadInvoice(req, req.params.id);
  if (invoice.status !== 'Pending' || invoice.amount_paid > 0) throw httpError(400, 'Only unpaid, pending invoices can be cancelled');
  await pool.query("UPDATE invoices SET status = 'Cancelled' WHERE id = ?", [invoice.id]);
  res.json({ message: 'Invoice cancelled' });
});

export const listPayments = asyncHandler(async (req, res) => {
  await loadInvoice(req, req.params.id); // permission + existence check
  const [rows] = await pool.query(
    `SELECT pay.id, pay.invoice_id, pay.amount, pay.method, pay.paid_at, u.name AS recorded_by_name
       FROM payments pay LEFT JOIN users u ON u.id = pay.recorded_by WHERE pay.invoice_id = ? ORDER BY pay.paid_at, pay.id`, [req.params.id]);
  res.json(rows);
});

export const recordPayment = asyncHandler(async (req, res) => {
  const amount = money(req.body.amount);
  const { method } = req.body;
  if (!METHODS.includes(method)) throw httpError(400, 'Payment method must be Cash, Card or UPI');
  if (!(amount > 0)) throw httpError(400, 'Enter a payment amount greater than zero');

  const invoice = await loadInvoice(req, req.params.id);
  const [pat] = await pool.query('SELECT user_id FROM patients WHERE id = ?', [invoice.patient_id]);

  const status = await withTransaction(async (conn) => {
    const [[row]] = await conn.query('SELECT total_amount, amount_paid, status FROM invoices WHERE id = ? FOR UPDATE', [invoice.id]);
    if (row.status === 'Cancelled') throw httpError(400, 'This invoice was cancelled');
    if (row.status === 'Paid') throw httpError(400, 'This invoice is already fully paid');
    const balance = money(row.total_amount - row.amount_paid);
    if (amount > balance) throw httpError(400, `Payment cannot be more than the balance of ₹${balance}`);

    const paid = money(row.amount_paid + amount);
    const newStatus = paid >= row.total_amount ? 'Paid' : 'Partially Paid';
    await conn.query('INSERT INTO payments (invoice_id, amount, method, recorded_by) VALUES (?,?,?,?)', [invoice.id, amount, method, req.user.id]);
    await conn.query('UPDATE invoices SET amount_paid = ?, status = ? WHERE id = ?', [paid, newStatus, invoice.id]);
    return newStatus;
  });
  await notify(pat[0]?.user_id, `Payment of ₹${amount} (${method}) received for invoice #${invoice.id}. Status: ${status}.`, 'payment');
  res.status(201).json({ message: `Payment recorded. Invoice is now ${status}.`, status });
});
