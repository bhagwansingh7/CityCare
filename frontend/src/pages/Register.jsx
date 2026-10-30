import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { useAuth, roleHome } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errMsg } from '../api/axios';
import { Field, todayStr } from '../components/ui';

export default function Register() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', date_of_birth: '', gender: '', address: '', emergency_contact: '',
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (user) return <Navigate to={roleHome[user.role]} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const missing = ['name', 'email', 'password', 'phone', 'date_of_birth', 'gender'].filter((k) => !form[k]);
    if (missing.length) return toast.error('Please fill in name, email, password, phone, date of birth and gender');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setBusy(true);
    try {
      const u = await register(form);
      toast.success('Account created. Welcome!');
      navigate(roleHome[u.role]);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white"><HeartPulse className="h-6 w-6" /></span>
          <h1 className="text-2xl font-semibold text-slate-900">Create a patient account</h1>
          <p className="text-sm text-slate-500">Book appointments and view your records online</p>
        </div>
        <form onSubmit={submit} className="card grid gap-4 p-6 sm:grid-cols-2">
          <Field label="Full name"><input className="input" value={form.name} onChange={set('name')} /></Field>
          <Field label="Email"><input type="email" className="input" value={form.email} onChange={set('email')} /></Field>
          <Field label="Password"><input type="password" className="input" value={form.password} onChange={set('password')} placeholder="At least 6 characters" /></Field>
          <Field label="Phone"><input className="input" value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Date of birth"><input type="date" max={todayStr()} className="input" value={form.date_of_birth} onChange={set('date_of_birth')} /></Field>
          <Field label="Gender">
            <select className="input" value={form.gender} onChange={set('gender')}>
              <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
            </select>
          </Field>
          <Field label="Address" className="sm:col-span-2"><input className="input" value={form.address} onChange={set('address')} /></Field>
          <Field label="Emergency contact (name and phone)" className="sm:col-span-2"><input className="input" value={form.emergency_contact} onChange={set('emergency_contact')} /></Field>
          <div className="flex items-center justify-between sm:col-span-2">
            <p className="text-sm text-slate-500">Already registered? <Link to="/login" className="font-medium text-blue-600 hover:underline">Log in</Link></p>
            <button className="btn-primary" disabled={busy}>{busy ? 'Creating...' : 'Create account'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
