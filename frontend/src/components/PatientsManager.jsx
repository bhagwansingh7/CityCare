import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Eye } from 'lucide-react';
import api, { errMsg } from '../api/axios';
import useFetch from '../api/useFetch';
import { useToast } from '../context/ToastContext';
import { PageHeader, Modal, Field, Spinner, Empty, SearchBox, fmtDate, ageFrom, todayStr } from './ui';

const blank = { name: '', email: '', phone: '', password: '', date_of_birth: '', gender: '', address: '', emergency_contact: '' };

// Patient list with search. Props decide what the current role may do.
//   canCreate / canEdit: show Register / Edit buttons
//   detailPath(id): if given, "View" navigates to that page instead of opening a pop-up
export default function PatientsManager({ canCreate = false, canEdit = false, detailPath }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data, loading, reload } = useFetch('/patients', { search });
  const [form, setForm] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const patients = data || [];

  const save = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.date_of_birth || !form.gender) {
      return toast.error('Name, email, phone, date of birth and gender are required');
    }
    setBusy(true);
    try {
      const res = form.id ? await api.put(`/patients/${form.id}`, form) : await api.post('/patients', form);
      toast.success(res.data.message);
      setForm(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Patients" subtitle="Search, register and update patient details"
        action={canCreate && <button className="btn-primary" onClick={() => setForm({ ...blank })}><Plus className="h-4 w-4" /> Register patient</button>} />
      <div className="card">
        <div className="border-b border-slate-200 p-4"><SearchBox value={search} onChange={setSearch} placeholder="Search by name or email" /></div>
        {loading ? <Spinner /> : patients.length === 0 ? <Empty text="No patients match your search." /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Date of birth</th><th>Gender</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium text-slate-900">{p.name}</td>
                    <td>{p.email}</td>
                    <td>{p.phone || '-'}</td>
                    <td>{fmtDate(p.date_of_birth)} <span className="text-slate-400">({ageFrom(p.date_of_birth)} y)</span></td>
                    <td>{p.gender}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button className="btn-outline btn-sm" onClick={() => (detailPath ? navigate(detailPath(p.id)) : setViewing(p))}><Eye className="h-3.5 w-3.5" /> View</button>
                        {canEdit && <button className="btn-outline btn-sm" onClick={() => setForm({ ...p, password: '' })}><Pencil className="h-3.5 w-3.5" /> Edit</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit patient' : 'Register patient'} wide>
        {form && (
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><input className="input" value={form.name} onChange={set('name')} /></Field>
            <Field label="Email"><input type="email" className="input" value={form.email} onChange={set('email')} /></Field>
            <Field label="Phone"><input className="input" value={form.phone || ''} onChange={set('phone')} /></Field>
            <Field label="Date of birth"><input type="date" max={todayStr()} className="input" value={form.date_of_birth} onChange={set('date_of_birth')} /></Field>
            <Field label="Gender">
              <select className="input" value={form.gender} onChange={set('gender')}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select>
            </Field>
            {!form.id && <Field label="Temporary password"><input className="input" value={form.password} onChange={set('password')} placeholder="Leave blank to use Patient@123" /></Field>}
            <Field label="Address" className="sm:col-span-2"><input className="input" value={form.address || ''} onChange={set('address')} /></Field>
            <Field label="Emergency contact" className="sm:col-span-2"><input className="input" value={form.emergency_contact || ''} onChange={set('emergency_contact')} placeholder="Name and phone number" /></Field>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" className="btn-outline" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save patient'}</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Patient details">
        {viewing && (
          <dl className="grid grid-cols-3 gap-y-3 text-sm">
            {[['Name', viewing.name], ['Email', viewing.email], ['Phone', viewing.phone], ['Date of birth', fmtDate(viewing.date_of_birth)],
              ['Gender', viewing.gender], ['Address', viewing.address], ['Emergency contact', viewing.emergency_contact]].map(([k, v]) => (
              <div key={k} className="col-span-3 grid grid-cols-3"><dt className="text-slate-500">{k}</dt><dd className="col-span-2 text-slate-900">{v || '-'}</dd></div>
            ))}
          </dl>
        )}
      </Modal>
    </>
  );
}
