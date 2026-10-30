import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { asyncHandler, httpError } from '../middleware/errorHandler.js';
import { isEmail } from '../services/validators.js';

const STAFF_ROLES = ['admin', 'receptionist', 'billing'];

export const listStaff = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE role IN ('admin','receptionist','billing') ORDER BY role, name"
  );
  res.json(rows);
});

// Admin creates admin / receptionist / billing accounts. (Doctors are added on the Doctors page.)
export const createStaff = asyncHandler(async (req, res) => {
  const { name, password, phone, role } = req.body;
  const email = (req.body.email || '').trim().toLowerCase();
  if (!name?.trim() || !email || !password) throw httpError(400, 'Name, email and password are required');
  if (!isEmail(email)) throw httpError(400, 'Enter a valid email address');
  if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters');
  if (!STAFF_ROLES.includes(role)) throw httpError(400, 'Role must be admin, receptionist or billing');

  const hash = await bcrypt.hash(password, 10);
  const [r] = await pool.query('INSERT INTO users (name, email, password_hash, role, phone) VALUES (?,?,?,?,?)', [name.trim(), email, hash, role, phone || null]);
  res.status(201).json({ message: 'Staff account created', id: r.insertId });
});

export const setStaffStatus = asyncHandler(async (req, res) => {
  if (Number(req.params.id) === req.user.id) throw httpError(400, 'You cannot deactivate your own account');
  const active = req.body.is_active ? 1 : 0;
  const [r] = await pool.query("UPDATE users SET is_active = ? WHERE id = ? AND role IN ('admin','receptionist','billing')", [active, req.params.id]);
  if (!r.affectedRows) throw httpError(404, 'Staff account not found');
  res.json({ message: active ? 'Account activated' : 'Account deactivated' });
});
