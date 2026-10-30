import { useEffect, useState } from 'react';
import api, { errMsg } from '../../api/axios';
import useFetch from '../../api/useFetch';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Field, Spinner, todayStr } from '../../components/ui';

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading, reload } = useFetch(`/patients/${user.patient_id}`);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone) return toast.error('Name and phone are required');
    setBusy(true);
    try {
      const res = await api.put(`/patients/${user.patient_id}`, form);
      toast.success(res.data.message);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading || !form) return <Spinner />;
  return (
    <>
      <PageHeader title="My profile" subtitle="Keep your contact details up to date" />
      <form onSubmit={save} className="card grid max-w-3xl gap-4 p-6 sm:grid-cols-2">
        <Field label="Full name"><input className="input" value={form.name} onChange={set('name')} /></Field>
        <Field label="Email (cannot be changed)"><input className="input bg-slate-50" value={form.email} disabled /></Field>
        <Field label="Phone"><input className="input" value={form.phone || ''} onChange={set('phone')} /></Field>
        <Field label="Date of birth"><input type="date" max={todayStr()} className="input" value={form.date_of_birth} onChange={set('date_of_birth')} /></Field>
        <Field label="Gender">
          <select className="input" value={form.gender} onChange={set('gender')}><option>Male</option><option>Female</option><option>Other</option></select>
        </Field>
        <Field label="Address"><input className="input" value={form.address || ''} onChange={set('address')} /></Field>
        <Field label="Emergency contact" className="sm:col-span-2"><input className="input" value={form.emergency_contact || ''} onChange={set('emergency_contact')} placeholder="Name and phone number" /></Field>
        <div className="flex justify-end sm:col-span-2"><button className="btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button></div>
      </form>
    </>
  );
}
