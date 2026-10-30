import { useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

// ---------- formatting helpers ----------
export const todayStr = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const fmtDate = (s) => {
  if (!s) return '-';
  const d = new Date(`${String(s).slice(0, 10)}T00:00:00`);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
export const fmtTime = (t) => (t ? String(t).slice(0, 5) : '-');
export const fmtDateTime = (s) => {
  if (!s) return '-';
  const d = new Date(String(s).replace(' ', 'T'));
  return isNaN(d) ? s : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};
export const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export const ageFrom = (dob) => {
  if (!dob) return '';
  const diff = Date.now() - new Date(`${String(dob).slice(0, 10)}T00:00:00`).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
};

// ---------- small building blocks ----------
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {Icon && <Icon className="h-5 w-5" />}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

const badgeColors = {
  Requested: 'bg-amber-50 text-amber-700 ring-amber-200',
  Confirmed: 'bg-blue-50 text-blue-700 ring-blue-200',
  Rescheduled: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  Completed: 'bg-green-50 text-green-700 ring-green-200',
  Cancelled: 'bg-red-50 text-red-700 ring-red-200',
  NoShow: 'bg-slate-100 text-slate-600 ring-slate-300',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  'Partially Paid': 'bg-orange-50 text-orange-700 ring-orange-200',
  Paid: 'bg-green-50 text-green-700 ring-green-200',
  Active: 'bg-green-50 text-green-700 ring-green-200',
  Inactive: 'bg-slate-100 text-slate-600 ring-slate-300',
};
export function StatusBadge({ status }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeColors[status] || badgeColors.NoShow}`}>
      {status === 'NoShow' ? 'No show' : status}
    </span>
  );
}

export function Modal({ open, title, onClose, children, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:py-10" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`card w-full ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export function Spinner({ full }) {
  return (
    <div className={`flex items-center justify-center text-blue-600 ${full ? 'h-screen' : 'py-10'}`}>
      <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" />
    </div>
  );
}

export function Empty({ text = 'Nothing to show yet.' }) {
  return <p className="px-4 py-10 text-center text-sm text-slate-500">{text}</p>;
}

export function SearchBox({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
      <input className="input pl-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}
