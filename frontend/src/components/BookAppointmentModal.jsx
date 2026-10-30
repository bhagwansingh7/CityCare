import { useEffect, useState } from 'react';
import api, { errMsg } from '../api/axios';
import useFetch from '../api/useFetch';
import { useToast } from '../context/ToastContext';
import { Modal, Field, todayStr } from './ui';

// Book an appointment. Patients book for themselves; receptionist/admin pick a patient.
export default function BookAppointmentModal({ open, onClose, onBooked, role, doctor }) {
  const toast = useToast();
  const staff = role !== 'patient';
  const [form, setForm] = useState({ patient_id: '', doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
  const [busy, setBusy] = useState(false);
  const { data: doctors } = useFetch('/doctors', {}, open);
  const { data: patients } = useFetch('/patients', {}, open && staff);

  // Pre-select the doctor when the modal is opened from a doctor card.
  useEffect(() => {
    if (open) setForm({ patient_id: '', doctor_id: doctor ? String(doctor.id) : '', appointment_date: '', appointment_time: '', reason: '' });
  }, [open, doctor]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const selected = (doctors || []).find((d) => String(d.id) === form.doctor_id);

  const submit = async (e) => {
    e.preventDefault();
    if (staff && !form.patient_id) return toast.error('Select a patient');
    if (!form.doctor_id || !form.appointment_date || !form.appointment_time) return toast.error('Select a doctor, date and time');
    setBusy(true);
    try {
      const res = await api.post('/appointments', form);
      toast.success(res.data.message);
      onClose();
      onBooked?.();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Book an appointment">
      <form onSubmit={submit} className="space-y-4">
        {staff && (
          <Field label="Patient">
            <select className="input" value={form.patient_id} onChange={set('patient_id')}>
              <option value="">Select patient</option>
              {(patients || []).map((p) => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
            </select>
          </Field>
        )}
        <Field label="Doctor">
          <select className="input" value={form.doctor_id} onChange={set('doctor_id')}>
            <option value="">Select doctor</option>
            {(doctors || []).map((d) => <option key={d.id} value={d.id}>Dr. {d.name} - {d.specialization}</option>)}
          </select>
        </Field>
        {selected && (
          <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-900">
            <p className="font-medium">Availability</p>
            {selected.availability.length === 0 ? <p>No fixed schedule set. Any time can be requested.</p> : (
              <p className="mt-1">{selected.availability.map((a) => `${a.day_of_week.slice(0, 3)} ${a.start_time.slice(0, 5)}-${a.end_time.slice(0, 5)}`).join('  |  ')}</p>
            )}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date"><input type="date" min={todayStr()} className="input" value={form.appointment_date} onChange={set('appointment_date')} /></Field>
          <Field label="Time"><input type="time" className="input" value={form.appointment_time} onChange={set('appointment_time')} /></Field>
        </div>
        <Field label="Reason for visit"><input className="input" value={form.reason} onChange={set('reason')} placeholder="For example: fever for 2 days" /></Field>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Booking...' : 'Book appointment'}</button>
        </div>
      </form>
    </Modal>
  );
}
