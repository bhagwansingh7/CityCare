import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { useAuth, roleHome } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errMsg } from '../api/axios';

const demoAccounts = [
  { role: 'Admin', email: 'admin@hospital.com' },
  { role: 'Doctor', email: 'dr.sharma@hospital.com' },
  { role: 'Receptionist', email: 'reception@hospital.com' },
  { role: 'Billing', email: 'billing@hospital.com' },
  { role: 'Patient', email: 'patient@hospital.com' },
];

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={roleHome[user.role]} replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Enter your email and password');
    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      toast.success(`Welcome back, ${u.name}`);
      navigate(roleHome[u.role]);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white"><HeartPulse className="h-6 w-6" /></span>
          <h1 className="text-2xl font-semibold text-slate-900">CityCare Hospital</h1>
          <p className="text-sm text-slate-500">Log in to your account</p>
        </div>
        <form onSubmit={submit} className="card space-y-4 p-6">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="username" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
          <p className="text-center text-sm text-slate-500">New patient? <Link to="/register" className="font-medium text-blue-600 hover:underline">Create an account</Link></p>
        </form>

        <div className="card mt-4 p-4">
          <p className="mb-2 text-sm font-medium text-slate-700">Demo accounts <span className="font-normal text-slate-500"></span></p>
          <div className="flex flex-wrap gap-2">
            {demoAccounts.map((a) => (
              <button key={a.role} type="button" className="btn-outline btn-sm" onClick={() => setForm({ email: a.email, password: 'Password@123' })}>{a.role}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
