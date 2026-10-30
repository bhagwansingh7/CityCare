import { Users, Stethoscope, CalendarDays, Check, Ban, Receipt, Wallet, CreditCard } from 'lucide-react';
import useFetch from '../../api/useFetch';
import { PageHeader, StatCard, Spinner, fmtMoney } from '../../components/ui';

// A simple horizontal bar list (no chart library needed).
function Bars({ title, rows, valueKey = 'count', format = (n) => n }) {
  const max = Math.max(1, ...rows.map((r) => r[valueKey]));
  return (
    <div className="card p-5">
      <h2 className="mb-4 font-semibold text-slate-900">{title}</h2>
      {rows.length === 0 ? <p className="text-sm text-slate-500">No data yet.</p> : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.status}>
              <div className="mb-1 flex justify-between text-sm"><span>{r.status === 'NoShow' ? 'No show' : r.status}</span><span className="font-medium">{format(r[valueKey])}</span></div>
              <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${(r[valueKey] / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Reports() {
  const { data: r, loading } = useFetch('/reports/dashboard');
  if (loading || !r) return <Spinner />;
  return (
    <>
      <PageHeader title="Reports" subtitle="Live figures calculated from the hospital database" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total patients" value={r.total_patients} icon={Users} />
        <StatCard label="Total doctors" value={r.total_doctors} icon={Stethoscope} />
        <StatCard label="Total appointments" value={r.total_appointments} icon={CalendarDays} />
        <StatCard label="Completed appointments" value={r.completed_appointments} icon={Check} />
        <StatCard label="Cancelled appointments" value={r.cancelled_appointments} icon={Ban} />
        <StatCard label="Total invoices" value={r.total_invoices} icon={Receipt} />
        <StatCard label="Amount paid" value={fmtMoney(r.paid_amount)} icon={Wallet} />
        <StatCard label="Amount pending" value={fmtMoney(r.pending_amount)} icon={CreditCard} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Bars title="Appointments by status" rows={r.appointments_by_status} />
        <Bars title="Invoice value by status" rows={r.invoices_by_status} valueKey="amount" format={fmtMoney} />
      </div>
    </>
  );
}
