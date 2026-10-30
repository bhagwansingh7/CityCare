import { useState } from 'react';
import { Plus, Pencil, Power } from 'lucide-react';
import api, { errMsg } from '../../api/axios';
import useFetch from '../../api/useFetch';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Modal, Field, Spinner, Empty, SearchBox, StatusBadge, fmtMoney } from '../../components/ui';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Turns the doctor's availability list into one editable row per weekday.
const toAvailState = (list = []) => Object.fromEntries(DAYS.map((day) => {
  const slot = list.find((s) => s.day_of_week === day);
  return [day, { on: !!slot, start: slot ? slot.start_time.slice(0, 5) : '09:00', end: slot ? slot.end_time.slice(0, 5) : '17:00' }];
}));

const blank = { name: '', email: '', password: '', phone: '', department_id: '', specialization: '', qualification: '', consultation_fee: '' };

export default function Doctors() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const { data, loading, reload } = useFetch('/doctors', { search });
  const { data: departments } = useFetch('/departments');
  const [form, setForm] = useState(null);
  const [avail, setAvail] = useState(toAvailState());
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const doctors = data || [];

  const openForm = (d) => { setForm(d ? { ...d, password: '' } : { ...blank }); setAvail(toAvailState(d?.availability)); };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.department_id || !form.specialization) return toast.error('Name, email, department and specialization are required');
    if (!form.id && !form.password) return toast.error('Set a password for the new doctor');
    const availability = DAYS.filter((d) => avail[d].on).map((d) => ({ day_of_week: d, start_time: avail[d].start, end_time: avail[d].end }));
    setBusy(true);
    try {
      const body = { ...form, availability };
      const res = form.id ? await api.put(`/doctors/${form.id}`, body) : await api.post('/doctors', body);
      toast.success(res.data.message);
      setForm(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (d) => {
    try {
      const res = await api.put(`/doctors/${d.id}/status`, { is_active: !d.is_active });
      toast.success(res.data.message);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <>
      <PageHeader title="Doctors" subtitle="Add doctors, assign departments and set availability"
        action={<button className="btn-primary" onClick={() => openForm(null)}><Plus className="h-4 w-4" /> Add doctor</button>} />
      <div className="card">
        <div className="border-b border-slate-200 p-4"><SearchBox value={search} onChange={setSearch} placeholder="Search by name or specialization" /></div>
        {loading ? <Spinner /> : doctors.length === 0 ? <Empty text="No doctors found." /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Doctor</th><th>Department</th><th>Specialization</th><th>Fee</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.id}>
                    <td><span className="font-medium text-slate-900">Dr. {d.name}</span><span className="block text-xs text-slate-500">{d.email}</span></td>
                    <td>{d.department_name}</td>
                    <td>{d.specialization}<span className="block text-xs text-slate-500">{d.qualification}</span></td>
                    <td>{fmtMoney(d.consultation_fee)}</td>
                    <td><StatusBadge status={d.is_active ? 'Active' : 'Inactive'} /></td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button className="btn-outline btn-sm" onClick={() => openForm(d)}><Pencil className="h-3.5 w-3.5" /> Edit</button>
                        <button className={`btn-sm ${d.is_active ? 'btn-danger' : 'btn-outline'}`} onClick={() => toggle(d)}><Power className="h-3.5 w-3.5" /> {d.is_active ? 'Deactivate' : 'Activate'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit doctor' : 'Add doctor'} wide>
        {form && (
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><input className="input" value={form.name} onChange={set('name')} /></Field>
            <Field label="Email (login)"><input type="email" className="input" value={form.email} onChange={set('email')} /></Field>
            <Field label={form.id ? 'New password (optional)' : 'Password'}><input type="password" className="input" value={form.password} onChange={set('password')} placeholder={form.id ? 'Leave blank to keep current' : 'At least 6 characters'} /></Field>
            <Field label="Phone"><input className="input" value={form.phone || ''} onChange={set('phone')} /></Field>
            <Field label="Department">
              <select className="input" value={form.department_id} onChange={set('department_id')}>
                <option value="">Select department</option>
                {(departments || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Specialization"><input className="input" value={form.specialization} onChange={set('specialization')} /></Field>
            <Field label="Qualification"><input className="input" value={form.qualification || ''} onChange={set('qualification')} /></Field>
            <Field label="Consultation fee (₹)"><input type="number" min="0" className="input" value={form.consultation_fee} onChange={set('consultation_fee')} /></Field>
            <div className="sm:col-span-2">
              <p className="label">Weekly availability</p>
              <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                {DAYS.map((day) => (
                  <div key={day} className="flex flex-wrap items-center gap-3 text-sm">
                    <label className="flex w-32 items-center gap-2"><input type="checkbox" checked={avail[day].on} onChange={(e) => setAvail({ ...avail, [day]: { ...avail[day], on: e.target.checked } })} />{day}</label>
                    <input type="time" className="input w-32 py-1" disabled={!avail[day].on} value={avail[day].start} onChange={(e) => setAvail({ ...avail, [day]: { ...avail[day], start: e.target.value } })} aria-label={`${day} start`} />
                    <span className="text-slate-400">to</span>
                    <input type="time" className="input w-32 py-1" disabled={!avail[day].on} value={avail[day].end} onChange={(e) => setAvail({ ...avail, [day]: { ...avail[day], end: e.target.value } })} aria-label={`${day} end`} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" className="btn-outline" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save doctor'}</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
