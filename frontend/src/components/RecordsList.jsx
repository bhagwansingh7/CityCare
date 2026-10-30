import useFetch from '../api/useFetch';
import { PageHeader, Spinner, Empty, fmtDate } from './ui';

// Medical records (diagnosis + treatment notes), newest first.
export default function RecordsList({ role }) {
  const { data, loading } = useFetch('/medical-records');
  const list = data || [];
  return (
    <>
      <PageHeader title="Medical records" subtitle={role === 'patient' ? 'Your diagnoses and treatment notes' : 'Records you have created'} />
      {loading ? <Spinner /> : list.length === 0 ? <div className="card"><Empty text="No medical records yet." /></div> : (
        <div className="space-y-3">
          {list.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{r.diagnosis}</h3>
                <span className="text-sm text-slate-500">{fmtDate(r.record_date)}</span>
              </div>
              <p className="text-sm text-slate-500">{role === 'patient' ? `Dr. ${r.doctor_name}` : `Patient: ${r.patient_name}`}</p>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{r.treatment_notes || 'No treatment notes.'}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
