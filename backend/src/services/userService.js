import pool from '../config/db.js';

// Returns the user plus their patient_id / doctor_id (if they have one). Never returns the password hash.
export async function getUserWithProfile(id) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active,
            p.id AS patient_id, d.id AS doctor_id
       FROM users u
       LEFT JOIN patients p ON p.user_id = u.id
       LEFT JOIN doctors d ON d.user_id = u.id
      WHERE u.id = ?`,
    [id]
  );
  return rows[0] || null;
}
