import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool, { withTransaction } from '../config/db.js';
import { asyncHandler, httpError } from '../middleware/errorHandler.js';
import { createPatientAccount } from '../services/patientService.js';
import { getUserWithProfile } from '../services/userService.js';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

const sendToken = (res, user, message, status = 200) => {
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.cookie('token', token, cookieOptions).status(status).json({ message, user });
};

// Registration always creates a PATIENT account, whatever the client sends.
export const register = asyncHandler(async (req, res) => {
  const { userId } = await withTransaction((conn) => createPatientAccount(conn, req.body));
  const user = await getUserWithProfile(userId);
  sendToken(res, user, 'Registration successful', 201);
});

export const login = asyncHandler(async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const { password } = req.body;
  if (!email || !password) throw httpError(400, 'Email and password are required');

  const [rows] = await pool.query('SELECT id, password_hash, is_active FROM users WHERE email = ?', [email]);
  const row = rows[0];
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    throw httpError(401, 'Incorrect email or password');
  }
  if (!row.is_active) throw httpError(403, 'This account has been deactivated. Contact the administrator');

  const user = await getUserWithProfile(row.id);
  sendToken(res, user, 'Login successful');
});

export const logout = (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.json({ message: 'Logged out' });
};

export const me = (req, res) => res.json({ user: req.user });
