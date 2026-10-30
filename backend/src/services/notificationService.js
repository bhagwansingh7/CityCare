import pool from '../config/db.js';

// Saves an in-app notification for one user. Never throws, so a failed
// notification cannot break the main action (booking, payment, ...).
export async function notify(userId, message, type = 'general') {
  if (!userId) return;
  try {
    await pool.query('INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)', [userId, message, type]);
  } catch (err) {
    console.error('Could not save notification:', err.message);
  }
}
