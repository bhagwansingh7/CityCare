import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CalendarClock, XCircle, Stethoscope } from 'lucide-react';
import api, { errMsg } from '../api/axios';
import useFetch from '../api/useFetch';
import { useToast } from '../context/ToastContext';
import { PageHeader, Modal, Field, Spinner, Empty, SearchBox, StatusBadge, fmtDate, fmtTime, todayStr } from './ui';
import BookAppointmentModal from './BookAppointmentModal';

const STATUSES = ['Requested', 'Confirmed', 'Rescheduled', 'Completed', 'Cancelled', 'NoShow'];
const OPEN = ['Requested', 'Confirmed', 'Rescheduled'];

// One appointment table for every role. What each row offers depends on `role`:
//   admin / receptionist: change status, reschedule, cancel, book
//   doctor:               change status, open the patient for consultation
//   patient:              book, reschedule, cancel
export default function AppointmentsManager({ role }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ status: '', date: '', search: '' });
  const { data, loading, reload } = useFetch('/appointments', filters);
  const [bookOpen, setBookOpen] = useState(false);
  const [resched, setResched] = useState(null);

  const isStaff = role === 'admin' || role === 'receptionist';
  const canBook = isStaff || role === 'patient';
  const canChangeStatus = isStaff || role === 'doctor';
  const rows = data || [];

  const act = async (fn, okMessage) => {
    try {
      const res = await fn();
      toast.success(res?.data?.message || okMessage);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const changeStatus = (a, status) => act(() => api.put(`/appointments/${a.id}/status`, { status }));
  const cancel = (a) => {
    if (window.confirm(`Cancel the appointment on ${fmtDate(a.appointment_date)} at ${fmtTime(a.appointment_time)}?`)) {
      act(() => api.put(`/appointments/${a.id}/cancel`));
    }
  };
  const submitResched = async (e) => {
    e.preventDefault();
    if (!resched.date || !resched.time) return toast.error('Choose a new date and time');
    await act(() => api.put(`/appointments/${resched.id}`, { appointment_date: resched.date, appointment_time: resched.time }));
    setResched(null);
  };

  return (
    <>
      <PageHeader title={role === 'patient' ? 'My appointments' : 'Appointments'} subtitle="Book, reschedule and track appointments"
        action={canBook && <button className="btn-primary" onClick={() => setBookOpen(true)}><Plus className="h-4 w-4" /> Book appointment</button>} />

      <div className="card">
        <div className="flex flex-wrap gap-3 border-b border-slate-200 p-4">
          {role !== 'patient' && <SearchBox value={filters.search} onChange={(v) => setFilters({ ...filters, search: v })} placeholder="Search patient or doctor" />}
          <select className="input sm:w-44" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'NoShow' ? 'No show' : s}</option>)}
          </select>
          <input type="date" className="input sm:w-44" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} aria-label="Filter by date" />
          {(filters.status || filters.date || filters.search) && <button className="btn-outline" onClick={() => setFilters({ status: '', date: '', search: '' })}>Clear filters</button>}
        </div>

        {loading ? <Spinner /> : rows.length === 0 ? <Empty text="No appointments found." /> : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th><th>Time</th>
                  {role !== 'patient' && <th>Patient</th>}
                  {role !== 'doctor' && <th>Doctor</th>}
                  <th>Reason</th><th>Status</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const open = OPEN.includes(a.status);
                  return (
                    <tr key={a.id}>
                      <td className="whitespace-nowrap">{fmtDate(a.appointment_date)}</td>
                      <td>{fmtTime(a.appointment_time)}</td>
                      {role !== 'patient' && <td className="font-medium text-slate-900">{a.patient_name}</td>}
                      {role !== 'doctor' && <td>Dr. {a.doctor_name}<span className="block text-xs text-slate-500">{a.department_name}</span></td>}
                      <td className="max-w-[14rem] truncate" title={a.reason}>{a.reason || '-'}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td>
                        <div className="flex flex-wrap justify-end gap-2">
                          {role === 'doctor' && <button className="btn-primary btn-sm" onClick={() => navigate(`/doctor/patients/${a.patient_id}?appointment=${a.id}`)}><Stethoscope className="h-3.5 w-3.5" /> Consult</button>}
                          {canChangeStatus && (
                            <select className="input w-auto py-1 text-xs" value={a.status} onChange={(e) => changeStatus(a, e.target.value)} aria-label="Change status">
                              {STATUSES.map((s) => <option key={s} value={s}>{s === 'NoShow' ? 'No show' : s}</option>)}
                            </select>
                          )}
                          {role !== 'doctor' && open && <button className="btn-outline btn-sm" onClick={() => setResched({ id: a.id, date: '', time: '' })}><CalendarClock className="h-3.5 w-3.5" /> Reschedule</button>}
                          {role !== 'doctor' && open && <button className="btn-danger btn-sm" onClick={() => cancel(a)}><XCircle className="h-3.5 w-3.5" /> Cancel</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BookAppointmentModal open={bookOpen} onClose={() => setBookOpen(false)} onBooked={reload} role={role} />

      <Modal open={!!resched} onClose={() => setResched(null)} title="Reschedule appointment">
        {resched && (
          <form onSubmit={submitResched} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="New date"><input type="date" min={todayStr()} className="input" value={resched.date} onChange={(e) => setResched({ ...resched, date: e.target.value })} /></Field>
              <Field label="New time"><input type="time" className="input" value={resched.time} onChange={(e) => setResched({ ...resched, time: e.target.value })} /></Field>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setResched(null)}>Close</button>
              <button className="btn-primary">Reschedule</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
