import pool, { withTransaction } from '../config/db.js';
import { asyncHandler, httpError } from '../middleware/errorHandler.js';
import { notify } from '../services/notificationService.js';

const SELECT = `SELECT pr.id, pr.patient_id, pr.doctor_id, pr.appointment_id, pr.prescription_date, pr.notes,
                       pu.name AS patient_name, du.name AS doctor_name
                  FROM prescriptions pr
                  JOIN patients p ON p.id = pr.patient_id JOIN users pu ON pu.id = p.user_id
                  JOIN doctors d ON d.id = pr.doctor_id JOIN users du ON du.id = d.user_id`;

async function attachItems(list) {
  if (!list.length) return list;
  const [items] = await pool.query('SELECT * FROM prescription_items WHERE prescription_id IN (?) ORDER BY id', [list.map((p) => p.id)]);
  list.forEach((p) => { p.items = items.filter((i) => i.prescription_id === p.id); });
  return list;
}

export const listPrescriptions = asyncHandler(async (req, res) => {
  const where = [];
  const params = [];
  if (req.user.role === 'patient') { where.push('pr.patient_id = ?'); params.push(req.user.patient_id); }
  else {
    if (req.query.patient_id) { where.push('pr.patient_id = ?'); params.push(req.query.patient_id); }
    // Doctors see their own prescriptions by default, or a patient's full history when patient_id is given.
    else if (req.user.role === 'doctor') { where.push('pr.doctor_id = ?'); params.push(req.user.doctor_id); }
  }
  const [rows] = await pool.query(`${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY pr.prescription_date DESC, pr.id DESC`, params);
  res.json(await attachItems(rows));
});

export const getPrescription = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`${SELECT} WHERE pr.id = ?`, [req.params.id]);
  if (!rows.length) throw httpError(404, 'Prescription not found');
  if (req.user.role === 'patient' && rows[0].patient_id !== req.user.patient_id) throw httpError(403, 'This is not your prescription');
  res.json((await attachItems(rows))[0]);
});

export const createPrescription = asyncHandler(async (req, res) => {
  const { patient_id, appointment_id, notes, items } = req.body;
  if (!patient_id) throw httpError(400, 'Patient is required');
  if (!Array.isArray(items) || !items.length) throw httpError(400, 'Add at least one medicine');
  for (const it of items) {
    if (!it.medicine_name?.trim() || !it.dosage?.trim()) throw httpError(400, 'Each medicine needs a name and dosage');
  }
  const [pat] = await pool.query('SELECT user_id FROM patients WHERE id = ?', [patient_id]);
  if (!pat.length) throw httpError(404, 'Patient not found');

  const id = await withTransaction(async (conn) => {
    const [r] = await conn.query(
      'INSERT INTO prescriptions (patient_id, doctor_id, appointment_id, prescription_date, notes) VALUES (?,?,?,CURDATE(),?)',
      [patient_id, req.user.doctor_id, appointment_id || null, notes || null]
    );
    for (const it of items) {
      await conn.query(
        'INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, instructions) VALUES (?,?,?,?,?,?)',
        [r.insertId, it.medicine_name.trim(), it.dosage.trim(), it.frequency || null, it.duration || null, it.instructions || null]
      );
    }
    return r.insertId;
  });
  await notify(pat[0].user_id, `Dr. ${req.user.name} added a new prescription for you.`, 'prescription');
  res.status(201).json({ message: 'Prescription created', id });
});
