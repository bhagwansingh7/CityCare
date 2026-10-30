import { useState } from 'react';
import { Plus, Power } from 'lucide-react';
import api, { errMsg } from '../../api/axios';
import useFetch from '../../api/useFetch';
import { useToast } from '../../context/ToastContext';
import { useAuth, roleLabel } from '../../context/AuthContext';
import { PageHeader, Modal, Field, Spinner, Empty, StatusBadge } from '../../components/ui';

export default function Staff() {
  const toast = useToast();
  const { user } = useAuth();
  const { data, loading, reload } = useFetch('/staff');
  const [form, setForm] = useState(null);
  const staff = data || [];
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Name, email and password are required');
    try {
      const res = await api.post('/staff', form);
      toast.success(res.data.message);
      setForm(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const toggle = async (s) => {
    try {
      const res = await api.put(`/staff/${s.id}/status`, { is_active: !s.is_active });
      toast.success(res.data.message);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <>
      <PageHeader title="Staff accounts" subtitle="Create logins for receptionists, billing staff and other administrators"
        action={<button className="btn-primary" onClick={() => setForm({ name: '', email: '', password: '', phone: '', role: 'receptionist' })}><Plus className="h-4 w-4" /> Add staff account</button>} />
      <div className="card">
        {loading ? <Spinner /> : staff.length === 0 ? <Empty text="No staff accounts found." /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium text-slate-900">{s.name}</td>
                    <td>{s.email}</td>
                    <td>{roleLabel[s.role]}</td>
                    <td><StatusBadge status={s.is_active ? 'Active' : 'Inactive'} /></td>
                    <td className="text-right">
                      {s.id !== user.id && <button className={`btn-sm ${s.is_active ? 'btn-danger' : 'btn-outline'}`} onClick={() => toggle(s)}><Power className="h-3.5 w-3.5" /> {s.is_active ? 'Deactivate' : 'Activate'}</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={!!form} onClose={() => setForm(null)} title="Add staff account">
        {form && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Full name"><input className="input" value={form.name} onChange={set('name')} /></Field>
            <Field label="Email (login)"><input type="email" className="input" value={form.email} onChange={set('email')} /></Field>
            <Field label="Password"><input type="password" className="input" value={form.password} onChange={set('password')} placeholder="At least 6 characters" /></Field>
            <Field label="Phone"><input className="input" value={form.phone} onChange={set('phone')} /></Field>
            <Field label="Role">
              <select className="input" value={form.role} onChange={set('role')}>
                <option value="receptionist">Receptionist</option><option value="billing">Billing staff</option><option value="admin">Administrator</option>
              </select>
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn-primary">Create account</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
