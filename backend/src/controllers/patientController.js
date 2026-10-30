import pool, { withTransaction } from '../config/db.js';
import { asyncHandler, httpError } from '../middleware/errorHandler.js';
import { createPatientAccount } from '../services/patientService.js';
import { isEmail, isDate } from '../services/validators.js';

const SELECT = `SELECT p.id, p.user_id, u.name, u.email, u.phone, p.date_of_birth, p.gender,
                       p.address, p.emergency_contact, u.created_at
                  FROM patients p JOIN users u ON u.id = p.user_id`;

export const listPatients = asyncHandler(async (req, res) => {
  const like = `%${(req.query.search || '').trim()}%`;
  const [rows] = await pool.query(`${SELECT} WHERE u.name LIKE ? OR u.email LIKE ? ORDER BY u.name`, [like, like]);
  res.json(rows);
});

export const getPatient = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (req.user.role === 'patient' && req.user.patient_id !== id) {
    throw httpError(403, 'You can only view your own profile');
  }
  const [rows] = await pool.query(`${SELECT} WHERE p.id = ?`, [id]);
  if (!rows.length) throw httpError(404, 'Patient not found');
  res.json(rows[0]);
});

// Receptionist/admin registers a patient. A default password is used if none is given.
export const createPatient = asyncHandler(async (req, res) => {
  const data = { ...req.body, password: req.body.password || 'Patient@123' };
  const { patientId } = await withTransaction((conn) => createPatientAccount(conn, data));
  res.status(201).json({ message: 'Patient registered', id: patientId });
});

export const updatePatient = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const isOwner = req.user.role === 'patient' && req.user.patient_id === id;
  if (req.user.role === 'patient' && !isOwner) throw httpError(403, 'You can only edit your own profile');

  const [rows] = await pool.query(`${SELECT} WHERE p.id = ?`, [id]);
  if (!rows.length) throw httpError(404, 'Patient not found');
  const old = rows[0];
  const d = { ...old, ...req.body };

  if (!d.name?.trim()) throw httpError(400, 'Name is required');
  if (!isDate(d.date_of_birth)) throw httpError(400, 'Date of birth is required');
  if (!['Male', 'Female', 'Other'].includes(d.gender)) throw httpError(400, 'Invalid gender');
  // Patients cannot change their own login email; staff can.
  const email = isOwner ? old.email : (d.email || '').trim().toLowerCase();
  if (!isEmail(email)) throw httpError(400, 'Enter a valid email address');

  await withTransaction(async (conn) => {
    await conn.query('UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?', [d.name.trim(), email, d.phone || null, old.user_id]);
    await conn.query(
      'UPDATE patients SET date_of_birth = ?, gender = ?, address = ?, emergency_contact = ? WHERE id = ?',
      [d.date_of_birth, d.gender, d.address || null, d.emergency_contact || null, id]
    );
  });
  res.json({ message: 'Patient updated' });
});
