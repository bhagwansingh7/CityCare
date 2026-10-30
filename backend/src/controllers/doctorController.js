import bcrypt from 'bcrypt';
import pool, { withTransaction } from '../config/db.js';
import { asyncHandler, httpError } from '../middleware/errorHandler.js';
import { isEmail, isTime, normTime } from '../services/validators.js';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SELECT = `SELECT d.id, d.user_id, u.name, u.email, u.phone, d.department_id, dep.name AS department_name,
                       d.specialization, d.qualification, d.consultation_fee, d.is_active
                  FROM doctors d
                  JOIN users u ON u.id = d.user_id
                  JOIN departments dep ON dep.id = d.department_id`;

async function attachAvailability(doctors) {
  if (!doctors.length) return doctors;
  const [slots] = await pool.query(
    `SELECT doctor_id, day_of_week, start_time, end_time FROM doctor_availability
      WHERE doctor_id IN (?) ORDER BY FIELD(day_of_week, ${DAYS.map((d) => `'${d}'`).join(',')})`,
    [doctors.map((d) => d.id)]
  );
  doctors.forEach((d) => { d.availability = slots.filter((s) => s.doctor_id === d.id); });
  return doctors;
}

function cleanAvailability(list) {
  if (!Array.isArray(list)) return [];
  return list.map((s) => {
    if (!DAYS.includes(s.day_of_week) || !isTime(s.start_time) || !isTime(s.end_time)) {
      throw httpError(400, 'Availability needs a valid day, start time and end time');
    }
    if (normTime(s.start_time) >= normTime(s.end_time)) throw httpError(400, 'Availability end time must be after start time');
    return [s.day_of_week, normTime(s.start_time), normTime(s.end_time)];
  });
}

export const listDoctors = asyncHandler(async (req, res) => {
  const where = [];
  const params = [];
  if (req.user.role !== 'admin') where.push('d.is_active = 1');
  if (req.query.search) {
    where.push('(u.name LIKE ? OR d.specialization LIKE ?)');
    params.push(`%${req.query.search}%`, `%${req.query.search}%`);
  }
  if (req.query.department_id) { where.push('d.department_id = ?'); params.push(req.query.department_id); }
  const [rows] = await pool.query(`${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY u.name`, params);
  res.json(await attachAvailability(rows));
});

export const getDoctor = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`${SELECT} WHERE d.id = ?`, [req.params.id]);
  if (!rows.length) throw httpError(404, 'Doctor not found');
  await attachAvailability(rows);
  res.json(rows[0]);
});

export const createDoctor = asyncHandler(async (req, res) => {
  const { name, password, phone, department_id, specialization, qualification, consultation_fee } = req.body;
  const email = (req.body.email || '').trim().toLowerCase();
  if (!name?.trim() || !email || !password || !department_id || !specialization?.trim()) {
    throw httpError(400, 'Name, email, password, department and specialization are required');
  }
  if (!isEmail(email)) throw httpError(400, 'Enter a valid email address');
  if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters');
  if (Number(consultation_fee) < 0 || isNaN(Number(consultation_fee))) throw httpError(400, 'Consultation fee must be a positive number');
  const slots = cleanAvailability(req.body.availability);

  const hash = await bcrypt.hash(password, 10);
  const id = await withTransaction(async (conn) => {
    const [dup] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (dup.length) throw httpError(400, 'An account with this email already exists');
    const [u] = await conn.query('INSERT INTO users (name, email, password_hash, role, phone) VALUES (?,?,?,?,?)', [name.trim(), email, hash, 'doctor', phone || null]);
    const [d] = await conn.query(
      'INSERT INTO doctors (user_id, department_id, specialization, qualification, consultation_fee) VALUES (?,?,?,?,?)',
      [u.insertId, department_id, specialization.trim(), qualification || null, consultation_fee || 0]
    );
    for (const s of slots) await conn.query('INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES (?,?,?,?)', [d.insertId, ...s]);
    return d.insertId;
  });
  res.status(201).json({ message: 'Doctor added', id });
});

export const updateDoctor = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await pool.query(`${SELECT} WHERE d.id = ?`, [id]);
  if (!rows.length) throw httpError(404, 'Doctor not found');
  const d = { ...rows[0], ...req.body };
  const email = (d.email || '').trim().toLowerCase();

  if (!d.name?.trim() || !isEmail(email) || !d.department_id || !d.specialization?.trim()) {
    throw httpError(400, 'Name, valid email, department and specialization are required');
  }
  if (Number(d.consultation_fee) < 0 || isNaN(Number(d.consultation_fee))) throw httpError(400, 'Consultation fee must be a positive number');
  const slots = Array.isArray(req.body.availability) ? cleanAvailability(req.body.availability) : null;

  await withTransaction(async (conn) => {
    await conn.query('UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?', [d.name.trim(), email, d.phone || null, rows[0].user_id]);
    if (req.body.password) {
      if (req.body.password.length < 6) throw httpError(400, 'Password must be at least 6 characters');
      await conn.query('UPDATE users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(req.body.password, 10), rows[0].user_id]);
    }
    await conn.query(
      'UPDATE doctors SET department_id = ?, specialization = ?, qualification = ?, consultation_fee = ? WHERE id = ?',
      [d.department_id, d.specialization.trim(), d.qualification || null, d.consultation_fee || 0, id]
    );
    if (slots) {
      await conn.query('DELETE FROM doctor_availability WHERE doctor_id = ?', [id]);
      for (const s of slots) await conn.query('INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES (?,?,?,?)', [id, ...s]);
    }
  });
  res.json({ message: 'Doctor updated' });
});

// Activate / deactivate. The login account is switched too, so inactive doctors cannot sign in.
export const setDoctorStatus = asyncHandler(async (req, res) => {
  const active = req.body.is_active ? 1 : 0;
  const [rows] = await pool.query('SELECT user_id FROM doctors WHERE id = ?', [req.params.id]);
  if (!rows.length) throw httpError(404, 'Doctor not found');
  await withTransaction(async (conn) => {
    await conn.query('UPDATE doctors SET is_active = ? WHERE id = ?', [active, req.params.id]);
    await conn.query('UPDATE users SET is_active = ? WHERE id = ?', [active, rows[0].user_id]);
  });
  res.json({ message: active ? 'Doctor activated' : 'Doctor deactivated' });
});
