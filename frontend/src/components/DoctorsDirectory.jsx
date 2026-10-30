import { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import useFetch from '../api/useFetch';
import { PageHeader, Spinner, Empty, SearchBox, StatusBadge, fmtMoney } from './ui';
import BookAppointmentModal from './BookAppointmentModal';

// Searchable list of doctors with availability and a "Book" button. Used by patients and receptionists.
export default function DoctorsDirectory({ role }) {
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [bookFor, setBookFor] = useState(null);
  const [open, setOpen] = useState(false);
  const { data, loading } = useFetch('/doctors', { search, department_id: departmentId });
  const { data: departments } = useFetch('/departments');
  const doctors = data || [];

  return (
    <>
      <PageHeader title="Doctors" subtitle="Find a doctor and check when they are available" />
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchBox value={search} onChange={setSearch} placeholder="Search by name or specialization" />
        <select className="input sm:w-56" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} aria-label="Filter by department">
          <option value="">All departments</option>
          {(departments || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : doctors.length === 0 ? <div className="card"><Empty text="No doctors match your search." /></div> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {doctors.map((d) => (
            <div key={d.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">Dr. {d.name}</h3>
                  <p className="text-sm text-slate-500">{d.specialization} - {d.department_name}</p>
                </div>
                <StatusBadge status={d.is_active ? 'Active' : 'Inactive'} />
              </div>
              <p className="mt-2 text-sm text-slate-600">{d.qualification || 'Qualification not listed'}</p>
              <p className="mt-1 text-sm text-slate-600">Consultation fee: <span className="font-medium text-slate-900">{fmtMoney(d.consultation_fee)}</span></p>
              <div className="mt-3 flex-1">
                <p className="mb-1 text-xs font-medium text-slate-500">Available</p>
                {d.availability.length === 0 ? <p className="text-xs text-slate-400">No schedule set</p> : (
                  <div className="flex flex-wrap gap-1.5">
                    {d.availability.map((a, i) => (
                      <span key={i} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{a.day_of_week.slice(0, 3)} {a.start_time.slice(0, 5)}-{a.end_time.slice(0, 5)}</span>
                    ))}
                  </div>
                )}
              </div>
              <button className="btn-primary mt-4" onClick={() => { setBookFor(d); setOpen(true); }}><CalendarPlus className="h-4 w-4" /> Book appointment</button>
            </div>
          ))}
        </div>
      )}
      <BookAppointmentModal open={open} onClose={() => setOpen(false)} role={role} doctor={bookFor} />
    </>
  );
}
