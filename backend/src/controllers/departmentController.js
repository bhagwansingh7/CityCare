import pool from '../config/db.js';
import { asyncHandler, httpError } from '../middleware/errorHandler.js';

export const listDepartments = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT dep.id, dep.name, dep.description, COUNT(doc.id) AS doctor_count
       FROM departments dep LEFT JOIN doctors doc ON doc.department_id = dep.id
      GROUP BY dep.id, dep.name, dep.description ORDER BY dep.name`
  );
  res.json(rows);
});

export const createDepartment = asyncHandler(async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) throw httpError(400, 'Department name is required');
  const [r] = await pool.query('INSERT INTO departments (name, description) VALUES (?, ?)', [name, req.body.description || null]);
  res.status(201).json({ message: 'Department added', id: r.insertId });
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) throw httpError(400, 'Department name is required');
  const [r] = await pool.query('UPDATE departments SET name = ?, description = ? WHERE id = ?', [name, req.body.description || null, req.params.id]);
  if (!r.affectedRows) throw httpError(404, 'Department not found');
  res.json({ message: 'Department updated' });
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const [docs] = await pool.query('SELECT COUNT(*) AS n FROM doctors WHERE department_id = ?', [req.params.id]);
  if (docs[0].n > 0) throw httpError(400, 'Move or remove the doctors in this department before deleting it');
  const [r] = await pool.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) throw httpError(404, 'Department not found');
  res.json({ message: 'Department deleted' });
});
