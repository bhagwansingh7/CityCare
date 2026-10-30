import 'dotenv/config';
import app from './app.js';
import pool from './config/db.js';

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET. Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

try {
  await pool.query('SELECT 1');
  console.log('Connected to MySQL');
} catch (err) {
  console.error('Could not connect to MySQL. Check the DB_* values in backend/.env:', err.message);
  process.exit(1);
}

app.listen(PORT, () => console.log(`HMS API running on http://localhost:${PORT}`));
