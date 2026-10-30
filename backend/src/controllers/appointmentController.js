import pool from '../config/db.js';
import { asyncHandler, httpError } from '../middleware/errorHandler.js';
import { notify } from '../services/notificationService.js';
import { isDate, isTime, normTime } from '../services/validators.js';

const STATUSES = ['Requested', 'Confirmed', 'Rescheduled', 'Completed', 'Cancelled', 'NoShow'];
const OPEN = ['Requested', 'Confirmed', 'Rescheduled']; // statuses that can still be rescheduled / cancelled
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SELECT = `SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.appointment_time, a.reason, a.status, a.notes, a.created_at,
                       pu.name AS patient_name, du.name AS doctor_name, dep.name AS department_name,
                       d.specialization, d.consultation_fee
                  FROM appointments a
                  JOIN patients p ON p.id = a.patient_id JOIN users pu ON pu.id = p.user_id
                  JOIN doctors d ON d.id = a.doctor_id JOIN users du ON du.id = d.user_id
                  JOIN departments dep ON dep.id = d.department_id`;

// Appointment + the user ids of both people (used for permission checks and notifications).
async function getAppointment(id) {
  const [rows] = await pool.query(
    `SELECT a.*, pu.id AS patient_user_id, pu.name AS patient_name, du.id AS doctor_user_id, du.name AS doctor_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id JOIN users pu ON pu.id = p.user_id
       JOIN doctors d ON d.id = a.doctor_id JOIN users du ON du.id = d.user_id
      WHERE a.id = ?`, [id]);
  if (!rows.length) throw httpError(404, 'Appointment not found');
  return rows[0];
}

function assertCanAccess(user, appt) {
  if (user.role === 'patient' && appt.patient_id !== user.patient_id) throw httpError(403, 'This is not your appointment');
  if (user.role === 'doctor' && appt.doctor_id !== user.doctor_id) throw httpError(403, 'This appointment is not assigned to you');
}

// Validates the slot: future, doctor active, inside doctor's availability, and not already booked.
async function checkSlot(doctorId, date, time, excludeId = 0) {
  if (!isDate(date) || !isTime(time)) throw httpError(400, 'A valid date and time are required');
  const when = new Date(`${date}T${normTime(time)}`);
  if (isNaN(when.getTime())) throw httpError(400, 'Invalid date or time');
  if (when < new Date()) throw httpError(400, 'Appointment must be in the future');

  const [docs] = await pool.query('SELECT id, is_active FROM doctors WHERE id = ?', [doctorId]);
  if (!docs.length) throw httpError(404, 'Doctor not found');
  if (!docs[0].is_active) throw httpError(400, 'This doctor is not accepting appointments');

  const day = DAYS[new Date(`${date}T00:00:00`).getDay()];
  const [avail] = await pool.query('SELECT day_of_week, start_time, end_time FROM doctor_availability WHERE doctor_id = ?', [doctorId]);
  if (avail.length) {
    const t = normTime(time);
    const ok = avail.some((a) => a.day_of_week === day && t >= a.start_time && t < a.end_time);
    if (!ok) throw httpError(400, `The doctor is not available at that time on ${day}. Check the availability shown for the doctor.`);
  }

  const [clash] = await pool.query(
    "SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status <> 'Cancelled' AND id <> ?",
    [doctorId, date, normTime(time), excludeId]
  );
  if (clash.length) throw httpError(409, 'This doctor already has an appointment at that date and time. Please choose another slot.');
}

const label = (a) => `${a.appointment_date} at ${String(a.appointment_time).slice(0, 5)}`;

export const listAppointments = asyncHandler(async (req, res) => {
  const where = [];
  const params = [];
  if (req.user.role === 'patient') { where.push('a.patient_id = ?'); params.push(req.user.patient_id); }
  else if (req.user.role === 'doctor') { where.push('a.doctor_id = ?'); params.push(req.user.doctor_id); }
  else {
    if (req.query.doctor_id) { where.push('a.doctor_id = ?'); params.push(req.query.doctor_id); }
  }
  if (req.query.patient_id && req.user.role !== 'patient') { where.push('a.patient_id = ?'); params.push(req.query.patient_id); }
  if (req.query.status) { where.push('a.status = ?'); params.push(req.query.status); }
  if (req.query.date) { where.push('a.appointment_date = ?'); params.push(req.query.date); }
  if (req.query.search) {
    where.push('(pu.name LIKE ? OR du.name LIKE ?)');
    params.push(`%${req.query.search}%`, `%${req.query.search}%`);
  }
  const [rows] = await pool.query(`${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY a.appointment_date DESC, a.appointment_time DESC`, params);
  res.json(rows);
});

export const getOneAppointment = asyncHandler(async (req, res) => {
  const appt = await getAppointment(req.params.id);
  assertCanAccess(req.user, appt);
  const [rows] = await pool.query(`${SELECT} WHERE a.id = ?`, [req.params.id]);
  res.json(rows[0]);
});

export const createAppointment = asyncHandler(async (req, res) => {
  const { doctor_id, appointment_date, appointment_time, reason } = req.body;
  const isPatient = req.user.role === 'patient';
  const patientId = isPatient ? req.user.patient_id : Number(req.body.patient_id);
  if (!patientId) throw httpError(400, 'Please select a patient');
  if (!doctor_id) throw httpError(400, 'Please select a doctor');

  const [pat] = await pool.query('SELECT p.id, p.user_id FROM patients p WHERE p.id = ?', [patientId]);
  if (!pat.length) throw httpError(404, 'Patient not found');

  await checkSlot(doctor_id, appointment_date, appointment_time);

  // Patient bookings wait for confirmation; receptionist/admin bookings are confirmed straight away.
  const status = isPatient ? 'Requested' : 'Confirmed';
  const [r] = await pool.query(
    'INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status) VALUES (?,?,?,?,?,?)',
    [patientId, doctor_id, appointment_date, normTime(appointment_time), reason || null, status]
  );

  const appt = await getAppointment(r.insertId);
  if (isPatient) {
    await notify(appt.patient_user_id, `Your appointment request with Dr. ${appt.doctor_name} on ${label(appt)} has been submitted.`, 'appointment_booked');
    await notify(appt.doctor_user_id, `New appointment request from ${appt.patient_name} on ${label(appt)}.`, 'appointment_booked');
  } else {
    await notify(appt.patient_user_id, `Your appointment with Dr. ${appt.doctor_name} on ${label(appt)} is confirmed.`, 'appointment_confirmed');
    await notify(appt.doctor_user_id, `New appointment with ${appt.patient_name} on ${label(appt)}.`, 'appointment_booked');
  }
  res.status(201).json({ message: isPatient ? 'Appointment requested' : 'Appointment booked', id: r.insertId });
});

// Reschedule
export const updateAppointment = asyncHandler(async (req, res) => {
  const appt = await getAppointment(req.params.id);
  assertCanAccess(req.user, appt);
  if (req.user.role === 'doctor') throw httpError(403, 'Doctors cannot reschedule appointments');
  if (!OPEN.includes(appt.status)) throw httpError(400, `A ${appt.status} appointment cannot be rescheduled`);

  const { appointment_date, appointment_time } = req.body;
  await checkSlot(appt.doctor_id, appointment_date, appointment_time, appt.id);
  await pool.query(
    "UPDATE appointments SET appointment_date = ?, appointment_time = ?, reason = COALESCE(?, reason), status = 'Rescheduled' WHERE id = ?",
    [appointment_date, normTime(appointment_time), req.body.reason || null, appt.id]
  );

  const when = `${appointment_date} at ${normTime(appointment_time).slice(0, 5)}`;
  await notify(appt.patient_user_id, `Your appointment with Dr. ${appt.doctor_name} was rescheduled to ${when}.`, 'appointment_rescheduled');
  await notify(appt.doctor_user_id, `Appointment with ${appt.patient_name} was rescheduled to ${when}.`, 'appointment_rescheduled');
  res.json({ message: 'Appointment rescheduled' });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) throw httpError(400, `Status must be one of: ${STATUSES.join(', ')}`);
  const appt = await getAppointment(req.params.id);
  assertCanAccess(req.user, appt);

  await pool.query('UPDATE appointments SET status = ? WHERE id = ?', [status, appt.id]);
  const type = status === 'Confirmed' ? 'appointment_confirmed' : status === 'Cancelled' ? 'appointment_cancelled' : 'appointment_status';
  await notify(appt.patient_user_id, `Your appointment with Dr. ${appt.doctor_name} on ${label(appt)} is now ${status}.`, type);
  res.json({ message: `Status changed to ${status}` });
});

export const cancelAppointment = asyncHandler(async (req, res) => {
  const appt = await getAppointment(req.params.id);
  assertCanAccess(req.user, appt);
  if (req.user.role === 'doctor') throw httpError(403, 'Doctors should update the status instead');
  if (!OPEN.includes(appt.status)) throw httpError(400, `A ${appt.status} appointment cannot be cancelled`);
  if (req.user.role === 'patient' && new Date(`${appt.appointment_date}T${appt.appointment_time}`) < new Date()) {
    throw httpError(400, 'Past appointments cannot be cancelled');
  }

  await pool.query("UPDATE appointments SET status = 'Cancelled' WHERE id = ?", [appt.id]);
  await notify(appt.patient_user_id, `Your appointment with Dr. ${appt.doctor_name} on ${label(appt)} was cancelled.`, 'appointment_cancelled');
  await notify(appt.doctor_user_id, `Appointment with ${appt.patient_name} on ${label(appt)} was cancelled.`, 'appointment_cancelled');
  res.json({ message: 'Appointment cancelled' });
});
