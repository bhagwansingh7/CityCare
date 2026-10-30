import pool from '../config/db.js';
import { asyncHandler, httpError } from '../middleware/errorHandler.js';
import { isDate } from '../services/validators.js';

const SELECT = `SELECT m.id, m.patient_id, m.doctor_id, m.appointment_id, m.diagnosis, m.treatment_notes, m.record_date,
                       pu.name AS patient_name, du.name AS doctor_name
                  FROM medical_records m
                  JOIN patients p ON p.id = m.patient_id JOIN users pu ON pu.id = p.user_id
                  JOIN doctors d ON d.id = m.doctor_id JOIN users du ON du.id = d.user_id`;

export const listRecords = asyncHandler(async (req, res) => {
  const where = [];
  const params = [];
  if (req.user.role === 'patient') { where.push('m.patient_id = ?'); params.push(req.user.patient_id); }
  else {
    if (req.query.patient_id) { where.push('m.patient_id = ?'); params.push(req.query.patient_id); }
    else if (req.user.role === 'doctor') { where.push('m.doctor_id = ?'); params.push(req.user.doctor_id); }
  }
  const [rows] = await pool.query(`${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY m.record_date DESC, m.id DESC`, params);
  res.json(rows);
});

export const getRecord = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`${SELECT} WHERE m.id = ?`, [req.params.id]);
  if (!rows.length) throw httpError(404, 'Medical record not found');
  if (req.user.role === 'patient' && rows[0].patient_id !== req.user.patient_id) throw httpError(403, 'This is not your record');
  res.json(rows[0]);
});

export const createRecord = asyncHandler(async (req, res) => {
  const { patient_id, appointment_id, diagnosis, treatment_notes } = req.body;
  if (!patient_id || !diagnosis?.trim()) throw httpError(400, 'Patient and diagnosis are required');
  const [pat] = await pool.query('SELECT id FROM patients WHERE id = ?', [patient_id]);
  if (!pat.length) throw httpError(404, 'Patient not found');
  const date = isDate(req.body.record_date) ? req.body.record_date : null;
  const [r] = await pool.query(
    'INSERT INTO medical_records (patient_id, doctor_id, appointment_id, diagnosis, treatment_notes, record_date) VALUES (?,?,?,?,?,COALESCE(?, CURDATE()))',
    [patient_id, req.user.doctor_id, appointment_id || null, diagnosis.trim(), treatment_notes || null, date]
  );
  res.status(201).json({ message: 'Medical record saved', id: r.insertId });
});

export const updateRecord = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT doctor_id FROM medical_records WHERE id = ?', [req.params.id]);
  if (!rows.length) throw httpError(404, 'Medical record not found');
  if (rows[0].doctor_id !== req.user.doctor_id) throw httpError(403, 'You can only edit records you created');
  if (!req.body.diagnosis?.trim()) throw httpError(400, 'Diagnosis is required');
  await pool.query('UPDATE medical_records SET diagnosis = ?, treatment_notes = ? WHERE id = ?', [req.body.diagnosis.trim(), req.body.treatment_notes || null, req.params.id]);
  res.json({ message: 'Medical record updated' });
});
