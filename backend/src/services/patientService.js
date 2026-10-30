import bcrypt from 'bcrypt';
import { httpError } from '../middleware/errorHandler.js';
import { isEmail, isDate } from './validators.js';

const GENDERS = ['Male', 'Female', 'Other'];

// Creates a users row (role = patient) and a patients row. Used by self-registration
// and by receptionists/admins registering a patient.
export async function createPatientAccount(conn, data) {
  const name = (data.name || '').trim();
  const email = (data.email || '').trim().toLowerCase();
  const { password, phone, date_of_birth, gender, address, emergency_contact } = data;

  if (!name || !email || !password) throw httpError(400, 'Name, email and password are required');
  if (!isEmail(email)) throw httpError(400, 'Enter a valid email address');
  if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters');
  if (!phone) throw httpError(400, 'Phone number is required');
  if (!isDate(date_of_birth)) throw httpError(400, 'Date of birth is required');
  if (!GENDERS.includes(gender)) throw httpError(400, 'Gender must be Male, Female or Other');

  const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) throw httpError(400, 'An account with this email already exists');

  const hash = await bcrypt.hash(password, 10);
  const [u] = await conn.query(
    'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
    [name, email, hash, 'patient', phone]
  );
  const [p] = await conn.query(
    'INSERT INTO patients (user_id, date_of_birth, gender, address, emergency_contact) VALUES (?, ?, ?, ?, ?)',
    [u.insertId, date_of_birth, gender, address || null, emergency_contact || null]
  );
  return { userId: u.insertId, patientId: p.insertId };
}
