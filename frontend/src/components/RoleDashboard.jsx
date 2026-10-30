import { Link } from 'react-router-dom';
import {
  Users, Stethoscope, CalendarDays, Check, Ban, Receipt, Wallet, CreditCard, Pill, ClipboardList,
  ClipboardPlus, FileText, CalendarCheck, Clock, HeartPulse,
} from 'lucide-react';
import useFetch from '../api/useFetch';
import { useAuth, roleHome } from '../context/AuthContext';
import { PageHeader, StatCard, StatusBadge, Spinner, Empty, fmtDate, fmtTime, fmtMoney } from './ui';

// [label, key in the stats response, icon, isMoney]
const CARDS = {
  admin: [
    ['Total patients', 'total_patients', Users], ['Total doctors', 'total_doctors', Stethoscope],
    ['Total appointments', 'total_appointments', CalendarDays], ['Completed appointments', 'completed_appointments', Check],
    ['Cancelled appointments', 'cancelled_appointments', Ban], ['Total invoices', 'total_invoices', Receipt],
    ['Amount paid', 'paid_amount', Wallet, true], ['Amount pending', 'pending_amount', CreditCard, true],
  ],
  doctor: [
    ["Today's appointments", 'today_appointments', CalendarCheck], ['Requests to confirm', 'pending_requests', Clock],
    ['My patients', 'my_patients', Users], ['Prescriptions written', 'prescriptions_written', Pill],
  ],
  receptionist: [
    ["Today's appointments", 'today_appointments', CalendarCheck], ['Requests to confirm', 'pending_requests', Clock],
    ['Registered patients', 'total_patients', Users], ['Active doctors', 'active_doctors', Stethoscope],
  ],
  billing: [
    ['Awaiting invoice', 'awaiting_invoice', ClipboardPlus], ['Open invoices', 'open_invoices', Receipt],
    ['Pending amount', 'pending_amount', CreditCard, true], ['Collected so far', 'collected_amount', Wallet, true],
  ],
  patient: [
    ['Upcoming appointments', 'upcoming_appointments', CalendarCheck], ['Prescriptions', 'prescriptions', Pill],
    ['Medical records', 'medical_records', ClipboardList], ['Balance due', 'balance_due', FileText, true],
  ],
};

export default function RoleDashboard({ role }) {
  const { user } = useAuth();
  const { data: stats, loading } = useFetch('/reports/my-stats');
  const recentUrl = role === 'billing' ? '/invoices' : '/appointments';
  const { data: recent } = useFetch(recentUrl);
  const rows = (recent || []).slice(0, 6);
  const base = roleHome[role];

  return (
    <>
      <PageHeader title={`Welcome, ${user.name}`} subtitle="Here is what is happening today" />
      {loading ? <Spinner /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CARDS[role].map(([label, key, icon, isMoney]) => (
            <StatCard key={key} label={label} icon={icon} value={isMoney ? fmtMoney(stats?.[key]) : stats?.[key] ?? 0} />
          ))}
        </div>
      )}

      <div className="card mt-6">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900"><HeartPulse className="h-4 w-4 text-blue-600" />{role === 'billing' ? 'Recent invoices' : 'Recent appointments'}</h2>
          <Link className="text-sm font-medium text-blue-600 hover:underline" to={`${base}/${role === 'billing' ? 'invoices' : 'appointments'}`}>View all</Link>
        </div>
        {rows.length === 0 ? <Empty text="Nothing to show yet." /> : (
          <div className="table-wrap">
            {role === 'billing' ? (
              <table className="table">
                <thead><tr><th>Invoice</th><th>Patient</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>{rows.map((i) => <tr key={i.id}><td>#{i.id}</td><td>{i.patient_name}</td><td>{fmtMoney(i.total_amount)}</td><td><StatusBadge status={i.status} /></td></tr>)}</tbody>
              </table>
            ) : (
              <table className="table">
                <thead><tr><th>Date</th><th>Time</th>{role !== 'patient' && <th>Patient</th>}{role !== 'doctor' && <th>Doctor</th>}<th>Status</th></tr></thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id}>
                      <td>{fmtDate(a.appointment_date)}</td><td>{fmtTime(a.appointment_time)}</td>
                      {role !== 'patient' && <td>{a.patient_name}</td>}
                      {role !== 'doctor' && <td>Dr. {a.doctor_name}</td>}
                      <td><StatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}
